'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AppScreenshot from './AppScreenshot';
import { 
  Play, 
  Pause, 
  Upload,
  MessageSquare, 
  Sparkles,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const demoSteps = [
  {
    step: 1,
    title: "Upload Your Document",
    description: "Drag and drop any PDF, Word document, or research paper",
    icon: Upload,
    action: "Document uploaded successfully! ✨"
  },
  {
    step: 2,
    title: "AI Processing",
    description: "Our advanced AI analyzes and understands your content",
    icon: Sparkles,
    action: "Processing complete! Ready for questions 🧠"
  },
  {
    step: 3,
    title: "Start Chatting",
    description: "Ask questions and get intelligent responses from your document",
    icon: MessageSquare,
    action: "What would you like to know? 💬"
  }
];

export default function LandingDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

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

      // Steps animation
      gsap.from('[data-step]', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: stepsRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-play demo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % demoSteps.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const startDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
  };

  const stopDemo = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Interactive Demo</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            See PaperLM in
            <br />
            <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Action
            </span>
          </h2>

          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
            Watch how easy it is to transform your documents into intelligent, interactive conversations.
          </p>

          <motion.button
            onClick={isPlaying ? stopDemo : startDemo}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mx-auto"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{isPlaying ? 'Stop Demo' : 'Start Demo'}</span>
          </motion.button>
        </div>

        {/* Demo Steps */}
        <div ref={stepsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {demoSteps.map((step, index) => {
            const IconComponent = step.icon;
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;
            
            return (
              <motion.div
                key={step.step}
                data-step
                className={`relative p-6 rounded-2xl border transition-all duration-500 ${
                  isActive 
                    ? 'border-amber-500 bg-amber-50 shadow-lg scale-105' 
                    : isCompleted
                    ? 'border-green-200 bg-green-50 shadow-sm'
                    : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
                }`}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step Number */}
                <div className={`absolute -top-4 left-8 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-amber-500 text-white' 
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {isCompleted ? '✓' : step.step}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                  isActive 
                    ? 'bg-amber-500 text-white scale-110' 
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Action Feedback */}
                {isActive && isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 p-3 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium"
                  >
                    {step.action}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Demo Interface */}
        <div className="max-w-4xl mx-auto">
          <AppScreenshot variant="chat" animated={isPlaying} />
        </div>
      </div>
    </section>
  );
}