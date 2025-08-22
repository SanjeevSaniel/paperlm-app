'use client';

import { motion } from 'framer-motion';
import { MessageSquarePlus, Trash2 } from 'lucide-react';
import { BasicMessage, ChatUser } from './types';

/**
 * Props for the ChatHeader component
 */
interface ChatHeaderProps {
  /** Whether documents are loaded */
  hasDocuments: boolean;
  /** Array of chat messages */
  messages: BasicMessage[];
  /** Callback to clear the current chat */
  onClearChat: () => void;
  /** Callback to start a new chat session */
  onNewChatSession: () => void;
  /** Current user information */
  user: ChatUser | null;
  /** Whether the user can send messages */
  canChat: boolean;
  /** Current chat message count */
  chatCount: number;
  /** Maximum free chat messages allowed */
  maxFreeChats: number;
}

/**
 * ChatHeader component displays the header for the chat panel
 * 
 * Features:
 * - Shows status based on document availability
 * - Displays chat management buttons (clear, new session)
 * - Shows usage indicator for free/premium users
 * - Animated status indicators
 * 
 * @param props - The component props
 * @returns JSX element representing the chat header
 */
export default function ChatHeader({
  hasDocuments,
  messages,
  onClearChat,
  onNewChatSession,
  user,
  canChat,
  chatCount,
  maxFreeChats,
}: ChatHeaderProps) {
  return (
    <div className='px-4 py-2 border-b border-amber-100/80 bg-amber-50/30 shrink-0'>
      <div className='flex items-center justify-between'>
        <p className='text-sm text-gray-600'>
          {hasDocuments
            ? '🧠 AI Assistant ready • Ask me anything about your uploaded documents'
            : '📄 Upload documents in Sources panel to unlock intelligent AI conversations'}
        </p>
        <div className='flex items-center gap-2'>
          {/* Chat Management Buttons */}
          {messages.length > 0 && (
            <>
              <motion.button
                onClick={onClearChat}
                className='flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title='Clear current chat'>
                <Trash2 className='w-3 h-3' />
                <span className='hidden sm:inline'>Clear</span>
              </motion.button>
              <motion.button
                onClick={onNewChatSession}
                className='flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all duration-200'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title='Start new chat session'>
                <MessageSquarePlus className='w-3 h-3' />
                <span className='hidden sm:inline'>New</span>
              </motion.button>
            </>
          )}
          <motion.div
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm transition-all duration-300 ${
              user
                ? 'bg-blue-50/90 text-blue-600 border-blue-200/60 shadow-sm'
                : canChat
                ? 'bg-green-50/90 text-green-600 border-green-200/60 shadow-sm'
                : 'bg-red-50/90 text-red-600 border-red-200/60 shadow-sm'
            }`}
            animate={{
              boxShadow: user
                ? '0 0 0 0 rgba(59, 130, 246, 0.5)'
                : canChat
                ? '0 0 0 0 rgba(34, 197, 94, 0.5)'
                : '0 0 0 0 rgba(239, 68, 68, 0.5)',
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: user
                ? '0 0 20px 2px rgba(59, 130, 246, 0.2)'
                : canChat
                ? '0 0 20px 2px rgba(34, 197, 94, 0.2)'
                : '0 0 20px 2px rgba(239, 68, 68, 0.2)',
            }}
            transition={{ duration: 0.2 }}>
            <motion.div
              className={`w-1 h-1 rounded-full ${
                user ? 'bg-blue-500' : canChat ? 'bg-green-500' : 'bg-red-500'
              }`}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <span className='text-[10px] leading-none'>
              {user ? '∞' : `${chatCount}/${maxFreeChats}`}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}