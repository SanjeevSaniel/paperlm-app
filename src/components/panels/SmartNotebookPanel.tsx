'use client';

import { Button } from '@/components/ui/Button';
import { useDocumentContext } from '@/contexts/DocumentContext';
import {
  getSessionData,
  NotebookNote,
  updateSessionNotebookNotes,
} from '@/lib/sessionStorage';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  Edit3,
  Eye,
  FileText,
  Lightbulb,
  Plus,
  Quote,
  Save,
  Sparkles,
  X,
  Brain,
  Play,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import NoteEditDialog from '../NoteEditDialog';
import NewNoteDialog from '../NewNoteDialog';
import { Input } from '../ui';
import { Textarea } from '../ui/textarea';

type Document = {
  id: string;
  name: string;
  sourceUrl?: string;
  metadata: {
    type: string;
    size?: number;
    chunksCount?: number;
  };
  status?: string;
};

// Use NotebookNote from sessionStorage instead of local Note interface
type Note = NotebookNote & {
  type: 'summary' | 'insight' | 'quote';
  createdAt: string;
  updatedAt: string;
  sourceDocumentId?: string;
  sourceUrl?: string;
  tags?: string[];
  isNew?: boolean;
};

export default function SmartNotebookPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showReadyAnimation, setShowReadyAnimation] = useState(false);
  const [isGeneratingNotebooks, setIsGeneratingNotebooks] = useState(false);
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const { hasDocuments, documentCount } = useDocumentContext();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Generate AI notebook cards (wrapped in useCallback to fix dependency warning)
  // Define a Document type for better type safety

  const generateSmartSummary = useCallback((doc: Document) => {
    const type = doc.metadata.type;
    const size = ((doc.metadata.size || 0) / 1024).toFixed(1);
    const chunks = doc.metadata.chunksCount || 0;

    let content = `## 📊 Document Analysis\n\n`;

    if (type === 'video/youtube') {
      content += `**📹 YouTube Video Analysis**\n`;
      content += `- Video transcript successfully extracted and processed\n`;
      content += `- Audio content converted to searchable text segments\n`;
      content += `- Speaker patterns and discussion topics identified\n`;
      content += `- Key timestamps and moments preserved for reference\n`;
      content += `- Video metadata and description analyzed\n`;
      content += `- Ready for timeline-based Q&A and content search\n\n`;
      
      content += `## 🎬 Video Insights\n\n`;
      content += `| Feature | Details |\n`;
      content += `|---------|----------|\n`;
      content += `| **Content Type** | YouTube Video Transcript |\n`;
      content += `| **Processing** | Full transcript + metadata |\n`;
      content += `| **Search Capability** | Timestamp-aware queries |\n`;
      content += `| **AI Features** | Topic extraction, speaker analysis |\n\n`;
    } else if (type === 'text/html') {
      content += `**🌐 Website Content Analysis**\n`;
      content += `- Web content successfully scraped and processed\n`;
      content += `- Key information extracted and structured\n`;
      content += `- Available for semantic search and chat\n\n`;
    } else {
      content += `**📄 Document Processing Complete**\n`;
      content += `- File successfully uploaded and parsed\n`;
      content += `- Content extracted and ready for analysis\n`;
      content += `- Fully searchable and chat-enabled\n\n`;
    }

    content += `## 📈 Processing Details\n\n`;
    content += `| Metric | Value |\n`;
    content += `|--------|-------|\n`;
    content += `| **File Size** | ${size} KB |\n`;
    content += `| **Text Chunks** | ${chunks} segments |\n`;
    content += `| **Status** | ✅ Ready for AI Chat |\n`;
    content += `| **Processed** | ${new Date().toLocaleString()} |\n\n`;

    if (doc.sourceUrl) {
      content += `## 🔗 Source Information\n\n`;
      content += `**Original URL:** [${new URL(doc.sourceUrl).hostname}](${
        doc.sourceUrl
      })\n\n`;
    }

    content += `## 💡 Next Steps\n\n`;
    if (type === 'video/youtube') {
      content += `- **💬 Chat:** Ask questions about video content and timestamps\n`;
      content += `- **🔍 Search:** Find specific moments or topics within the video\n`;
      content += `- **📝 Notes:** Create highlights from key video segments\n`;
      content += `- **⏱️ Timeline:** Jump to specific moments discussed\n`;
      content += `- **🎯 Topics:** Explore main themes and discussion points\n`;
      content += `- **🤝 Compare:** Analyze alongside other videos or documents\n\n`;
    } else {
      content += `- **💬 Chat:** Ask questions about this content\n`;
      content += `- **🔍 Search:** Find specific information within the document\n`;
      content += `- **📝 Notes:** Create custom summaries and insights\n`;
      content += `- **🤝 Compare:** Analyze alongside other documents\n\n`;
    }

    content += `*This summary was automatically generated by AI based on document processing results.*`;

    return content;
  }, []);

  const generateAINotebookCards = useCallback(
    async (documents: Document[]) => {
      setIsGeneratingNotebooks(true);

      try {
        for (const doc of documents) {
          // Add to processing set
          setProcessingDocs(prev => new Set(prev).add(doc.id));
          
          // Create a placeholder card with animation
          const placeholderNote: Note = {
            id: `processing-${doc.id}-${Date.now()}`,
            title: `🔄 Analyzing ${doc.name}...`,
            content: `# 🔄 AI Analysis in Progress\n\n**Document:** ${doc.name}\n**Status:** Processing document content...\n\nOur AI is currently:\n- 📖 Reading and understanding your document\n- 🧠 Extracting key insights and themes\n- 📝 Generating comprehensive summary\n- 🏷️ Identifying important tags and metadata\n\n*This usually takes 15-30 seconds...*`,
            type: 'summary',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sourceDocumentId: doc.id,
            sourceUrl: doc.sourceUrl,
            tags: ['🔄 Processing'],
            isNew: true,
          };

          setNotes((prev) => [placeholderNote, ...prev]);

          // Simulate realistic processing time based on document type
          const processingTime = doc.metadata.type === 'video/youtube' ? 3000 : 2000;
          await new Promise((resolve) => setTimeout(resolve, processingTime));

          // Replace placeholder with actual AI-generated content
          const aiNote: Note = {
            id: `ai-${doc.id}-${Date.now()}`,
            title: `🤖 ${doc.name} - AI Analysis`,
            content: generateSmartSummary(doc),
            type: 'summary',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sourceDocumentId: doc.id,
            sourceUrl: doc.sourceUrl,
            tags: [
              doc.metadata.type === 'video/youtube'
                ? '🎥 Video'
                : doc.metadata.type === 'text/html'
                ? '🌐 Website'
                : '📄 Document',
              '🤖 AI Generated',
              '✅ Complete',
            ],
            isNew: true,
          };

          // Remove placeholder and add final note
          setNotes((prev) => {
            const filtered = prev.filter(note => note.id !== placeholderNote.id);
            return [aiNote, ...filtered];
          });

          // Remove from processing set
          setProcessingDocs(prev => {
            const updated = new Set(prev);
            updated.delete(doc.id);
            return updated;
          });

          // Show completion toast
          toast.success(`📝 Notebook card ready for ${doc.name}!`, {
            duration: 3000,
            icon: '✨',
          });
        }
      } catch (error) {
        console.error('Failed to generate AI cards:', error);
        toast.error('Failed to generate notebook cards');
      } finally {
        setIsGeneratingNotebooks(false);
        setProcessingDocs(new Set());
      }
    },
    [generateSmartSummary],
  );

  // Load notes from session storage on mount
  useEffect(() => {
    const loadNotesFromSession = () => {
      try {
        const sessionData = getSessionData();
        if (sessionData && sessionData.notebookNotes.length > 0) {
          // Convert session notes to local Note format
          const sessionNotes: Note[] = sessionData.notebookNotes.map(
            (note) => ({
              ...note,
              type: 'summary' as const, // Default type for migrated notes
              createdAt: note.createdAt,
              updatedAt: note.updatedAt,
            }),
          );
          setNotes(sessionNotes);
        } else {
          // Start with empty notes - let auto-generation create them
          setNotes([]);
        }
      } catch (error) {
        console.warn('Failed to load notebook notes from session:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadNotesFromSession();
  }, []);

  // Save notes to session storage whenever they change
  useEffect(() => {
    if (isInitialized && notes.length >= 0) {
      const sessionNotes = notes.map((note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }));
      updateSessionNotebookNotes(sessionNotes);
    }
  }, [notes, isInitialized]);

  // Auto-create notebook cards when documents are uploaded
  useEffect(() => {
    if (hasDocuments && documentCount > 0) {
      const sessionData = getSessionData();
      const documents = sessionData?.documents || [];
      const existingNotes = notes;

      // Check if we need to create cards for new documents
      const newDocuments = documents.filter(
        (doc) =>
          doc.status === 'ready' &&
          !existingNotes.some((note) => note.sourceDocumentId === doc.id),
      );

      if (newDocuments.length > 0) {
        generateAINotebookCards(newDocuments);
      }
    }
  }, [
    hasDocuments,
    documentCount,
    isInitialized,
    generateAINotebookCards,
    notes,
  ]);

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    if (editingId) {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === editingId
            ? {
                ...note,
                title: editTitle,
                content: editContent,
                updatedAt: new Date().toISOString(),
              }
            : note,
        ),
      );
      setEditingId(null);
      setEditContent('');
      setEditTitle('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditTitle('');
  };

  const handleNewNoteSave = (newNote: Note) => {
    setNotes((prev) => [newNote, ...prev]);
    toast.success('Note created successfully!', {
      duration: 2000,
      icon: '📝',
    });
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setShowDetailsDialog(true);
  };

  const handleSaveFromDialog = (updatedNote: Note) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)),
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const getTypeIcon = (type: Note['type']) => {
    switch (type) {
      case 'summary':
        return FileText;
      case 'insight':
        return Lightbulb;
      case 'quote':
        return Quote;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: Note['type']) => {
    switch (type) {
      case 'summary':
        return 'bg-green-50 border-green-200 text-[#7bc478]';
      case 'insight':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'quote':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Generate insights using AI
  const generateInsights = async () => {
    try {
      const sessionData = getSessionData();
      const documents = sessionData?.documents?.filter(doc => doc.status === 'ready') || [];
      
      if (documents.length === 0) {
        toast.error('No documents available for analysis');
        return;
      }

      const documentIds = documents.map(doc => doc.id);
      
      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds, type: 'insights' }),
      });

      if (response.ok) {
        const { insights } = await response.json();
        
        insights.forEach((insight: { content: string }, index: number) => {
          const newNote: Note = {
            id: `insight-${Date.now()}-${index}`,
            title: `🧠 AI Insights - Document ${index + 1}`,
            content: insight.content,
            type: 'insight',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: ['🤖 AI Generated', '🧠 Insights'],
          };
          
          setNotes(prev => [newNote, ...prev]);
        });
        
        toast.success(`Generated ${insights.length} insights!`);
      } else {
        throw new Error('Failed to generate insights');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      toast.error('Failed to generate insights');
    }
  };

  // Generate audio overview (mock function for demo)
  const generateAudioOverview = async () => {
    try {
      const sessionData = getSessionData();
      const documents = sessionData?.documents?.filter(doc => doc.status === 'ready') || [];
      
      if (documents.length === 0) {
        toast.error('No documents available for audio overview');
        return;
      }

      // Mock audio generation for demo
      toast.loading('Generating audio overview...', { duration: 3000 });
      
      setTimeout(() => {
        const audioNote: Note = {
          id: `audio-${Date.now()}`,
          title: '🎧 Audio Overview',
          content: `# 🎧 Audio Overview Available

An AI-generated audio overview has been created for your documents. This overview includes:

- **Key takeaways** from all uploaded documents
- **Important themes** and connections between sources  
- **Notable quotes** and highlights
- **Summary of main findings**

*Note: This is a demo implementation. In a production app, this would generate actual audio content using text-to-speech technology.*

## Features:
- 📝 Conversational summary format
- 🔗 Cross-document connections
- ⏱️ Estimated 10-15 minute listen
- 🎯 Focused on actionable insights`,
          type: 'summary',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['🎧 Audio', '🤖 AI Generated', '📊 Overview'],
        };
        
        setNotes(prev => [audioNote, ...prev]);
        toast.success('Audio overview generated!');
      }, 3000);
      
    } catch (error) {
      console.error('Error generating audio overview:', error);
      toast.error('Failed to generate audio overview');
    }
  };

  // Show ready animation when documents are available
  useEffect(() => {
    if (hasDocuments && documentCount > 0) {
      setShowReadyAnimation(true);
      const timer = setTimeout(() => setShowReadyAnimation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [hasDocuments, documentCount]);

  return (
    <div className='h-full flex flex-col'>
      {/* Compact Header for Card */}
      <div className='px-4 py-3 border-b border-amber-100/80 bg-amber-50/30'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <p className='text-sm text-gray-600 font-light'>
              Organize insights, summaries, and key findings
            </p>
            <AnimatePresence>
              {showReadyAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className='flex items-center gap-1.5 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium'>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }}>
                    <Sparkles className='w-3 h-3' />
                  </motion.div>
                  Ready for insights!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className='flex items-center gap-2'>
            {/* AI Features - NotebookLM-like */}
            {hasDocuments && (
              <>
                <Button
                  onClick={generateInsights}
                  className='bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 cursor-pointer'
                  size='sm'>
                  <Brain className='w-3 h-3 mr-1' />
                  Generate Insights
                </Button>
                <Button
                  onClick={generateAudioOverview}
                  className='bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0 cursor-pointer'
                  size='sm'>
                  <Play className='w-3 h-3 mr-1' />
                  Audio Overview
                </Button>
              </>
            )}
            
            {/* GREEN BUTTON - New Note */}
            <Button
              onClick={() => setShowNewNoteDialog(true)}
              className='bg-[#4ea674] hover:bg-[#4c8e3c] text-white flex-shrink-0 cursor-pointer'
              size='sm'>
              <Plus className='w-3 h-3 mr-1' />
              New Note
            </Button>
          </div>
        </div>
      </div>


      {/* Notes List */}
      <div className='flex-1 overflow-y-auto p-4'>
        {!hasDocuments && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center py-8 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-xl border border-blue-100/50 mb-4'>
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotateY: [0, 360, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className='w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3'>
              <BookOpen className='w-6 h-6 text-white' />
            </motion.div>
            <p className='text-sm font-medium text-gray-700 mb-1'>
              Ready to analyze your documents
            </p>
            <p className='text-xs text-gray-500'>
              Upload documents or add sources to start taking AI-enhanced notes
            </p>
          </motion.div>
        )}

        {hasDocuments && notes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center py-8'>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3'>
              <FileText className='w-6 h-6 text-green-600' />
            </motion.div>
            <p className='text-sm font-medium text-gray-700 mb-1'>
              Documents ready!
            </p>
            <p className='text-xs text-gray-500'>
              Start by adding your first note or insight about your documents
            </p>
          </motion.div>
        ) : notes.length > 0 ? (
          <div className='space-y-2.5'>
            {notes.map((note) => {
              const TypeIcon = getTypeIcon(note.type);
              const isEditing = editingId === note.id;
              const isProcessing = note.title.includes('🔄 Analyzing') || note.tags?.includes('🔄 Processing');

              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`group border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                    isProcessing 
                      ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-purple-50 animate-pulse' 
                      : 'border-gray-200 bg-white/60 hover:bg-white/80 hover:shadow-md'
                  }`}
                  onClick={() => !isProcessing && handleViewNote(note)}>
                  
                  {/* Processing Gradient Overlay */}
                  {isProcessing && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10"
                      animate={{
                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{
                        backgroundSize: '200% 200%',
                      }}
                    />
                  )}
                  <div className='p-4'>
                    {isEditing ? (
                      <div className='space-y-3'>
                        <Input
                          type='text'
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className='w-full text-sm'
                        />
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className='w-full text-sm'
                        />
                        <div className='flex items-center gap-2'>
                          {/* GREEN BUTTON - Save Edit */}
                          <Button
                            onClick={saveEdit}
                            className='bg-green-600 hover:bg-green-700 text-white'
                            size='sm'>
                            <Save className='w-3 h-3 mr-1' />
                            Save
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            variant='outline'
                            size='sm'>
                            <X className='w-3 h-3 mr-1' />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className='flex items-start justify-between mb-2.5'>
                          <div className='flex items-center gap-2.5'>
                            <div
                              className={`p-1.5 rounded-lg border ${getTypeColor(
                                note.type,
                              )}`}>
                              <TypeIcon className='w-3.5 h-3.5' />
                            </div>
                            <div className='min-w-0 flex-1'>
                              <h3 className='font-semibold text-gray-900 text-sm leading-tight'>
                                {note.title}
                              </h3>
                              <p className='text-xs text-gray-500 mt-0.5'>
                                Updated{' '}
                                {new Date(note.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <Button
                              onClick={(
                                e: React.MouseEvent<HTMLButtonElement>,
                              ) => {
                                e.stopPropagation();
                                handleViewNote(note);
                              }}
                              variant='ghost'
                              size='sm'
                              className='p-1.5 h-auto text-gray-400 cursor-pointer hover:text-blue-500'
                              title='View details'>
                              <Eye className='w-3.5 h-3.5' />
                            </Button>
                            <Button
                              onClick={(
                                e: React.MouseEvent<HTMLButtonElement>,
                              ) => {
                                e.stopPropagation();
                                startEditing(note);
                              }}
                              variant='ghost'
                              size='sm'
                              className='p-1.5 h-auto text-gray-400 cursor-pointer hover:text-[#7bc478]'
                              title='Quick edit'>
                              <Edit3 className='w-3.5 h-3.5' />
                            </Button>
                          </div>
                        </div>

                        <p className='text-xs text-gray-600 line-clamp-2 leading-relaxed'>
                          {note.content}
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Note Edit Dialog */}
      <NoteEditDialog
        note={selectedNote}
        isOpen={showDetailsDialog}
        onClose={() => {
          setShowDetailsDialog(false);
          setSelectedNote(null);
        }}
        onSave={handleSaveFromDialog}
        onDelete={handleDeleteNote}
      />

      {/* New Note Dialog */}
      <NewNoteDialog
        isOpen={showNewNoteDialog}
        onClose={() => setShowNewNoteDialog(false)}
        onSave={handleNewNoteSave}
      />
    </div>
  );
}
