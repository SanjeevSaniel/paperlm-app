/**
 * Document Citation Extractor
 * Extracts enhanced citation information during document processing
 */

export interface DocumentSection {
  title: string;
  startChar: number;
  endChar: number;
  level: number; // 1 = main heading, 2 = sub-heading, etc.
  content: string;
}

export interface PageBreak {
  pageNumber: number;
  startChar: number;
  endChar: number;
}

export interface ExtractedCitationInfo {
  pageNumber?: number;
  sectionTitle?: string;
  paragraphIndex?: number;
  lineNumber?: number;
  exactLocation: string;
  contextBefore?: string;
  contextAfter?: string;
}

/**
 * Extract page breaks from document text
 */
export function extractPageBreaks(text: string): PageBreak[] {
  const pageBreaks: PageBreak[] = [];
  
  // Common page break patterns
  const pagePatterns = [
    /\f/g, // Form feed character
    /\n\s*-\s*\d+\s*-\s*\n/g, // Page numbers like "- 5 -"
    /\n\s*Page\s+(\d+)\s*\n/gi,
    /\n\s*(\d+)\s*\n(?=\s*[A-Z])/g, // Standalone page numbers before new sections
    /\[page\s+(\d+)\]/gi, // Explicit page markers
  ];
  
  let currentPage = 1;
  let lastPageEnd = 0;
  
  for (const pattern of pagePatterns) {
    let match;
    pattern.lastIndex = 0; // Reset regex
    
    while ((match = pattern.exec(text)) !== null) {
      const pageStart = lastPageEnd;
      const pageEnd = match.index;
      
      if (pageEnd > pageStart) {
        pageBreaks.push({
          pageNumber: currentPage,
          startChar: pageStart,
          endChar: pageEnd
        });
        
        currentPage++;
        lastPageEnd = pageEnd;
      }
    }
  }
  
  // Add final page if there's remaining content
  if (lastPageEnd < text.length) {
    pageBreaks.push({
      pageNumber: currentPage,
      startChar: lastPageEnd,
      endChar: text.length
    });
  }
  
  return pageBreaks;
}

/**
 * Extract document sections and headings
 */
export function extractDocumentSections(text: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  
  // Patterns for different heading styles
  const headingPatterns = [
    { pattern: /^(#{1,6})\s+(.+)$/gm, levelOffset: 0 }, // Markdown headers
    { pattern: /^([IVX]+\.?\s+.+)$/gm, levelOffset: 1 }, // Roman numeral sections
    { pattern: /^(\d+\.?\s+.+)$/gm, levelOffset: 1 }, // Numbered sections
    { pattern: /^([A-Z][A-Z\s]{2,50})\s*$/gm, levelOffset: 1 }, // ALL CAPS headers
    { pattern: /^(.+)\n={3,}$/gm, levelOffset: 1 }, // Underlined with equals
    { pattern: /^(.+)\n-{3,}$/gm, levelOffset: 2 }, // Underlined with dashes
  ];
  
  for (const { pattern, levelOffset } of headingPatterns) {
    let match;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(text)) !== null) {
      const title = match[2] || match[1];
      const level = match[1].startsWith('#') ? match[1].length : levelOffset + 1;
      
      // Find the end of this section (next heading or end of document)
      const nextMatch = pattern.exec(text);
      const endChar = nextMatch ? nextMatch.index : text.length;
      pattern.lastIndex = match.index + match[0].length; // Reset for next iteration
      
      sections.push({
        title: title.trim(),
        startChar: match.index,
        endChar,
        level,
        content: text.substring(match.index, endChar)
      });
    }
  }
  
  // Sort sections by position in document
  return sections.sort((a, b) => a.startChar - b.startChar);
}

/**
 * Find which page a character position is on
 */
export function findPageForPosition(position: number, pageBreaks: PageBreak[]): number {
  for (const page of pageBreaks) {
    if (position >= page.startChar && position <= page.endChar) {
      return page.pageNumber;
    }
  }
  return 1; // Default to page 1 if not found
}

/**
 * Find which section a character position is in
 */
export function findSectionForPosition(position: number, sections: DocumentSection[]): DocumentSection | undefined {
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i];
    if (position >= section.startChar && position <= section.endChar) {
      return section;
    }
  }
  return undefined;
}

/**
 * Calculate paragraph and line numbers
 */
export function calculateParagraphAndLine(text: string, position: number): { paragraphIndex: number; lineNumber: number } {
  const beforePosition = text.substring(0, position);
  const paragraphs = beforePosition.split(/\n\s*\n/); // Double newlines indicate paragraphs
  const lines = beforePosition.split('\n');
  
  return {
    paragraphIndex: paragraphs.length,
    lineNumber: lines.length
  };
}

/**
 * Extract context around a position
 */
export function extractContext(text: string, startChar: number, endChar: number, contextLength: number = 100): {
  contextBefore?: string;
  contextAfter?: string;
} {
  const contextStart = Math.max(0, startChar - contextLength);
  const contextEnd = Math.min(text.length, endChar + contextLength);
  
  const contextBefore = startChar > contextLength ? 
    '...' + text.substring(contextStart, startChar).trim() : 
    text.substring(contextStart, startChar).trim();
    
  const contextAfter = endChar + contextLength < text.length ? 
    text.substring(endChar, contextEnd).trim() + '...' : 
    text.substring(endChar, contextEnd).trim();
  
  return {
    contextBefore: contextBefore || undefined,
    contextAfter: contextAfter || undefined
  };
}

/**
 * Extract enhanced citation information for a text chunk
 */
export function extractCitationInfo(
  fullText: string,
  chunkStartChar: number,
  chunkEndChar: number,
  fileName: string
): ExtractedCitationInfo {
  // Extract document structure
  const pageBreaks = extractPageBreaks(fullText);
  const sections = extractDocumentSections(fullText);
  
  // Find page number
  const pageNumber = findPageForPosition(chunkStartChar, pageBreaks);
  
  // Find section
  const section = findSectionForPosition(chunkStartChar, sections);
  const sectionTitle = section?.title;
  
  // Calculate paragraph and line numbers
  const { paragraphIndex, lineNumber } = calculateParagraphAndLine(fullText, chunkStartChar);
  
  // Extract context
  const context = extractContext(fullText, chunkStartChar, chunkEndChar);
  
  // Build exact location string
  const locationParts: string[] = [];
  if (pageNumber > 1) locationParts.push(`Page ${pageNumber}`);
  if (sectionTitle) locationParts.push(`Section: ${sectionTitle}`);
  if (paragraphIndex > 1) locationParts.push(`Paragraph ${paragraphIndex}`);
  
  const exactLocation = locationParts.length > 0 ? 
    locationParts.join(', ') : 
    `${fileName}, Position ${chunkStartChar}-${chunkEndChar}`;
  
  return {
    pageNumber: pageNumber > 1 ? pageNumber : undefined,
    sectionTitle,
    paragraphIndex: paragraphIndex > 1 ? paragraphIndex : undefined,
    lineNumber: lineNumber > 1 ? lineNumber : undefined,
    exactLocation,
    contextBefore: context.contextBefore,
    contextAfter: context.contextAfter
  };
}

/**
 * Process document and enhance chunks with citation information
 */
export function enhanceDocumentChunksWithCitations<T extends {
  pageContent: string;
  metadata: {
    startChar: number;
    endChar: number;
    fileName: string;
    [key: string]: any;
  };
}>(
  fullText: string,
  chunks: T[]
): (T & { metadata: T['metadata'] & ExtractedCitationInfo })[] {
  return chunks.map(chunk => {
    const citationInfo = extractCitationInfo(
      fullText,
      chunk.metadata.startChar,
      chunk.metadata.endChar,
      chunk.metadata.fileName
    );
    
    return {
      ...chunk,
      metadata: {
        ...chunk.metadata,
        ...citationInfo
      }
    };
  });
}

/**
 * Validate and clean extracted citation information
 */
export function validateCitationInfo(info: ExtractedCitationInfo): {
  isValid: boolean;
  warnings: string[];
  cleanedInfo: ExtractedCitationInfo;
} {
  const warnings: string[] = [];
  const cleanedInfo = { ...info };
  
  // Validate page number
  if (info.pageNumber && (info.pageNumber < 1 || info.pageNumber > 10000)) {
    warnings.push('Page number seems unrealistic');
    cleanedInfo.pageNumber = undefined;
  }
  
  // Validate section title
  if (info.sectionTitle && info.sectionTitle.length > 200) {
    warnings.push('Section title is very long, truncating');
    cleanedInfo.sectionTitle = info.sectionTitle.substring(0, 200) + '...';
  }
  
  // Validate context
  if (info.contextBefore && info.contextBefore.length > 500) {
    cleanedInfo.contextBefore = info.contextBefore.substring(0, 500) + '...';
  }
  
  if (info.contextAfter && info.contextAfter.length > 500) {
    cleanedInfo.contextAfter = info.contextAfter.substring(0, 500) + '...';
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    cleanedInfo
  };
}