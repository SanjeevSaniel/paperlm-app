'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  hasDocuments: boolean;
}

export default function EmptyState({ hasDocuments }: EmptyStateProps) {
  if (!hasDocuments) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
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
          <MessageSquare className='w-8 h-8 text-white' />
        </motion.div>
        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className='text-lg font-semibold text-gray-800 mb-2'>
          AI Chat Assistant Ready
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className='text-sm text-gray-600 mb-4'>
          Upload documents first to start intelligent conversations with AI about
          your content
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}>
          <div className='px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium inline-block'>
            💬 Ready to chat once you add sources
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
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
        <Sparkles className='w-7 h-7 text-white' />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className='text-lg font-semibold text-gray-800 mb-2'>
        Start Your AI Conversation
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className='text-sm text-gray-600 mb-4'>
        Your documents are loaded and ready. Ask me anything about your content!
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className='flex items-center justify-center gap-3'>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className='px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200'>
          🤖 AI powered by your documents
        </motion.div>
      </motion.div>
    </motion.div>
  );
}