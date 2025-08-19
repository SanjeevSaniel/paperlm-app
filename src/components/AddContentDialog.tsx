'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Type, Youtube, Globe, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui';

interface AddContentDialogProps {
  onFileUpload: (files: FileList) => void;
  onTextSubmit: (text: string) => void;
  onUrlSubmit: (url: string, type: 'youtube' | 'website') => void;
  canPerformAction: (action: 'upload' | 'query') => boolean;
  children: React.ReactNode;
}

export default function AddContentDialog({
  onFileUpload,
  onTextSubmit,
  onUrlSubmit,
  canPerformAction,
  children,
}: AddContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeType, setActiveType] = useState<'upload' | 'text' | 'youtube' | 'website' | null>(null);
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files);
      setOpen(false);
    }
  }, [onFileUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
      setOpen(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onTextSubmit(textInput.trim());
      setTextInput('');
      setOpen(false);
      setActiveType(null);
    }
  };

  const handleUrlSubmit = (type: 'youtube' | 'website') => {
    if (urlInput.trim()) {
      onUrlSubmit(urlInput.trim(), type);
      setUrlInput('');
      setOpen(false);
      setActiveType(null);
    }
  };

  const resetDialog = () => {
    setActiveType(null);
    setTextInput('');
    setUrlInput('');
    setDragActive(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        resetDialog();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription>
            Choose how you'd like to add content to your knowledge base.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!activeType ? (
            <div className="space-y-4">
              {/* Upload Files - Prominent */}
              <motion.button
                onClick={() => setActiveType('upload')}
                className="w-full flex items-center gap-4 p-4 border-2 border-dashed border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">Upload Files</p>
                  <p className="text-xs text-gray-500">PDF, TXT, DOCX up to 10MB each</p>
                </div>
              </motion.button>

              {/* Other options in horizontal layout */}
              <div className="grid grid-cols-3 gap-3">
                {/* Paste Text */}
                <motion.button
                  onClick={() => setActiveType('text')}
                  className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-slate-300 hover:bg-slate-50/30 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Type className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Paste Text</p>
                  </div>
                </motion.button>

                {/* YouTube */}
                <motion.button
                  onClick={() => setActiveType('youtube')}
                  className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-red-200 hover:bg-red-50/30 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Youtube className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">YouTube</p>
                  </div>
                </motion.button>

                {/* Website */}
                <motion.button
                  onClick={() => setActiveType('website')}
                  className="flex flex-col items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-emerald-200 hover:bg-emerald-50/30 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Website</p>
                  </div>
                </motion.button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Back button */}
              <button
                onClick={() => setActiveType(null)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Back to options
              </button>

              {/* Upload Form */}
              {activeType === 'upload' && (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                    dragActive 
                      ? 'border-blue-300 bg-blue-50/50' 
                      : 'border-gray-300 hover:border-blue-200'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Drop files here or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Supports PDF, TXT, DOCX up to 10MB each
                  </p>
                  
                  <label className="cursor-pointer">
                    <Button variant="primary" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Files
                    </Button>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.txt,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Text Form */}
              {activeType === 'text' && (
                <div className="space-y-4">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your text content here..."
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleTextSubmit}
                      disabled={!textInput.trim()}
                      variant="primary"
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Text
                    </Button>
                  </div>
                </div>
              )}

              {/* URL Forms */}
              {(activeType === 'youtube' || activeType === 'website') && (
                <div className="space-y-4">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder={
                      activeType === 'youtube' 
                        ? 'https://youtube.com/watch?v=...' 
                        : 'https://example.com'
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleUrlSubmit(activeType)}
                      disabled={!urlInput.trim()}
                      variant="primary"
                      className="flex-1"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add {activeType === 'youtube' ? 'Video' : 'Website'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}