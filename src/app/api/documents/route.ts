import { NextRequest } from 'next/server';
import { getDocumentsByUser } from '@/lib/database';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest, user) => {
  const documents = getDocumentsByUser(user.userId);
  
  return {
    documents: documents.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt,
    })),
  };
});