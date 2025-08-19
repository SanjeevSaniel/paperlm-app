import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: 'https://fa8be317-2c99-4a51-9547-20db7ccee47e.eu-central-1-0.aws.cloud.qdrant.io:6333',
  apiKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.IDc0O7-4sL-WYGJzqbG3hDHD_-RbvGXNy3dtlTP0IPo',
});

try {
  const result = await client.getCollections();
  console.log('List of collections:', result.collections);
} catch (err) {
  console.error('Could not get collections:', err);
}
