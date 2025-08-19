'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, MessageCircle, FileText, Sparkles } from 'lucide-react';

interface AIAssistantAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function AIAssistantAnimation({ isVisible, onComplete }: AIAssistantAnimationProps) {
  const [phase, setPhase] = useState(0); // 0: greeting, 1: thinking, 2: ready

  useEffect(() => {
    if (!isVisible) return;

    const phaseTimers = [
      setTimeout(() => setPhase(1), 2000), // Move to thinking after 2s
      setTimeout(() => setPhase(2), 4000), // Move to ready after 4s
    ];

    return () => phaseTimers.forEach(timer => clearTimeout(timer));
  }, [isVisible]);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: -20,
      transition: { duration: 0.4, ease: "easeIn" }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence mode="wait" onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col items-center justify-center h-full px-8 py-12"
        >
          {/* Main AI Interface */}
          <motion.div 
            variants={floatingVariants}
            animate="animate"
            className="relative mb-12"
          >
            {/* Ambient Background Glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                background: [
                  "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
                  "radial-gradient(circle, rgba(123, 196, 120, 0.1) 0%, transparent 70%)",
                  "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
                ],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: '200px', height: '200px', left: '-50px', top: '-50px' }}
            />

            {/* Central AI Hub */}
            <motion.div
              className="relative w-24 h-24 bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 10px 40px rgba(139, 92, 246, 0.15)",
                  "0 10px 40px rgba(123, 196, 120, 0.15)",
                  "0 10px 40px rgba(139, 92, 246, 0.15)",
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  {phase === 0 && <Bot className="w-8 h-8 text-purple-600" />}
                  {phase === 1 && <Sparkles className="w-8 h-8 text-[#7bc478]" />}
                  {phase === 2 && <MessageCircle className="w-8 h-8 text-slate-700" />}
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Orbiting Elements */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 bg-white rounded-full shadow-sm border border-slate-200"
                animate={{
                  rotate: [0, 360],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  rotate: { duration: 8 + i * 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2 + i * 0.5, repeat: Infinity, ease: "easeInOut" }
                }}
                style={{
                  left: '50%',
                  top: '50%',
                  transformOrigin: `${25 + i * 15}px 0px`,
                  marginLeft: '-6px',
                  marginTop: '-6px',
                }}
              />
            ))}
          </motion.div>

          {/* Status Messages */}
          <motion.div
            className="text-center max-w-sm"
            animate={{ opacity: 1 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {phase === 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      Hello there! 👋
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      I'm your AI assistant, initializing...
                    </p>
                  </div>
                )}
                {phase === 1 && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      Getting ready ✨
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Setting up document analysis capabilities...
                    </p>
                  </div>
                )}
                {phase === 2 && (
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      Ready to help! 💭
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      Upload documents or start a conversation to begin
                    </p>
                    
                    {/* Quick Actions */}
                    <motion.div 
                      className="flex justify-center gap-3"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-xs text-slate-700 shadow-sm cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        Upload
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-xs text-slate-700 shadow-sm cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Chat
                      </motion.div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Progress Indicator */}
          <motion.div
            className="flex justify-center gap-2 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i <= phase ? 'bg-[#7bc478]' : 'bg-slate-300'
                }`}
                animate={i === phase ? {
                  scale: [1, 1.3, 1],
                  opacity: [0.7, 1, 0.7]
                } : {}}
                transition={{
                  duration: 1,
                  repeat: i === phase ? Infinity : 0,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}