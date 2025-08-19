import { DocumentChunk } from '@/types';
import pdf from 'pdf-parse';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const chunkDocument = async (
  documentId: string,
  content: string,
): Promise<DocumentChunk[]> => {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '.', '!', '?', ';', ':', ' ']
  });
  
  const chunks = await textSplitter.splitText(content);
  
  let currentChar = 0;
  return chunks.map((chunk, index) => {
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
      },
    };
  });
};

function splitTextRecursively(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
  separators: string[]
): string[] {
  if (text.length <= chunkSize) {
    return [text];
  }

  // Try each separator in order
  for (const separator of separators) {
    if (text.includes(separator)) {
      const parts = text.split(separator);
      const chunks: string[] = [];
      let currentChunk = '';

      for (const part of parts) {
        const testChunk = currentChunk + (currentChunk ? separator : '') + part;
        
        if (testChunk.length <= chunkSize) {
          currentChunk = testChunk;
        } else {
          if (currentChunk) {
            chunks.push(currentChunk);
            // Add overlap if possible
            const overlapStart = Math.max(0, currentChunk.length - chunkOverlap);
            currentChunk = currentChunk.slice(overlapStart) + separator + part;
          } else {
            // Part is too large, split it further
            const subChunks = splitTextRecursively(part, chunkSize, chunkOverlap, separators.slice(1));
            chunks.push(...subChunks);
            currentChunk = '';
          }
        }
      }
      
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      
      return chunks.filter(chunk => chunk.trim().length > 0);
    }
  }

  // If no separators work, split by character count
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  
  return chunks;
}

export const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.type === 'text/plain') {
    return await file.text();
  }
  
  if (file.type === 'application/pdf') {
    try {
      // Convert File to Blob and create a temporary file-like object for LangChain
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Create a temporary file path for LangChain PDF loader
      // Note: In production, you might want to save to a temporary directory
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      
      // Use the original pdf-parse as fallback since PDFLoader requires file path
      // For better PDF processing, we can keep using pdf-parse or implement file system temp storage
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }
  
  // Support additional text-based formats
  if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
    return await file.text();
  }
  
  if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
    return await file.text();
  }
  
  throw new Error(`Unsupported file type: ${file.type}`);
};