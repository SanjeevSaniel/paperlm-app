export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { scrapeYouTubeContent, scrapeWebsiteContent } from '@/lib/urlScraping';
import { chunkDocument } from '@/lib/documentProcessing';
import { addDocuments } from '@/lib/qdrant';
import { saveDocument } from '@/lib/database';
import { withFreemium } from '@/lib/freemium';

export const POST = withFreemium(async (request: NextRequest, user, usage) => {
  const startTime = Date.now();
  console.log('Scrape request received for user:', user?.userId || 'anonymous', 'sessionId:', usage.sessionId);
  
  try {
    const { url, type } = await request.json();
    
    if (!url || !type) {
      throw new Error('URL and type are required');
    }

    if (!['youtube', 'website'].includes(type)) {
      throw new Error('Type must be either "youtube" or "website"');
    }

    console.log('Scraping content:', { url, type });

    let scrapedData;
    let contentType;
    
    if (type === 'youtube') {
      scrapedData = await scrapeYouTubeContent(url);
      contentType = 'video/youtube';
    } else {
      scrapedData = await scrapeWebsiteContent(url);
      contentType = 'text/html';
    }

    console.log('Scraped content length:', scrapedData.content.length);

    const documentId = `${type}-${Date.now()}-${usage.sessionId}`;
    const chunks = await chunkDocument(documentId, scrapedData.content);
    console.log('Generated chunks:', chunks.length);

    // Save document metadata
    if (user) {
      saveDocument({
        id: documentId,
        fileName: scrapedData.title,
        fileType: contentType,
        fileSize: scrapedData.content.length,
        uploadedAt: new Date().toISOString(),
        userId: user.userId,
      });
    }

    // Prepare documents for vector storage
    const documents = chunks.map((chunk) => ({
      pageContent: chunk.content,
      metadata: {
        documentId: chunk.documentId,
        chunkId: chunk.id,
        chunkIndex: chunk.metadata.chunkIndex,
        startChar: chunk.metadata.startChar,
        endChar: chunk.metadata.endChar,
        fileName: scrapedData.title,
        fileType: contentType,
        fileSize: scrapedData.content.length,
        sourceUrl: url,
        sourceType: type,
        ...scrapedData.metadata,
      },
    }));

    console.log('Calling addDocuments with options:', {
      sessionId: usage.sessionId,
      isAnonymous: !usage.isAuthenticated,
      fileName: scrapedData.title,
      fileType: contentType,
      fileSize: scrapedData.content.length,
    });

    await addDocuments(documents, {
      sessionId: usage.sessionId,
      isAnonymous: !usage.isAuthenticated,
      fileName: scrapedData.title,
      fileType: contentType,
      fileSize: scrapedData.content.length,
    });

    console.log('Content scraping completed successfully');

    return {
      documentId,
      fileName: scrapedData.title,
      chunksCount: chunks.length,
      contentLength: scrapedData.content.length,
      sourceUrl: url,
      sourceType: type,
    };
  } catch (error) {
    console.error('Scrape API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Scraping failed';
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}, 'upload'); // Use 'upload' action for rate limiting