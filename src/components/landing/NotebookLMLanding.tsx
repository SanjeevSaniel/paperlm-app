'use client';

import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { FileText, MessageSquare, Sparkles, ArrowRight, PlayCircle, CheckCircle } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import Logo from '@/components/Logo';

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
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          <motion.div 
            className="absolute top-20 left-10 w-64 h-64 bg-amber-100/40 rounded-full blur-3xl opacity-30"
            animate={{ 
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-20 right-10 w-80 h-80 bg-orange-100/40 rounded-full blur-3xl opacity-30"
            animate={{ 
              x: [0, -40, 0],
              y: [0, 30, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ 
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
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
                <span className="font-medium">1 document</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-orange-600" />
                <span className="font-medium">5 chat messages</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span className="text-gray-600">Free account required</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Product Demo Section */}
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
              See how it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Watch these quick demos to understand PaperLM&apos;s core features
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Video Player Mock */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 rounded-2xl p-8 border border-amber-200/30">
                <motion.div
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 relative flex items-center justify-center overflow-hidden rounded-t-xl">
                    {isPlaying ? (
                      /* Video Player */
                      <div className="w-full h-full">
                        <iframe
                          src={`${demoVideos[activeVideo].videoUrl}?autoplay=1&background=1`}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          title={demoVideos[activeVideo].title}
                        />
                      </div>
                    ) : (
                      /* Preview with Play Button */
                      <>
                        {/* Simulated App Interface */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/10 via-amber-50/10 to-orange-50/10">
                          {activeVideo === 0 && (
                            <div className="p-4 h-full flex flex-col">
                              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 bg-amber-500/30 rounded"></div>
                                  <div className="h-2 bg-white/20 rounded flex-1"></div>
                                </div>
                                <div className="h-1 bg-amber-500/50 rounded w-3/4"></div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 flex-1">
                                <div className="bg-white/10 backdrop-blur-sm rounded"></div>
                                <div className="bg-white/10 backdrop-blur-sm rounded"></div>
                              </div>
                            </div>
                          )}
                          {activeVideo === 1 && (
                            <div className="p-4 h-full flex flex-col">
                              <div className="flex gap-3 flex-1">
                                <div className="flex-1 space-y-2">
                                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 ml-auto w-3/4">
                                    <div className="h-2 bg-white/30 rounded mb-1"></div>
                                    <div className="h-2 bg-white/20 rounded w-2/3"></div>
                                  </div>
                                  <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg p-2 w-4/5">
                                    <div className="h-2 bg-amber-300/40 rounded mb-1"></div>
                                    <div className="h-2 bg-amber-300/30 rounded w-3/4"></div>
                                    <div className="h-2 bg-amber-300/30 rounded w-1/2 mt-1"></div>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2">
                                <div className="h-2 bg-white/20 rounded flex-1"></div>
                                <div className="w-6 h-6 bg-amber-500/30 rounded"></div>
                              </div>
                            </div>
                          )}
                          {activeVideo === 2 && (
                            <div className="p-4 h-full">
                              <div className="space-y-2">
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-4 h-4 bg-amber-500/30 rounded"></div>
                                    <div className="h-2 bg-white/30 rounded w-1/3"></div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="h-1 bg-white/20 rounded w-full"></div>
                                    <div className="h-1 bg-white/20 rounded w-4/5"></div>
                                    <div className="h-1 bg-white/20 rounded w-3/5"></div>
                                  </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-4 h-4 bg-orange-500/30 rounded"></div>
                                    <div className="h-2 bg-white/30 rounded w-2/5"></div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="h-1 bg-white/20 rounded w-full"></div>
                                    <div className="h-1 bg-white/20 rounded w-3/4"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <motion.button
                          className="relative z-10 w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePlayVideo(activeVideo)}
                        >
                          <PlayCircle className="w-8 h-8" />
                        </motion.button>
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                          {demoVideos[activeVideo].duration}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-medium text-gray-900 mb-3">
                      {demoVideos[activeVideo].title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {demoVideos[activeVideo].description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {demoVideos[activeVideo].features.map((feature, index) => (
                        <span key={index} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Video List */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {demoVideos.map((video, index) => (
                <motion.button
                  key={index}
                  className={`w-full text-left p-6 rounded-xl border transition-all duration-300 ${
                    activeVideo === index
                      ? 'bg-amber-50/80 border-amber-200 shadow-md'
                      : 'bg-white border-gray-200 hover:border-amber-200 hover:bg-amber-50/40'
                  }`}
                  onClick={() => {
                    setActiveVideo(index);
                    setIsPlaying(false); // Reset playing state when switching videos
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      activeVideo === index
                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <PlayCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{video.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {video.features.slice(0, 2).map((feature, fIndex) => (
                          <span key={fIndex} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">{video.duration}</div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-purple-50/30 via-amber-50/20 to-orange-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
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
                key={index}
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
                        key={index}
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

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
                <div className="text-4xl font-normal text-gray-900">$0</div>
                <p className="text-gray-600 mt-2">Perfect for trying out PaperLM</p>
              </div>

              <ul className="space-y-4 text-gray-700 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>1 document upload</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>5 chat messages</span>
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
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-normal text-gray-900">$9</span>
                  <span className="text-lg text-gray-600">/month</span>
                </div>
                <p className="text-gray-600 mt-2">For researchers and professionals</p>
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
                  Start Pro trial
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
            <p className="text-sm text-gray-600">
              All plans include data encryption, secure processing, and GDPR compliance
            </p>
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
            © 2024 PaperLM
          </div>
        </div>
      </footer>
    </div>
  );
}