export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { GoogleGenAI } from '@google/genai';
import { chunkDocument } from '@/lib/documentProcessing';
import { addDocuments } from '@/lib/qdrant';
import { loadWebsiteWithLangChain } from '@/lib/langchainRecursive';
import {
  scrapeWebsiteContent,
  scrapeYouTubeContent,
  scrapeWithPuppeteer,
} from '@/lib/urlScraping';
import { getUserTypeFromId } from '@/lib/userIdGenerator';

type ScrapeBody = {
  url: string;
  type: 'youtube' | 'website';
  maxDepth?: number;
  sameOrigin?: boolean;
  limit?: number;
  loader?: 'recursive' | 'cheerio' | 'puppeteer';
  sessionId?: string;
};

// Helper function to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Gemini AI summarization function with thinking enabled
async function generateGeminiSummary(
  title: string,
  transcript: string,
): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Gemini API key not found, skipping YouTube summarization');
      return null;
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Please create a comprehensive, well-structured summary of this YouTube video transcript.

Video Title: ${title}

Please format your response with:
1. 🎯 Key Points (5-8 main points)
2. 📝 Detailed Summary (500-800 words)
3. 💡 Key Insights & Takeaways
4. 🎤 Notable Quotes (if any)
5. 🏷️ Topics Covered
6. ⚡ Action Items (if applicable)

Make the summary engaging, well-organized, and capture the essence of the video content.

Transcript: ${transcript.slice(0, 15000)}${
      transcript.length > 15000
        ? '\n\n[Transcript truncated for processing]'
        : ''
    }`;

    // Fixed: Use simple string content instead of complex parts structure
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert content analyst and summarizer. Create comprehensive, engaging summaries that capture the essence of video content.',
        thinkingConfig: {
          // Remove thinkingBudget to enable thinking
        },
      },
    });

    // Fixed: Handle potential undefined response with null coalescing
    return response.text ?? null;
  } catch (error) {
    console.error('Error generating Gemini summary:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = (await request.json()) as ScrapeBody;
    const { url, type, maxDepth, sameOrigin, limit, loader, sessionId } = body || {};
    
    // Determine user type and effective userId
    const userId = sessionId || clerkUserId;
    const userType = sessionId ? getUserTypeFromId(sessionId) : 'registered_free';
    if (!url || !type) {
      return NextResponse.json(
        { success: false, error: 'URL and type are required' },
        { status: 400 },
      );
    }

    let scraped: {
      title: string;
      content: string;
      metadata?: Record<string, unknown>;
    } | null = null;
    let fileType = 'text/plain';

    if (type === 'youtube') {
      scraped = await scrapeYouTubeContent(url);
      fileType = 'video/youtube';

      // Generate AI summary for YouTube videos using Gemini
      try {
        const videoId = extractVideoId(url);
        if (videoId && scraped.content && scraped.content.length > 500) {
          // Use Gemini for YouTube video summarization with thinking enabled
          const geminiSummary = await generateGeminiSummary(
            scraped.title,
            scraped.content,
          );

          if (geminiSummary) {
            // Create enhanced content with both summary and original transcript
            const enhancedContent = `# 📹 AI-Generated Video Summary (Gemini)

${geminiSummary}

---

# 📄 Original Transcript

${scraped.content}`;

            scraped = {
              title: `📹 ${scraped.title} - AI Summary`,
              content: enhancedContent,
              metadata: {
                ...scraped.metadata,
                originalTranscript: scraped.content,
                aiSummarized: true,
                summaryMethod: 'gemini',
                summaryTimestamp: new Date().toISOString(),
                hasAISummary: true,
                thinkingEnabled: true,
              },
            };
          }
        }
      } catch (summaryError) {
        console.warn(
          'YouTube summarization failed, using original transcript:',
          summaryError,
        );
        // Continue with original transcript if summarization fails
      }
    } else {
      const order =
        loader === 'puppeteer'
          ? ['puppeteer', 'cheerio', 'recursive']
          : loader === 'cheerio'
          ? ['cheerio', 'puppeteer', 'recursive']
          : ['recursive', 'cheerio', 'puppeteer'];

      let lastErr: Error | null = null;
      for (const l of order) {
        try {
          if (l === 'recursive') {
            const res = await loadWebsiteWithLangChain(url, {
              maxDepth: typeof maxDepth === 'number' ? maxDepth : 2,
              sameOrigin: typeof sameOrigin === 'boolean' ? sameOrigin : true,
              limit: typeof limit === 'number' ? limit : 25,
            });
            scraped = {
              title: res.title,
              content: res.content,
              metadata: res.metadata,
            };
          } else if (l === 'cheerio') {
            const res = await scrapeWebsiteContent(url);
            scraped = {
              title: res.title,
              content: res.content,
              metadata: res.metadata,
            };
          } else {
            const res = await scrapeWithPuppeteer(url);
            scraped = {
              title: res.title,
              content: res.content,
              metadata: res.metadata,
            };
          }
          fileType = 'text/html';
          break;
        } catch (e) {
          lastErr = e as Error;
        }
      }
      if (!scraped) {
        return NextResponse.json(
          { success: false, error: lastErr?.message || 'Failed to scrape' },
          { status: 500 },
        );
      }
    }

    if (!scraped.content || scraped.content.trim().length < 50) {
      return NextResponse.json(
        { success: false, error: 'No content extracted' },
        { status: 400 },
      );
    }

    const documentId = `web-${Date.now()}`;
    const chunks = await chunkDocument(documentId, scraped.content);

    const docs = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: {
        documentId: chunk.documentId,
        chunkId: chunk.id,
        chunkIndex: chunk.metadata.chunkIndex,
        startChar: chunk.metadata.startChar,
        endChar: chunk.metadata.endChar,
        fileName: scraped!.title || 'Website',
        fileType,
        fileSize: scraped!.content.length,
        sessionId: sessionId || clerkUserId,
        userId: userId,
        userType: userType as 'registered_free' | 'session' | 'temporary' | 'unknown',
        sourceUrl: url,
        loader:
          typeof scraped!.metadata?.loader === 'string'
            ? scraped!.metadata.loader
            : undefined,
        uploadedAt: new Date().toISOString(),
        extractedSections: [],
        contextBefore: '',
        contextAfter: '',
      },
    }));

    await addDocuments(docs);

    return NextResponse.json({
      success: true,
      documentId,
      chunks: chunks.length,
      chunksCount: chunks.length,
      title: scraped.title || 'Website',
      fileName: scraped.title || 'Website',
      contentLength: scraped.content.length,
      meta: scraped.metadata || {},
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || 'Failed to scrape',
      },
      { status: 500 },
    );
  }
}
