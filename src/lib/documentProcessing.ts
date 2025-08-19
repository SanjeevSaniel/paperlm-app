import { DocumentChunk } from '@/types';
import fs from 'fs/promises';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import os from 'os';
import path from 'path';

// Chunk a plain string into overlapping segments
export const chunkDocument = async (
  documentId: string,
  content: string,
): Promise<DocumentChunk[]> => {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '.', '!', '?', ';', ':', ' '],
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

// Extract text from an uploaded file
export const extractTextFromFile = async (file: File): Promise<string> => {
  // Plain text
  if (file.type === 'text/plain') {
    return await file.text();
  }

  // Markdown
  if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
    return await file.text();
  }

  // CSV -> simple human-readable formatting
  if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
    const csvText = await file.text();
    const lines = csvText.split('\n');
    const headers = lines[0]?.split(',') ?? [];

    let formattedText = `CSV Document: ${file.name}\n\n`;
    formattedText += `Headers: ${headers.join(', ')}\n\n`;
    formattedText += `Data:\n`;

    lines.slice(1).forEach((line, index) => {
      if (line.trim()) {
        const values = line.split(',');
        formattedText += `Row ${index + 1}:\n`;
        headers.forEach((header, i) => {
          formattedText += `  ${header}: ${values[i] || ''}\n`;
        });
        formattedText += '\n';
      }
    });

    return formattedText;
  }

  // DOCX (basic placeholder)
  if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    return `DOCX Document: ${file.name}\n\nNote: DOCX processing requires additional libraries. Please convert to PDF or TXT for full text extraction.`;
  }

  // PDF processing with fallback approaches
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    console.log('Processing PDF file:', file.name);
    const arrayBuffer = await file.arrayBuffer();

    // First, try pdf-parse as it's simpler and faster
    try {
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(Buffer.from(arrayBuffer));
      console.log('PDF parsed successfully with pdf-parse');
      return data.text.trim();
    } catch (error) {
      console.warn('pdf-parse failed, trying LangChain PDFLoader:', error);
    }

    // Fallback to LangChain PDFLoader with temporary file
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'paperlm-'));
    const tmpPath = path.join(tmpDir, `upload-${Date.now()}.pdf`);
    await fs.writeFile(tmpPath, Buffer.from(arrayBuffer));

    try {
      console.log('Trying LangChain PDFLoader...');
      
      // Dynamic import to avoid loading heavy deps at module load time
      const { PDFLoader } = await import(
        '@langchain/community/document_loaders/fs/pdf'
      );

      // Use pdfjs-dist backend to avoid pdf-parse FS issues
      const loader = new PDFLoader(tmpPath, {
        splitPages: false,
        // Supply pdfjs dynamically
        pdfjs: () => import('pdfjs-dist'),
      });

      const docs = await loader.load();
      const text = docs.map((d) => d.pageContent).join('\n');
      console.log('PDF parsed successfully with LangChain PDFLoader');
      return text.trim();
    } catch (error) {
      console.error('LangChain PDFLoader also failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    } finally {
      // Cleanup temp file and directory
      try {
        await fs.unlink(tmpPath);
      } catch {}
      try {
        await fs.rmdir(tmpDir);
      } catch {}
    }
  }

  throw new Error(`Unsupported file type: ${file.type}`);
};
