import { NextRequest, NextResponse } from 'next/server';
import { similaritySearch } from '@/lib/qdrant';
import openai from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { documentIds, type = 'summary' } = await request.json();

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json({ error: 'Document IDs are required' }, { status: 400 });
    }

    const insights: Array<{
      documentId: string;
      type: string;
      content: string;
      timestamp: string;
    }> = [];

    // Search for relevant content from specified documents
    const searchQuery = type === 'summary' 
      ? 'key findings main points important information summary'
      : type === 'insights'
      ? 'analysis conclusions implications significance trends patterns'
      : 'notable quotes important statements key phrases memorable text';

    try {
      const searchResults = await similaritySearch(searchQuery);
      
      // Filter results to only include the specified document IDs
      const filteredResults = searchResults.filter(result => 
        documentIds.includes(result.metadata.documentId)
      );

      // Group content by document
      const contentByDoc = new Map();
      filteredResults.forEach(result => {
        const docId = result.metadata.documentId;
        if (!contentByDoc.has(docId)) {
          contentByDoc.set(docId, []);
        }
        contentByDoc.get(docId).push(result.pageContent);
      });

      // Generate insights for each document
      for (const [docId, contents] of contentByDoc.entries()) {
        const combinedContent = contents.slice(0, 10).join('\n\n');
        
        let prompt = '';
        if (type === 'summary') {
          prompt = `Create a comprehensive summary of the following content. Focus on the main themes, key findings, and important points. Format as markdown with clear sections:\n\n${combinedContent}`;
        } else if (type === 'insights') {
          prompt = `Analyze the following content and provide key insights, implications, and conclusions. Look for patterns, trends, and significant observations. Format as markdown with bullet points:\n\n${combinedContent}`;
        } else {
          prompt = `Extract the most notable and impactful quotes from the following content. Select quotes that are memorable, insightful, or represent key ideas. Format as markdown with context:\n\n${combinedContent}`;
        }

        // Generate insight using the existing OpenAI setup
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        });

        insights.push({
          documentId: docId,
          type,
          content: completion.choices[0]?.message?.content || 'Unable to generate insight',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (vectorError) {
      console.warn('Vector search failed, generating general insights:', vectorError);
      
      // Fallback: generate general insights
      const generalPrompt = type === 'summary' 
        ? 'Create a general template for document analysis and summarization best practices.'
        : type === 'insights'
        ? 'Provide general guidelines for extracting insights from documents and data analysis.'
        : 'Explain the importance of extracting key quotes and memorable statements from documents.';

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: generalPrompt }],
        max_tokens: 1000,
        temperature: 0.7,
      });

      insights.push({
        documentId: 'general',
        type,
        content: completion.choices[0]?.message?.content || 'Unable to generate insight',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}