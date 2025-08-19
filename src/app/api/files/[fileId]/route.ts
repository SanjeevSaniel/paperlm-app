export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { GridFSBucket, MongoClient } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;
    
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'MongoDB not configured' }, { status: 500 });
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    try {
      const db = client.db('paperlm');
      const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

      // Get file metadata
      const files = await bucket.find({ _id: fileId as any }).toArray();
      if (files.length === 0) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      const file = files[0];
      
      // Create download stream
      const downloadStream = bucket.openDownloadStream(fileId as any);
      
      // Convert stream to buffer
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        downloadStream.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        downloadStream.on('error', (error) => {
          console.error('GridFS download error:', error);
          reject(new NextResponse('File download failed', { status: 500 }));
        });
        
        downloadStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          
          const response = new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': file.metadata?.contentType || 'application/octet-stream',
              'Content-Length': buffer.length.toString(),
              'Content-Disposition': `attachment; filename="${file.filename}"`,
              'Cache-Control': 'public, max-age=31536000', // 1 year cache
            },
          });
          
          resolve(response);
        });
      });
      
    } finally {
      await client.close();
    }
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}