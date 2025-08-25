import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { similaritySearch } from '@/lib/qdrant';
import openai, { OPENAI_MODEL } from '@/lib/openai';
import { NoteRepository } from '@/lib/repositories/noteRepository';
import { UserRepository } from '@/lib/repositories/userRepository';
import { DocumentRepository } from '@/lib/repositories/documentRepository';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const { sessionId, userEmail } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get user if authenticated
    let user = null;
    if (userId) {
      user = await UserRepository.findByClerkId(userId);
    }

    // Get documents for this session
    let documents = [];
    if (user) {
      documents = await DocumentRepository.findByUserAndSession(user.id, sessionId);
    } else {
      documents = await DocumentRepository.findBySessionId(sessionId);
    }

    if (documents.length === 0) {
      return NextResponse.json({ 
        error: 'No documents found for this session',
        notes: []
      }, { status: 400 });
    }

    const generatedNotes = [];

    // Generate different types of notes
    const noteTypes = [
      {
        type: 'summary' as const,
        searchQuery: 'key findings main points important information summary overview',
        prompt: (content: string) => `Create a comprehensive summary of the following content. Focus on the main themes, key findings, and important points. Keep it concise but informative:\n\n${content}`,
        title: 'Document Summary'
      },
      {
        type: 'insight' as const,
        searchQuery: 'analysis conclusions implications significance trends patterns important insights',
        prompt: (content: string) => `Analyze the following content and provide 3-5 key insights, implications, and conclusions. Look for patterns, trends, and significant observations:\n\n${content}`,
        title: 'Key Insights'
      },
      {
        type: 'quote' as const,
        searchQuery: 'important statements key phrases notable quotes memorable text significant quotes',
        prompt: (content: string) => `Extract 2-3 of the most notable and impactful quotes from the following content. Select quotes that are memorable, insightful, or represent key ideas:\n\n${content}`,
        title: 'Notable Quotes'
      }
    ];

    for (const noteType of noteTypes) {
      try {
        // Search for relevant content
        const searchResults = await similaritySearch(
          noteType.searchQuery,
          8,  // Get more results for better content
          sessionId,
          userId || undefined
        );

        if (searchResults.length === 0) {
          continue; // Skip this note type if no content found
        }

        // Combine the most relevant content
        const combinedContent = searchResults
          .slice(0, 6)
          .map(result => result.pageContent)
          .join('\n\n');

        if (combinedContent.trim().length < 100) {
          continue; // Skip if not enough content
        }

        // Generate note content using AI
        const completion = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [{ 
            role: 'user', 
            content: noteType.prompt(combinedContent)
          }],
          max_tokens: 800,
          temperature: 0.6,
        });

        const noteContent = completion.choices[0]?.message?.content;
        if (!noteContent) {
          continue;
        }

        // Create note in database
        const newNote = await NoteRepository.create({
          userId: user?.id || 'anonymous',
          sessionId: sessionId,
          title: noteType.title,
          content: noteContent,
          type: noteType.type,
          tags: ['ai-generated', 'auto-summary'],
          metadata: {
            generatedAt: new Date().toISOString(),
            sourceDocuments: searchResults.map(r => r.metadata.documentId),
            aiModel: OPENAI_MODEL
          }
        });

        if (newNote) {
          generatedNotes.push({
            id: newNote.id,
            title: newNote.title,
            content: newNote.content,
            type: newNote.type,
            createdAt: newNote.createdAt,
            updatedAt: newNote.updatedAt
          });
        }

      } catch (error) {
        console.error(`Error generating ${noteType.type} note:`, error);
        // Continue with next note type
      }
    }

    return NextResponse.json({ 
      notes: generatedNotes,
      count: generatedNotes.length,
      message: `Generated ${generatedNotes.length} AI notes successfully`
    });

  } catch (error) {
    console.error('Error in generate-notes API:', error);
    return NextResponse.json(
      { error: 'Failed to generate notes', notes: [] },
      { status: 500 }
    );
  }
}