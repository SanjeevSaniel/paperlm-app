'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, ExternalLink, Loader2 } from 'lucide-react';
import { ChatMessage } from '@/types';
import { Button, Textarea } from '../ui';
import { useFreemium } from '@/contexts/FreemiumContext';
import { useDocumentContext } from '@/contexts/DocumentContext';
import AIAssistantAnimation from '../AIAssistantAnimation';

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { canPerformAction, updateUsage, showUpgradeModal, usage } = useFreemium();
  const { hasDocuments, documentCount } = useDocumentContext();

  // Hide animation when documents are uploaded or user starts chatting
  useEffect(() => {
    if (hasDocuments || messages.length > 0 || documentCount > 0) {
      setShowAnimation(false);
    } else if (!hasDocuments && messages.length === 0 && documentCount === 0) {
      setShowAnimation(true);
    }
  }, [hasDocuments, messages.length, documentCount]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Hide animation when user starts chatting
    if (showAnimation) {
      setShowAnimation(false);
    }

    // Check if user can query
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

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Send query to API
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          chatHistory: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (response.ok) {
        const result = await response.json();
        updateUsage('query'); // Update usage count
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response || 'I received your message but couldn\'t generate a proper response.',
          timestamp: new Date(),
          citations: result.citations || []
        };
        
        setMessages(prev => [...prev, assistantMessage]);
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
        content: 'Sorry, I encountered an error processing your request. Please make sure you have uploaded documents and your API keys are configured.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Height adjustment is now handled by the Textarea component

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header for Card */}
      <div className="p-4 border-b border-amber-100/80 bg-amber-50/30">
        <p className="text-sm text-gray-600">Ask questions about your uploaded documents</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 relative">
        {/* AI Assistant Animation - shown when no documents and no messages */}
        <AIAssistantAnimation 
          isVisible={showAnimation} 
          onComplete={() => setShowAnimation(false)}
        />
        
        {/* Chat Messages */}
        <AnimatePresence>
          {!showAnimation && messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3 h-3 text-purple-600" />
                </div>
              )}
              
              <div className={`max-w-[85%] ${message.role === 'user' ? 'order-first' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm border ${
                  message.role === 'user' 
                    ? 'bg-[#7bc478] text-white border-[#7bc478] shadow-sm' 
                    : 'bg-white/80 text-slate-800 border-slate-200 shadow-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
                
                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs font-medium text-gray-700">Sources:</p>
                    {message.citations.map((citation) => (
                      <motion.div
                        key={citation.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-purple-50/50 border border-purple-200/50 rounded-lg p-2 cursor-pointer hover:bg-purple-100/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <ExternalLink className="w-3 h-3 text-purple-600" />
                              <span className="text-xs font-medium text-purple-900">
                                {citation.documentName}
                              </span>
                              <span className="text-xs bg-purple-200 text-purple-800 px-1 py-1 rounded-full">
                                {Math.round(citation.relevanceScore * 100)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 line-clamp-2">
                              &quot;{citation.content}&quot;
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              
              {message.role === 'user' && (
                <div className="w-6 h-6 bg-[#7bc478]/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3 h-3 text-[#7bc478]" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Loading indicator */}
        {!showAnimation && isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-purple-600" />
            </div>
            <div className="bg-white/80 border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-4 bg-white/50">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative w-full bg-white rounded-xl shadow-sm border border-slate-300 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-purple-500 transition-all">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={isLoading}
              autoResize={true}
              minRows={1}
              maxRows={5}
              className="w-full border-0 focus:ring-0 outline-none bg-transparent resize-none pr-14 py-3 px-4 text-slate-800 placeholder-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <motion.button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                !inputValue.trim() || isLoading
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-white bg-[#7bc478] hover:bg-[#6bb068] shadow-sm hover:shadow-md cursor-pointer'
              }`}
              whileHover={!inputValue.trim() || isLoading ? {} : { scale: 1.05 }}
              whileTap={!inputValue.trim() || isLoading ? {} : { 
                scale: 0.95,
                rotate: [0, -10, 10, 0],
                transition: { duration: 0.3 }
              }}
              animate={isLoading ? { 
                rotate: 360,
                transition: { duration: 1, repeat: Infinity, ease: "linear" }
              } : {}}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </form>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}