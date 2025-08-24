import { testQdrantConnection, deleteDocumentFromQdrant } from './src/lib/qdrant.js';

async function testDeletion() {
  console.log('🧪 Starting Qdrant deletion test...');
  
  // First test the connection
  console.log('\n=== Testing Connection ===');
  await testQdrantConnection();
  
  // Try to delete a test document (use a dummy ID for now)
  console.log('\n=== Testing Deletion ===');
  const testDocumentId = 'test-doc-123';
  const result = await deleteDocumentFromQdrant(testDocumentId);
  
  console.log(`\n=== Result ===`);
  console.log('Deletion result:', result);
}

testDeletion().catch(console.error);