'use client';

import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { FileText, MessageSquare, Sparkles, ArrowRight, PlayCircle, CheckCircle } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import Logo from '@/components/Logo';
import AnimatedAppDemo from '@/components/AnimatedAppDemo';

export default function NotebookLMLanding() {
  const { isSignedIn } = useUser();
  const [activeVideo, setActiveVideo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const demoVideos = [
    {
      title: "Document Upload & Processing",
      description: "Drag and drop PDFs, Word docs, or paste text directly. Watch as PaperLM intelligently chunks and processes your documents for optimal AI analysis.",
      duration: "0:45",
      features: ["Multi-format support", "Intelligent chunking", "OCR for scanned documents"],
      videoUrl: "https://player.vimeo.com/video/demo1" // Placeholder - replace with actual demo
    },
    {
      title: "AI-Powered Chat Interface", 
      description: "Experience natural conversations with your documents. Ask complex questions and get detailed answers with precise source citations from your uploaded content.",
      duration: "1:12",
      features: ["Natural language queries", "Source citations", "Context-aware responses"],
      videoUrl: "https://player.vimeo.com/video/demo2" // Placeholder - replace with actual demo
    },
    {
      title: "Smart Notebook Integration",
      description: "Automatically generate notes from document insights. Save important citations and build a comprehensive knowledge base from your research.",
      duration: "0:38",
      features: ["Auto-note generation", "Citation management", "Knowledge organization"],
      videoUrl: "https://player.vimeo.com/video/demo3" // Placeholder - replace with actual demo
    }
  ];

  const handlePlayVideo = (index: number) => {
    setActiveVideo(index);
    setIsPlaying(true);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40">
      {/* Header */}
      <motion.header 
        className="border-b border-amber-200/30 bg-white/60 backdrop-blur-md sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Logo size="sm" showText={true} animated={true} />
            </motion.div>
            
            <nav className="hidden md:flex items-center gap-8">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
                  How it works
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
              </motion.div>
            </nav>

            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <>
                  <Link href="/paper">
                    <motion.button 
                      className="px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Dashboard
                    </motion.button>
                  </Link>
                  <UserButton />
                </>
              ) : (
                <>
                  <SignInButton>
                    <motion.button 
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Sign in
                    </motion.button>
                  </SignInButton>
                  <Link href="/sign-up">
                    <motion.button 
                      className="px-4 py-2 bg-gradient-to-r from-orange-500/90 to-amber-600/90 hover:from-orange-600/90 hover:to-amber-700/90 text-white rounded-lg transition-colors"
                      whileHover={{ scale: 1.05, boxShadow: "0 4px 20px rgba(251, 146, 60, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Get started
                    </motion.button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.section 
        className="py-20 lg:py-32 relative overflow-hidden"
        style={{ y, opacity }}
      >
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 -z-10">
          <motion.div 
            className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-amber-200/40 to-orange-200/40 rounded-full blur-3xl"
            animate={{ 
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-l from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"
            animate={{ 
              x: [0, -60, 0],
              y: [0, 40, 0],
              scale: [1, 0.8, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3
            }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-blue-100/20 to-indigo-100/20 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -180, -360]
            }}
            transition={{ 
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          
          {/* Floating particles */}
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-2 h-2 bg-gradient-to-r from-amber-400/60 to-orange-400/60 rounded-full"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`
              }}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.8,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50/80 border border-amber-200/50 rounded-full text-sm text-amber-800 mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>Introducing PaperLM • Your AI research assistant</span>
          </motion.div>

          <motion.h1 
            className="text-4xl lg:text-5xl xl:text-6xl font-normal text-gray-900 leading-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            A new way to interact with your{' '}
            <motion.span 
              className="text-amber-600 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              documents
              <motion.div
                className="absolute bottom-0 left-0 w-full h-1 bg-amber-200 rounded"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                style={{ originX: 0 }}
              />
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 leading-relaxed mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Upload research papers, PDFs, and documents. Ask questions, get summaries, 
            and discover insights through natural conversation with AI.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {isSignedIn ? (
              <Link href="/paper">
                <motion.button 
                  className="px-8 py-4 bg-gradient-to-r from-orange-500/90 to-amber-600/90 hover:from-orange-600/90 hover:to-amber-700/90 text-white rounded-xl transition-colors flex items-center gap-2 text-lg font-medium shadow-lg"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(251, 146, 60, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Go to Dashboard</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </motion.button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <motion.button 
                  className="px-8 py-4 bg-gradient-to-r from-orange-500/90 to-amber-600/90 hover:from-orange-600/90 hover:to-amber-700/90 text-white rounded-xl transition-colors flex items-center gap-2 text-lg font-medium shadow-lg"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(251, 146, 60, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span>Get started</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </motion.button>
              </Link>
            )}
            
            <Link href="/how-it-works">
              <motion.button 
                className="px-8 py-4 bg-white border border-gray-200 hover:border-amber-300 text-gray-700 hover:text-amber-700 rounded-xl transition-colors flex items-center gap-2 text-lg font-medium shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlayCircle className="w-5 h-5" />
                <span>How it works</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* Free User Limits */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-amber-600" />
                <span className="font-medium">2 documents</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-orange-600" />
                <span className="font-medium">10 chat messages</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">Free account required</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Interactive App Demos Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-4xl font-normal text-gray-900 mb-4">
              Experience PaperLM in action
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Interactive demos showing how PaperLM transforms document interaction
            </p>
          </motion.div>

          {/* Three Interactive Demos */}
          <div className="space-y-20">
            {/* Upload Demo */}
            <motion.div 
              className="grid lg:grid-cols-2 gap-12 items-center"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-4">
                    <FileText className="w-4 h-4" />
                    <span>Document Upload</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-normal text-gray-900 mb-4">
                    Upload and process documents instantly
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Drop any PDF, Word doc, or research paper. Our AI processes and indexes 
                    your content in seconds, making it ready for intelligent conversation.
                  </p>
                  <div className="space-y-3">
                    {[
                      "Multi-format document support (PDF, DOCX, TXT)",
                      "Intelligent text extraction and chunking",
                      "OCR support for scanned documents",
                      "Instant AI processing and indexing"
                    ].map((feature, index) => (
                      <motion.div
                        key={`feature-item-${index}`}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      >
                        <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full"></div>
                        <span className="text-gray-700">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl">
                  <AnimatedAppDemo demoType="upload" autoPlay={true} />
                </div>
              </motion.div>
            </motion.div>

            {/* Chat Demo */}
            <motion.div 
              className="grid lg:grid-cols-2 gap-12 items-center"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="relative lg:order-1"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl">
                  <AnimatedAppDemo demoType="chat" autoPlay={true} />
                </div>
              </motion.div>
              <div className="lg:order-0">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                    <MessageSquare className="w-4 h-4" />
                    <span>AI Chat Interface</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-normal text-gray-900 mb-4">
                    Chat naturally with your documents
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Ask questions in plain English. Get detailed answers with precise 
                    citations from your documents. It's like having a conversation with your research.
                  </p>
                  <div className="space-y-3">
                    {[
                      "Natural language question processing",
                      "Contextual AI responses with citations",
                      "Multi-document knowledge synthesis",
                      "Follow-up question understanding"
                    ].map((feature, index) => (
                      <motion.div
                        key={`feature-item-${index}`}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      >
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                        <span className="text-gray-700">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Notes Demo */}
            <motion.div 
              className="grid lg:grid-cols-2 gap-12 items-center"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />
                    <span>Smart Notes</span>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-normal text-gray-900 mb-4">
                    Auto-generate insights and summaries
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    Let AI automatically extract key insights, generate summaries, and organize 
                    your findings into actionable notes with proper source citations.
                  </p>
                  <div className="space-y-3">
                    {[
                      "Automatic summary generation",
                      "Key insight extraction",
                      "Structured note organization",
                      "Source citation tracking"
                    ].map((feature, index) => (
                      <motion.div
                        key={`feature-item-${index}`}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      >
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                        <span className="text-gray-700">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl">
                  <AnimatedAppDemo demoType="notes" autoPlay={true} />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-purple-50/30 via-amber-50/20 to-orange-50/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <motion.div 
            className="absolute top-10 right-20 w-32 h-32 bg-gradient-to-br from-amber-300/20 to-orange-300/20 rounded-full blur-2xl"
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, 360, 0]
            }}
            transition={{ 
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div 
            className="absolute bottom-10 left-20 w-40 h-40 bg-gradient-to-tl from-purple-300/15 to-pink-300/15 rounded-full blur-2xl"
            animate={{ 
              scale: [1.2, 1, 1.2],
              x: [0, 20, 0]
            }}
            transition={{ 
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-full text-sm text-amber-800 mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Powerful Features</span>
            </motion.div>
            <h2 className="text-3xl lg:text-4xl font-normal text-gray-900 mb-4">
              Built for researchers and knowledge workers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform how you interact with documents through intelligent AI conversation
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Universal document support",
                description: "PDFs, Word docs, research papers, and text files. Upload anything and start analyzing immediately.",
                color: "amber",
                delay: 0.1
              },
              {
                icon: MessageSquare,
                title: "Natural conversation",
                description: "Ask questions in plain English. Get detailed answers with citations and contextual explanations.",
                color: "orange", 
                delay: 0.2
              },
              {
                icon: Sparkles,
                title: "Instant insights",
                description: "Discover key themes, generate summaries, and extract actionable insights from complex documents.",
                color: "amber",
                delay: 0.3
              }
            ].map((feature, index) => (
              <motion.div
                key={`feature-card-${index}`}
                className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: feature.delay }}
                whileHover={{ y: -5 }}
              >
                <motion.div 
                  className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-6`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </motion.div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Feature showcase */}
          <motion.div
            className="mt-20 bg-white rounded-2xl p-8 lg:p-12 border border-gray-200"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <h3 className="text-2xl lg:text-3xl font-normal text-gray-900 mb-4">
                    Experience the future of document interaction
                  </h3>
                  <p className="text-lg text-gray-600 mb-6">
                    No more scrolling through endless pages. Ask specific questions and get precise answers with source citations.
                  </p>
                  <div className="space-y-3">
                    {[
                      "Smart document parsing and chunking",
                      "Context-aware AI responses", 
                      "Source citation for every answer",
                      "Multi-document knowledge synthesis"
                    ].map((item, index) => (
                      <motion.div
                        key={`feature-item-${index}`}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                      >
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-gray-700">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
              <div className="relative">
                <motion.div
                  className="bg-gradient-to-br from-amber-50/60 via-orange-50/40 to-amber-50/60 rounded-xl p-6 border-2 border-dashed border-amber-200/50"
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <FileText className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-gray-600 text-sm">
                      Your documents become conversational partners
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* How it works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-normal text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to start chatting with your documents
            </p>
          </div>

          <div className="space-y-12">
            <div className="flex items-start gap-6">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Upload your documents</h3>
                <p className="text-gray-600">
                  Drop your PDFs, research papers, or any text documents. We&apos;ll process them instantly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Ask questions</h3>
                <p className="text-gray-600">
                  Use natural language to ask about content, request summaries, or explore specific topics.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium text-sm flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Get instant answers</h3>
                <p className="text-gray-600">
                  Receive detailed, contextual responses based on your document content with source citations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-4xl font-normal text-gray-900 mb-4">
              Choose your plan
            </h2>
            <p className="text-xl text-gray-600">
              Get started for free, upgrade as you grow
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {/* Free Plan */}
            <motion.div
              className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-gray-300 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -5 }}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-medium text-gray-900 mb-2">Free</h3>
                <div className="flex flex-col">
                  <span className="text-4xl font-normal text-gray-900">$0</span>
                  <span className="text-lg text-gray-500">₹0</span>
                </div>
                <p className="text-gray-600 mt-2">Perfect for trying out PaperLM</p>
              </div>

              <ul className="space-y-4 text-gray-700 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>2 document uploads</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>10 chat messages</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Basic AI analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Quick sign-up process</span>
                </li>
              </ul>

              <Link href="/sign-up">
                <motion.button 
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start for free
                </motion.button>
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              className="bg-white p-8 rounded-2xl border-2 border-amber-200 relative hover:border-amber-300 transition-all duration-300 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -5 }}
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                  Most popular
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-medium text-gray-900 mb-2">Pro</h3>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-normal text-gray-900">$5</span>
                    <span className="text-lg text-gray-600">/month</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-normal text-gray-500">₹415</span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                </div>
                <p className="text-gray-600 mt-2">For researchers and professionals • Cancel anytime</p>
              </div>

              <ul className="space-y-4 text-gray-700 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>Unlimited documents</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>Unlimited chat messages</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>Advanced AI analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <span>Document history & sync</span>
                </li>
              </ul>

              <Link href="/sign-up">
                <motion.button 
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:from-orange-600 hover:to-amber-700 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Pro Monthly
                </motion.button>
              </Link>
            </motion.div>

            {/* Credits Plan */}
            <motion.div
              className="bg-white p-8 rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -5 }}
            >
              <div className="mb-6">
                <h3 className="text-2xl font-medium text-gray-900 mb-2">Credits</h3>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-normal text-gray-900">$0.10</span>
                    <span className="text-lg text-gray-600">per message</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-normal text-gray-500">₹8.30</span>
                    <span className="text-sm text-gray-500">per message</span>
                  </div>
                </div>
                <p className="text-gray-600 mt-2">Pay only for what you use • No monthly fees</p>
              </div>

              <ul className="space-y-4 text-gray-700 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span>Unlimited documents</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span>Pay per message sent</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span>Advanced AI analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span>Credit bundles available</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span>No expiry on credits</span>
                </li>
              </ul>

              <Link href="/sign-up">
                <motion.button 
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Buy Credits
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                All plans include data encryption, secure processing, and GDPR compliance
              </p>
              <p className="text-xs text-gray-500">
                Pro: $5/month • Credits: $0.10/message • Cancel anytime • No setup fees
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Logo and Description */}
            <div className="flex items-center gap-6">
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
              >
                <Logo size="sm" showText={true} animated={false} />
              </motion.div>
              <div className="hidden md:block text-sm text-gray-600">
                AI-powered document analysis
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">
                Terms
              </Link>
              <Link href="/help" className="hover:text-gray-900 transition-colors">
                Help
              </Link>
              <Link href="/contact" className="hover:text-gray-900 transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            © 2025 PaperLM
          </div>
        </div>
      </footer>
    </div>
  );
}