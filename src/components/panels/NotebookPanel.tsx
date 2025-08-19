'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit3, Save, X, FileText, Lightbulb, Quote, Eye } from 'lucide-react';
import { Button, Input, Textarea } from '../ui';
import NoteDetailsDialog from '../NoteDetailsDialog';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'summary' | 'insight' | 'quote';
  createdAt: Date;
  updatedAt: Date;
}

export default function NotebookPanel() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Key Findings',
      content: 'The research shows significant improvements in processing speed when using vector databases for semantic search operations.',
      type: 'summary',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Research Insight',
      content: 'Vector embeddings capture semantic meaning better than traditional keyword-based approaches, leading to more accurate document retrieval.',
      type: 'insight',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteType, setNewNoteType] = useState<Note['type']>('summary');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEdit = () => {
    if (editingId) {
      setNotes(prev => prev.map(note => 
        note.id === editingId 
          ? { ...note, title: editTitle, content: editContent, updatedAt: new Date() }
          : note
      ));
      setEditingId(null);
      setEditContent('');
      setEditTitle('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
    setEditTitle('');
  };

  const addNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: editTitle || 'New Note',
      content: editContent,
      type: newNoteType,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setNotes(prev => [newNote, ...prev]);
    setShowNewNote(false);
    setEditContent('');
    setEditTitle('');
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setShowDetailsDialog(true);
  };

  const handleSaveFromDialog = (updatedNote: Note) => {
    setNotes(prev => prev.map(note => 
      note.id === updatedNote.id ? updatedNote : note
    ));
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
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
      case 'summary': return 'bg-green-50 border-green-200 text-[#7bc478]';
      case 'insight': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'quote': return 'bg-purple-50 text-purple-800 border-purple-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header for Card */}
      <div className="p-4 border-b border-amber-100/80 bg-amber-50/30">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-gray-600 font-light">Organize insights, summaries, and key findings</p>
          <Button
            onClick={() => setShowNewNote(true)}
            variant="primary"
            size="sm"
            className="flex-shrink-0"
          >
            <Plus className="w-3 h-3 mr-1" />
            New Note
          </Button>
        </div>
      </div>

      {/* New Note Form */}
      {showNewNote && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-amber-200/50 p-3 bg-orange-50/40"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Input
                type="text"
                placeholder="Note title..."
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="flex-1 text-sm"
              />
              <select
                value={newNoteType}
                onChange={(e) => setNewNoteType(e.target.value as Note['type'])}
                className="px-2.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 bg-white cursor-pointer focus:ring-green-300 focus:border-[#9bd098]"
              >
                <option value="summary">Summary</option>
                <option value="insight">Insight</option>
                <option value="quote">Quote</option>
              </select>
            </div>
            <Textarea
              placeholder="Write your note content..."
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="w-full text-sm"
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={addNewNote}
                disabled={!editContent.trim()}
                variant="primary"
                size="sm"
              >
                <Save className="w-3 h-3 mr-1" />
                Save Note
              </Button>
              <Button
                onClick={() => {
                  setShowNewNote(false);
                  setEditContent('');
                  setEditTitle('');
                }}
                variant="outline"
                size="sm"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No notes yet. Start by adding your first note!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notes.map((note) => {
              const TypeIcon = getTypeIcon(note.type);
              const isEditing = editingId === note.id;
              
              return (
                <motion.div
                  key={note.id}
                  layout
                  className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer bg-white/60 hover:bg-white/80"
                  onClick={() => handleViewNote(note)}
                >
                  <div className="p-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-sm"
                        />
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={saveEdit}
                            variant="primary"
                            size="sm"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            onClick={cancelEdit}
                            variant="outline"
                            size="sm"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg border ${getTypeColor(note.type)}`}>
                              <TypeIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{note.title}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Updated {note.updatedAt.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewNote(note);
                              }}
                              variant="ghost"
                              size="sm"
                              className="p-1.5 h-auto text-gray-400 cursor-pointer hover:text-blue-500"
                              title="View details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(note);
                              }}
                              variant="ghost"
                              size="sm"
                              className="p-1.5 h-auto text-gray-400 cursor-pointer hover:text-[#7bc478]"
                              title="Quick edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{note.content}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Note Details Dialog */}
      <NoteDetailsDialog
        note={selectedNote}
        isOpen={showDetailsDialog}
        onClose={() => {
          setShowDetailsDialog(false);
          setSelectedNote(null);
        }}
        onSave={handleSaveFromDialog}
        onDelete={handleDeleteNote}
      />
    </div>
  );
}