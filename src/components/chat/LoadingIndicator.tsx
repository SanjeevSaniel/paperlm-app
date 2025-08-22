'use client';

import { motion } from 'framer-motion';
import { Bot, Loader2 } from 'lucide-react';
import { useCallback } from 'react';

interface LoadingIndicatorProps {
  currentUserQuery: string;
  loadingMessageIndex: number;
}

export default function LoadingIndicator({
  currentUserQuery,
  loadingMessageIndex,
}: LoadingIndicatorProps) {
  
  // Generate context-aware loading messages based on user query
  const getLoadingMessages = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();

    // Detect query type and generate appropriate messages
    if (lowerQuery.includes('summary') || lowerQuery.includes('summarize')) {
      return [
        '📖 Reading through your documents...',
        '🔍 Identifying key points and themes...',
        '📝 Crafting a comprehensive summary...',
        '✨ Finalizing your summary...',
      ];
    } else if (
      lowerQuery.includes('compare') ||
      lowerQuery.includes('difference')
    ) {
      return [
        '🔍 Analyzing documents for comparison...',
        '⚖️ Identifying similarities and differences...',
        '📊 Building comparison analysis...',
        '✨ Preparing detailed comparison...',
      ];
    } else if (lowerQuery.includes('video') || lowerQuery.includes('youtube')) {
      return [
        '🎥 Processing video transcript...',
        '⏱️ Analyzing timeline and content...',
        '🔍 Searching through video segments...',
        '✨ Preparing video-based response...',
      ];
    } else if (
      lowerQuery.includes('quote') ||
      lowerQuery.includes('citation')
    ) {
      return [
        '📝 Searching for relevant quotes...',
        '🔍 Locating specific citations...',
        '📚 Cross-referencing sources...',
        '✨ Preparing cited response...',
      ];
    } else if (
      lowerQuery.includes('how') ||
      lowerQuery.includes('why') ||
      lowerQuery.includes('what')
    ) {
      return [
        '🤔 Understanding your question...',
        '🔍 Searching through document content...',
        '🧠 Analyzing relevant information...',
        '✨ Formulating detailed answer...',
      ];
    } else if (
      lowerQuery.includes('list') ||
      lowerQuery.includes('steps') ||
      lowerQuery.includes('process')
    ) {
      return [
        '📋 Identifying key points...',
        '🔢 Organizing information systematically...',
        '📝 Structuring comprehensive list...',
        '✨ Finalizing organized response...',
      ];
    } else {
      // Generic messages for general queries
      return [
        '🔍 Searching through your documents...',
        '🧠 Processing relevant information...',
        '📝 Analyzing content for insights...',
        '✨ Crafting your response...',
      ];
    }
  }, []);

  return (
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
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}>
        <Bot className='w-3 h-3 text-purple-600' />
      </motion.div>
      
      <motion.div
        className='bg-gradient-to-r from-white/90 to-purple-50/50 border border-purple-200/50 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-sm'
        animate={{
          boxShadow: [
            '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
            '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}>
        <div className='flex items-center gap-3'>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
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
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ width: '30%' }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}