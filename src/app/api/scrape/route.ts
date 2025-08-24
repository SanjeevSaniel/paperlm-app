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
import { DocumentRepository } from '@/lib/repositories/documentRepository';
import { UserRepository } from '@/lib/repositories/userRepository';

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
    // Get authenticated user (can be null for anonymous users)
    const { userId: clerkUserId } = await auth();

    const body = (await request.json()) as ScrapeBody;
    const { url, type, maxDepth, sameOrigin, limit, loader, sessionId } = body || {};
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
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

    // Get user if authenticated, or create anonymous user
    let user = null;
    let isAnonymousUser = false;
    
    if (clerkUserId) {
      // Authenticated user
      user = await UserRepository.findByClerkId(clerkUserId);
      if (!user) {
        user = await UserRepository.getOrCreate(clerkUserId, `${clerkUserId}@placeholder.local`);
      }
    } else {
      // Anonymous user - create a temporary user record
      isAnonymousUser = true;
      const anonymousEmail = `anonymous-${sessionId}@temp.local`;
      const anonymousClerkId = `anonymous-${sessionId}`;
      
      try {
        // Try to find existing anonymous user for this session
        user = await UserRepository.findByClerkId(anonymousClerkId);
        if (!user) {
          // Create new anonymous user
          user = await UserRepository.getOrCreate(anonymousClerkId, anonymousEmail);
          console.log(`👤 Created anonymous user for session: ${sessionId}`);
        }
      } catch (error) {
        console.error('Failed to create anonymous user:', error);
        return NextResponse.json({ error: 'Failed to create user session' }, { status: 500 });
      }
    }

    // Create document record in database first
    console.log('💾 Creating scraped document record in database...');
    
    // Generate proper UUID for anonymous users if no authenticated user
    let anonymousUserId = user?.id;
    if (!anonymousUserId) {
      const sessionStr = sessionId || userId || 'anonymous';
      // Convert sessionId to a consistent hash and format as UUID
      let hash = 0;
      for (let i = 0; i < sessionStr.length; i++) {
        const char = sessionStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      const hashHex = Math.abs(hash).toString(16).padStart(8, '0').substring(0, 8);
      const randomHex = Math.random().toString(16).substring(2, 6);
      anonymousUserId = `00000000-0000-4000-8000-${hashHex}${randomHex}`;
    }
    
    if (!user?.id) {
      console.error('❌ No user ID available for document creation');
      return NextResponse.json({ error: 'User session not available' }, { status: 500 });
    }

    const newDocument = await DocumentRepository.create({
      userId: user.id,
      sessionId: sessionId,
      name: scraped.title || 'Website Content',
      content: scraped.content,
      fileType: fileType,
      fileSize: scraped.content.length,
      status: 'processing',
      sourceUrl: url,
      metadata: {
        ...scraped.metadata,
        scrapeType: type,
        userType: isAnonymousUser ? 'anonymous' : 'registered_free',
        isAnonymous: isAnonymousUser,
      },
    });

    if (!newDocument) {
      console.log('❌ Failed to create document record in database');
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }

    console.log('✅ Scraped document record created:', {
      documentId: newDocument.id,
      status: newDocument.status,
      name: newDocument.name,
      sourceUrl: url
    });

    const documentId = newDocument.id; // Use the database ID
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
        sessionId: sessionId,
        userId: user.id,
        userType: isAnonymousUser ? 'anonymous' : 'registered_free',
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

    // Update document status to ready
    console.log(`📝 Updating scraped document ${documentId} to ready status with ${chunks.length} chunks`);
    const updatedDocument = await DocumentRepository.updateProcessingResults(documentId, {
      chunksCount: chunks.length,
      qdrantCollectionId: 'paperlm_documents',
    });
    
    if (updatedDocument) {
      console.log(`✅ Scraped document ${documentId} updated successfully, status: ${updatedDocument.status}`);
    } else {
      console.error(`❌ Failed to update scraped document ${documentId} status`);
    }

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
