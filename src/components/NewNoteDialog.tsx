'use client';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Lightbulb,
  Quote,
  Save,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'summary' | 'insight' | 'quote';
  createdAt: string;
  updatedAt: string;
}

interface NewNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
}

export default function NewNoteDialog({
  isOpen,
  onClose,
  onSave,
}: NewNoteDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<Note['type']>('summary');

  const handleSave = () => {
    if (title.trim() && content.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        type: noteType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSave(newNote);
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setNoteType('summary');
    onClose();
  };

  const getTypeIcon = (type: Note['type']) => {
    switch (type) {
      case 'summary':
        return FileText;
      case 'insight':
        return Lightbulb;
      case 'quote':
        return Quote;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: Note['type']) => {
    switch (type) {
      case 'summary':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'insight':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'quote':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const TypeIcon = getTypeIcon(noteType);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <DialogContent 
            className='sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative z-50'
            asChild>
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.95,
                y: 20
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.95,
                y: 20
              }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
                scale: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }
              }}>
              <DialogHeader>
                <motion.div 
                  className='flex items-start gap-4'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                  <motion.div
                    className={`p-2 rounded-lg border ${getTypeColor(noteType)} flex-shrink-0`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}>
                    <TypeIcon className='w-5 h-5' />
                  </motion.div>
                  <div className='flex-1 min-w-0'>
                    <DialogTitle className='text-left text-xl font-semibold text-gray-900 mb-3'>
                      Create New Note
                    </DialogTitle>
                    <motion.div 
                      className='space-y-4'
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}>
                      
                      {/* Title Input */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>
                          Note Title
                        </label>
                        <Input
                          type='text'
                          placeholder='Enter note title...'
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className='w-full text-base focus:border-green-400 focus:ring-green-200 transition-all duration-200'
                          autoFocus
                        />
                      </div>

                      {/* Type Selection */}
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-gray-700'>
                          Note Type
                        </label>
                        <select
                          value={noteType}
                          onChange={(e) => setNoteType(e.target.value as Note['type'])}
                          className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200'>
                          <option value='summary'>📄 Summary</option>
                          <option value='insight'>💡 Insight</option>
                          <option value='quote'>💬 Quote</option>
                        </select>
                      </div>
                    </motion.div>
                  </div>
                  <motion.button
                    onClick={handleClose}
                    className='text-gray-400 hover:text-gray-600 transition-colors p-1'
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}>
                    <X className='w-5 h-5' />
                  </motion.button>
                </motion.div>
              </DialogHeader>

              {/* Content Area */}
              <motion.div 
                className='flex-1 overflow-y-auto mt-6'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Content
                  </label>
                  <Textarea
                    placeholder='Write your note content here...'
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className='w-full text-sm focus:border-green-400 focus:ring-green-200 transition-all duration-200 resize-none'
                  />
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div 
                className='flex items-center justify-between pt-6 border-t border-gray-200/50'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}>
                <div className='text-xs text-gray-500'>
                  {content.length} characters
                </div>
                <div className='flex items-center gap-3'>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleClose}
                      variant='outline'
                      size='sm'
                      className='hover:border-gray-400 transition-all duration-200'>
                      <X className='w-4 h-4 mr-2' />
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleSave}
                      disabled={!title.trim() || !content.trim()}
                      className='bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-200'
                      size='sm'>
                      <Save className='w-4 h-4 mr-2' />
                      Save Note
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}