'use client';

import Logo from '@/components/Logo';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle,
  FileText,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Target,
  Upload,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import React, { useRef, useState } from 'react';

const AnimatedPath = ({ d, delay = 0 }: { d: string; delay?: number }) => {
  return (
    <motion.path
      d={d}
      stroke="url(#gradient)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: { duration: 2, delay, ease: "easeInOut" },
        opacity: { duration: 0.5, delay }
      }}
    />
  );
};

const FlowingText = ({ children, delay = 0, className = "" }: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string; 
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

const InteractiveDemo = ({ 
  title, 
  description, 
  children, 
  delay = 0 
}: { 
  title: string; 
  description: string; 
  children: React.ReactNode; 
  delay?: number; 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-amber-300 transition-all duration-500 hover:shadow-xl">
        <h3 className="text-2xl font-medium text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
          {children}
        </div>
      </div>
      
      {/* Flowing animation lines */}
      <motion.div
        className="absolute -inset-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl -z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: isHovered ? 1 : 0, 
          scale: isHovered ? 1.02 : 0.8 
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default function ProductWalkthrough() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const steps = [
    {
      icon: Upload,
      title: "Document Upload",
      subtitle: "The Journey Begins",
      description: "Your documents arrive at PaperLM like passengers at a smart terminal. Whether it's a research paper, PDF, or Word document, our system welcomes each file with intelligent processing capabilities.",
      details: [
        "Drag & drop any document format",
        "Automatic file type detection",
        "Smart OCR for scanned documents",
        "Instant preprocessing and optimization"
      ]
    },
    {
      icon: Brain,
      title: "AI Processing",
      subtitle: "The Magic Unfolds",
      description: "Behind the scenes, advanced AI algorithms dissect your document like a master librarian organizing knowledge. Every sentence, paragraph, and concept is carefully catalogued and understood.",
      details: [
        "Intelligent document chunking",
        "Semantic understanding",
        "Context preservation",
        "Vector embedding generation"
      ]
    },
    {
      icon: MessageSquare,
      title: "Conversational Interface",
      subtitle: "Natural Interaction",
      description: "Now comes the beautiful part - talking to your documents as if they were knowledgeable friends. Ask questions, seek insights, or explore ideas through natural conversation.",
      details: [
        "Natural language processing",
        "Context-aware responses",
        "Source citations included",
        "Multi-turn conversations"
      ]
    },
    {
      icon: Lightbulb,
      title: "Insight Generation",
      subtitle: "Knowledge Unveiled",
      description: "Watch as patterns emerge and insights crystallize. PaperLM doesn't just answer questions - it helps you discover connections and understanding you never knew existed.",
      details: [
        "Automatic insight extraction",
        "Pattern recognition",
        "Knowledge synthesis",
        "Smart recommendations"
      ]
    }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40">
      {/* Header */}
      <header className="border-b border-amber-200/30 bg-white/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </Link>
              <Logo size="sm" showText={true} animated={true} />
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/paper">
                <button className="px-4 py-2 bg-gradient-to-r from-orange-500/90 to-amber-600/90 hover:from-orange-600/90 hover:to-amber-700/90 text-white rounded-lg transition-colors">
                  Try PaperLM
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section 
        className="py-20 lg:py-32 relative overflow-hidden"
        style={{ y, opacity }}
      >
        {/* Artistic Background Elements */}
        <div className="absolute inset-0 -z-10">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#f97316" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            
            {/* Flowing artistic paths */}
            <AnimatedPath d="M100,200 Q300,100 500,200 T900,150" delay={0.5} />
            <AnimatedPath d="M150,400 Q400,300 650,400 T950,350" delay={1} />
            <AnimatedPath d="M50,600 Q250,500 450,600 T850,550" delay={1.5} />
            <AnimatedPath d="M200,800 Q500,700 800,800" delay={2} />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FlowingText delay={0.2}>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50/80 border border-amber-200/50 rounded-full text-sm text-amber-800 mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>Understanding PaperLM • A Journey Through Intelligence</span>
            </motion.div>
          </FlowingText>

          <FlowingText delay={0.4}>
            <h1 className="text-4xl lg:text-6xl font-normal text-gray-900 leading-tight mb-6">
              How Your Documents
              <br />
              <motion.span 
                className="text-amber-600 relative inline-block"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                Come to Life
                <motion.div
                  className="absolute -bottom-2 left-0 w-full h-1 bg-amber-200 rounded"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 1.5 }}
                  style={{ originX: 0 }}
                />
              </motion.span>
            </h1>
          </FlowingText>
          
          <FlowingText delay={0.6}>
            <p className="text-xl text-gray-600 leading-relaxed mb-12 max-w-3xl mx-auto">
              Discover the elegant dance between your documents and artificial intelligence. 
              A story of transformation, understanding, and insight generation.
            </p>
          </FlowingText>

          <FlowingText delay={0.8}>
            <motion.div
              className="inline-flex items-center gap-2 text-gray-600"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span>Scroll to explore the journey</span>
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </FlowingText>
        </div>
      </motion.section>

      {/* The Journey Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FlowingText>
            <div className="text-center mb-20">
              <h2 className="text-3xl lg:text-4xl font-normal text-gray-900 mb-6">
                The Four Acts of Digital Transformation
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Every document that enters PaperLM embarks on a remarkable journey. 
                Like a symphony in four movements, each stage builds upon the last to create something magical.
              </p>
            </div>
          </FlowingText>

          <div className="space-y-32">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`grid lg:grid-cols-2 gap-12 items-center ${
                  index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                }`}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {/* Content */}
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <motion.div
                    className="flex items-center gap-3 mb-6"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-amber-600 font-medium">{step.subtitle}</div>
                      <h3 className="text-2xl font-medium text-gray-900">{step.title}</h3>
                    </div>
                  </motion.div>

                  <FlowingText delay={0.6}>
                    <p className="text-lg text-gray-700 leading-relaxed mb-8">
                      {step.description}
                    </p>
                  </FlowingText>

                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    {step.details.map((detail, detailIndex) => (
                      <motion.div
                        key={detailIndex}
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 1 + detailIndex * 0.1 }}
                      >
                        <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <span className="text-gray-700">{detail}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Visual Demo */}
                <div className={index % 2 === 1 ? 'lg:col-start-1' : ''}>
                  <InteractiveDemo
                    title={`Step ${index + 1}: ${step.title}`}
                    description="Interactive demonstration"
                    delay={0.4}
                  >
                    <div className="p-8 h-80">
                      {index === 0 && (
                        <motion.div
                          className="space-y-4"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                        >
                          {/* Upload Animation */}
                          <motion.div
                            className="border-2 border-dashed border-amber-300 rounded-lg p-6 text-center"
                            animate={{ 
                              borderColor: ["#fcd34d", "#f59e0b", "#fcd34d"],
                              scale: [1, 1.02, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Drop your documents here</p>
                          </motion.div>
                          
                          <motion.div
                            className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 1 }}
                          >
                            <FileText className="w-5 h-5 text-blue-500" />
                            <div className="flex-1">
                              <div className="h-2 bg-gray-200 rounded">
                                <motion.div
                                  className="h-full bg-amber-500 rounded"
                                  initial={{ width: "0%" }}
                                  animate={{ width: "100%" }}
                                  transition={{ duration: 2, delay: 1.5 }}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">Processing...</span>
                          </motion.div>
                        </motion.div>
                      )}

                      {index === 1 && (
                        <motion.div
                          className="h-full relative"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                        >
                          {/* Brain Processing Animation */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.div
                              className="relative"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            >
                              <Brain className="w-16 h-16 text-amber-500" />
                              {[...Array(6)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="absolute w-3 h-3 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"
                                  style={{
                                    top: `${50 + 30 * Math.cos((i * 60 * Math.PI) / 180)}%`,
                                    left: `${50 + 30 * Math.sin((i * 60 * Math.PI) / 180)}%`,
                                  }}
                                  animate={{
                                    scale: [0.5, 1.2, 0.5],
                                    opacity: [0.3, 1, 0.3]
                                  }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.3
                                  }}
                                />
                              ))}
                            </motion.div>
                          </div>
                        </motion.div>
                      )}

                      {index === 2 && (
                        <motion.div
                          className="space-y-3 h-full"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                        >
                          {/* Chat Interface */}
                          <motion.div
                            className="bg-gray-100 rounded-lg p-3 ml-12"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 1 }}
                          >
                            <p className="text-sm text-gray-700">What are the key findings in this research?</p>
                          </motion.div>
                          
                          <motion.div
                            className="bg-amber-50 border border-amber-200 rounded-lg p-3 mr-12"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 1.5 }}
                          >
                            <p className="text-sm text-gray-700">Based on the document, there are three key findings...</p>
                            <div className="mt-2 text-xs text-amber-600">Source: Page 12, Section 3.2</div>
                          </motion.div>

                          <motion.div
                            className="flex items-center gap-2 p-2 bg-white rounded-lg"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 2 }}
                          >
                            <div className="h-2 bg-gray-200 rounded flex-1" />
                            <Send className="w-4 h-4 text-amber-500" />
                          </motion.div>
                        </motion.div>
                      )}

                      {index === 3 && (
                        <motion.div
                          className="grid grid-cols-2 gap-3 h-full"
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.5 }}
                        >
                          {/* Insights Grid */}
                          {[
                            { icon: Target, label: "Key Insights", color: "text-blue-500" },
                            { icon: BookOpen, label: "Summaries", color: "text-green-500" },
                            { icon: Zap, label: "Quick Facts", color: "text-purple-500" },
                            { icon: RefreshCw, label: "Connections", color: "text-orange-500" }
                          ].map((item, i) => (
                            <motion.div
                              key={i}
                              className="bg-white rounded-lg p-4 border border-gray-200"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5, delay: 1 + i * 0.2 }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <item.icon className={`w-6 h-6 ${item.color} mb-2`} />
                              <div className="text-xs font-medium text-gray-700">{item.label}</div>
                              <div className="space-y-1 mt-2">
                                <div className="h-1 bg-gray-200 rounded" />
                                <div className="h-1 bg-gray-200 rounded w-3/4" />
                                <div className="h-1 bg-gray-200 rounded w-1/2" />
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </InteractiveDemo>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section className="py-20 bg-gradient-to-br from-purple-50/30 via-amber-50/20 to-orange-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FlowingText>
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-normal text-gray-900 mb-4">
                The Art of Understanding
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Every feature in PaperLM is crafted with intention, designed to bridge the gap 
                between human curiosity and machine intelligence.
              </p>
            </div>
          </FlowingText>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                title: "Semantic Search",
                description: "Find information by meaning, not just keywords. Our AI understands context and nuance.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: Brain,
                title: "Context Awareness",
                description: "Every question builds on previous conversations, creating deeper understanding over time.",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: Target,
                title: "Precise Citations",
                description: "Every answer comes with exact source references, maintaining academic integrity.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: Lightbulb,
                title: "Insight Generation",
                description: "Discover patterns and connections across your documents that you might have missed.",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: RefreshCw,
                title: "Continuous Learning",
                description: "The more you interact, the better PaperLM understands your research needs.",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: Zap,
                title: "Instant Processing",
                description: "From upload to insight in seconds. No waiting, no delays, just immediate understanding.",
                color: "from-red-500 to-pink-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="group relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-amber-300 transition-all duration-500 hover:shadow-lg">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FlowingText>
            <h2 className="text-3xl lg:text-4xl font-normal text-gray-900 mb-6">
              Ready to Transform Your Documents?
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Join thousands of researchers, students, and professionals who have discovered 
              a new way to interact with their knowledge.
            </p>
            
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/paper">
                <motion.button 
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:from-orange-600 hover:to-amber-700 transition-colors font-medium text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Your Journey
                </motion.button>
              </Link>
              <Link href="/">
                <motion.button 
                  className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>
          </FlowingText>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <Logo size="sm" showText={true} animated={false} />
              <div className="hidden md:block text-sm text-gray-600">
                AI-powered document analysis
              </div>
            </div>

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
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            © 2024 PaperLM
          </div>
        </div>
      </footer>
    </div>
  );
}