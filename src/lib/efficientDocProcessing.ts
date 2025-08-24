/**
 * Efficient Document Processing System
 * Replacing LangChain with lightweight, optimized alternatives
 */

import { DocumentChunk } from '@/types';
import { EfficientTextSplitter, generateEmbeddings } from './advancedRag';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Lightweight PDF text extraction without LangChain
 */
export async function extractPDFTextEfficient(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  
  try {
    // Method 1: Try pdf-parse (lighter than LangChain)
    const buffer = Buffer.from(arrayBuffer);
    
    // Direct import to avoid dynamic import issues
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    
    if (data.text && data.text.trim().length > 50) {
      console.log(`✅ pdf-parse extracted ${data.text.length} characters from ${data.numpages} pages`);
      return data.text.trim();
    }
  } catch (error) {
    console.warn('⚠️ pdf-parse failed:', error);
  }

  // Method 2: Fallback to basic buffer processing
  try {
    const text = Buffer.from(arrayBuffer).toString('utf8');
    const cleanText = text.replace(/[^\x20-\x7E\n]/g, ' ').trim();
    
    if (cleanText.length > 50) {
      console.log(`✅ Buffer extraction got ${cleanText.length} characters`);
      return cleanText;
    }
  } catch (error) {
    console.warn('⚠️ Buffer extraction failed:', error);
  }

  throw new Error('Failed to extract text from PDF');
}

/**
 * Efficient text extraction from various file types
 */
export async function extractTextFromFileEfficient(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  try {
    // Handle different file types
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await extractPDFTextEfficient(file);
    }

    if (fileType.startsWith('text/') || 
        fileName.endsWith('.txt') || 
        fileName.endsWith('.md') || 
        fileName.endsWith('.csv')) {
      const text = await file.text();
      console.log(`✅ Text file extracted ${text.length} characters`);
      return text;
    }

    if (fileName.endsWith('.json')) {
      const text = await file.text();
      try {
        const json = JSON.parse(text);
        const readable = JSON.stringify(json, null, 2);
        console.log(`✅ JSON file processed ${readable.length} characters`);
        return readable;
      } catch {
        return text;
      }
    }

    // For other file types, try to read as text
    const text = await file.text();
    if (text.trim().length > 0) {
      console.log(`✅ Generic text extraction got ${text.length} characters`);
      return text;
    }

    throw new Error(`Unsupported file type: ${fileType}`);

  } catch (error) {
    console.error('Text extraction failed:', error);
    throw new Error(`Failed to extract text from ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced document chunking with better context preservation
 */
export async function chunkDocumentEfficient(
  documentId: string,
  content: string,
  options: {
    chunkSize?: number;
    chunkOverlap?: number;
    preserveStructure?: boolean;
  } = {}
): Promise<DocumentChunk[]> {
  const {
    chunkSize = 1200,
    chunkOverlap = 250,
    preserveStructure = true
  } = options;

  // Preprocess content to preserve structure
  let processedContent = content;
  
  if (preserveStructure) {
    processedContent = content
      // Preserve headers and titles
      .replace(/^(#{1,6}\s+.+)$/gm, '\n\n$1\n\n')
      // Preserve bullet points and lists
      .replace(/^(\s*[-*•]\s+.+)$/gm, '\n$1')
      .replace(/^(\s*\d+\.\s+.+)$/gm, '\n$1')
      // Preserve section breaks
      .replace(/^(Introduction|Summary|Conclusion|Abstract|Overview|Background|Methods|Results|Discussion|Executive Summary):/gmi, '\n\n$1:\n')
      // Clean up excessive whitespace
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }

  // Use efficient text splitter
  const splitter = new EfficientTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: [
      '\n\n\n', // Major section breaks
      '\n\n',   // Paragraph breaks
      '\n',     // Line breaks
      '. ',     // Sentence endings
      '! ',     // Exclamations
      '? ',     // Questions
      '; ',     // Semicolons
      ', ',     // Commas (for lists)
      ' ',      // Word boundaries
    ]
  });

  const chunks = splitter.splitText(processedContent);
  let currentChar = 0;

  const documentChunks: DocumentChunk[] = chunks.map((chunk, index) => {
    const startChar = currentChar;
    const endChar = currentChar + chunk.length;
    currentChar = endChar;

    return {
      id: `${documentId}-chunk-${index}`,
      documentId,
      content: chunk,
      metadata: {
        chunkIndex: index,
        startChar,
        endChar,
        chunkSize: chunk.length,
        totalChunks: chunks.length,
        // Enhanced metadata
        wordCount: chunk.split(/\s+/).length,
        hasStructure: /^(#{1,6}|\d+\.|[-*•])/m.test(chunk),
        contentType: detectContentType(chunk),
        quality: calculateChunkQuality(chunk),
      }
    };
  });

  console.log(`📄 Document chunked into ${documentChunks.length} efficient chunks`);
  return documentChunks;
}

/**
 * Detect the type of content in a chunk
 */
function detectContentType(content: string): string {
  const lower = content.toLowerCase();
  
  if (/^#{1,6}\s/.test(content)) return 'header';
  if (/^\d+\.\s/.test(content)) return 'numbered-list';
  if (/^[-*•]\s/.test(content)) return 'bullet-list';
  if (/\b(table|column|row)\b/i.test(content) && /\|/.test(content)) return 'table';
  if (/\b(figure|chart|graph|image)\b/i.test(lower)) return 'figure-reference';
  if (/\b(abstract|summary|conclusion)\b/i.test(lower)) return 'summary';
  if (/\b(introduction|overview|background)\b/i.test(lower)) return 'introduction';
  
  return 'paragraph';
}

/**
 * Calculate chunk quality score (0-1)
 */
function calculateChunkQuality(content: string): number {
  let score = 0.5; // Base score
  
  // Length quality (optimal around 800-1500 chars)
  const length = content.length;
  if (length >= 300 && length <= 2000) {
    score += 0.2;
  } else if (length < 100 || length > 3000) {
    score -= 0.2;
  }
  
  // Sentence completeness
  const sentences = content.split(/[.!?]+/).length - 1;
  if (sentences >= 2) score += 0.1;
  
  // Has meaningful content (not just whitespace/numbers)
  const words = content.split(/\s+/).filter(word => 
    word.length > 2 && !/^\d+$/.test(word)
  ).length;
  if (words >= 10) score += 0.1;
  if (words >= 50) score += 0.1;
  
  // Structural elements
  if (/^(#{1,6}|\d+\.|[-*•])/m.test(content)) score += 0.05;
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Batch process multiple documents efficiently
 */
export async function batchProcessDocuments(
  files: File[],
  options: {
    maxConcurrent?: number;
    chunkSize?: number;
    generateEmbeddings?: boolean;
  } = {}
): Promise<Array<{
  file: File;
  text: string;
  chunks: DocumentChunk[];
  embeddings?: number[][];
  error?: string;
}>> {
  const {
    maxConcurrent = 3,
    chunkSize = 1200,
    generateEmbeddings: shouldGenerateEmbeddings = false
  } = options;

  const results: Array<{
    file: File;
    text: string;
    chunks: DocumentChunk[];
    embeddings?: number[][];
    error?: string;
  }> = [];

  // Process files in batches to avoid memory issues
  for (let i = 0; i < files.length; i += maxConcurrent) {
    const batch = files.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (file) => {
      try {
        const text = await extractTextFromFileEfficient(file);
        const chunks = await chunkDocumentEfficient(`batch-${i}-${file.name}`, text, {
          chunkSize
        });

        let embeddings: number[][] | undefined;
        if (shouldGenerateEmbeddings) {
          const chunkTexts = chunks.map(c => c.content);
          embeddings = await generateEmbeddings(chunkTexts);
        }

        return {
          file,
          text,
          chunks,
          embeddings
        };
      } catch (error) {
        return {
          file,
          text: '',
          chunks: [],
          error: error instanceof Error ? error.message : 'Processing failed'
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    console.log(`📦 Processed batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(files.length / maxConcurrent)}`);
  }

  const successful = results.filter(r => !r.error).length;
  console.log(`✅ Batch processing complete: ${successful}/${files.length} files successful`);

  return results;
}

/**
 * Smart text preprocessing for better embeddings
 */
export function preprocessTextForEmbedding(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove excessive punctuation
    .replace(/[^\w\s.,!?;:()\-]/g, '')
    // Normalize quotes
    .replace(/[""'']/g, '"')
    // Remove very short words and numbers that don't add semantic value
    .split(' ')
    .filter(word => word.length > 1 && !/^\d+$/.test(word))
    .join(' ')
    .trim();
}

/**
 * Calculate text similarity without embeddings (for lightweight comparison)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}