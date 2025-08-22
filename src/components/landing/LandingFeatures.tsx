'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import AppScreenshot from './AppScreenshot';
import { 
  FileText, 
  Brain, 
  MessageSquare, 
  Search, 
  Zap, 
  Shield,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: FileText,
    title: "Multi-Format Support",
    description: "Upload PDFs, Word documents, research papers, and more. Our AI understands your content regardless of format.",
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
    delay: 0
  },
  {
    icon: Brain,
    title: "Intelligent Analysis",
    description: "Advanced AI processes your documents to extract key insights, themes, and connections you might miss.",
    gradient: "from-purple-500 to-amber-500",
    bgGradient: "from-purple-50 to-amber-50",
    delay: 0.1
  },
  {
    icon: MessageSquare,
    title: "Natural Conversations",
    description: "Chat with your documents as if talking to an expert. Ask questions, get summaries, and explore ideas.",
    gradient: "from-orange-500 to-amber-600",
    bgGradient: "from-orange-50 to-amber-50",
    delay: 0.2
  },
  {
    icon: Search,
    title: "Semantic Search",
    description: "Find information based on meaning, not just keywords. Discover connections across your document library.",
    gradient: "from-amber-600 to-orange-600",
    bgGradient: "from-amber-50 to-orange-50",
    delay: 0.3
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Get instant responses powered by cutting-edge AI technology. No waiting, just immediate insights.",
    gradient: "from-amber-500 to-yellow-500",
    bgGradient: "from-amber-50 to-yellow-50",
    delay: 0.4
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your documents stay private with enterprise-grade security. Complete control over your data.",
    gradient: "from-purple-500 to-indigo-500",
    bgGradient: "from-purple-50 to-indigo-50",
    delay: 0.5
  }
];

const mainFeatures = [
  {
    title: "Upload & Analyze",
    description: "Drag and drop your documents or paste text directly. Our AI instantly processes and understands your content.",
    variant: "upload" as const,
    features: ["PDF Support", "Text Recognition", "Multi-language", "Instant Processing"]
  },
  {
    title: "Ask Questions",
    description: "Engage in natural conversations with your documents. Get summaries, explanations, and detailed analysis.",
    variant: "chat" as const,
    features: ["Natural Language", "Context Aware", "Follow-up Questions", "Citations"]
  },
  {
    title: "Discover Insights",
    description: "Uncover hidden patterns, connections, and insights across your document collection with AI-powered analysis.",
    variant: "notebook" as const,
    features: ["Pattern Recognition", "Key Themes", "Relationships", "Smart Summaries"]
  }
];

export default function LandingFeatures() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const mainFeaturesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.from(titleRef.current, {
        opacity: 0,
        y: 50,
        duration: 1,
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });

      // Feature cards animation
      gsap.from('[data-feature-card]', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.1,
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });

      // Main features animation
      gsap.from('[data-main-feature]', {
        opacity: 0,
        x: -50,
        duration: 1,
        stagger: 0.2,
        scrollTrigger: {
          trigger: mainFeaturesRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-50/30 to-white"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-100/30 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-100/30 to-transparent rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Powerful Features</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
            Everything you need to
            <br />
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              unlock your documents
            </span>
          </h2>

          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            PaperLM combines cutting-edge AI with intuitive design to transform how you interact with your documents and research.
          </p>
        </div>

        {/* Feature Grid */}
        <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                data-feature-card
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)" 
                }}
                transition={{ duration: 0.3 }}
                className={`p-8 rounded-3xl bg-gradient-to-br ${feature.bgGradient} border border-white/50 backdrop-blur-sm hover:border-gray-200 transition-all duration-300 group`}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                <div className="mt-4 flex items-center text-sm font-medium text-amber-600 group-hover:text-amber-700 transition-colors">
                  <span>Learn more</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Main Features */}
        <div ref={mainFeaturesRef} className="space-y-16">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              data-main-feature
              className={`flex flex-col lg:flex-row items-center gap-12 ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Content */}
              <div className="flex-1 lg:max-w-xl">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  {feature.description}
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {feature.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{feat}</span>
                    </div>
                  ))}
                </div>

                <Link href="/paper">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
                  >
                    <span>Try Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
              </div>

              {/* Visual */}
              <div className="flex-1 lg:max-w-lg">
                <div className="relative">
                  <AppScreenshot variant={feature.variant} animated={true} />
                  
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}