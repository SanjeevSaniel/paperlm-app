// Temporary in-memory storage for anonymous users
// In production, you'd want to use Redis or similar

interface AnonymousDocument {
  id: string;
  sessionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  chunks: Array<{
    id: string;
    content: string;
    embedding: number[];
    chunkIndex: number;
    startChar: number;
    endChar: number;
  }>;
}

// Simple in-memory store with automatic cleanup
class AnonymousStore {
  private documents = new Map<string, AnonymousDocument>();
  private sessionDocuments = new Map<string, Set<string>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30 * 60 * 1000);
  }

  addDocument(doc: AnonymousDocument) {
    this.documents.set(doc.id, doc);
    
    if (!this.sessionDocuments.has(doc.sessionId)) {
      this.sessionDocuments.set(doc.sessionId, new Set());
    }
    this.sessionDocuments.get(doc.sessionId)!.add(doc.id);
  }

  getDocumentsBySession(sessionId: string): AnonymousDocument[] {
    const docIds = this.sessionDocuments.get(sessionId);
    if (!docIds) return [];

    return Array.from(docIds)
      .map(id => this.documents.get(id))
      .filter(Boolean) as AnonymousDocument[];
  }

  getAllChunksBySession(sessionId: string): Array<{
    id: string;
    content: string;
    embedding: number[];
    metadata: {
      documentId: string;
      chunkId: string;
      chunkIndex: number;
      startChar: number;
      endChar: number;
      fileName: string;
      fileType: string;
      fileSize: number;
    };
  }> {
    const docs = this.getDocumentsBySession(sessionId);
    const allChunks: any[] = [];

    for (const doc of docs) {
      for (const chunk of doc.chunks) {
        allChunks.push({
          id: chunk.id,
          content: chunk.content,
          embedding: chunk.embedding,
          metadata: {
            documentId: doc.id,
            chunkId: chunk.id,
            chunkIndex: chunk.chunkIndex,
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            fileName: doc.fileName,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
          },
        });
      }
    }

    return allChunks;
  }

  private cleanup() {
    const cutoff = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
    
    for (const [docId, doc] of this.documents.entries()) {
      const uploadTime = new Date(doc.uploadedAt).getTime();
      if (uploadTime < cutoff) {
        this.documents.delete(docId);
        
        // Clean up session tracking
        const sessionDocs = this.sessionDocuments.get(doc.sessionId);
        if (sessionDocs) {
          sessionDocs.delete(docId);
          if (sessionDocs.size === 0) {
            this.sessionDocuments.delete(doc.sessionId);
          }
        }
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
  }
}

export const anonymousStore = new AnonymousStore();
export type { AnonymousDocument };