import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  context?: string,
) {
  const system = {
    role: 'system' as const,
    content: `You are a document-grounded assistant. Use ONLY the provided Context to answer.
Rules:
- If not in Context, say: "I can't find this in your sources."
- Cite snippets by bracket number [1], [2], etc., matching the chunk labels.
- Do not use outside knowledge.

Context:
${context || '(no context provided)'}
`,
  };

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // or 'gpt-4' if available
    messages: [system, ...messages],
    temperature: 0.3,
    max_tokens: 900,
  });

  return res.choices[0].message.content;
}

export default openai;
