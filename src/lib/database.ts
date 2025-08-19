import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  userId: string;
  // Storage information
  storageFileId?: string;
  storageUrl?: string;
  storageProvider?: 'cloudinary' | 'gridfs' | 'local';
}

export interface ChunkRecord {
  id: string;
  documentId: string;
  content: string;
  embedding: string; // JSON string of number array
  chunkIndex: number;
  startChar: number;
  endChar: number;
}

export interface UserRecord {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  lastAccessedAt: string;
}

const dbPath = path.join(process.cwd(), 'data', 'paperlm.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TEXT NOT NULL,
    last_accessed_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TEXT NOT NULL,
    user_id TEXT NOT NULL,
    storage_file_id TEXT,
    storage_url TEXT,
    storage_provider TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    start_char INTEGER NOT NULL,
    end_char INTEGER NOT NULL,
    FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks (document_id);
  CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents (user_id);
  CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users (clerk_user_id);
`);

// User management
export const createUser = (clerkUserId: string, email: string, firstName?: string, lastName?: string): string => {
  const userId = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO users (id, clerk_user_id, email, first_name, last_name, created_at, last_accessed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(userId, clerkUserId, email, firstName || null, lastName || null, now, now);
  return userId;
};

export const getUserByClerkId = (clerkUserId: string): UserRecord | null => {
  const stmt = db.prepare('SELECT * FROM users WHERE clerk_user_id = ?');
  return stmt.get(clerkUserId) as UserRecord | undefined || null;
};

export const updateUserAccess = (clerkUserId: string): void => {
  const stmt = db.prepare('UPDATE users SET last_accessed_at = ? WHERE clerk_user_id = ?');
  stmt.run(new Date().toISOString(), clerkUserId);
};

export const ensureUser = (clerkUserId: string, email: string, firstName?: string, lastName?: string): string => {
  const user = getUserByClerkId(clerkUserId);
  
  if (!user) {
    const userId = createUser(clerkUserId, email, firstName, lastName);
    return userId;
  } else {
    updateUserAccess(clerkUserId);
    return user.id;
  }
};

// Document management
export const saveDocument = (doc: DocumentRecord): void => {
  const stmt = db.prepare(`
    INSERT INTO documents (id, file_name, file_type, file_size, uploaded_at, user_id, storage_file_id, storage_url, storage_provider)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    doc.id, 
    doc.fileName, 
    doc.fileType, 
    doc.fileSize, 
    doc.uploadedAt, 
    doc.userId,
    doc.storageFileId || null,
    doc.storageUrl || null,
    doc.storageProvider || null
  );
};

export const getDocumentsByUser = (userId: string): DocumentRecord[] => {
  const stmt = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC');
  return stmt.all(userId) as DocumentRecord[];
};

// Chunk management
export const saveChunks = (chunks: ChunkRecord[]): void => {
  const stmt = db.prepare(`
    INSERT INTO chunks (id, document_id, content, embedding, chunk_index, start_char, end_char)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction((chunks: ChunkRecord[]) => {
    for (const chunk of chunks) {
      stmt.run(
        chunk.id,
        chunk.documentId,
        chunk.content,
        chunk.embedding,
        chunk.chunkIndex,
        chunk.startChar,
        chunk.endChar
      );
    }
  });
  
  transaction(chunks);
};

export interface ChunkWithDocument extends ChunkRecord {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export const getChunksByUser = (userId: string): ChunkWithDocument[] => {
  const stmt = db.prepare(`
    SELECT 
      c.*,
      d.file_name as fileName,
      d.file_type as fileType,
      d.file_size as fileSize
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE d.user_id = ?
    ORDER BY d.uploaded_at DESC, c.chunk_index ASC
  `);
  
  return stmt.all(userId) as ChunkWithDocument[];
};

export const deleteDocument = (documentId: string): void => {
  const stmt = db.prepare('DELETE FROM documents WHERE id = ?');
  stmt.run(documentId);
};

// Cleanup old users (optional utility)
export const cleanupOldUsers = (daysOld: number = 90): void => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const stmt = db.prepare('DELETE FROM users WHERE last_accessed_at < ?');
  stmt.run(cutoffDate.toISOString());
};

export default db;