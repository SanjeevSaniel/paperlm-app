import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateChatCompletion = async (
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  context?: string
) => {
  const systemMessage = {
    role: 'system' as const,
    content: `You are a helpful AI assistant that analyzes documents and answers questions based on the provided context. 
    ${context ? `Here is the relevant context from the documents:\n\n${context}` : ''}
    
    Always cite specific parts of the documents when possible and provide detailed, helpful responses.
    If you cannot find relevant information in the context, say so clearly.`
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [systemMessage, ...messages],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return completion.choices[0].message.content;
};

export default openai;