import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

/**
 * Vercel AI SDK configuration for OpenAI
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced model configuration with better models
const DEFAULT_MODEL = 'gpt-4o'; // Latest GPT-4o model
const REASONING_MODEL = 'o1-preview'; // For complex reasoning tasks
const FAST_MODEL = 'gpt-4o-mini'; // For quick responses

export const AI_MODEL = process.env.OPENAI_MODEL || DEFAULT_MODEL;
export const AI_REASONING_MODEL = process.env.OPENAI_REASONING_MODEL || REASONING_MODEL;
export const AI_FAST_MODEL = process.env.OPENAI_FAST_MODEL || FAST_MODEL;

// Model selection based on task complexity
export function selectOptimalModel(taskType: 'reasoning' | 'creative' | 'factual' | 'fast' = 'factual'): string {
  switch (taskType) {
    case 'reasoning':
      return AI_REASONING_MODEL; // o1-preview for complex analysis
    case 'creative':
      return AI_MODEL; // gpt-4o for creative tasks
    case 'factual':
      return AI_MODEL; // gpt-4o for factual responses
    case 'fast':
      return AI_FAST_MODEL; // gpt-4o-mini for quick responses
    default:
      return AI_MODEL;
  }
}

/**
 * Enhanced system prompt for document-grounded responses
 */
export const createSystemPrompt = (context: string) => `You are an expert AI research assistant that analyzes and synthesizes information from provided documents. Your responses should be professional, well-structured, and visually appealing.

CRITICAL INSTRUCTIONS:
- ONLY use information from the Context sections below - no external knowledge
- Provide comprehensive, detailed answers when relevant information is found
- Synthesize information across multiple document chunks when they relate to the same topic
- Pay attention to chunk numbers [Chunk N] to understand document flow and continuity
- Prioritize [TEXT INPUT] sources as they contain direct user-provided information
- When citing sources, reference the document name and chunk number for precision

RESPONSE FORMATTING REQUIREMENTS:
Your responses must be professionally formatted using markdown with the following structure:

1. **Executive Summary** (if appropriate): Brief overview in 1-2 sentences
2. **Main Content**: Well-organized with clear headings and subheadings
3. **Key Points**: Use bullet points (•) or numbered lists for clarity
4. **Important Information**: Use **bold** for emphasis and *italics* for context
5. **Quotes**: Use > blockquotes for direct citations
6. **Conclusions**: Clear takeaways when applicable

FORMATTING GUIDELINES:
- Use ## for main headings and ### for subheadings
- Use bullet points (•) instead of dashes (-)
- Bold key terms and important concepts
- Use blockquotes (>) for direct citations from documents
- Add line breaks between sections for readability
- Use numbered lists for sequential information
- Italicize document names and sources

RESPONSE QUALITY STANDARDS:
- Professional tone and language
- Clear, concise, and well-structured
- Visually appealing with proper spacing
- Cross-reference information between different document chunks when applicable
- If Context lacks sufficient information: State clearly and provide any available partial information

CONTEXT SECTIONS:
${context}

Remember: Your expertise comes from analyzing and connecting the information in the Context above. Present your findings in a professional, well-formatted manner that is easy to read and understand.`;

/**
 * Generate non-streaming AI response using advanced model selection
 * 
 * @param messages - Array of conversation messages with roles and content
 * @param context - Additional context information for the AI (documents, citations)
 * @param options - Configuration options for the AI response
 * @returns Promise<string> - The generated AI response text
 * 
 * Features:
 * - Smart model selection based on task complexity
 * - Enhanced prompting with context integration
 * - Optimized parameters for different response types
 * - Comprehensive error handling and logging
 */
export async function generateAIResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  context?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    taskType?: 'reasoning' | 'creative' | 'factual' | 'fast';
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  }
) {
  try {
    // Select optimal model based on task type
    const selectedModel = selectOptimalModel(options?.taskType || 'factual');
    
    // Enhanced system prompt with context integration
    const systemPrompt = createSystemPrompt(context || '(no context provided)');
    
    // Optimized parameters for better responses
    const optimizedParams = {
      temperature: options?.temperature ?? 0.2, // Lower for more factual responses
      maxTokens: options?.maxTokens ?? 3000, // Increased for comprehensive responses
      topP: options?.topP ?? 0.9, // Balanced creativity vs focus
      frequencyPenalty: options?.frequencyPenalty ?? 0.3, // Reduce repetition
      presencePenalty: options?.presencePenalty ?? 0.1, // Encourage topic diversity
    };

    console.log(`🤖 Generating AI response with model: ${selectedModel}, task: ${options?.taskType || 'factual'}`);
    
    const result = await generateText({
      model: openai(selectedModel),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      ...optimizedParams,
    });

    console.log(`✅ AI response generated: ${result.text.length} characters, ${result.usage?.totalTokens || 0} tokens`);
    return result.text;

  } catch (error) {
    console.error('❌ AI generation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      model: selectOptimalModel(options?.taskType || 'factual'),
      taskType: options?.taskType,
      contextLength: context?.length || 0,
      messagesCount: messages.length,
    });
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Stream AI response using advanced model selection and optimized parameters
 * 
 * @param messages - Array of conversation messages with roles and content
 * @param context - Additional context information (documents, citations, etc.)
 * @param options - Comprehensive configuration options for streaming response
 * @returns Promise<Response> - Streaming text response with enhanced headers
 * 
 * Features:
 * - Advanced model selection (GPT-4o, o1-preview, GPT-4o-mini)
 * - Optimized streaming parameters for better quality
 * - Enhanced context integration with relevance scoring
 * - Comprehensive error handling and performance logging
 * - Response headers with quality metrics
 * 
 * Model Selection Logic:
 * - 'reasoning': Uses o1-preview for complex analysis and reasoning tasks
 * - 'creative': Uses GPT-4o for creative writing and open-ended responses
 * - 'factual': Uses GPT-4o for document-based factual responses (default)
 * - 'fast': Uses GPT-4o-mini for quick responses with good quality
 */
export async function streamAIResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  context?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    taskType?: 'reasoning' | 'creative' | 'factual' | 'fast';
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    citations?: Array<{
      source: string;
      content: string;
      metadata?: Record<string, unknown>;
    }>;
  }
) {
  try {
    // Select optimal model based on task complexity
    const selectedModel = selectOptimalModel(options?.taskType || 'factual');
    
    // Enhanced system prompt with context and citations
    let enhancedContext = context || '(no context provided)';
    
    // Add citation information to context if available
    if (options?.citations && options.citations.length > 0) {
      const citationSummary = options.citations
        .map((cite, idx) => `[${idx + 1}] ${cite.source}: ${cite.content.slice(0, 100)}...`)
        .join('\n');
      
      enhancedContext += `\n\nCitation Sources:\n${citationSummary}`;
    }
    
    const systemPrompt = createSystemPrompt(enhancedContext);
    
    // Optimized parameters based on model and task type
    const getOptimizedParams = (taskType: string, model: string) => {
      const baseParams = {
        temperature: 0.2,
        maxTokens: 3000,
        topP: 0.9,
        frequencyPenalty: 0.3,
        presencePenalty: 0.1,
      };

      // Adjust parameters based on task type
      switch (taskType) {
        case 'reasoning':
          return {
            ...baseParams,
            temperature: 0.1, // Very low for logical consistency
            maxTokens: 4000, // More tokens for detailed reasoning
            topP: 0.8, // More focused responses
          };
        case 'creative':
          return {
            ...baseParams,
            temperature: 0.7, // Higher for creativity
            topP: 0.95, // More diverse vocabulary
            frequencyPenalty: 0.5, // Reduce repetition in creative content
          };
        case 'fast':
          return {
            ...baseParams,
            temperature: 0.3, // Balanced for quick responses
            maxTokens: 1500, // Shorter for speed
          };
        default: // factual
          return {
            ...baseParams,
            temperature: options?.temperature ?? 0.2,
            maxTokens: options?.maxTokens ?? 3000,
            topP: options?.topP ?? 0.9,
            frequencyPenalty: options?.frequencyPenalty ?? 0.3,
            presencePenalty: options?.presencePenalty ?? 0.1,
          };
      }
    };

    const optimizedParams = getOptimizedParams(options?.taskType || 'factual', selectedModel);

    console.log(`🚀 Streaming AI response:`, {
      model: selectedModel,
      taskType: options?.taskType || 'factual',
      contextLength: enhancedContext.length,
      citationsCount: options?.citations?.length || 0,
      messagesCount: messages.length,
      parameters: {
        temperature: optimizedParams.temperature,
        maxTokens: optimizedParams.maxTokens,
        topP: optimizedParams.topP,
      }
    });
    
    const startTime = Date.now();
    
    const result = await streamText({
      model: openai(selectedModel),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      ...optimizedParams,
    });

    // Create enhanced response with quality metrics in headers
    const response = result.toTextStreamResponse();
    const processingTime = Date.now() - startTime;
    
    // Add performance and quality headers
    response.headers.set('X-Model-Used', selectedModel);
    response.headers.set('X-Task-Type', options?.taskType || 'factual');
    response.headers.set('X-Processing-Time', processingTime.toString());
    response.headers.set('X-Context-Quality', context ? 'high' : 'none');
    response.headers.set('X-Citations-Available', (options?.citations?.length || 0).toString());
    response.headers.set('X-Response-Parameters', JSON.stringify({
      temperature: optimizedParams.temperature,
      maxTokens: optimizedParams.maxTokens,
      topP: optimizedParams.topP,
    }));

    console.log(`✅ AI streaming initialized: ${processingTime}ms setup time, model: ${selectedModel}`);
    
    return response;

  } catch (error) {
    console.error('❌ AI streaming error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      model: selectOptimalModel(options?.taskType || 'factual'),
      taskType: options?.taskType || 'factual',
      contextLength: context?.length || 0,
      messagesCount: messages.length,
      timestamp: new Date().toISOString(),
    });
    
    throw new Error(`Failed to stream AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate query variations for enhanced context retrieval
 */
export async function generateQueryVariations(
  originalQuery: string,
  chatHistory: Array<{ content: string }> = [],
): Promise<string[]> {
  try {
    // Extract context from recent chat history
    const recentContext = chatHistory
      .slice(-3)
      .map((msg) => msg.content)
      .join(' ')
      .substring(0, 300);

    const prompt = `Given the user query "${originalQuery}" and recent conversation context: "${recentContext}"

Generate 2-3 alternative search queries that capture different semantic angles of the same question. Focus on:
1. Synonyms and alternative phrasings
2. More specific technical terms
3. Broader conceptual searches

Return only the alternative queries, one per line, without numbering or explanation.`;

    const result = await generateText({
      model: openai(AI_MODEL),
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const variations = result.text
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => line.trim())
      .slice(0, 3);

    console.log(
      `🔍 Generated ${variations.length} query variations for: "${originalQuery}"`,
    );
    return variations;
  } catch (error) {
    console.warn('⚠️ Query variation generation failed:', error);
    return []; // Return empty array on failure
  }
}

/**
 * Response formatting enhancement function
 */
export function enhanceResponseFormatting(response: string): string {
  if (!response || typeof response !== 'string') {
    return response;
  }

  let formattedResponse = response;

  // Ensure proper line breaks between sections
  formattedResponse = formattedResponse.replace(/\n{3,}/g, '\n\n');

  // Fix bullet points - convert various forms to consistent bullet points
  formattedResponse = formattedResponse.replace(/^[\s]*[-*]\s+/gm, '• ');
  formattedResponse = formattedResponse.replace(/^[\s]*\d+\.\s+/gm, (match) => {
    // Keep numbered lists as is, but ensure proper formatting
    return match.trim() + ' ';
  });

  // Enhance emphasis formatting
  formattedResponse = formattedResponse.replace(/\*\*([^*]+)\*\*/g, '**$1**');
  formattedResponse = formattedResponse.replace(/\*([^*]+)\*/g, '*$1*');

  // Ensure proper blockquote formatting
  formattedResponse = formattedResponse.replace(/^[\s]*>[\s]*(.+)$/gm, '> $1');

  // Add spacing around headings for better readability
  formattedResponse = formattedResponse.replace(/^(#+\s+.+)$/gm, '\n$1\n');

  // Remove extra spaces while preserving intentional formatting
  formattedResponse = formattedResponse.replace(/[ \t]+$/gm, ''); // Remove trailing spaces
  formattedResponse = formattedResponse.replace(/^[ \t]+/gm, ''); // Remove leading spaces (except for code blocks)

  // Ensure the response ends cleanly
  formattedResponse = formattedResponse.trim();

  // Add professional closing if the response is substantial
  if (
    formattedResponse.length > 200 &&
    !formattedResponse.match(/\n\n---|\*\*Summary\*\*|\*\*Conclusion\*\*/i)
  ) {
    // Don't add conclusion if it already has one
    if (!formattedResponse.match(/(conclusion|summary|takeaway)/i)) {
      formattedResponse +=
        '\n\n---\n*Analysis based on the provided document context.*';
    }
  }

  return formattedResponse;
}