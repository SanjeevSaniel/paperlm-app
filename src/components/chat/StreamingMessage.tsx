'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';
import { useEffect, useState } from 'react';

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
  onStreamComplete?: () => void;
}

/**
 * StreamingMessage component for displaying AI responses as they stream in
 * 
 * Features:
 * - Real-time content updates during streaming
 * - Typing indicator while streaming
 * - Smooth animations
 * - Markdown rendering for formatted responses
 * 
 * @param content - The current content (updates during streaming)
 * @param isStreaming - Whether the message is currently streaming
 * @param onStreamComplete - Callback when streaming is complete
 */
export default function StreamingMessage({ 
  content, 
  isStreaming, 
  onStreamComplete 
}: StreamingMessageProps) {
  const [displayContent, setDisplayContent] = useState('');

  // Update display content when content changes
  useEffect(() => {
    setDisplayContent(content);
  }, [content]);

  // Call completion callback when streaming stops
  useEffect(() => {
    if (!isStreaming && content && onStreamComplete) {
      onStreamComplete();
    }
  }, [isStreaming, content, onStreamComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex gap-4 justify-start">
      
      {/* AI Avatar */}
      <div className='w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1'>
        <Bot className='w-3 h-3 text-purple-600' />
      </div>

      {/* Message Content */}
      <div className="max-w-[85%]">
        <div className="px-4 py-3 rounded-2xl text-sm border bg-white/80 text-slate-800 border-slate-200 shadow-sm">
          {displayContent ? (
            <MarkdownRenderer
              content={displayContent}
              className='leading-relaxed'
            />
          ) : (
            <div className="text-slate-500">
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-block">
                Thinking...
              </motion.span>
            </div>
          )}
          
          {/* Typing indicator */}
          {isStreaming && displayContent && (
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-2 h-4 bg-purple-400 ml-1 rounded-sm">
            </motion.span>
          )}
        </div>
        
        {/* Stream status indicator */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mt-2 text-xs text-slate-500">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-3 h-3 border border-purple-300 border-t-purple-600 rounded-full">
            </motion.div>
            <span>AI is responding...</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}