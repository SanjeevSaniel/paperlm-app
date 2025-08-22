'use client';

import { motion } from 'framer-motion';
import { Loader2, Send, Zap, ZapOff } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ChatUser } from './types';

/**
 * Props for the ChatInput component
 */
interface ChatInputProps {
  /** Current input value */
  inputValue: string;
  /** Function to update input value */
  setInputValue: (value: string) => void;
  /** Form submit handler */
  onSubmit: (e: React.FormEvent) => void;
  /** Whether a request is currently loading */
  isLoading: boolean;
  /** Whether the user can send messages */
  canChat: boolean;
  /** Whether documents are available */
  hasDocuments: boolean;
  /** Whether the screen is small (mobile) */
  isSmallScreen: boolean;
  /** Current user information */
  user: ChatUser | null;
  /** Whether streaming is enabled */
  enableStreaming?: boolean;
  /** Function to toggle streaming */
  onToggleStreaming?: (enabled: boolean) => void;
  /** Whether currently streaming */
  isStreaming?: boolean;
  /** Function to abort streaming */
  onAbortStream?: () => void;
}

/**
 * ChatInput component handles message input and submission
 * 
 * Features:
 * - Auto-sizing textarea that maintains single row height
 * - Responsive placeholder text
 * - Submit button with loading state
 * - Keyboard shortcuts (Enter to send)
 * - Disabled state handling for usage limits
 * 
 * @param props - The component props
 * @returns JSX element representing the chat input form
 */
export default function ChatInput({
  inputValue,
  setInputValue,
  onSubmit,
  isLoading,
  canChat,
  hasDocuments,
  isSmallScreen,
  enableStreaming = true,
  onToggleStreaming,
  isStreaming = false,
  onAbortStream,
  user,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className='px-4 pt-2 pb-1 bg-white/50 shrink-0'>
      <form onSubmit={onSubmit} className='w-full'>
        <div className='relative flex items-center w-full bg-white rounded-xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-amber-200 focus-within:border-amber-400 transition-all'>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Re-enforce single row regardless of content
              setSingleRowHeight();
            }}
            placeholder={
              !canChat && !user
                ? 'Sign in to continue chatting...'
                : isSmallScreen
                ? 'Type here...'
                : 'Ask anything about your documents...'
            }
            disabled={isLoading || (!canChat && !user)}
            rows={1}
            className='w-full border-0 focus:ring-0 focus:border-0 outline-none bg-transparent resize-none pr-14 py-2 px-4 text-slate-800 placeholder-slate-400 shadow-none overflow-hidden h-[var(--chat-input-h)]'
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            onFocus={() => setSingleRowHeight()}
            style={{
              // Fallback if CSS var not set yet
              height: '40px',
              lineHeight: '1.5',
            }}
          />
          {/* Streaming Controls */}
          <div className='absolute right-16 top-1/2 -translate-y-1/2 flex items-center gap-1'>
            {/* Abort Streaming Button */}
            {isStreaming && onAbortStream && (
              <motion.button
                type='button'
                onClick={onAbortStream}
                className='p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title='Stop streaming'>
                <ZapOff className='w-3.5 h-3.5' />
              </motion.button>
            )}
            
            {/* Streaming Toggle */}
            {onToggleStreaming && (
              <motion.button
                type='button'
                onClick={() => onToggleStreaming(!enableStreaming)}
                className={`p-1.5 rounded-md transition-colors ${
                  enableStreaming
                    ? 'text-blue-500 hover:bg-blue-50'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={enableStreaming ? 'Streaming enabled' : 'Streaming disabled'}>
                <Zap className='w-3.5 h-3.5' />
              </motion.button>
            )}
          </div>
          
          <motion.button
            type='submit'
            disabled={!inputValue.trim() || isLoading || !canChat}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
              !inputValue.trim() || isLoading || !canChat
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-white bg-[#7bc478] hover:bg-[#6bb068] shadow-sm hover:shadow-md cursor-pointer'
            }`}
            whileHover={
              !inputValue.trim() || isLoading || !canChat ? {} : { scale: 1.02 }
            }
            whileTap={
              !inputValue.trim() || isLoading || !canChat ? {} : { scale: 0.98 }
            }
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
            title={!canChat ? 'Usage limit reached' : undefined}>
            {isLoading ? (
              <Loader2 className='w-4 h-4' />
            ) : (
              <Send className='w-4 h-4' />
            )}
          </motion.button>
        </div>
      </form>

      {/* Instructions */}
      <div className='pt-1'>
        <p className='text-xs text-slate-500 text-center'>
          Press Enter to send •{' '}
          {hasDocuments
            ? 'Ask questions, request summaries, or analyze content'
            : 'Add documents first to start chatting'}
        </p>
      </div>
    </div>
  );
}