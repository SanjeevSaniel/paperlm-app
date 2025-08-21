/**
 * Enhanced Citation Processing
 * Provides better source attribution with page numbers, sections, and context
 */

import { RAGMetadata } from './qdrant';

export interface EnhancedCitation {
  id: string;
  content: string;
  fullContent?: string;
  metadata: RAGMetadata;
  // Enhanced display information
  displayTitle: string;
  exactReference: string;
  confidence: number;
  contextualSnippet: string;
  sourceType: 'pdf' | 'word' | 'text' | 'web' | 'unknown';
  citationFormat: {
    apa: string;
    mla: string;
    chicago: string;
  };
}

/**
 * Extract page number from content or metadata
 */
function extractPageNumber(content: string, metadata: RAGMetadata): number | undefined {
  if (metadata.pageNumber) return metadata.pageNumber;
  
  // Try to extract page number from content patterns
  const pagePatterns = [
    /(?:page|p\.?)\s*(\d+)/i,
    /^(\d+)\s*$/, // Just a number at start of line
    /\[page\s*(\d+)\]/i,
    /(?:^|\s)(\d+)(?:\s|$)/, // Standalone number
  ];
  
  for (const pattern of pagePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const pageNum = parseInt(match[1], 10);
      if (pageNum > 0 && pageNum < 10000) { // Reasonable page range
        return pageNum;
      }
    }
  }
  
  return undefined;
}

/**
 * Extract section title from content
 */
function extractSectionTitle(content: string, metadata: RAGMetadata): string | undefined {
  if (metadata.sectionTitle) return metadata.sectionTitle;
  
  // Look for section headers in the content
  const sectionPatterns = [
    /^(#{1,6}\s+.+)$/m, // Markdown headers
    /^([A-Z][A-Z\s]{2,50})\s*$/m, // ALL CAPS headers
    /^(\d+\.?\s+[A-Z].+)$/m, // Numbered sections
    /^([IVX]+\.?\s+[A-Z].+)$/m, // Roman numeral sections
  ];
  
  for (const pattern of sectionPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/^#+\s*/, ''); // Remove markdown syntax
    }
  }
  
  return undefined;
}

/**
 * Generate contextual snippet with highlighting
 */
function generateContextualSnippet(content: string, query?: string): string {
  const maxLength = 200;
  
  if (content.length <= maxLength) {
    return content;
  }
  
  // If we have a query, try to center around the most relevant part
  if (query) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    let bestMatch = { index: 0, score: 0 };
    
    for (const term of queryTerms) {
      const index = content.toLowerCase().indexOf(term);
      if (index !== -1) {
        // Calculate score based on term frequency and position
        const termCount = (content.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        const score = termCount * (1 - index / content.length);
        if (score > bestMatch.score) {
          bestMatch = { index, score };
        }
      }
    }
    
    // Center the snippet around the best match
    const start = Math.max(0, bestMatch.index - maxLength / 2);
    const end = Math.min(content.length, start + maxLength);
    const snippet = content.substring(start, end);
    
    return (start > 0 ? '...' : '') + snippet + (end < content.length ? '...' : '');
  }
  
  // Default: take from the beginning
  return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
}

/**
 * Determine source type from metadata
 */
function determineSourceType(metadata: RAGMetadata): 'pdf' | 'word' | 'text' | 'web' | 'unknown' {
  const fileName = metadata.fileName.toLowerCase();
  const fileType = metadata.fileType.toLowerCase();
  
  if (fileName.endsWith('.pdf') || fileType.includes('pdf')) return 'pdf';
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc') || fileType.includes('word')) return 'word';
  if (metadata.sourceUrl && (metadata.sourceUrl.startsWith('http') || metadata.sourceUrl.startsWith('https'))) return 'web';
  if (fileName.endsWith('.txt') || fileType.includes('text')) return 'text';
  
  return 'unknown';
}

/**
 * Generate citation formats
 */
function generateCitationFormats(metadata: RAGMetadata, pageNumber?: number): {
  apa: string;
  mla: string;
  chicago: string;
} {
  const author = metadata.loader || 'Unknown Author';
  const title = metadata.fileName.replace(/\.[^/.]+$/, ''); // Remove extension
  const year = metadata.uploadedAt ? new Date(metadata.uploadedAt).getFullYear() : new Date().getFullYear();
  const pageRef = pageNumber ? `, p. ${pageNumber}` : '';
  const url = metadata.sourceUrl;
  
  // APA Format
  let apa = `${author} (${year}). ${title}`;
  if (pageRef) apa += pageRef;
  if (url) apa += `. Retrieved from ${url}`;
  
  // MLA Format
  let mla = `${author}. "${title}." ${year}`;
  if (pageRef) mla += pageRef;
  if (url) mla += `. Web.`;
  
  // Chicago Format
  let chicago = `${author}. "${title}." Accessed ${new Date().toLocaleDateString()}.`;
  if (pageRef) chicago += pageRef;
  if (url) chicago += ` ${url}.`;
  
  return { apa, mla, chicago };
}

/**
 * Create enhanced citation from RAG result
 */
export function createEnhancedCitation(
  ragResult: { pageContent: string; metadata: RAGMetadata },
  query?: string
): EnhancedCitation {
  const { pageContent, metadata } = ragResult;
  
  // Extract enhanced information
  const pageNumber = extractPageNumber(pageContent, metadata);
  const sectionTitle = extractSectionTitle(pageContent, metadata);
  const sourceType = determineSourceType(metadata);
  const contextualSnippet = generateContextualSnippet(pageContent, query);
  
  // Build exact reference
  let exactReference = metadata.fileName;
  if (pageNumber) exactReference += `, Page ${pageNumber}`;
  if (sectionTitle) exactReference += `, Section: ${sectionTitle}`;
  if (metadata.paragraphIndex) exactReference += `, Paragraph ${metadata.paragraphIndex}`;
  
  // Create display title
  const displayTitle = sectionTitle || metadata.fileName.replace(/\.[^/.]+$/, '');
  
  // Generate citation formats
  const citationFormat = generateCitationFormats(metadata, pageNumber);
  
  // Calculate confidence (use existing or calculate from relevance)
  const confidence = metadata.confidence || 0.8; // Default confidence
  
  return {
    id: metadata.chunkId,
    content: pageContent,
    fullContent: pageContent, // Could be expanded to include more context
    metadata: {
      ...metadata,
      pageNumber,
      sectionTitle,
      exactLocation: exactReference,
      confidence
    },
    displayTitle,
    exactReference,
    confidence,
    contextualSnippet,
    sourceType,
    citationFormat
  };
}

/**
 * Enhance citations with additional context and formatting
 */
export function enhanceCitations(
  ragResults: Array<{ pageContent: string; metadata: RAGMetadata }>,
  query?: string
): EnhancedCitation[] {
  return ragResults.map(result => createEnhancedCitation(result, query));
}

/**
 * Format citation for display in chat
 */
export function formatCitationForDisplay(citation: EnhancedCitation, format: 'short' | 'full' = 'short'): string {
  if (format === 'short') {
    return citation.exactReference;
  }
  
  // Full format with APA citation
  return `${citation.exactReference}\n\n"${citation.contextualSnippet}"\n\nCitation: ${citation.citationFormat.apa}`;
}

/**
 * Generate bibliography from citations
 */
export function generateBibliography(
  citations: EnhancedCitation[],
  format: 'apa' | 'mla' | 'chicago' = 'apa'
): string[] {
  const uniqueCitations = new Map<string, EnhancedCitation>();
  
  // Remove duplicates based on document ID
  citations.forEach(citation => {
    const key = citation.metadata.documentId;
    if (!uniqueCitations.has(key) || citation.confidence > uniqueCitations.get(key)!.confidence) {
      uniqueCitations.set(key, citation);
    }
  });
  
  return Array.from(uniqueCitations.values())
    .sort((a, b) => a.metadata.fileName.localeCompare(b.metadata.fileName))
    .map(citation => citation.citationFormat[format]);
}

/**
 * Validate and clean citation content
 */
export function validateCitation(citation: EnhancedCitation): {
  isValid: boolean;
  issues: string[];
  cleanedCitation?: EnhancedCitation;
} {
  const issues: string[] = [];
  
  // Check for minimum required information
  if (!citation.content || citation.content.trim().length < 10) {
    issues.push('Citation content is too short');
  }
  
  if (!citation.metadata.fileName) {
    issues.push('Missing source file name');
  }
  
  if (citation.confidence < 0.3) {
    issues.push('Low confidence score - citation may not be relevant');
  }
  
  // Clean and validate content
  const cleanedContent = citation.content
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s.,;:!?()-]/g, ''); // Remove special characters
  
  const cleanedCitation: EnhancedCitation = {
    ...citation,
    content: cleanedContent,
    contextualSnippet: generateContextualSnippet(cleanedContent)
  };
  
  return {
    isValid: issues.length === 0,
    issues,
    cleanedCitation: issues.length === 0 ? cleanedCitation : undefined
  };
}