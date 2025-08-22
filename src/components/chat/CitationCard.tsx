'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Copy, ExternalLink, Plus } from 'lucide-react';
import { NotebookNote } from '@/lib/sessionStorage';
import { useNotebookContext } from '@/contexts/NotebookContext';
import toast from 'react-hot-toast';
import { EnhancedCitation } from './types';

/**
 * Props for the CitationCard component
 */
interface CitationCardProps {
  /** Citation data to display */
  citation: EnhancedCitation;
}

/**
 * CitationCard component displays a citation with interactive features
 * 
 * Features:
 * - Displays citation metadata (page, section, type)
 * - Interactive buttons for adding to notebook, copying, and opening source
 * - Hover effects and animations
 * - Formatted citation content with author/publication info
 * 
 * @param props - The component props
 * @returns JSX element representing a citation card
 */
export default function CitationCard({ citation }: CitationCardProps) {
  const { triggerRefresh } = useNotebookContext();

  const handleCitationClick = async (citation: EnhancedCitation) => {
    try {
      // Use fullContent if available, otherwise use content
      const citationContent =
        citation.fullContent || citation.content || 'No content available';

      // Create a better formatted citation title
      const citationTitle = citation.documentName
        ? `📄 Citation: ${citation.documentName}`
        : '📄 Citation from Chat';

      // Create enhanced formatted content with precise citation information
      const formattedContent = `## 📚 Enhanced Source Information

**Document:** ${citation.documentName || 'Unknown'}
${citation.documentType ? `**Type:** ${citation.documentType}\n` : ''}${
        citation.pageNumber ? `**Page:** ${citation.pageNumber}\n` : ''
      }${
        citation.sectionTitle ? `**Section:** ${citation.sectionTitle}\n` : ''
      }${
        citation.exactLocation
          ? `**Exact Location:** ${citation.exactLocation}\n`
          : ''
      }${citation.sourceUrl ? `**URL:** ${citation.sourceUrl}\n` : ''}${
        citation.author ? `**Author:** ${citation.author}\n` : ''
      }${citation.publishedAt ? `**Published:** ${citation.publishedAt}\n` : ''}

## 💬 Citation Content

> "${citationContent}"

${
  citation.contextBefore
    ? `\n**Context Before:** "${citation.contextBefore}"\n`
    : ''
}${
        citation.contextAfter
          ? `**Context After:** "${citation.contextAfter}"\n`
          : ''
      }

## 📖 Citation Formats

${
  citation.citationFormat
    ? `**APA:** ${citation.citationFormat.apa}

**MLA:** ${citation.citationFormat.mla}

**Chicago:** ${citation.citationFormat.chicago}`
    : 'Citation formats not available'
}

## 📝 Notes

*Add your thoughts and observations about this citation here...*

---
*Added from AI Chat on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*`;

      // Create a new notebook note from citation
      const newNote: NotebookNote = {
        id: `citation-note-${Date.now()}`,
        title: citationTitle,
        content: formattedContent,
        userId: 'user',
        timestamp: Date.now(),
      };

      // Note: This will be updated to save to API in the future
      // For now, we'll just trigger the refresh
      console.log('Citation note created:', newNote);

      // Trigger notebook refresh to show new note immediately
      triggerRefresh();

      toast.success('Citation added to notebook!', {
        duration: 3000,
        icon: '📝',
      });
    } catch (error) {
      console.error('Failed to create notebook card:', error);
      toast.error('Failed to add citation to notebook');
    }
  };

  // Copy citation content to clipboard
  const handleCitationCopy = async (citation: EnhancedCitation) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className='group bg-gradient-to-r from-purple-50/50 to-blue-50/30 border border-purple-200/50 rounded-lg overflow-hidden hover:from-purple-100/60 hover:to-blue-100/40 hover:border-purple-300/60 transition-all duration-200 hover:shadow-sm'>
      
      {/* Header section */}
      <div className='px-3 py-2 border-b border-purple-200/30 bg-purple-50/30'>
        <div className='flex items-center justify-between gap-2'>
          <div className='flex items-center gap-2 min-w-0 flex-1'>
            <div className='w-4 h-4 rounded bg-purple-100 flex items-center justify-center flex-shrink-0'>
              <ExternalLink className='w-2.5 h-2.5 text-purple-600' />
            </div>
            <span className='text-xs font-medium text-purple-900 truncate'>
              {citation.documentName}
            </span>
          </div>
          <div className='flex items-center gap-1 flex-shrink-0'>
            {citation.pageNumber && (
              <span className='text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium'>
                Page {citation.pageNumber}
              </span>
            )}
            {citation.documentType && (
              <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full'>
                {citation.documentType}
              </span>
            )}
            {citation.sectionTitle && (
              <span className='text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full'>
                {citation.sectionTitle.length > 20
                  ? citation.sectionTitle.substring(0, 20) + '...'
                  : citation.sectionTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className='p-3'>
        <div className='grid grid-cols-[1fr_auto] gap-3 items-start'>
          {/* Citation content */}
          <div className='min-w-0'>
            <blockquote className='text-xs text-gray-700 leading-relaxed mb-2 italic border-l-2 border-purple-200 pl-2 overflow-hidden break-words'>
              &quot;{citation.content}&quot;
            </blockquote>

            {/* Author and publication info */}
            {(citation.author || citation.publishedAt) && (
              <div className='flex items-center gap-2 text-xs text-gray-500'>
                {citation.author && (
                  <span className='truncate'>By {citation.author}</span>
                )}
                {citation.author && citation.publishedAt && (
                  <span className='text-gray-400'>•</span>
                )}
                {citation.publishedAt && (
                  <span className='whitespace-nowrap'>
                    {new Date(citation.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className='flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0'>
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
                title='Open Source Link'>
                <ArrowUpRight className='w-3 h-3' />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}