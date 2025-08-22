'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Upload,
  MessageSquare, 
  FileText,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Zap,
  Bot
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const workflowSteps = [
  {
    id: 'sources',
    title: 'Upload & Organize',
    subtitle: 'Sources Panel',
    description: 'Upload PDFs, documents, and research papers. Our AI instantly processes and indexes your content for intelligent retrieval.',
    icon: Upload,
    color: 'amber',
    features: ['PDF Support', 'Auto-indexing', 'Smart Organization', 'OCR Processing'],
    panelContent: {
      title: 'Document Sources',
      items: ['Research Paper.pdf', 'Meeting Notes.docx', 'Project Brief.pdf', 'Reference Guide.txt']
    }
  },
  {
    id: 'chat',
    title: 'Ask & Discover',
    subtitle: 'Chat Panel', 
    description: 'Have natural conversations with your documents. Ask questions, get summaries, and explore insights with AI-powered citations.',
    icon: MessageSquare,
    color: 'orange',
    features: ['Natural Language', 'Smart Citations', 'Context Aware', 'Follow-up Questions'],
    panelContent: {
      title: 'AI Conversation',
      messages: [
        { type: 'user', content: 'What are the key findings in the research paper?' },
        { type: 'ai', content: 'Based on the research, there are three main findings: 1) AI models show 94% accuracy...' }
      ]
    }
  },
  {
    id: 'studio',
    title: 'Create & Export',
    subtitle: 'Studio Panel',
    description: 'Generate summaries, create study guides, extract insights, and export your findings in various formats.',
    icon: Sparkles,
    color: 'slate',
    features: ['Auto Summaries', 'Study Guides', 'Export Options', 'Insight Extraction'],
    panelContent: {
      title: 'Content Studio',
      outputs: ['Executive Summary', 'Key Insights', 'Action Items', 'Study Guide']
    }
  }
];

export default function LandingWorkflow() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate workflow cards
      gsap.from('[data-workflow-card]', {
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "bottom 30%",
          toggleActions: "play none none reverse"
        }
      });

      // Animate the main demo
      gsap.from('[data-workflow-demo]', {
        opacity: 0,
        scale: 0.95,
        duration: 1,
        scrollTrigger: {
          trigger: '[data-workflow-demo]',
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-rotate active step
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % workflowSteps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-slate-50/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-bl from-amber-100/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-orange-100/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm border border-amber-200/30 text-amber-700 rounded-full text-sm font-medium mb-6"
          >
            <Zap className="w-4 h-4" />
            <span>Three-Panel Workflow</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Your Complete
            <br />
            <span className="bg-gradient-to-r from-amber-600/80 to-orange-600/80 bg-clip-text text-transparent">
              Research Workflow
            </span>
          </h2>

          <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
            From upload to insight, PaperLM provides a seamless three-panel interface that adapts to your research needs.
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {workflowSteps.map((step, index) => {
            const IconComponent = step.icon;
            const isActive = activeStep === index;
            
            return (
              <motion.div
                key={step.id}
                data-workflow-card
                className={`relative p-6 rounded-2xl border transition-all duration-500 cursor-pointer group ${
                  isActive 
                    ? 'bg-white border-amber-200/50 shadow-lg scale-105' 
                    : 'bg-white/60 border-slate-200/50 shadow-sm hover:shadow-md hover:scale-102'
                }`}
                onClick={() => setActiveStep(index)}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                {/* Step Number */}
                <div className={`absolute -top-3 left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {index + 1}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  isActive 
                    ? 'bg-amber-500/10 text-amber-600' 
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-amber-600 font-medium">
                    {step.subtitle}
                  </p>
                </div>
                
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {step.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {step.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-b-2xl"
                    layoutId="activeIndicator"
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Interactive Demo */}
        <div data-workflow-demo className="max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/50 shadow-2xl overflow-hidden">
            {/* Demo Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200/50 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-slate-700">PaperLM Workspace</span>
              </div>
              <div className="text-xs text-slate-500">Three-Panel Interface</div>
            </div>

            {/* Three-Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 h-96">
              {workflowSteps.map((step, index) => {
                const isActive = activeStep === index;
                const IconComponent = step.icon;
                
                return (
                  <div
                    key={step.id}
                    className={`border-r border-slate-200/50 last:border-r-0 transition-all duration-500 ${
                      isActive ? 'bg-amber-50/30' : 'bg-white/50'
                    }`}
                  >
                    {/* Panel Header */}
                    <div className={`p-4 border-b border-slate-200/50 ${
                      isActive ? 'bg-amber-100/20' : 'bg-slate-50/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-4 h-4 ${
                          isActive ? 'text-amber-600' : 'text-slate-500'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isActive ? 'text-amber-700' : 'text-slate-600'
                        }`}>
                          {step.panelContent.title}
                        </span>
                      </div>
                    </div>

                    {/* Panel Content */}
                    <div className="p-4">
                      {step.id === 'sources' && (
                        <div className="space-y-2">
                          {step.panelContent.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-white/80 rounded-lg border border-slate-200/30">
                              <FileText className="w-4 h-4 text-slate-500" />
                              <span className="text-xs text-slate-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {step.id === 'chat' && (
                        <div className="space-y-3">
                          {step.panelContent.messages?.map((msg, idx) => (
                            <div key={idx} className={`p-2 rounded-lg text-xs ${
                              msg.type === 'user' 
                                ? 'bg-amber-100/50 text-amber-700 ml-4' 
                                : 'bg-slate-100/50 text-slate-700 mr-4'
                            }`}>
                              <div className="flex items-start gap-2">
                                {msg.type === 'ai' && <Bot className="w-3 h-3 text-slate-500 mt-0.5" />}
                                <span className="leading-relaxed">{msg.content}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {step.id === 'studio' && (
                        <div className="space-y-2">
                          {step.panelContent.outputs?.map((output, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white/80 rounded-lg border border-slate-200/30">
                              <span className="text-xs text-slate-700">{output}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}