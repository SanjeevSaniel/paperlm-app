'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  NotebookPen, 
  MessageSquare, 
  Upload,
  Search,
  Send,
  Bot,
  Sparkles,
  Zap
} from 'lucide-react';

interface AppScreenshotProps {
  variant?: 'upload' | 'chat' | 'notebook';
  animated?: boolean;
}

export default function AppScreenshot({ variant = 'chat', animated = true }: AppScreenshotProps) {
  const baseAnimation = animated ? {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 }
  } : {};

  if (variant === 'upload') {
    return (
      <motion.div 
        className="bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
        {...baseAnimation}
      >
        {/* Header */}
        <div className="px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-sm font-medium text-gray-700">PaperLM</div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs">
            <Zap className="w-3 h-3" />
            <span>5/10 queries</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 h-80 flex items-center justify-center">
          <div className="text-center max-w-sm">
            <motion.div 
              className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 mx-auto"
              animate={animated ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Upload className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Upload Your Documents</h3>
            <p className="text-sm text-gray-600 mb-6">Drag and drop PDFs, Word documents, or research papers to get started</p>
            <div className="border-2 border-dashed border-amber-300 rounded-xl p-8 bg-amber-50/50">
              <div className="text-amber-600 text-sm font-medium">Drop files here or click to browse</div>
            </div>
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="px-6 py-3 bg-white/60 backdrop-blur-sm border-t border-gray-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileText className="w-4 h-4" />
            <span>Supports PDF, DOCX, TXT</span>
          </div>
          <div className="text-xs text-gray-400">Ready to process</div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'notebook') {
    return (
      <motion.div 
        className="bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
        {...baseAnimation}
      >
        {/* Header */}
        <div className="px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NotebookPen className="w-4 h-4 text-amber-600" />
            <div className="text-sm font-medium text-gray-700">Smart Notebook</div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-gray-100 rounded-lg">
              <Search className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 h-80 space-y-4 overflow-y-auto">
          <div className="bg-white/70 rounded-lg p-4 border border-amber-200/50">
            <h4 className="font-medium text-gray-900 mb-2">Key Insights</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Machine learning models show 94% accuracy in document classification</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Natural language processing techniques improve semantic search by 40%</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Vector embeddings enable cross-document relationship detection</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/70 rounded-lg p-4 border border-orange-200/50">
            <h4 className="font-medium text-gray-900 mb-2">Research Questions</h4>
            <div className="space-y-2">
              <div className="text-sm text-gray-700 p-2 bg-orange-50 rounded">
                How do different embedding models compare for document retrieval?
              </div>
              <div className="text-sm text-gray-700 p-2 bg-amber-50 rounded">
                What are the computational costs of real-time semantic search?
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 py-3 bg-white/60 backdrop-blur-sm border-t border-gray-200/50">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <span className="text-gray-400">Add your thoughts...</span>
            </div>
            <button className="p-2 bg-orange-500 text-white rounded-lg">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default chat variant
  return (
    <motion.div 
      className="bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
      {...baseAnimation}
    >
      {/* Header */}
      <div className="px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-600" />
          <div className="text-sm font-medium text-gray-700">AI Chat</div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Active</span>
        </div>
      </div>

      {/* Messages */}
      <div className="p-6 h-80 space-y-4 overflow-y-auto">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="max-w-xs bg-orange-500 text-white rounded-2xl rounded-br-md px-4 py-2">
            <p className="text-sm">What are the main findings about AI document processing in this research paper?</p>
          </div>
        </div>

        {/* AI Response */}
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 bg-white/70 rounded-2xl rounded-tl-md px-4 py-3 border border-amber-200/50">
            <p className="text-sm text-gray-700 leading-relaxed">
              Based on the research paper, there are three key findings about AI document processing:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-amber-500 rounded-full mt-2"></div>
                <span><strong>Accuracy:</strong> Modern NLP models achieve 94% accuracy in document classification</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-orange-500 rounded-full mt-2"></div>
                <span><strong>Speed:</strong> Semantic search performance improved by 40% with vector embeddings</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 bg-amber-600 rounded-full mt-2"></div>
                <span><strong>Scale:</strong> Systems can handle millions of documents in real-time</span>
              </li>
            </ul>
            <div className="mt-3 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">
              📄 Source: research_paper.pdf, page 3
            </div>
          </div>
        </div>

        {/* Typing indicator */}
        {animated && (
          <motion.div 
            className="flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="bg-white/70 rounded-2xl rounded-tl-md px-4 py-3 border border-amber-200/50">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-6 py-3 bg-white/60 backdrop-blur-sm border-t border-gray-200/50">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white rounded-full border border-gray-200 px-4 py-2 text-sm">
            <span className="text-gray-400">Ask anything about your documents...</span>
          </div>
          <button className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}