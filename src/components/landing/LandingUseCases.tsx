'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  GraduationCap,
  Building2,
  UserCheck,
  BookOpen,
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const useCases = [
  {
    title: 'Academic Research',
    description: 'Researchers and graduate students use PaperLM to analyze literature, extract key findings, and generate comprehensive literature reviews.',
    icon: GraduationCap,
    color: 'from-blue-500/10 to-indigo-500/10',
    borderColor: 'border-blue-200/30',
    iconColor: 'text-blue-600',
    stats: '15K+ researchers',
    features: [
      'Literature review automation',
      'Citation management',
      'Cross-paper analysis',
      'Research synthesis'
    ],
    example: 'Upload 50+ research papers and ask: "What are the main methodological approaches in machine learning research from 2020-2024?"'
  },
  {
    title: 'Business Intelligence',
    description: 'Executives and analysts transform reports, market research, and strategic documents into actionable insights for decision-making.',
    icon: Building2,
    color: 'from-emerald-500/10 to-green-500/10',
    borderColor: 'border-emerald-200/30',
    iconColor: 'text-emerald-600',
    stats: '500+ companies',
    features: [
      'Market analysis',
      'Competitive intelligence',
      'Strategic planning',
      'Report generation'
    ],
    example: 'Analyze quarterly reports and ask: "What are the emerging market trends and their potential impact on our strategy?"'
  },
  {
    title: 'Legal Research',
    description: 'Legal professionals streamline case research, contract analysis, and regulatory compliance by chatting with legal documents.',
    icon: UserCheck,
    color: 'from-amber-500/10 to-yellow-500/10',
    borderColor: 'border-amber-200/30',
    iconColor: 'text-amber-600',
    stats: '200+ law firms',
    features: [
      'Case law analysis',
      'Contract review',
      'Regulatory research',
      'Precedent finding'
    ],
    example: 'Upload contracts and ask: "Identify potential risks and non-standard clauses across these agreements."'
  },
  {
    title: 'Content Creation',
    description: 'Writers, journalists, and content creators research topics efficiently by conversing with source materials and references.',
    icon: BookOpen,
    color: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-200/30',
    iconColor: 'text-purple-600',
    stats: '5K+ creators',
    features: [
      'Source verification',
      'Fact checking',
      'Content research',
      'Story development'
    ],
    example: 'Research climate data and ask: "What are the most credible statistics on renewable energy adoption rates?"'
  }
];

export default function LandingUseCases() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-usecase-card]', {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.15,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          end: "bottom 30%",
          toggleActions: "play none none reverse"
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-slate-100/40 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 right-10 w-64 h-64 bg-gradient-to-bl from-amber-100/30 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100/60 border border-slate-200/40 text-slate-700 rounded-full text-sm font-medium mb-6"
          >
            <Users className="w-4 h-4" />
            <span>Trusted Across Industries</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Built for Every
            <br />
            <span className="bg-gradient-to-r from-amber-600/80 to-orange-600/80 bg-clip-text text-transparent">
              Research Workflow
            </span>
          </h2>

          <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
            From academic research to business intelligence, see how professionals across industries use PaperLM to unlock insights from their documents.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((useCase) => {
            const IconComponent = useCase.icon;
            
            return (
              <motion.div
                key={useCase.title}
                data-usecase-card
                className={`group p-8 rounded-3xl bg-gradient-to-br ${useCase.color} border ${useCase.borderColor} hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center ${useCase.iconColor}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-1">
                        {useCase.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <TrendingUp className="w-4 h-4" />
                        <span>{useCase.stats}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-700 leading-relaxed mb-6">
                  {useCase.description}
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {useCase.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Example */}
                <div className="p-4 bg-white/60 rounded-xl border border-white/50">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="text-xs font-medium text-slate-700 mb-1">Example Query:</div>
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        &ldquo;{useCase.example}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-slate-500">Learn more</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-slate-50/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl">
            <div className="text-left">
              <h3 className="font-semibold text-slate-900 mb-1">Ready to transform your workflow?</h3>
              <p className="text-sm text-slate-600">Join thousands of professionals who trust PaperLM</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-orange-500/90 to-amber-600/90 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}