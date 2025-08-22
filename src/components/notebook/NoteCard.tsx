'use client';

import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BookOpen,
  Edit3,
  Eye,
  Lightbulb,
  Quote,
  Trash2,
} from 'lucide-react';
import { Note, NoteHandlers } from './types';

/**
 * Props for the NoteCard component
 */
interface NoteCardProps {
  /** Note data to display */
  note: Note;
  /** Note action handlers */
  handlers: NoteHandlers;
}

/**
 * NoteCard displays an individual note with actions
 * 
 * Features:
 * - Type-specific icons and colors
 * - Truncated content with expand option
 * - Action buttons for edit, view, delete
 * - Source document links
 * - Tag display
 * - Hover animations
 * 
 * @param props - The component props
 * @returns JSX element representing a note card
 */
export default function NoteCard({ note, handlers }: NoteCardProps) {
  /**
   * Get note type configuration
   */
  const getNoteTypeConfig = (type: string) => {
    switch (type) {
      case 'summary':
        return {
          icon: BookOpen,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          label: 'Summary',
        };
      case 'insight':
        return {
          icon: Lightbulb,
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          iconColor: 'text-amber-600',
          label: 'Insight',
        };
      case 'quote':
        return {
          icon: Quote,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          label: 'Quote',
        };
      default:
        return {
          icon: BookOpen,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          label: 'Note',
        };
    }
  };

  const typeConfig = getNoteTypeConfig(note.type);
  const TypeIcon = typeConfig.icon;

  /**
   * Truncate content for preview
   */
  const truncateContent = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={`
        group p-4 rounded-xl border-2 ${typeConfig.borderColor} ${typeConfig.bgColor}
        hover:shadow-md transition-all duration-200 cursor-pointer
        ${note.isNew ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      `}>
      
      {/* Header */}
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          <div className={`w-6 h-6 rounded-lg ${typeConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
            <TypeIcon className={`w-3.5 h-3.5 ${typeConfig.iconColor}`} />
          </div>
          <div className='min-w-0 flex-1'>
            <h3 className='font-medium text-gray-900 text-sm leading-tight line-clamp-2'>
              {note.title}
            </h3>
            <p className='text-xs text-gray-500 mt-0.5'>
              {new Date(note.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        {/* Type Badge */}
        <span className={`
          px-2 py-1 text-xs font-medium rounded-full flex-shrink-0
          ${typeConfig.bgColor} ${typeConfig.iconColor}
        `}>
          {typeConfig.label}
        </span>
      </div>

      {/* Content Preview */}
      <div className='mb-3'>
        <p className='text-sm text-gray-700 leading-relaxed line-clamp-3'>
          {truncateContent(note.content.replace(/[#*`]/g, ''), 120)}
        </p>
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className='flex flex-wrap gap-1 mb-3'>
          {note.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className='px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full'>
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className='px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full'>
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Source Document */}
      {note.sourceDocumentId && (
        <div className='mb-3 p-2 bg-white/50 rounded-lg border border-gray-100'>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 bg-purple-100 rounded flex items-center justify-center flex-shrink-0'>
              <ArrowUpRight className='w-2.5 h-2.5 text-purple-600' />
            </div>
            <span className='text-xs text-gray-600 truncate'>
              Source: Document #{note.sourceDocumentId.slice(-6)}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='flex items-center justify-between pt-2 border-t border-gray-100'>
        <div className='flex items-center gap-1'>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handlers.onView(note);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors'
            title='View note'>
            <Eye className='w-3.5 h-3.5' />
          </motion.button>
          
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handlers.onEdit(note);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors'
            title='Edit note'>
            <Edit3 className='w-3.5 h-3.5' />
          </motion.button>
          
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handlers.onDelete(note.id);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors'
            title='Delete note'>
            <Trash2 className='w-3.5 h-3.5' />
          </motion.button>
        </div>
        
        <span className='text-xs text-gray-400'>
          {new Date(note.updatedAt).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}