import { DocumentChunk } from '@/types';
import fs from 'fs/promises';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import os from 'os';
import path from 'path';

// Enhanced PDF extraction with OCR fallback for scanned documents
const extractPDFText = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'paperlm-'));
  const tmpPath = path.join(tmpDir, `upload-${Date.now()}.pdf`);

  try {
    // Write file to temporary location
    await fs.writeFile(tmpPath, Buffer.from(arrayBuffer));

    // Method 1: Try LangChain PDFLoader first (best for text-based PDFs)
    try {
      const { PDFLoader } = await import('@langchain/community/document_loaders/fs/pdf');
      const loader = new PDFLoader(tmpPath, {
        splitPages: false,
        parsedItemSeparator: '\n',
      });

      const docs = await loader.load();
      if (docs && docs.length > 0) {
        const text = docs.map((doc) => doc.pageContent).join('\n\n').trim();
        
        // Check if we got meaningful text (not just whitespace or minimal content)
        if (text && text.length > 50 && text.split(/\s+/).length > 10) {
          console.log(`✅ LangChain PDFLoader extracted ${text.length} characters`);
          return text;
        }
      }
    } catch (error) {
      console.warn('⚠️ LangChain PDFLoader failed:', error);
    }

    // Method 2: Try pdf-parse as fallback
    try {
      const pdfParse = await import('pdf-parse');
      const buffer = Buffer.from(arrayBuffer);
      const data = await pdfParse.default(buffer);
      
      if (data.text && data.text.trim().length > 50) {
        console.log(`✅ pdf-parse extracted ${data.text.length} characters from ${data.numpages} pages`);
        return data.text.trim();
      }
    } catch (error) {
      console.warn('⚠️ pdf-parse failed:', error);
    }

    // Method 3: Try pdfjs-dist for more complex PDFs
    try {
      const pdfjsLib = await import('pdfjs-dist');
      const uint8Array = new Uint8Array(arrayBuffer);
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      
      let fullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item) => 'str' in item)
          .map(item => (item as { str: string }).str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      if (fullText.trim().length > 50) {
        console.log(`✅ pdfjs-dist extracted ${fullText.length} characters from ${pdf.numPages} pages`);
        return fullText.trim();
      }
    } catch (error) {
      console.warn('⚠️ pdfjs-dist failed:', error);
    }

    // Method 4: OCR fallback for scanned PDFs (using pdfjs-dist + Tesseract)
    console.log('📄 Text extraction failed, attempting OCR for scanned PDF...');
    try {
      const ocrText = await extractPDFWithOCR(arrayBuffer);
      if (ocrText && ocrText.length > 50) {
        console.log(`✅ OCR extracted ${ocrText.length} characters`);
        return `# 📄 OCR-Extracted Content\n\n*This document was processed using OCR (Optical Character Recognition) as it appears to be a scanned PDF. Text accuracy may vary.*\n\n---\n\n${ocrText}`;
      }
    } catch (error) {
      console.warn('⚠️ OCR extraction failed:', error);
    }

    throw new Error('PDF appears to be empty, corrupted, or contains no readable text. All extraction methods failed.');
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

// OCR extraction for scanned PDFs
const extractPDFWithOCR = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Convert PDF pages to images and run OCR
    const pdfjsLib = await import('pdfjs-dist');
    const Tesseract = await import('tesseract.js');
    
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    
    let ocrText = '';
    const maxPages = Math.min(pdf.numPages, 20); // Limit OCR to first 20 pages for performance
    
    console.log(`🔍 Starting OCR for ${maxPages} pages...`);
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR accuracy
        
        // Create canvas to render PDF page
        const canvas = new (await import('canvas')).Canvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        
        await page.render({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          canvas: canvas as any, // Canvas from node-canvas has different typing than DOM canvas
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          canvasContext: context as any,
          viewport: viewport,
        }).promise;
        
        // Convert canvas to image buffer
        const imageBuffer = canvas.toBuffer('image/png');
        
        // Run OCR on the page image
        console.log(`📖 OCR processing page ${pageNum}/${maxPages}...`);
        const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              console.log(`⚙️ OCR progress: ${Math.round(m.progress * 100)}%`);
            }
          }
        });
        
        if (text && text.trim().length > 10) {
          ocrText += `\n\n--- Page ${pageNum} ---\n\n${text.trim()}`;
        }
      } catch (pageError) {
        console.warn(`⚠️ OCR failed for page ${pageNum}:`, pageError);
        // Continue with next page
      }
    }
    
    return ocrText.trim();
  } catch (error) {
    console.error('❌ OCR extraction failed:', error);
    throw new Error('OCR processing failed');
  }
};

export const chunkDocument = async (
  documentId: string,
  content: string,
): Promise<DocumentChunk[]> => {
  // Preprocess content to preserve important structural elements
  const processedContent = content
    // Preserve headers and titles by adding extra spacing
    .replace(/^(#{1,6}\s+.+)$/gm, '\n\n$1\n\n')
    // Preserve bullet points and numbered lists
    .replace(/^(\s*[-*•]\s+.+)$/gm, '\n$1')
    .replace(/^(\s*\d+\.\s+.+)$/gm, '\n$1')
    // Preserve sections that start with common keywords
    .replace(/^(Introduction|Summary|Conclusion|Abstract|Overview|Background|Methods|Results|Discussion):/gm, '\n\n$1:\n')
    // Normalize multiple spaces and newlines
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  // Enhanced chunking for better context preservation
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500, // Increased from 1000 for more context per chunk
    chunkOverlap: 300, // Increased from 200 for better context continuity
    separators: [
      '\n\n\n', // Triple newlines (major section breaks)
      '\n\n',   // Double newlines (paragraph breaks)
      '\n',     // Single newlines
      '. ',     // Sentence endings with space
      '! ',     // Exclamation with space
      '? ',     // Question with space
      ';',      // Semicolons
      ',',      // Commas (for lists)
      ' ',      // Spaces (last resort)
    ],
  });

  const chunks = await textSplitter.splitText(processedContent);
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

// OCR extraction for image files
const extractImageText = async (file: File): Promise<string> => {
  try {
    const Tesseract = await import('tesseract.js');
    
    console.log(`🖼️ Starting OCR for image: ${file.name}`);
    
    const { data: { text, confidence } } = await Tesseract.recognize(file, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`⚙️ OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    if (text && text.trim().length > 10) {
      const confidenceScore = Math.round(confidence);
      console.log(`✅ OCR extracted ${text.length} characters with ${confidenceScore}% confidence`);
      
      return `# 🖼️ OCR-Extracted Image Content\n\n*This image was processed using OCR (Optical Character Recognition). Text accuracy: ${confidenceScore}%*\n\n**Original file:** ${file.name}\n**File size:** ${(file.size / 1024).toFixed(1)} KB\n\n---\n\n${text.trim()}`;
    }
    
    throw new Error('No readable text found in image');
  } catch (error) {
    console.error('❌ Image OCR failed:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  // Plain text
  if (file.type === 'text/plain') return await file.text();

  // Markdown
  if (file.type === 'text/markdown' || file.name.endsWith('.md')) {
    return await file.text();
  }

  // Image files with OCR
  if (file.type.startsWith('image/')) {
    const supportedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (supportedImageTypes.includes(file.type)) {
      return await extractImageText(file);
    }
    throw new Error(`Unsupported image format: ${file.type}. Supported formats: JPEG, PNG, GIF, BMP, WebP`);
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
    `Unsupported file type: ${file.type}. Supported formats: PDF, DOCX, CSV, TXT, MD, Images (JPEG, PNG, GIF, BMP, WebP)`,
  );
};
