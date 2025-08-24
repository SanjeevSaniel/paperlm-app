import { NextApiRequest, NextApiResponse } from 'next';
import { testQdrantConnection } from '../../lib/qdrant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Starting Qdrant connection test...');
    await testQdrantConnection();
    console.log('✅ Qdrant connection test completed');
    
    res.status(200).json({ 
      success: true, 
      message: 'Qdrant connection test completed. Check server logs for details.' 
    });
  } catch (error) {
    console.error('❌ Qdrant test API error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}