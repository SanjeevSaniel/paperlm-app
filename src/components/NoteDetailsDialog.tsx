'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Save, X, FileText, Lightbulb, Quote, Calendar, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'summary' | 'insight' | 'quote';
  createdAt: Date;
  updatedAt: Date;
}

interface NoteDetailsDialogProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  onDelete?: (noteId: string) => void;
}

export default function NoteDetailsDialog({
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
        updatedAt: new Date(),
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
      case 'summary': return FileText;
      case 'insight': return Lightbulb;
      case 'quote': return Quote;
      default: return FileText;
    }
  };

  const getTypeColor = (type: Note['type']) => {
    switch (type) {
      case 'summary': return 'bg-green-50 border-green-200 text-green-700';
      case 'insight': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'quote': return 'bg-purple-50 border-purple-200 text-purple-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getTypeLabel = (type: Note['type']) => {
    switch (type) {
      case 'summary': return 'Summary';
      case 'insight': return 'Insight';
      case 'quote': return 'Quote';
      default: return 'Note';
    }
  };

  if (!note) return null;

  const TypeIcon = getTypeIcon(note.type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg border ${getTypeColor(note.type)} flex-shrink-0`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-lg font-semibold bg-transparent border-0 focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-400"
                  placeholder="Note title..."
                  autoFocus
                />
              ) : (
                <DialogTitle className="text-left text-lg">{note.title}</DialogTitle>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Created {note.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Updated {note.updatedAt.toLocaleDateString()}</span>
                </div>
                {isEditing ? (
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as Note['type'])}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="summary">Summary</option>
                    <option value="insight">Insight</option>
                    <option value="quote">Quote</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 text-xs rounded-full border ${getTypeColor(note.type)}`}>
                    {getTypeLabel(note.type)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={!editTitle.trim() || !editContent.trim()}
                    variant="primary"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your note content..."
              className="w-full h-full min-h-[300px] p-4 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            </div>
          )}
        </div>

        {!isEditing && onDelete && (
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              onClick={() => {
                onDelete(note.id);
                onClose();
              }}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete Note
            </Button>
            <div className="text-xs text-gray-500">
              Click Edit to modify this note
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}