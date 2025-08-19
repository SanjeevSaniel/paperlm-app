import { DocumentChunk } from '@/types';
import fs from 'fs/promises';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import os from 'os';
import path from 'path';

// Simplified PDF extraction using LangChain PDFLoader (like your working example)
const extractPDFText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();

  // Create temporary file for LangChain PDFLoader (same approach as your working code)
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'paperlm-'));
  const tmpPath = path.join(tmpDir, `upload-${Date.now()}.pdf`);

  try {
    // Write file to temporary location (like your './nodejs.pdf' approach)
    await fs.writeFile(tmpPath, Buffer.from(arrayBuffer));

    // Use LangChain PDFLoader (exactly like your working code)
    const { PDFLoader } = await import(
      '@langchain/community/document_loaders/fs/pdf'
    );
    const loader = new PDFLoader(tmpPath, {
      splitPages: false, // Get all text as single document
      parsedItemSeparator: '\n',
    });

    // Load documents (same as your: const docs = await loader.load())
    const docs = await loader.load();

    if (!docs || docs.length === 0) {
      throw new Error('No content extracted from PDF file');
    }

    // Extract text content (same pattern as your code)
    const text = docs
      .map((doc) => doc.pageContent)
      .join('\n\n')
      .trim();

    if (text && text.length > 10) {
      console.log(`✅ LangChain PDFLoader extracted ${text.length} characters`);
      return text;
    }

    throw new Error('PDF appears to be empty or contains no readable text');
  } finally {
    // Clean up temporary file
    try {
      await fs.unlink(tmpPath);
    } catch {}
    try {
      await fs.rmdir(tmpDir);
    } catch {}
  }
};

export const chunkDocument = async (
  documentId: string,
  content: string,
): Promise<DocumentChunk[]> => {
  // Use the same text splitter approach as your working code
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

export const extractTextFromFile = async (file: File): Promise<string> => {
  // Plain text
  if (file.type === 'text/plain') return await file.text();

  // Markdown
  if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
    return await file.text();
  }

  // CSV
  if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
    const csvText = await file.text();
    if (csvText.trim().length < 10) {
      throw new Error('CSV file appears to be empty');
    }

    // Try LangChain CSV loader
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'paperlm-'));
    const tmpPath = path.join(tmpDir, `upload-${Date.now()}.csv`);

    try {
      await fs.writeFile(tmpPath, csvText, 'utf8');
      const { CSVLoader } = await import(
        '@langchain/community/document_loaders/fs/csv'
      );
      const loader = new CSVLoader(tmpPath);
      const docs = await loader.load();

      if (docs && docs.length > 0) {
        return docs
          .map((d) => d.pageContent)
          .join('\n\n')
          .trim();
      }
    } finally {
      try {
        await fs.unlink(tmpPath);
      } catch {}
      try {
        await fs.rmdir(tmpDir);
      } catch {}
    }

    throw new Error('Failed to process CSV file');
  }

  // DOCX
  if (
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'paperlm-'));
    const tmpPath = path.join(tmpDir, `upload-${Date.now()}.docx`);

    try {
      await fs.writeFile(tmpPath, Buffer.from(arrayBuffer));
      const { DocxLoader } = await import(
        '@langchain/community/document_loaders/fs/docx'
      );
      const loader = new DocxLoader(tmpPath);
      const docs = await loader.load();

      if (!docs || docs.length === 0) {
        throw new Error('No content extracted from DOCX file');
      }

      return docs
        .map((d) => d.pageContent)
        .join('\n\n')
        .trim();
    } finally {
      try {
        await fs.unlink(tmpPath);
      } catch {}
      try {
        await fs.rmdir(tmpDir);
      } catch {}
    }
  }

  // PDF - Use LangChain PDFLoader (same as your working approach)
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    return await extractPDFText(file);
  }

  throw new Error(
    `Unsupported file type: ${file.type}. Supported formats: PDF, DOCX, CSV, TXT, MD`,
  );
};
