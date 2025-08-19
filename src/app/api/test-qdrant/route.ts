export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';

export async function GET() {
  try {
    console.log('Testing Qdrant connection...');
    console.log('QDRANT_URL:', process.env.QDRANT_URL);
    console.log('QDRANT_API_KEY exists:', !!process.env.QDRANT_API_KEY);
    
    const client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
    
    // Test basic connection
    const collections = await client.getCollections();
    console.log('Collections:', collections.collections?.map(c => c.name));
    
    const COLLECTION_NAME = 'paperlm_documents';
    
    // Check if our collection exists
    const exists = collections.collections?.some(
      (c) => c.name === COLLECTION_NAME,
    );
    
    let collectionInfo = null;
    if (exists) {
      collectionInfo = await client.getCollection(COLLECTION_NAME);
      console.log('Collection info:', {
        points_count: collectionInfo.points_count,
        status: collectionInfo.status
      });
    } else {
      console.log('Collection does not exist, creating...');
      await client.createCollection(COLLECTION_NAME, {
        vectors: { size: 1536, distance: 'Cosine' },
      });
      collectionInfo = await client.getCollection(COLLECTION_NAME);
    }
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      collections: collections.collections?.map(c => c.name),
      targetCollection: COLLECTION_NAME,
      collectionExists: exists,
      collectionInfo: {
        points_count: collectionInfo?.points_count || 0,
        status: collectionInfo?.status
      }
    });
    
  } catch (error) {
    console.error('Qdrant test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      connection: 'FAILED'
    }, { status: 500 });
  }
}