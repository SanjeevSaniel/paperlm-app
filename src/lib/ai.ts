import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

/**
 * Vercel AI SDK configuration for OpenAI
 */
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default model configuration
const DEFAULT_MODEL = 'gpt-4o';
export const AI_MODEL = process.env.OPENAI_MODEL || DEFAULT_MODEL;

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
 * Generate non-streaming AI response using Vercel AI SDK
 */
export async function generateAIResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  context?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
) {
  try {
    const systemPrompt = createSystemPrompt(context || '(no context provided)');
    
    const result = await generateText({
      model: openai(AI_MODEL),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: options?.temperature ?? 0.3,
    });

    return result.text;
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Stream AI response using Vercel AI SDK
 */
export async function streamAIResponse(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  context?: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
) {
  try {
    const systemPrompt = createSystemPrompt(context || '(no context provided)');
    
    const result = await streamText({
      model: openai(AI_MODEL),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: options?.temperature ?? 0.3,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('AI streaming error:', error);
    throw new Error('Failed to stream AI response');
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