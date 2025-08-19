export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { chunkDocument } from '@/lib/documentProcessing';
import { addDocuments } from '@/lib/qdrant';
import { loadWebsiteWithLangChain } from '@/lib/langchainRecursive';
import {
  scrapeWebsiteContent,
  scrapeYouTubeContent,
  scrapeWithPuppeteer,
} from '@/lib/urlScraping';

type ScrapeBody = {
  url: string;
  type: 'youtube' | 'website';
  maxDepth?: number;
  sameOrigin?: boolean;
  limit?: number;
  loader?: 'recursive' | 'cheerio' | 'puppeteer';
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScrapeBody;
    const { url, type, maxDepth, sameOrigin, limit, loader } = body || {};
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
        sourceUrl: url,
        loader:
          typeof scraped!.metadata?.loader === 'string'
            ? scraped!.metadata.loader
            : undefined,
        uploadedAt: new Date().toISOString(),
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
