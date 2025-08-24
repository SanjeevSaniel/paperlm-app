'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  MessageSquare, 
  Upload, 
  Search,
  User,
  Menu,
  Plus,
  Send,
  Sparkles,
  BookOpen,
  ChevronRight
} from 'lucide-react';

interface AnimatedAppDemoProps {
  demoType: 'upload' | 'chat' | 'notes';
  autoPlay?: boolean;
}

const AnimatedAppDemo: React.FC<AnimatedAppDemoProps> = ({ demoType, autoPlay = true }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Auto-advance animation steps
  useEffect(() => {
    if (!isPlaying) return;
    
    const stepDurations = demoType === 'upload' ? [2000, 3000, 2000, 1500] : 
                         demoType === 'chat' ? [1500, 2500, 2000, 3000] :
                         [2000, 2500, 2000];
    
    const timer = setTimeout(() => {
      setCurrentStep(prev => prev < stepDurations.length - 1 ? prev + 1 : 0);
    }, stepDurations[currentStep] || 2000);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying, demoType]);

  const DocumentUploadDemo = () => (
    <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
      {/* App Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
        <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-600 rounded flex items-center justify-center">
          <FileText className="w-3 h-3 text-white" />
        </div>
        <span className="ml-2 text-sm font-medium text-gray-800">PaperLM</span>
        <div className="ml-auto flex gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <Menu className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 h-full">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <motion.div
                className="w-16 h-16 border-2 border-dashed border-amber-300 rounded-xl flex items-center justify-center mx-auto mb-4"
                animate={{ borderColor: ['#fcd34d', '#f59e0b', '#fcd34d'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Upload className="w-6 h-6 text-amber-500" />
              </motion.div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your document</h3>
              <p className="text-gray-600 text-sm">Drop PDF, Word docs, or research papers here</p>
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.div
                className="bg-white rounded-lg p-4 border border-gray-200 mb-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">research-paper.pdf</div>
                    <div className="text-xs text-gray-500">2.4 MB • PDF Document</div>
                  </div>
                  <div className="text-right">
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-amber-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Processing...</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="text-center text-sm text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                AI is analyzing your document...
              </motion.div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">research-paper.pdf</div>
                    <div className="text-xs text-green-600">✓ Successfully processed</div>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                </div>
              </div>

              <motion.div
                className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-800">Document ready for chat and analysis!</span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              <div className="text-sm font-medium text-gray-900 mb-3">Quick Actions:</div>
              {[
                { icon: MessageSquare, text: "Start chatting with document", color: "bg-blue-100 text-blue-700" },
                { icon: BookOpen, text: "Generate summary notes", color: "bg-purple-100 text-purple-700" },
                { icon: Search, text: "Search within document", color: "bg-green-100 text-green-700" }
              ].map((action, index) => (
                <motion.div
                  key={`action-${action.text.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 15)}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className={`w-8 h-8 ${action.color} rounded flex items-center justify-center`}>
                    <action.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm text-gray-700">{action.text}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  const ChatDemo = () => (
    <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
      {/* App Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
        <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-600 rounded flex items-center justify-center">
          <MessageSquare className="w-3 h-3 text-white" />
        </div>
        <span className="ml-2 text-sm font-medium text-gray-800">AI Chat</span>
        <div className="ml-auto">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">1 document loaded</span>
        </div>
      </div>

      <div className="flex h-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 space-y-4 overflow-hidden">
            <AnimatePresence>
              {currentStep >= 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-xs text-sm">
                    What are the key findings in this research paper?
                  </div>
                </motion.div>
              )}

              {currentStep >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 max-w-sm">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      {currentStep >= 2 ? (
                        <>
                          <p className="text-sm text-gray-800 mb-2">
                            Based on your document, here are the three key findings:
                          </p>
                          <ol className="text-sm text-gray-700 space-y-1 pl-4">
                            <li>1. Machine learning models show 89% accuracy improvement</li>
                            <li>2. Processing time reduced by 67% compared to traditional methods</li>
                            <li>3. Cross-domain applications demonstrate strong generalization</li>
                          </ol>
                          <div className="text-xs text-amber-600 mt-3 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>Sources: Pages 12-15, Section 4.2</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-gray-300 border-t-amber-500 rounded-full"
                          />
                          <span className="text-sm text-gray-600">AI is analyzing...</span>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {currentStep >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="flex justify-end"
                >
                  <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-xs text-sm">
                    Can you explain the methodology used?
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-3 bg-white rounded-full border border-gray-200 px-4 py-2">
              <input
                type="text"
                placeholder="Ask anything about your document..."
                className="flex-1 text-sm bg-transparent outline-none"
                disabled
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const NotesDemo = () => (
    <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
      {/* App Header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4">
        <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-600 rounded flex items-center justify-center">
          <BookOpen className="w-3 h-3 text-white" />
        </div>
        <span className="ml-2 text-sm font-medium text-gray-800">Smart Notes</span>
        <div className="ml-auto">
          <Plus className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div className="p-4 h-full space-y-3 overflow-hidden">
        <AnimatePresence>
          {currentStep >= 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-gray-900">Auto-Generated Summary</span>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">New</span>
              </div>
              
              {currentStep >= 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <h4 className="font-medium text-gray-900 mb-2">Machine Learning Research Findings</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>• Advanced ML models achieve 89% accuracy improvement over baseline</p>
                    <p>• Processing efficiency gains of 67% in computational time</p>
                    <p>• Strong cross-domain generalization capabilities demonstrated</p>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>📄 From: research-paper.pdf</span>
                    <span>📍 Pages: 12-15</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {currentStep >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-white rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-900">Key Insights</span>
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Methodology combines supervised learning with reinforcement learning techniques</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Dataset includes 50,000+ labeled examples across multiple domains</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: currentStep >= 2 ? 1 : 0 }}
            transition={{ delay: 1.5 }}
            className="text-center text-sm text-gray-500"
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            AI automatically organizes your insights
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  const demos = {
    upload: DocumentUploadDemo,
    chat: ChatDemo,
    notes: NotesDemo
  };

  const DemoComponent = demos[demoType];

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <DemoComponent />
      
      {/* Play/Pause Control */}
      <motion.button
        onClick={() => setIsPlaying(!isPlaying)}
        className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isPlaying ? (
          <div className="w-3 h-3 flex items-center justify-center">
            <div className="w-0.5 h-3 bg-white rounded mr-0.5"></div>
            <div className="w-0.5 h-3 bg-white rounded"></div>
          </div>
        ) : (
          <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent ml-0.5"></div>
        )}
      </motion.button>

      {/* Progress Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1">
        {Array.from({ length: demoType === 'notes' ? 3 : 4 }).map((_, index) => (
          <motion.div
            key={`${demoType}-progress-${index}`}
            className={`w-2 h-2 rounded-full ${index <= currentStep ? 'bg-white' : 'bg-white/30'}`}
            animate={{ scale: index === currentStep ? 1.2 : 1 }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default AnimatedAppDemo;