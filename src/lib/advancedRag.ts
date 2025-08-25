/**
 * Advanced RAG System with HyDE, Context Rewriting, and Efficient Processing
 * Replacing LangChain dependencies with lightweight alternatives
 */

import openai from './openai';

// Types for advanced RAG
export interface HyDEResult {
  originalQuery: string;
  hypotheticalDocument: string;
  refinedQueries: string[];
}

export interface ContextRewriteResult {
  rewrittenContext: string;
  relevanceScore: number;
  condensedSummary: string;
}

export interface AdvancedRAGResult {
  content: string;
  metadata: {
    documentId: string;
    chunkId: string;
    fileName: string;
    relevanceScore: number;
    contextQuality: number;
    citations: string[];
  };
  rewrittenContent: string;
}

/**
 * HyDE (Hypothetical Document Embeddings) Implementation
 * Generates hypothetical documents to improve retrieval accuracy
 */
export async function generateHyDE(query: string, domain?: string): Promise<HyDEResult> {
  try {
    const prompt = `You are an expert document generator. Generate a hypothetical document that would perfectly answer this query: "${query}"

${domain ? `Domain context: ${domain}` : ''}

Generate a comprehensive, factual document (200-300 words) that directly addresses the query. Focus on:
1. Specific details and facts
2. Technical accuracy
3. Comprehensive coverage of the topic
4. Natural language flow

Hypothetical Document:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 400,
    });

    const hypotheticalDocument = response.choices[0]?.message?.content || query;

    // Generate refined queries based on the hypothetical document
    const refinedQueries = await generateRefinedQueries(query, hypotheticalDocument);

    return {
      originalQuery: query,
      hypotheticalDocument,
      refinedQueries,
    };
  } catch (error) {
    console.warn('HyDE generation failed:', error);
    return {
      originalQuery: query,
      hypotheticalDocument: query,
      refinedQueries: [query],
    };
  }
}

/**
 * Generate refined queries from the hypothetical document
 */
async function generateRefinedQueries(originalQuery: string, hypotheticalDoc: string): Promise<string[]> {
  try {
    const prompt = `Based on this query: "${originalQuery}"
And this hypothetical document: "${hypotheticalDoc}"

Generate 3 refined search queries that would help find relevant information. Make them:
1. More specific than the original
2. Cover different aspects of the topic
3. Use relevant technical terms
4. Be concise (5-10 words each)

Format as a simple list:
1. [refined query 1]
2. [refined query 2]  
3. [refined query 3]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content || '';
    const queries = content
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(query => query.length > 0 && query.length < 100)
      .slice(0, 3);

    return queries.length > 0 ? queries : [originalQuery];
  } catch (error) {
    console.warn('Refined queries generation failed:', error);
    return [originalQuery];
  }
}

/**
 * Context Rewriting for better coherence and relevance
 */
export async function rewriteContext(
  chunks: string[],
  query: string,
  maxLength: number = 2000
): Promise<ContextRewriteResult> {
  if (!chunks.length) {
    return {
      rewrittenContext: '',
      relevanceScore: 0,
      condensedSummary: '',
    };
  }

  try {
    const combinedContent = chunks.join('\n\n').slice(0, 4000); // Limit input size

    const prompt = `Rewrite and synthesize this content to directly answer the query: "${query}"

Content:
${combinedContent}

Instructions:
1. Extract only information relevant to the query
2. Rewrite in clear, coherent prose  
3. Maintain factual accuracy
4. Remove redundancy and irrelevant details
5. Keep under ${maxLength} characters
6. Preserve important technical details and numbers

Rewritten content:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: Math.min(800, maxLength / 2),
    });

    const rewrittenContent = response.choices[0]?.message?.content || combinedContent.slice(0, maxLength);

    // Generate condensed summary
    const summaryPrompt = `Summarize this content in 1-2 sentences:
${rewrittenContent}`;

    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: summaryPrompt }],
      temperature: 0.1,
      max_tokens: 100,
    });

    const condensedSummary = summaryResponse.choices[0]?.message?.content || '';

    // Calculate relevance score (simple keyword matching)
    const queryKeywords = query.toLowerCase().split(' ').filter(word => word.length > 3);
    const contentLower = rewrittenContent.toLowerCase();
    const matches = queryKeywords.filter(keyword => contentLower.includes(keyword));
    const relevanceScore = queryKeywords.length > 0 ? matches.length / queryKeywords.length : 0;

    return {
      rewrittenContext: rewrittenContent,
      relevanceScore,
      condensedSummary,
    };
  } catch (error) {
    console.warn('Context rewriting failed:', error);
    const fallbackContent = chunks.join('\n\n').slice(0, maxLength);
    return {
      rewrittenContext: fallbackContent,
      relevanceScore: 0.5,
      condensedSummary: 'Content summary unavailable',
    };
  }
}

/**
 * Lightweight text splitter (replacing LangChain)
 */
export class EfficientTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: {
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
  } = {}) {
    this.chunkSize = options.chunkSize || 1000;
    this.chunkOverlap = options.chunkOverlap || 200;
    this.separators = options.separators || ['\n\n', '\n', '. ', ' '];
  }

  splitText(text: string): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    const chunks: string[] = [];
    let currentPos = 0;

    while (currentPos < text.length) {
      let chunkEnd = Math.min(currentPos + this.chunkSize, text.length);
      
      // Try to end at a natural break point
      if (chunkEnd < text.length) {
        for (const separator of this.separators) {
          const separatorPos = text.lastIndexOf(separator, chunkEnd);
          if (separatorPos > currentPos) {
            chunkEnd = separatorPos + separator.length;
            break;
          }
        }
      }

      const chunk = text.slice(currentPos, chunkEnd).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move position considering overlap
      const nextStart = Math.max(
        currentPos + 1,
        chunkEnd - this.chunkOverlap
      );
      
      if (nextStart >= chunkEnd) break;
      currentPos = nextStart;
    }

    return chunks;
  }
}

/**
 * Efficient embedding function with batching
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 10; // Process in batches to avoid API limits
  const embeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });

      embeddings.push(...response.data.map(item => item.embedding));
    } catch (error) {
      console.warn(`Embedding batch ${i}-${i + BATCH_SIZE} failed:`, error);
      // Add fallback embeddings
      batch.forEach(() => embeddings.push(createFallbackEmbedding()));
    }
  }

  return embeddings;
}

/**
 * Create fallback embedding when API fails
 */
function createFallbackEmbedding(dimension: number = 1536): number[] {
  return Array.from({ length: dimension }, () => Math.random() * 2 - 1);
}

/**
 * Cosine similarity calculation
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Query expansion using semantic similarity
 */
export async function expandQuery(
  originalQuery: string,
  chatHistory: { role: string; content: string }[] = []
): Promise<string[]> {
  try {
    const context = chatHistory
      .slice(-3) // Last 3 messages for context
      .map(msg => msg.content)
      .join('\n');

    const prompt = `Given this conversation context:
${context}

Expand this query with 2-3 related search terms that would help find comprehensive information:
Query: "${originalQuery}"

Return only the expanded queries, one per line:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    const expandedQueries = (response.choices[0]?.message?.content || '')
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0 && q !== originalQuery)
      .slice(0, 3);

    return [originalQuery, ...expandedQueries];
  } catch (error) {
    console.warn('Query expansion failed:', error);
    return [originalQuery];
  }
}