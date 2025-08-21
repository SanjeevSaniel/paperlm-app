'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ArrowRight, Sparkles, FileText, Brain, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function LandingHero() {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 });

    // Animated background
    gsap.set(backgroundRef.current, { scale: 0.8, opacity: 0 });
    tl.to(backgroundRef.current, {
      scale: 1,
      opacity: 0.1,
      duration: 2,
      ease: "power3.out"
    });

    // Title animation with typewriter effect
    tl.fromTo(titleRef.current, 
      { opacity: 0, y: 50 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1.2, 
        ease: "power3.out" 
      }, 
      0.5
    );

    // Subtitle animation
    tl.fromTo(subtitleRef.current,
      { opacity: 0, y: 30 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 1, 
        ease: "power3.out" 
      },
      1
    );

    // CTA buttons animation
    if (ctaRef.current?.children) {
      tl.fromTo(Array.from(ctaRef.current.children),
        { opacity: 0, y: 20, scale: 0.9 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 0.8, 
          stagger: 0.1,
          ease: "back.out(1.7)" 
        },
        1.5
      );
    }

    // Floating animation for icons
    const icons = document.querySelectorAll('[data-float]');
    icons.forEach((icon, index) => {
      gsap.to(icon, {
        y: -10,
        duration: 2 + index * 0.3,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: index * 0.2
      });
    });

  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50/80 via-amber-50/30 to-orange-50/20">
      {/* Animated Background */}
      <div ref={backgroundRef} className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-amber-200/40 to-orange-300/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-slate-300/40 to-amber-300/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-orange-200/40 to-amber-300/40 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <div data-float className="absolute top-20 left-20 p-4 bg-white/30 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20">
          <FileText className="w-8 h-8 text-amber-500/70" />
        </div>
        <div data-float className="absolute top-40 right-32 p-4 bg-white/30 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20">
          <Brain className="w-8 h-8 text-slate-500/70" />
        </div>
        <div data-float className="absolute bottom-40 left-32 p-4 bg-white/30 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20">
          <MessageSquare className="w-8 h-8 text-orange-500/70" />
        </div>
        <div data-float className="absolute bottom-20 right-20 p-4 bg-white/30 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20">
          <Sparkles className="w-8 h-8 text-amber-500/70" />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 text-center z-10 max-w-6xl">
        {/* Brand Badge with Small Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-3 px-5 py-3 bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-full text-sm font-medium mb-8 shadow-sm"
        >
          <Logo size="sm" showText={false} animated={true} />
          <div className="flex items-center gap-2 text-slate-700">
            <Sparkles className="w-4 h-4 text-amber-500/80" />
            <span className="font-medium">PaperLM • Powered by Advanced AI</span>
          </div>
        </motion.div>

        {/* Title */}
        <h1 ref={titleRef} className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent leading-tight mb-6">
          Transform Documents Into
          <br />
          <span className="bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-amber-700/90 bg-clip-text text-transparent">
            Intelligent Conversations
          </span>
        </h1>

        {/* Subtitle */}
        <p ref={subtitleRef} className="text-lg md:text-xl text-slate-600 leading-relaxed mb-12 max-w-3xl mx-auto">
          Upload PDFs, research papers, and notes. Our AI instantly understands your content and lets you chat with your documents like never before.
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/paper">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(251, 146, 60, 0.25)" }}
              whileTap={{ scale: 0.95 }}
              className="group px-10 py-4 bg-gradient-to-r from-orange-500/90 to-amber-600/90 hover:from-orange-600/90 hover:to-amber-700/90 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 text-lg"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-white/70 backdrop-blur-sm text-slate-700 font-medium rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-300 text-lg"
          >
            Watch Demo
          </motion.button>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.6 }}
            className="text-sm text-gray-500 text-center mb-8"
          >
            Trusted by researchers, students, and professionals worldwide
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.6 }}
              className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-amber-200/30"
            >
              <div className="text-2xl font-bold text-amber-600 mb-1">1M+</div>
              <div className="text-sm text-gray-600">Documents Processed</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4, duration: 0.6 }}
              className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-orange-200/30"
            >
              <div className="text-2xl font-bold text-orange-600 mb-1">50+</div>
              <div className="text-sm text-gray-600">File Formats</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.6, duration: 0.6 }}
              className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-amber-200/30"
            >
              <div className="text-2xl font-bold text-amber-700 mb-1">99.9%</div>
              <div className="text-sm text-gray-600">Accuracy Rate</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-bounce"></div>
        </div>
      </motion.div>
    </section>
  );
}