'use client';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Edit3,
  FileText,
  Lightbulb,
  Quote,
  Save,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'summary' | 'insight' | 'quote';
  createdAt: string;
  updatedAt: string;
}

interface NoteDetailsDialogProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete?: (noteId: string) => void;
}

export default function NoteEditDialog({
  note,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: NoteDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<Note['type']>('summary');

  useEffect(() => {
    if (note) {
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditType(note.type);
      setIsEditing(false);
    }
  }, [note]);

  const handleSave = () => {
    if (note && editTitle.trim() && editContent.trim()) {
      const updatedNote: Note = {
        ...note,
        title: editTitle.trim(),
        content: editContent.trim(),
        type: editType,
        updatedAt: new Date().toISOString(),
      };
      onSave(updatedNote);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (note) {
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditType(note.type);
    }
    setIsEditing(false);
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

  const getTypeLabel = (type: Note['type']) => {
    switch (type) {
      case 'summary':
        return 'Summary';
      case 'insight':
        return 'Insight';
      case 'quote':
        return 'Quote';
      default:
        return 'Note';
    }
  };

  if (!note) return null;

  const TypeIcon = getTypeIcon(note.type);

  return (
    <AnimatePresence mode='wait'>
      {isOpen && (
        <Dialog
          open={isOpen}
          onOpenChange={onClose}>
          <DialogContent
            className='sm:max-w-4xl w-full max-w-[95vw] h-[85vh] overflow-hidden flex flex-col'
            showCloseButton={false}>
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 20,
              }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
                scale: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
              }}
              className='flex flex-col h-full'>
              {/* Fixed Header */}
              <DialogHeader className='flex-shrink-0 pb-4 border-b border-gray-200'>
                <motion.div
                  className='flex items-start gap-4'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.1,
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1],
                  }}>
                  <motion.div
                    className={`p-2 rounded-lg border ${getTypeColor(
                      note.type,
                    )} flex-shrink-0`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.15,
                      duration: 0.3,
                      ease: [0.34, 1.56, 0.64, 1],
                    }}>
                    <TypeIcon className='w-5 h-5' />
                  </motion.div>

                  <div className='flex-1 min-w-0'>
                    {isEditing ? (
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-3 w-full'>
                        <motion.input
                          type='text'
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className='md:col-span-2 text-lg font-semibold bg-transparent border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-all duration-200'
                          placeholder='Note title...'
                          autoFocus
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        <motion.select
                          value={editType}
                          onChange={(e) =>
                            setEditType(e.target.value as Note['type'])
                          }
                          className='px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white transition-all duration-200'
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}>
                          <option value='summary'>📄 Summary</option>
                          <option value='insight'>💡 Insight</option>
                          <option value='quote'>💬 Quote</option>
                        </motion.select>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}>
                        <DialogTitle className='text-left text-lg leading-tight'>
                          {note.title}
                        </DialogTitle>
                      </motion.div>
                    )}

                    <motion.div
                      className='flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap'
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.3 }}>
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-3 h-3' />
                        <span>
                          Created{' '}
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        <Clock className='w-3 h-3' />
                        <span>
                          Updated{' '}
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {!isEditing && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full border ${getTypeColor(
                            note.type,
                          )}`}>
                          {getTypeLabel(note.type)}
                        </span>
                      )}
                    </motion.div>
                  </div>

                  <motion.div
                    className='flex items-center gap-2'
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}>
                    {isEditing ? (
                      <>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={handleSave}
                            disabled={!editTitle.trim() || !editContent.trim()}
                            className='bg-green-600 hover:bg-green-700 text-white'
                            size='sm'>
                            <Save className='w-4 h-4 mr-2' />
                            Save
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={handleCancel}
                            variant='outline'
                            size='sm'>
                            <X className='w-4 h-4 mr-2' />
                            Cancel
                          </Button>
                        </motion.div>
                      </>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant='outline'
                          className='hover:text-green-600 hover:border-green-300'
                          size='sm'>
                          <Edit3 className='w-4 h-4 mr-2' />
                          Edit
                        </Button>
                      </motion.div>
                    )}

                    {/* Close button */}
                    <motion.button
                      onClick={onClose}
                      className='group flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100/80 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-all duration-200 border border-gray-200/50 hover:border-red-200'
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title='Close dialog'>
                      <X className='w-4 h-4' />
                    </motion.button>
                  </motion.div>
                </motion.div>
              </DialogHeader>

              {/* Scrollable Content Area */}
              <motion.div
                className='flex-1 overflow-y-auto py-4 min-h-0'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.35,
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}>
                <AnimatePresence mode='wait'>
                  {isEditing ? (
                    <motion.textarea
                      key='editing'
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder='Write your note content...'
                      className='w-full h-full min-h-[400px] p-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none bg-white transition-all duration-200 font-mono leading-relaxed'
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -10 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      autoFocus
                    />
                  ) : (
                    <motion.div
                      key='viewing'
                      className='prose prose-sm max-w-none'
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: -10 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                      <div className='p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-lg border border-gray-200/50 shadow-sm'>
                        <div
                          className='text-gray-700 leading-relaxed whitespace-pre-wrap text-sm'
                          style={{
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            lineHeight: '1.7',
                          }}>
                          {note.content}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Fixed Footer */}
              {!isEditing && onDelete && (
                <motion.div
                  className='flex justify-between items-center pt-4 border-t border-gray-200/50 flex-shrink-0'
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => {
                        if (
                          window.confirm(
                            'Are you sure you want to delete this note? This action cannot be undone.',
                          )
                        ) {
                          onDelete(note.id);
                          onClose();
                        }
                      }}
                      variant='outline'
                      size='sm'
                      className='text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200'>
                      Delete Note
                    </Button>
                  </motion.div>
                  <div className='text-xs text-gray-500'>
                    Click Edit to modify this note
                  </div>
                </motion.div>
              )}
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
