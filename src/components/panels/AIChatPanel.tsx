'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, ExternalLink, Loader2 } from 'lucide-react';
import { ChatMessage } from '@/types';
import { useFreemium } from '@/contexts/FreemiumContext';
import { useDocumentContext } from '@/contexts/DocumentContext';
import { useUser } from '@clerk/nextjs';
import AIAssistantAnimation from '../AIAssistantAnimation';
import {
  getSessionData,
  updateSessionChatMessages,
} from '@/lib/sessionStorage';

export default function AIChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { canPerformAction, updateUsage, showUpgradeModal, usage } =
    useFreemium();
  const { hasDocuments, documentCount } = useDocumentContext();
  const { user, isLoaded } = useUser();

  // Responsive screen size
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load chat history
  useEffect(() => {
    if (!isLoaded) return;

    const loadChatHistory = async () => {
      try {
        const sessionData = getSessionData();
        if (sessionData && sessionData.chatMessages.length > 0) {
          const parsedMessages = sessionData.chatMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setMessages(parsedMessages);
        } else {
          const savedMessages = localStorage.getItem('paperlm_chat_history');
          if (savedMessages) {
            const parsedMessages = JSON.parse(savedMessages).map(
              (msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }),
            );
            setMessages(parsedMessages);
            updateSessionChatMessages(parsedMessages);
          }
        }

        if (user) {
          const response = await fetch('/api/user/chat');
          if (response.ok) {
            const { messages: apiMessages } = await response.json();
            if (apiMessages && apiMessages.length > 0) {
              const formattedMessages = apiMessages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }));
              setMessages(formattedMessages);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load chat history:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadChatHistory();
  }, [isLoaded, user]);

  // Persist messages
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      updateSessionChatMessages(messages);
      localStorage.setItem('paperlm_chat_history', JSON.stringify(messages));

      if (user) {
        const syncToAPI = async () => {
          try {
            await fetch('/api/user/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages }),
            });
          } catch (error) {
            console.warn('Failed to sync chat history to API:', error);
          }
        };
        const timeoutId = setTimeout(syncToAPI, 2000);
        return () => clearTimeout(timeoutId);
      }
    }
    return;
  }, [messages, isInitialized, user]);

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

  // Textarea auto-resize
  const adjustTextareaHeight = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';

    const minRows = 1;
    const maxRows = 10;
    const lineHeight = 24;
    const padding = 24;
    const minHeight = minRows * lineHeight + padding;
    const maxHeight = maxRows * lineHeight + padding;

    const newHeight = Math.max(
      minHeight,
      Math.min(textarea.scrollHeight, maxHeight),
    );
    textarea.style.height = newHeight + 'px';
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.minHeight = '48px';
      adjustTextareaHeight();
    }
  };

  useEffect(() => {
    resetTextareaHeight();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setTimeout(resetTextareaHeight, 100);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (showAnimation) setShowAnimation(false);

    if (!canPerformAction('query')) {
      showUpgradeModal('query', usage);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
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
        updateUsage('query');

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
        const errorData = await response.json();
        if (errorData.limitExceeded) {
          showUpgradeModal('query', errorData.currentUsage);
          return;
        }
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
    }
  };

  return (
    <div className='h-full min-h-0 grid grid-rows-[auto,minmax(0,1fr),auto] overflow-hidden'>
      {/* Header */}
      <div className='px-4 py-3 border-b border-amber-100/80 bg-amber-50/30'>
        <p className='text-sm text-gray-600'>
          Ask questions about your uploaded documents
        </p>
      </div>

      {/* Middle scrollable row */}
      <div className='min-h-0'>
        <div
          className='h-full min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-3 relative'
          style={{ maxHeight: '100%' }}>
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
                    </div>

                    {message.citations && message.citations.length > 0 && (
                      <div className='mt-2 space-y-2'>
                        <p className='text-xs font-medium text-gray-700'>
                          Sources:
                        </p>
                        {message.citations.map((citation) => (
                          <motion.div
                            key={citation.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className='bg-purple-50/50 border border-purple-200/50 rounded-lg p-2 cursor-pointer hover:bg-purple-100/50 transition-colors'>
                            <div className='flex items-start justify-between'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-1'>
                                  <ExternalLink className='w-3 h-3 text-purple-600' />
                                  <span className='text-xs font-medium text-purple-900'>
                                    {citation.documentName}
                                  </span>
                                  <span className='text-xs bg-purple-200 text-purple-800 px-1 py-1 rounded-full'>
                                    {Math.round(citation.relevanceScore * 100)}%
                                  </span>
                                </div>
                                <p className='text-xs text-gray-700 line-clamp-2'>
                                  &quot;{citation.content}&quot;
                                </p>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className='flex gap-3'>
              <div className='w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0'>
                <Bot className='w-3 h-3 text-purple-600' />
              </div>
              <div className='bg-white/80 border border-slate-200 rounded-2xl px-4 py-3 shadow-sm'>
                <div className='flex items-center gap-2'>
                  <Loader2 className='w-3 h-3 animate-spin text-gray-500' />
                  <span className='text-sm text-gray-600'>Thinking...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className='border-t border-slate-200 p-4 bg-white/50'>
        <form
          onSubmit={handleSubmit}
          className='w-full'>
          <div className='relative w-full bg-white rounded-xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-amber-200 focus-within:border-amber-400 transition-all'>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                adjustTextareaHeight();
              }}
              placeholder={
                isSmallScreen ? 'Type here...' : 'Type your question...'
              }
              disabled={isLoading}
              rows={1}
              className='w-full border-0 focus:ring-0 focus:border-0 outline-none bg-transparent resize-none pr-14 py-3 px-4 text-slate-800 placeholder-slate-400 shadow-none'
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onFocus={() => setTimeout(resetTextareaHeight, 10)}
              style={{
                minHeight: '48px',
                maxHeight: '264px',
                lineHeight: '1.5',
                height: '48px',
              }}
            />
            <motion.button
              type='submit'
              disabled={!inputValue.trim() || isLoading}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                !inputValue.trim() || isLoading
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-white bg-[#7bc478] hover:bg-[#6bb068] shadow-sm hover:shadow-md cursor-pointer'
              }`}
              whileHover={
                !inputValue.trim() || isLoading ? {} : { scale: 1.02 }
              }
              whileTap={!inputValue.trim() || isLoading ? {} : { scale: 0.98 }}
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
              }>
              {isLoading ? (
                <Loader2 className='w-4 h-4' />
              ) : (
                <Send className='w-4 h-4' />
              )}
            </motion.button>
          </div>
        </form>
        <p className='text-xs text-slate-500 mt-2 text-center'>
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
