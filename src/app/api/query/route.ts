import { NextRequest } from 'next/server';
import { similaritySearch } from '@/lib/qdrant';
import { generateChatCompletion } from '@/lib/openai';
import { withFreemium } from '@/lib/freemium';

export const POST = withFreemium(async (request: NextRequest, user, usage) => {
  const { message, chatHistory = [] } = await request.json();

  if (!message) {
    throw new Error('No message provided');
  }

  // Search for relevant documents using appropriate storage
  const identifier = user ? user.userId : usage.sessionId;
  console.log('Query details:', { message, identifier, isAnonymous: !usage.isAuthenticated });
  const searchResults = await similaritySearch(message, identifier, 5, !usage.isAuthenticated);
  console.log('Search results:', searchResults.length, searchResults.map(r => ({ content: r.pageContent.substring(0, 100), metadata: r.metadata })));

  // Prepare context from search results
  const context = searchResults
    .map((doc, index) => `[${index + 1}] ${doc.pageContent}`)
    .join('\n\n');

  // Prepare messages for ChatGPT
  const messages = [
    ...chatHistory,
    { role: 'user' as const, content: message }
  ];

  // Generate response
  const response = await generateChatCompletion(messages, context);

  // Prepare citations - ensure metadata exists
  const citations = searchResults
    .filter(doc => doc.pageContent && doc.pageContent.length > 0)
    .map((doc, index) => ({
      id: `citation-${index}`,
      documentId: doc.metadata?.documentId || 'unknown',
      documentName: doc.metadata?.fileName || 'Unknown Document',
      chunkId: doc.metadata?.chunkId || `chunk-${index}`,
      content: doc.pageContent.length > 200 ? doc.pageContent.substring(0, 200) + '...' : doc.pageContent,
      startChar: doc.metadata?.startChar || 0,
      endChar: doc.metadata?.endChar || doc.pageContent.length,
      relevanceScore: Math.max(0.1, 0.9 - index * 0.1), // Approximate relevance score
    }));

  const remainingUsage = {
    uploads: usage.isAuthenticated ? Infinity : (3 - usage.uploads),
    queries: usage.isAuthenticated ? Infinity : (5 - (usage.queries + 1)),
    total: usage.isAuthenticated ? Infinity : (5 - (usage.uploads + usage.queries + 1)),
  };

  return {
    response,
    citations,
    context: searchResults.length > 0,
    remainingUsage,
    isAuthenticated: usage.isAuthenticated,
  };
}, 'query');