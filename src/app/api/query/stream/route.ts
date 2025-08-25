export const runtime = 'nodejs';

import { streamAIResponse } from '@/lib/ai';
import type { RAGResult } from '@/lib/qdrant';
import { searchWithUserContext, checkQdrantHealth } from '@/lib/improvedVectorSearch';
import { rewriteContext } from '@/lib/advancedRag';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

/**
 * Improved streaming query endpoint with advanced RAG
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const {
      message,
      chatHistory = [],
      sessionId,
      userEmail,
    } = await request.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'No message provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine the storage identifier: email for authenticated users, sessionId for free users
    const storageId = userId && userEmail ? userEmail : sessionId;

    if (!storageId || typeof storageId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'No user email or session ID provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check Qdrant health
    const health = await checkQdrantHealth();
    console.log('🏥 Qdrant health:', {
      connected: health.connected,
      collectionExists: health.collectionExists,
      documentCount: health.documentCount,
      error: health.error
    });

    // Enhanced search with advanced RAG techniques
    const results = await searchWithUserContext(message, storageId, {
      k: 20,
      chatHistory,
    });

    console.log(`📚 Advanced RAG found ${results.length} context results for: "${message}"`);

    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({
          error: "I don't have any relevant documents to answer this question. Please upload documents, add text input, or scrape websites first.",
          citations: [],
          context: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use advanced context rewriting
    const chunks = results.slice(0, 12).map(r => r.pageContent);
    const contextResult = await rewriteContext(chunks, message, 10000);
    
    console.log(`🔄 Context rewritten:`, {
      originalChunks: chunks.length,
      rewrittenLength: contextResult.rewrittenContext.length,
      relevanceScore: contextResult.relevanceScore,
      summaryLength: contextResult.condensedSummary.length
    });

    // Build enhanced context
    const context = contextResult.rewrittenContext || chunks.join('\n\n').slice(0, 8000);

    // Create citations with improved metadata
    const citations = results.slice(0, 8).map((result) => {
      const fileName = result.metadata.fileName || 'Unknown Document';
      const isTextInput = fileName === 'text-input.txt';
      
      return {
        source: isTextInput ? 'Text Input' : fileName,
        content: result.pageContent.slice(0, 200) + (result.pageContent.length > 200 ? '...' : ''),
        metadata: {
          documentId: result.metadata.documentId,
          chunkIndex: result.metadata.chunkIndex,
          fileName: fileName,
          confidence: result.metadata.confidence || 0,
          relevanceScore: contextResult.relevanceScore,
        }
      };
    });

    // Build message array for AI with enhanced context
    const systemMessage = `You are an expert AI assistant with access to relevant documents. Use the provided context to answer questions accurately and comprehensively.

Context Information (Relevance Score: ${contextResult.relevanceScore.toFixed(2)}):
${context}

Instructions:
1. Answer based primarily on the provided context
2. If the context doesn't contain sufficient information, clearly state this
3. Cite specific information from the context when possible
4. Be concise but thorough
5. If context quality is low (relevance < 0.3), acknowledge this limitation

Context Summary: ${contextResult.condensedSummary}`;

    const messages = [
      { role: 'system' as const, content: systemMessage },
      ...chatHistory.slice(-5), // Keep last 5 messages for better context
      { role: 'user' as const, content: message },
    ];

    console.log(`🤖 Generating AI response with context length: ${context.length} chars`);

    // Detect task type based on query content for optimal model selection
    const detectTaskType = (query: string): 'reasoning' | 'creative' | 'factual' | 'fast' => {
      const queryLower = query.toLowerCase();
      
      // Complex reasoning indicators
      if (queryLower.includes('analyze') || queryLower.includes('compare') || 
          queryLower.includes('explain why') || queryLower.includes('reasoning') ||
          queryLower.includes('logic') || queryLower.includes('cause') ||
          queryLower.includes('conclude') || queryLower.includes('infer')) {
        return 'reasoning';
      }
      
      // Creative task indicators  
      if (queryLower.includes('write') || queryLower.includes('create') ||
          queryLower.includes('generate') || queryLower.includes('draft') ||
          queryLower.includes('compose') || queryLower.includes('story')) {
        return 'creative';
      }
      
      // Fast response indicators
      if (queryLower.includes('quick') || queryLower.includes('brief') ||
          queryLower.includes('summary') || queryLower.includes('list') ||
          query.length < 50) {
        return 'fast';
      }
      
      // Default to factual for document-based queries
      return 'factual';
    };

    const taskType = detectTaskType(message);
    
    console.log(`🎯 Detected task type: ${taskType} for query: "${message.slice(0, 50)}..."`);

    // Stream AI response with advanced model selection and optimized parameters
    const streamResponse = await streamAIResponse(messages, context, {
      taskType,
      temperature: taskType === 'reasoning' ? 0.1 : taskType === 'creative' ? 0.6 : 0.2,
      maxTokens: taskType === 'reasoning' ? 4000 : taskType === 'fast' ? 1500 : 3000,
      topP: 0.9,
      frequencyPenalty: 0.3,
      presencePenalty: 0.1,
      citations,
    });

    // Enhanced response headers
    const headers = new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Context-Length': context.length.toString(),
      'X-Results-Count': results.length.toString(),
      'X-Relevance-Score': contextResult.relevanceScore.toFixed(3),
      'X-Citations-Count': citations.length.toString(),
      'X-Qdrant-Health': health.connected ? 'healthy' : 'degraded',
    });

    return new Response(streamResponse.body, {
      headers,
      status: 200,
    });

  } catch (error) {
    console.error('❌ Advanced streaming query error:', error);
    
    // Enhanced error logging
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };
    
    console.error('Error details:', errorDetails);

    return new Response(
      JSON.stringify({ 
        error: 'Failed to process query with advanced RAG system',
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}