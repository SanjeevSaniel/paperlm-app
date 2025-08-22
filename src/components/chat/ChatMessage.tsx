'use client';

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import Link from 'next/link';
import { ChatMessage as ChatMessageType } from '@/types';
import MarkdownRenderer from '../MarkdownRenderer';
import CitationCard from './CitationCard';
import { EnhancedCitation } from './types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessageComponent({ message }: ChatMessageProps) {
  return (
    <motion.div
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
          {message.role === 'assistant' ? (
            <MarkdownRenderer
              content={message.content}
              className='leading-relaxed'
            />
          ) : (
            <p className='whitespace-pre-wrap leading-relaxed'>
              {message.content}
            </p>
          )}

          {/* Authentication Prompt */}
          {message.isAuthPrompt && (
            <div className='mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg'>
              <div className='flex flex-col sm:flex-row items-center gap-3'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-900 mb-1'>
                    Ready to unlock unlimited access?
                  </p>
                  <p className='text-xs text-gray-600'>
                    Sign in for unlimited queries, cloud sync, and premium
                    features.
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

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className='mt-2 space-y-2'>
            <p className='text-xs font-medium text-gray-700'>Sources:</p>
            {message.citations.map((citation) => (
              <CitationCard
                key={citation.id}
                citation={citation as EnhancedCitation}
              />
            ))}
          </div>
        )}

        {/* Timestamp */}
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
  );
}