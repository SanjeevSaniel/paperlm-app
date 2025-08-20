'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Send,
  Bot,
  User,
  ExternalLink,
  Loader2,
  BookOpen,
  Copy,
  Plus,
} from 'lucide-react';
import { ChatMessage } from '@/types';
import { useDocumentContext } from '@/contexts/DocumentContext';
import { useUsage } from '@/contexts/UsageContext';
import { useUser } from '@clerk/nextjs';
import AIAssistantAnimation from '../AIAssistantAnimation';
import {
  getSessionData,
  updateSessionChatMessages,
  updateSessionNotebookNotes,
  NotebookNote,
} from '@/lib/sessionStorage';
import toast from 'react-hot-toast';

// Handle citation click to create notebook card
interface Citation {
  id: string;
  documentName?: string;
  documentType?: string;
  sourceUrl?: string;
  author?: string;
  publishedAt?: string;
  relevanceScore: number;
  content: string;
  fullContent?: string;
}

export default function AIChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [currentUserQuery, setCurrentUserQuery] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { hasDocuments, documentCount } = useDocumentContext();
  const { canUseService, incrementUsage, usageCount, maxFreeUsage } = useUsage();
  const { user } = useUser();

  // Generate context-aware loading messages based on user query
  const getLoadingMessages = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // Detect query type and generate appropriate messages
    if (lowerQuery.includes('summary') || lowerQuery.includes('summarize')) {
      return [
        '📖 Reading through your documents...',
        '🔍 Identifying key points and themes...',
        '📝 Crafting a comprehensive summary...',
        '✨ Finalizing your summary...'
      ];
    } else if (lowerQuery.includes('compare') || lowerQuery.includes('difference')) {
      return [
        '🔍 Analyzing documents for comparison...',
        '⚖️ Identifying similarities and differences...',
        '📊 Building comparison analysis...',
        '✨ Preparing detailed comparison...'
      ];
    } else if (lowerQuery.includes('video') || lowerQuery.includes('youtube')) {
      return [
        '🎥 Processing video transcript...',
        '⏱️ Analyzing timeline and content...',
        '🔍 Searching through video segments...',
        '✨ Preparing video-based response...'
      ];
    } else if (lowerQuery.includes('quote') || lowerQuery.includes('citation')) {
      return [
        '📝 Searching for relevant quotes...',
        '🔍 Locating specific citations...',
        '📚 Cross-referencing sources...',
        '✨ Preparing cited response...'
      ];
    } else if (lowerQuery.includes('how') || lowerQuery.includes('why') || lowerQuery.includes('what')) {
      return [
        '🤔 Understanding your question...',
        '🔍 Searching through document content...',
        '🧠 Analyzing relevant information...',
        '✨ Formulating detailed answer...'
      ];
    } else if (lowerQuery.includes('list') || lowerQuery.includes('steps') || lowerQuery.includes('process')) {
      return [
        '📋 Identifying key points...',
        '🔢 Organizing information systematically...',
        '📝 Structuring comprehensive list...',
        '✨ Finalizing organized response...'
      ];
    } else {
      // Generic messages for general queries
      return [
        '🔍 Searching through your documents...',
        '🧠 Processing relevant information...',
        '📝 Analyzing content for insights...',
        '✨ Crafting your response...'
      ];
    }
  }, []);

  // Cycle through loading messages
  useEffect(() => {
    if (!isLoading) return;

    const messages = getLoadingMessages(currentUserQuery);
    let index = 0;
    setLoadingMessageIndex(0);

    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingMessageIndex(index);
    }, 1500); // Change message every 1.5 seconds

    return () => clearInterval(interval);
  }, [isLoading, currentUserQuery, getLoadingMessages]);

  // Responsive screen size
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const sessionData = getSessionData();
        if (sessionData && sessionData.chatMessages.length > 0) {
          const parsedMessages = sessionData.chatMessages.map(
            (msg: ChatMessage) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }),
          );
          setMessages(parsedMessages);
        } else {
          const savedMessages = localStorage.getItem('paperlm_chat_history');
          if (savedMessages) {
            const parsedMessages = (
              JSON.parse(savedMessages) as ChatMessage[]
            ).map((msg: ChatMessage) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }));
            setMessages(parsedMessages);
            updateSessionChatMessages(parsedMessages);
          }
        }
        // Removed user-based API loading - only use session/local storage
      } catch (error) {
        console.warn('Failed to load chat history:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadChatHistory();
  }, []); // Removed dependencies on isLoaded and user

  // Persist messages
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      updateSessionChatMessages(messages);
      localStorage.setItem('paperlm_chat_history', JSON.stringify(messages));
      // Removed user API sync - only use local storage
    }
    return;
  }, [messages, isInitialized]); // Removed user dependency

  const handleCitationClick = async (citation: Citation) => {
    try {
      const sessionData = getSessionData();
      const existingNotes = sessionData?.notebookNotes || [];

      // Use fullContent if available, otherwise use content
      const citationContent =
        citation.fullContent || citation.content || 'No content available';

      // Create a new notebook note from citation
      const newNote: NotebookNote = {
        id: `citation-note-${Date.now()}`,
        title: `From ${citation.documentName || 'Unknown Document'}`,
        content: `Source: ${citation.documentName || 'Unknown'}\n${
          citation.documentType ? `Type: ${citation.documentType}\n` : ''
        }${citation.sourceUrl ? `URL: ${citation.sourceUrl}\n` : ''}${
          citation.author ? `Author: ${citation.author}\n` : ''
        }${
          citation.publishedAt ? `Published: ${citation.publishedAt}\n` : ''
        }\nRelevance: ${Math.round(
          (citation.relevanceScore || 0) * 100,
        )}%\n\n"${citationContent}"`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to existing notes
      const updatedNotes = [newNote, ...existingNotes];
      updateSessionNotebookNotes(updatedNotes);

      toast.success('Added to notebook!', {
        duration: 2000,
        icon: '📝',
      });
    } catch (error) {
      console.error('Failed to create notebook card:', error);
      toast.error('Failed to add to notebook');
    }
  };

  // Copy citation content to clipboard
  const handleCitationCopy = async (citation: Citation) => {
    try {
      await navigator.clipboard.writeText(
        citation.fullContent ?? citation.content ?? 'No content available',
      );
      toast.success('Citation copied to clipboard!', {
        duration: 2000,
        icon: '📋',
      });
    } catch {
      toast.error('Failed to copy citation');
    }
  };

  // Toggle animation visibility
  useEffect(() => {
    if (hasDocuments || messages.length > 0 || documentCount > 0) {
      setShowAnimation(false);
    } else {
      setShowAnimation(true);
    }
  }, [hasDocuments, messages.length, documentCount]);

  const scrollToBottom = (smooth: boolean) => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end',
    });
  };

  // Scroll when messages change
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollToBottom(isInitialized);
    });
    return () => cancelAnimationFrame(id);
  }, [messages, isInitialized]);

  // Force textarea to a single visual row always
  const setSingleRowHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const cs = getComputedStyle(el);
    const lineHeight = parseFloat(cs.lineHeight || '20');
    const paddingTop = parseFloat(cs.paddingTop || '0');
    const paddingBottom = parseFloat(cs.paddingBottom || '0');
    const height = lineHeight + paddingTop + paddingBottom;
    el.style.setProperty('--chat-input-h', `${height}px`);
    el.style.height = `${height}px`;
    el.scrollTop = 0;
  };

  useEffect(() => {
    setSingleRowHeight();
    // Recompute if fonts/themes change
    const onResize = () => setSingleRowHeight();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Check usage limit
    if (!canUseService && !user) {
      // Show authentication prompt instead of just an error
      const authMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `You've reached the free usage limit of ${maxFreeUsage} queries per session. Sign in to continue with unlimited access!`,
        timestamp: new Date(),
        isAuthPrompt: true,
      };
      
      setMessages((prev) => [...prev, authMessage]);
      return;
    }

    if (showAnimation) setShowAnimation(false);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setCurrentUserQuery(inputValue); // Store query for context-aware loading
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          chatHistory: messages.slice(-5).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Increment usage count on successful response
        incrementUsage();

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            result.response ||
            "I received your message but couldn't generate a proper response.",
          timestamp: new Date(),
          citations: result.citations || [],
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Query failed');
      }
    } catch (error) {
      console.error('Query error:', error);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Sorry, I encountered an error processing your request. Please make sure you have uploaded documents and your API keys are configured.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Reapply single row height after send, in case fonts/styles changed
      setSingleRowHeight();
    }
  };

  return (
    <div className='h-full min-h-0 flex flex-col overflow-hidden'>
      {/* Header */}
      <div className='px-4 py-2 border-b border-amber-100/80 bg-amber-50/30 shrink-0'>
        <div className='flex items-center justify-between'>
          <p className='text-sm text-gray-600'>
            {hasDocuments 
              ? 'Ready to help! Ask me anything about your documents'
              : 'Upload documents in Sources panel to start intelligent conversations'
            }
          </p>
          <div className='flex justify-end'>
            <motion.div 
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm transition-all duration-300 ${
                user 
                  ? 'bg-blue-50/90 text-blue-600 border-blue-200/60 shadow-sm' 
                  : canUseService 
                    ? 'bg-green-50/90 text-green-600 border-green-200/60 shadow-sm' 
                    : 'bg-red-50/90 text-red-600 border-red-200/60 shadow-sm'
              }`}
              animate={{
                boxShadow: user 
                  ? '0 0 0 0 rgba(59, 130, 246, 0.5)' 
                  : canUseService 
                    ? '0 0 0 0 rgba(34, 197, 94, 0.5)'
                    : '0 0 0 0 rgba(239, 68, 68, 0.5)'
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: user 
                  ? '0 0 20px 2px rgba(59, 130, 246, 0.2)' 
                  : canUseService 
                    ? '0 0 20px 2px rgba(34, 197, 94, 0.2)'
                    : '0 0 20px 2px rgba(239, 68, 68, 0.2)'
              }}
              transition={{ duration: 0.2 }}>
              <motion.div 
                className={`w-1 h-1 rounded-full ${
                  user 
                    ? 'bg-blue-500' 
                    : canUseService 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                }`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
              <span className="text-[10px] leading-none">
                {user 
                  ? '∞' 
                  : `${usageCount}/${maxFreeUsage}`
                }
              </span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Messages section (bounded) */}
      <div className='flex-1 min-h-0'>
        {/* Actual scroll area */}
        <div className='h-full min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3 relative'>
          <AIAssistantAnimation
            isVisible={showAnimation}
            onComplete={() => setShowAnimation(false)}
          />

          <AnimatePresence>
            {!showAnimation &&
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                  {message.role === 'assistant' && (
                    <div className='w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                      <Bot className='w-3 h-3 text-purple-600' />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] ${
                      message.role === 'user' ? 'order-first' : ''
                    }`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm border ${
                        message.role === 'user'
                          ? 'bg-[#7bc478] text-white border-[#7bc478] shadow-sm'
                          : 'bg-white/80 text-slate-800 border-slate-200 shadow-sm'
                      }`}>
                      <p className='whitespace-pre-wrap leading-relaxed'>
                        {message.content}
                      </p>
                      
                      {/* Authentication Prompt */}
                      {message.isAuthPrompt && (
                        <div className='mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg'>
                          <div className='flex flex-col sm:flex-row items-center gap-3'>
                            <div className='flex-1'>
                              <p className='text-sm font-medium text-gray-900 mb-1'>
                                Ready to unlock unlimited access?
                              </p>
                              <p className='text-xs text-gray-600'>
                                Sign in for unlimited queries, cloud sync, and premium features.
                              </p>
                            </div>
                            <div className='flex gap-2'>
                              <Link
                                href='/sign-in'
                                className='px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'>
                                Sign In
                              </Link>
                              <Link
                                href='/sign-up'
                                className='px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors'>
                                Sign Up Free
                              </Link>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {message.citations && message.citations.length > 0 && (
                      <div className='mt-2 space-y-2'>
                        <p className='text-xs font-medium text-gray-700'>
                          Sources:
                        </p>
                        {message.citations.map((citation) => (
                          <motion.div
                            key={citation.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className='group bg-gradient-to-r from-purple-50/50 to-blue-50/30 border border-purple-200/50 rounded-lg p-3 hover:from-purple-100/60 hover:to-blue-100/40 hover:border-purple-300/60 transition-all duration-200 hover:shadow-sm'>
                            <div className='flex items-start justify-between'>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2 mb-2'>
                                  <div className='flex items-center gap-1.5'>
                                    <div className='w-5 h-5 rounded bg-purple-100 flex items-center justify-center'>
                                      <ExternalLink className='w-3 h-3 text-purple-600' />
                                    </div>
                                    <span className='text-xs font-medium text-purple-900 truncate'>
                                      {citation.documentName}
                                    </span>
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    <span className='text-xs bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded-full font-medium'>
                                      {Math.round(
                                        citation.relevanceScore * 100,
                                      )}
                                      %
                                    </span>
                                    {citation.documentType && (
                                      <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full'>
                                        {citation.documentType}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <p className='text-xs text-gray-700 leading-relaxed mb-2 line-clamp-3'>
                                  &quot;{citation.content}&quot;
                                </p>

                                {(citation.author || citation.publishedAt) && (
                                  <div className='flex items-center gap-2 text-xs text-gray-500 mb-2'>
                                    {citation.author && (
                                      <span>By {citation.author}</span>
                                    )}
                                    {citation.author &&
                                      citation.publishedAt && <span>•</span>}
                                    {citation.publishedAt && (
                                      <span>
                                        {new Date(
                                          citation.publishedAt,
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className='flex flex-col gap-1 ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCitationClick(citation);
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className='p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors'
                                  title='Add to Notebook'>
                                  <Plus className='w-3 h-3' />
                                </motion.button>

                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCitationCopy(citation);
                                  }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className='p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors'
                                  title='Copy Citation'>
                                  <Copy className='w-3 h-3' />
                                </motion.button>

                                {citation.sourceUrl && (
                                  <motion.button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(citation.sourceUrl, '_blank');
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className='p-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors'
                                    title='Open Source'>
                                    <BookOpen className='w-3 h-3' />
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <p className='text-xs text-gray-500 mt-2'>
                      {message.timestamp instanceof Date
                        ? message.timestamp.toLocaleTimeString()
                        : new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className='w-6 h-6 bg-[#7bc478]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
                      <User className='w-3 h-3 text-[#7bc478]' />
                    </div>
                  )}
                </motion.div>
              ))}
          </AnimatePresence>

          {!showAnimation && isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className='flex gap-3'>
              <motion.div 
                className='w-6 h-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-200'
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: 'easeInOut' 
                }}>
                <Bot className='w-3 h-3 text-purple-600' />
              </motion.div>
              <motion.div 
                className='bg-gradient-to-r from-white/90 to-purple-50/50 border border-purple-200/50 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm'
                animate={{ 
                  boxShadow: [
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}>
                <div className='flex items-center gap-3'>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className='flex-shrink-0'>
                    <Loader2 className='w-4 h-4 text-purple-500' />
                  </motion.div>
                  <motion.span 
                    key={loadingMessageIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.4 }}
                    className='text-sm font-medium text-gray-700'>
                    {getLoadingMessages(currentUserQuery)[loadingMessageIndex]}
                  </motion.span>
                </div>
                
                {/* Progress indicator */}
                <motion.div 
                  className='mt-2 h-1 bg-gray-200 rounded-full overflow-hidden'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}>
                  <motion.div
                    className='h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full'
                    animate={{ 
                      x: ['-100%', '100%'],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: 'easeInOut' 
                    }}
                    style={{ width: '30%' }}
                  />
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className='border-t border-slate-200 px-4 pt-3 pb-1 bg-white/50 shrink-0'>
        <form
          onSubmit={handleSubmit}
          className='w-full'>
          <div className='relative w-full bg-white rounded-xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-amber-200 focus-within:border-amber-400 transition-all'>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // Re-enforce single row regardless of content
                setSingleRowHeight();
              }}
              placeholder={
                !canUseService && !user 
                  ? 'Sign in to continue chatting...' 
                  : isSmallScreen 
                    ? 'Type here...' 
                    : 'Ask anything about your documents...'
              }
              disabled={isLoading || (!canUseService && !user)}
              rows={1}
              className='w-full border-0 focus:ring-0 focus:border-0 outline-none bg-transparent resize-none pr-14 py-2 px-4 text-slate-800 placeholder-slate-400 shadow-none overflow-hidden h-[var(--chat-input-h)]'
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onFocus={() => setSingleRowHeight()}
              style={{
                // Fallback if CSS var not set yet
                height: '40px',
                lineHeight: '1.5',
              }}
            />
            <motion.button
              type='submit'
              disabled={!inputValue.trim() || isLoading || !canUseService}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                !inputValue.trim() || isLoading || !canUseService
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-white bg-[#7bc478] hover:bg-[#6bb068] shadow-sm hover:shadow-md cursor-pointer'
              }`}
              whileHover={
                !inputValue.trim() || isLoading || !canUseService ? {} : { scale: 1.02 }
              }
              whileTap={!inputValue.trim() || isLoading || !canUseService ? {} : { scale: 0.98 }}
              animate={
                isLoading
                  ? {
                      rotate: 360,
                      transition: {
                        duration: 1,
                        repeat: Infinity,
                        ease: 'linear',
                      },
                    }
                  : {}
              }
              title={!canUseService ? 'Usage limit reached' : undefined}>
              {isLoading ? (
                <Loader2 className='w-4 h-4' />
              ) : (
                <Send className='w-4 h-4' />
              )}
            </motion.button>
          </div>
        </form>
        
        {/* Instructions */}
        <div className='pt-0.5 pb-1'>
          <p className='text-xs text-slate-500 text-center'>
            Press Enter to send • Upload docs in Sources panel
          </p>
        </div>
      </div>
    </div>
  );
}
