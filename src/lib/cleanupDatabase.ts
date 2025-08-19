import Database from 'better-sqlite3';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface CleanupRecord {
  id?: number;
  documentId: string;
  sessionId: string;
  cloudinaryPublicId?: string;
  uploadedAt: string;
  expiresAt: string;
  isAnonymous: boolean;
  fileName: string;
  fileType: string;
  fileSize: number;
  cleaned: boolean;
}

let db: Database.Database | null = null;

function getDatabase() {
  if (db) return db;

  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'cleanup.db');
    db = new Database(dbPath);

    // Create cleanup table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS cleanup_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        documentId TEXT UNIQUE NOT NULL,
        sessionId TEXT NOT NULL,
        cloudinaryPublicId TEXT,
        uploadedAt TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        isAnonymous BOOLEAN NOT NULL,
        fileName TEXT NOT NULL,
        fileType TEXT NOT NULL,
        fileSize INTEGER NOT NULL,
        cleaned BOOLEAN DEFAULT FALSE,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for efficient cleanup queries
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_expires_cleaned 
      ON cleanup_records(expiresAt, cleaned)
    `);
    
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_session_anonymous 
      ON cleanup_records(sessionId, isAnonymous)
    `);

    console.log('✅ Cleanup database initialized');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize cleanup database:', error);
    throw error;
  }
}

export function addCleanupRecord(record: Omit<CleanupRecord, 'id' | 'cleaned'>): void {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    INSERT OR REPLACE INTO cleanup_records 
    (documentId, sessionId, cloudinaryPublicId, uploadedAt, expiresAt, isAnonymous, fileName, fileType, fileSize, cleaned)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
  `);

  stmt.run(
    record.documentId,
    record.sessionId,
    record.cloudinaryPublicId,
    record.uploadedAt,
    record.expiresAt,
    record.isAnonymous,
    record.fileName,
    record.fileType,
    record.fileSize
  );

  console.log('📝 Added cleanup record:', record.documentId);
}

export function getExpiredRecords(): CleanupRecord[] {
  const database = getDatabase();
  const now = new Date().toISOString();
  
  const stmt = database.prepare(`
    SELECT * FROM cleanup_records 
    WHERE expiresAt <= ? AND cleaned = FALSE
    ORDER BY uploadedAt ASC
  `);

  const records = stmt.all(now) as CleanupRecord[];
  console.log(`📋 Found ${records.length} expired records`);
  return records;
}

export function getRecordsBySession(sessionId: string): CleanupRecord[] {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    SELECT * FROM cleanup_records 
    WHERE sessionId = ? AND cleaned = FALSE
    ORDER BY uploadedAt DESC
  `);

  return stmt.all(sessionId) as CleanupRecord[];
}

export function markRecordCleaned(documentId: string): void {
  const database = getDatabase();
  
  const stmt = database.prepare(`
    UPDATE cleanup_records 
    SET cleaned = TRUE 
    WHERE documentId = ?
  `);

  const result = stmt.run(documentId);
  
  if (result.changes > 0) {
    console.log('✅ Marked record as cleaned:', documentId);
  } else {
    console.warn('⚠️ No record found to mark as cleaned:', documentId);
  }
}

export function deleteOldCleanedRecords(olderThanDays = 30): number {
  const database = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  const stmt = database.prepare(`
    DELETE FROM cleanup_records 
    WHERE cleaned = TRUE AND expiresAt <= ?
  `);

  const result = stmt.run(cutoffDate.toISOString());
  const deletedCount = result.changes;
  
  console.log(`🗑️ Deleted ${deletedCount} old cleaned records`);
  return deletedCount;
}

export function getCleanupStats() {
  const database = getDatabase();

  type CountResult = { count: number };

  const totalStmt = database.prepare(
    'SELECT COUNT(*) as count FROM cleanup_records',
  );
  const cleanedStmt = database.prepare(
    'SELECT COUNT(*) as count FROM cleanup_records WHERE cleaned = TRUE',
  );
  const expiredStmt = database.prepare(
    'SELECT COUNT(*) as count FROM cleanup_records WHERE expiresAt <= ? AND cleaned = FALSE',
  );

  const now = new Date().toISOString();

  const total = (totalStmt.get() as CountResult).count;
  const cleaned = (cleanedStmt.get() as CountResult).count;
  const expired = (expiredStmt.get(now) as CountResult).count;

  return {
    total,
    cleaned,
    pending: total - cleaned,
    expired,
    active: total - cleaned - expired
  };
}