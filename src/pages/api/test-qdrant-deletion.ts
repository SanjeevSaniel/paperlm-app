import { NextApiRequest, NextApiResponse } from 'next';
import { testQdrantConnection, deleteDocumentFromQdrant } from '../../lib/qdrant';
import { db } from '../../lib/db';
import { documents } from '../../db/schema';
import { desc } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Starting comprehensive Qdrant deletion test...');
    
    // First test the connection
    console.log('\n=== Testing Connection ===');
    await testQdrantConnection();
    
    // Get a real document from the database to test with
    console.log('\n=== Finding test document ===');
    const testDocs = await db
      .select()
      .from(documents)
      .orderBy(desc(documents.uploaded_at))
      .limit(1);
    
    if (testDocs.length === 0) {
      console.log('ℹ️ No documents in database to test with');
      return res.status(200).json({ 
        success: true, 
        message: 'Connection test completed. No documents to test deletion with.' 
      });
    }
    
    const testDoc = testDocs[0];
    console.log(`📄 Testing with document: ${testDoc.name} (ID: ${testDoc.id})`);
    
    // Try to delete the document from Qdrant (without deleting from DB)
    console.log('\n=== Testing Qdrant Deletion ===');
    const result = await deleteDocumentFromQdrant(testDoc.id);
    
    console.log(`\n=== Result ===`);
    console.log('Deletion result:', result);
    
    res.status(200).json({ 
      success: true, 
      message: 'Qdrant deletion test completed. Check server logs for details.',
      deletionResult: result,
      testedDocument: {
        id: testDoc.id,
        name: testDoc.name
      }
    });
  } catch (error) {
    console.error('❌ Qdrant deletion test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}