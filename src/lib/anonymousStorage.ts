// Existing contents omitted for brevity; only showing additions and relevant parts

export interface AnonymousDocument {
  id: string;
  sessionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string; // ISO string
  chunks: Array<{
    id: string;
    content: string;
    embedding: number[];
    chunkIndex: number;
    startChar: number;
    endChar: number;
  }>;
}

class AnonymousStore {
  private docs: Map<string, AnonymousDocument>;

  constructor() {
    this.docs = new Map();
  }

  addDocument(doc: AnonymousDocument) {
    this.docs.set(doc.id, doc);
  }

  getDocumentsBySession(sessionId: string): AnonymousDocument[] {
    const result: AnonymousDocument[] = [];
    for (const doc of this.docs.values()) {
      if (doc.sessionId === sessionId) {
        result.push(doc);
      }
    }
    return result;
  }

  getAllChunksBySession(sessionId: string) {
    const docs = this.getDocumentsBySession(sessionId);
    const allChunks: Array<{
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
    }> = [];

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

  /**
   * Remove anonymous documents older than the specified hours.
   * Returns number of documents removed.
   */
  cleanupOlderThan(hours: number): number {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    let removed = 0;
    for (const [id, doc] of this.docs.entries()) {
      const uploadedTs = new Date(doc.uploadedAt).getTime();
      if (!Number.isNaN(uploadedTs) && uploadedTs < cutoff) {
        this.docs.delete(id);
        removed++;
      }
    }
    if (removed > 0) {
      console.log(
        `Anonymous storage cleanup removed ${removed} documents older than ${hours}h`,
      );
    }
    return removed;
  }
}

export const anonymousStore = new AnonymousStore();
