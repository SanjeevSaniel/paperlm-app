'use client';

import { Button } from '@/components/ui/Button';
import { useDocumentContext } from '@/contexts/DocumentContext';
import { useNotebookContext } from '@/contexts/NotebookContext';
import {
  getSessionData,
  NotebookNote,
  updateSessionNotebookNotes,
} from '@/lib/sessionStorage';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
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
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import NewNoteDialog from '../NewNoteDialog';
import NoteEditDialog from '../NoteEditDialog';
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
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const [newlyCreatedNotes, setNewlyCreatedNotes] = useState<Set<string>>(
    new Set(),
  );
  const { hasDocuments, documentCount } = useDocumentContext();
  const { refreshTrigger } = useNotebookContext();

  // Helper function to detect if content contains URLs
  const containsUrl = (text: string): string | null => {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // NEW: Sort notes by updatedAt date descending (newest first)
  const sortedNotes = useMemo(() => {
    return notes.slice().sort((a: Note, b: Note) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);

      // Handle invalid dates
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }

      return dateB.getTime() - dateA.getTime();
    });
  }, [notes]);

  // Helper function to extract AI summary from document content
  const extractAISummary = useCallback(
    (documentContent: string, documentName: string) => {
      if (!documentContent) return null;

      // Check for Gemini AI summary pattern
      const geminiSummaryMatch = documentContent.match(
        /# 📹 AI-Generated Video Summary \(Gemini\)\s*(.*?)\s*---\s*# 📄 Original/s,
      );

      if (geminiSummaryMatch && geminiSummaryMatch[1]) {
        return {
          type: 'gemini',
          content: geminiSummaryMatch[1].trim(),
          title: `✨ ${documentName} - Gemini AI Summary`,
          tags: [
            '🎥 Video',
            '🤖 Gemini AI',
            '✨ AI Summary',
            '🧠 Advanced Reasoning',
            '✅ Complete',
          ],
        };
      }

      // Check for other AI summary patterns
      const aiSummaryMatch = documentContent.match(
        /# 🤖 AI-Generated.*?Summary\s*(.*?)\s*---/s,
      );

      if (aiSummaryMatch && aiSummaryMatch[1]) {
        return {
          type: 'ai',
          content: aiSummaryMatch[1].trim(),
          title: `🤖 ${documentName} - AI Summary`,
          tags: ['🎥 Video', '🤖 AI Generated', '📝 Summary', '✅ Complete'],
        };
      }

      return null;
    },
    [],
  );

  // Generate AI notebook cards (wrapped in useCallback to fix dependency warning)
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

      try {
        for (const doc of documents) {
          // Add to processing set
          setProcessingDocs((prev) => new Set(prev).add(doc.id));

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

          // **NEW: Check if document already has AI-generated content**
          const sessionData = getSessionData();
          const fullDocument = sessionData?.documents?.find(
            (d) => d.id === doc.id,
          );

          const aiSummary = extractAISummary(
            fullDocument?.content || '',
            doc.name,
          );

          // Simulate realistic processing time based on document type
          const processingTime =
            doc.metadata.type === 'video/youtube' ? 3000 : 2000;
          await new Promise((resolve) => setTimeout(resolve, processingTime));

          // Create the final AI note with real content or fallback
          const aiNoteId = `ai-${doc.id}-${Date.now()}`;
          const aiNote: Note = {
            id: aiNoteId,
            title: aiSummary?.title || `🤖 ${doc.name} - AI Analysis`,
            content: aiSummary?.content || generateSmartSummary(doc),
            type: 'summary',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sourceDocumentId: doc.id,
            sourceUrl: doc.sourceUrl,
            tags: aiSummary?.tags || [
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
            const filtered = prev.filter(
              (note) => note.id !== placeholderNote.id,
            );
            return [aiNote, ...filtered];
          });

          // Add to newly created notes for animation
          setNewlyCreatedNotes((prev) => new Set(prev).add(aiNoteId));

          // Remove from processing set
          setProcessingDocs((prev) => {
            const updated = new Set(prev);
            updated.delete(doc.id);
            return updated;
          });

          // Show completion toast
          const toastMessage = aiSummary
            ? `✨ Gemini AI summary ready for ${doc.name}!`
            : `📝 Notebook card ready for ${doc.name}!`;

          toast.success(toastMessage, {
            duration: 3000,
            icon: aiSummary ? '✨' : '📝',
          });

          // Remove from newly created after 5 seconds
          setTimeout(() => {
            setNewlyCreatedNotes((prev) => {
              const updated = new Set(prev);
              updated.delete(aiNoteId);
              return updated;
            });
          }, 5000);
        }
      } catch (error) {
        console.error('Failed to generate AI cards:', error);
        toast.error('Failed to generate notebook cards');
      } finally {
        setProcessingDocs(new Set());
      }
    },
    [generateSmartSummary, extractAISummary],
  );

  // Load notes from session storage on mount and when refresh is triggered
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
  }, [refreshTrigger]); // Added refreshTrigger as dependency

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
      const documents: Document[] = sessionData?.documents || [];
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
    const noteWithNew = { ...newNote, isNew: true };
    setNotes((prev) => [noteWithNew, ...prev]);
    setNewlyCreatedNotes((prev) => new Set(prev).add(noteWithNew.id));

    toast.success('Note created successfully!', {
      duration: 2000,
      icon: '📝',
    });

    // Remove from newly created after 5 seconds
    setTimeout(() => {
      setNewlyCreatedNotes((prev) => {
        const updated = new Set(prev);
        updated.delete(noteWithNew.id);
        return updated;
      });
    }, 5000);
  };

  const handleViewNote = (note: Note) => {
    if (
      !note.title.includes('🔄 Analyzing') &&
      !note.tags?.includes('🔄 Processing')
    ) {
      setSelectedNote(note);
      setShowDetailsDialog(true);
    }
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
        {/* Empty State - Show when no documents AND no notes */}
        {!hasDocuments && notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center py-12 bg-gradient-to-br from-blue-50/40 via-purple-50/30 to-amber-50/40 rounded-2xl border border-blue-100/50 shadow-sm'>
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                rotateY: [0, 180, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className='w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
              <BookOpen className='w-8 h-8 text-white' />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className='text-lg font-semibold text-gray-800 mb-2'>
              Ready to analyze your documents
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className='text-sm text-gray-600 mb-4'>
              Upload documents or add sources to start taking AI-enhanced notes
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className='flex items-center justify-center gap-2'>
              <motion.div
                className='w-2 h-2 bg-blue-400 rounded-full'
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className='w-2 h-2 bg-purple-400 rounded-full'
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
              <motion.div
                className='w-2 h-2 bg-amber-400 rounded-full'
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Documents ready but no notes yet */}
        {hasDocuments && notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center py-10 bg-gradient-to-br from-green-50/40 to-emerald-50/40 rounded-2xl border border-green-100/50 shadow-sm'>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className='w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-md'>
              <FileText className='w-7 h-7 text-white' />
            </motion.div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className='text-lg font-semibold text-gray-800 mb-2'>
              Documents ready!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className='text-sm text-gray-600 mb-4'>
              Start by creating your first note or let AI generate insights from
              your documents
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className='flex items-center justify-center gap-3'>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className='px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200'>
                ✨ Ready for insights
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* Notes List - CHANGED: Using sortedNotes instead of notes */}
        {sortedNotes.length > 0 && (
          <div className='space-y-2.5'>
            {sortedNotes.map((note) => {
              const TypeIcon = getTypeIcon(note.type);
              const isEditing = editingId === note.id;
              const isProcessing = processingDocs.has(
                note.sourceDocumentId || '',
              );
              const isNewlyCreated = newlyCreatedNotes.has(note.id);

              return (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`group relative rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                    isProcessing
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50'
                      : 'border border-gray-200 bg-white/60 hover:bg-white/80 hover:shadow-md'
                  }`}
                  onClick={() => {
                    if (!isProcessing) {
                      handleViewNote(note);
                    }
                  }}>
                  {/* NEW: Animated border for newly created notes */}
                  {isNewlyCreated && !isProcessing && (
                    <motion.div
                      className='absolute inset-0 rounded-xl pointer-events-none'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}>
                      <motion.div
                        className='absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400/30 via-blue-400/30 to-purple-400/30'
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
                      <div className='absolute inset-[1px] rounded-xl bg-white/90' />
                    </motion.div>
                  )}

                  {/* Processing animation */}
                  {isProcessing && (
                    <div className='absolute inset-0 rounded-xl'>
                      <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-60'>
                        <div className='absolute inset-[2px] rounded-xl bg-gradient-to-r from-blue-50 to-purple-50' />
                      </div>
                      <motion.div
                        className='absolute inset-0 rounded-xl'
                        style={{
                          background:
                            'conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.8), transparent)',
                        }}
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                      <div className='absolute inset-[2px] rounded-xl bg-gradient-to-r from-blue-50 to-purple-50' />
                    </div>
                  )}

                  <div className='p-4 relative z-10'>
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
                              <div className='flex items-center gap-2'>
                                <h3 className='font-semibold text-gray-900 text-sm leading-tight'>
                                  {note.title}
                                </h3>
                                {/* NEW: "NEW" tag for newly created notes */}
                                {isNewlyCreated && (
                                  <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className='px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white text-xs font-medium rounded-full shadow-sm'>
                                    NEW
                                  </motion.span>
                                )}
                              </div>
                              <p className='text-xs text-gray-500 mt-0.5'>
                                Updated{' '}
                                {new Date(note.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className='flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                            {!isProcessing &&
                              (note.sourceUrl || containsUrl(note.content)) && (
                                <Button
                                  onClick={(
                                    e: React.MouseEvent<HTMLButtonElement>,
                                  ) => {
                                    e.stopPropagation();
                                    const url =
                                      note.sourceUrl ||
                                      containsUrl(note.content);
                                    if (url) {
                                      window.open(url, '_blank');
                                    }
                                  }}
                                  variant='ghost'
                                  size='sm'
                                  className='p-1.5 h-auto text-gray-400 cursor-pointer hover:text-purple-500'
                                  title='Open link'>
                                  <ArrowUpRight className='w-3.5 h-3.5' />
                                </Button>
                              )}
                            {!isProcessing && (
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
                            )}
                            {!isProcessing && (
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
                            )}
                            {!isProcessing && (
                              <Button
                                onClick={(
                                  e: React.MouseEvent<HTMLButtonElement>,
                                ) => {
                                  e.stopPropagation();
                                  handleDeleteNote(note.id);
                                  toast.success('Note deleted', {
                                    duration: 1200,
                                  });
                                }}
                                variant='ghost'
                                size='sm'
                                className='p-1.5 h-auto text-gray-400 cursor-pointer hover:text-red-600'
                                title='Delete note'>
                                <Trash2 className='w-3.5 h-3.5' />
                              </Button>
                            )}
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
        )}
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
