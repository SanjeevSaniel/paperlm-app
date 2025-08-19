'use server';

import { load as loadCheerio } from 'cheerio';
import type { Document } from '@langchain/core/documents';

export type RecursiveUrlOptions = {
  maxDepth?: number;
  limit?: number;
  sameOrigin?: boolean;
};

export async function loadWebsiteWithLangChain(
  url: string,
  opts: RecursiveUrlOptions = {},
): Promise<{
  title: string;
  content: string;
  metadata: {
    url: string;
    pages: number;
    loader: 'langchain-recursive';
    maxDepth: number;
    sameOrigin: boolean;
  };
}> {
  const { maxDepth = 2, limit = 25, sameOrigin = true } = opts;
  const { RecursiveUrlLoader } = await import(
    '@langchain/community/document_loaders/web/recursive_url'
  );

  const extractor = (html: string) => {
    const $ = loadCheerio(html);
    $(
      'script, style, nav, footer, header, noscript, iframe, svg, canvas, video, audio, form, aside, .ads, .advertisement, .social-share, .sidebar',
    ).remove();
    const candidates = [
      'main',
      'article',
      '[role="main"]',
      '.content, .post-content, .entry-content, .article-content, .main-content',
      'body',
    ];
    let bestText = '';
    for (const sel of candidates) {
      const el = $(sel).first();
      if (el.length) {
        const text = el.text().replace(/\s+/g, ' ').trim();
        if (text.length > bestText.length) bestText = text;
      }
    }
    return bestText.replace(/\s{2,}/g, ' ').trim();
  };

  const loader = new RecursiveUrlLoader(url, { maxDepth, extractor });
  const docs: Document[] = await loader.load();
  if (!docs || docs.length === 0)
    throw new Error('LangChain RecursiveUrlLoader returned no documents.');

  const seed = new URL(url);
  const filtered: Document[] = sameOrigin
    ? docs.filter((d: Document) => {
        const raw =
          (d.metadata as Record<string, unknown>)?.['source'] ??
          (d.metadata as Record<string, unknown>)?.['url'] ??
          '';
        try {
          const src = new URL(String(raw || ''), seed);
          return src.origin === seed.origin;
        } catch {
          return true;
        }
      })
    : docs;

  const limited: Document[] = filtered.slice(0, limit);
  const joinedContent = limited
    .map((d: Document) => {
      const md = (d.metadata || {}) as Record<string, unknown>;
      const src = String(md['source'] ?? md['url'] ?? '');
      const title = String(md['title'] ?? '');
      const body = (d.pageContent ?? '').toString().trim();
      const header = [title, src].filter(Boolean).join(' — ');
      return `${header}\n\n${body}`.trim();
    })
    .filter(Boolean)
    .join('\n\n-----\n\n');

  const firstMd = (limited[0]?.metadata || {}) as Record<string, unknown>;
  const finalTitle = String(firstMd['title'] ?? '').trim() || seed.hostname;

  return {
    title: finalTitle || 'Website',
    content: joinedContent,
    metadata: {
      url,
      pages: limited.length,
      loader: 'langchain-recursive',
      maxDepth,
      sameOrigin,
    },
  };
}
