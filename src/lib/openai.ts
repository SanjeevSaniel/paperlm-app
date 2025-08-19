import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateChatCompletion = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  context?: string
) => {
  console.log('=== generateChatCompletion called ===');
  console.log('Context provided:', !!context);
  console.log('Context length:', context?.length || 0);
  if (context) {
    console.log('Context preview:', context.substring(0, 200) + '...');
  }
  
  const systemMessage = {
    role: 'system' as const,
    content: `You are a helpful AI assistant that analyzes documents and answers questions based on the provided context. 

${context ? `Here is the relevant context from the documents:

${context}

Based on this context, please answer the user's question.` : 'No context has been provided. Please let the user know that no documents have been uploaded or that you cannot find relevant information in the available documents.'}

Always cite specific parts of the documents when possible and provide detailed, helpful responses.
If you cannot find relevant information in the context, say so clearly.`
  };
  
  console.log('System message length:', systemMessage.content.length);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [systemMessage, ...messages],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return completion.choices[0].message.content;
};

export default openai;