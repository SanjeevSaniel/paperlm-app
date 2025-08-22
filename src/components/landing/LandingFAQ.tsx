'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Plus,
  Minus,
  HelpCircle,
  Shield,
  FileText,
  Zap,
  Users
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    category: 'Getting Started',
    icon: Zap,
    questions: [
      {
        question: 'How do I get started with PaperLM?',
        answer: 'Simply sign up for a free account, upload your first document (PDF, Word, or text), and start asking questions. Our AI will instantly process your content and be ready to chat within seconds.'
      },
      {
        question: 'What file formats are supported?',
        answer: 'PaperLM supports PDF, Word documents (.docx), PowerPoint presentations (.pptx), text files (.txt), CSV files, and many other common formats. We also have OCR capabilities for scanned documents.'
      },
      {
        question: 'Is there a limit to document size?',
        answer: 'Free accounts can upload documents up to 25MB each, with a total storage limit of 100MB. Premium plans offer larger file limits and unlimited storage.'
      }
    ]
  },
  {
    category: 'Features & Functionality',
    icon: FileText,
    questions: [
      {
        question: 'How accurate are the AI responses?',
        answer: 'Our AI maintains a 99.2% accuracy rate in citation matching and information retrieval. All responses include source citations so you can verify the information directly from your documents.'
      },
      {
        question: 'Can I upload multiple documents at once?',
        answer: 'Yes! You can upload multiple documents and our AI will understand relationships between them. Ask questions that span across your entire document collection for comprehensive insights.'
      },
      {
        question: 'Does PaperLM work with non-English documents?',
        answer: 'Yes, PaperLM supports over 50 languages including Spanish, French, German, Chinese, Japanese, and many others. You can even ask questions in one language about documents in another.'
      }
    ]
  },
  {
    category: 'Privacy & Security',
    icon: Shield,
    questions: [
      {
        question: 'Is my data secure and private?',
        answer: 'Absolutely. Your documents are encrypted in transit and at rest. We use enterprise-grade security measures and never use your content to train AI models. You maintain full ownership and control of your data.'
      },
      {
        question: 'Can other users see my documents?',
        answer: 'No, your documents are completely private. Each user account is isolated, and only you can access your uploaded content and conversation history.'
      },
      {
        question: 'How long do you store my documents?',
        answer: 'Documents are stored securely in your account until you choose to delete them. You can export or delete your data at any time. We also offer automatic deletion options for sensitive documents.'
      }
    ]
  },
  {
    category: 'Pricing & Plans',
    icon: Users,
    questions: [
      {
        question: 'Is there a free plan available?',
        answer: 'Yes! Our free plan includes 25 AI queries per month, 100MB storage, and support for all major file formats. Perfect for trying out PaperLM or light usage.'
      },
      {
        question: 'What&apos;s included in the premium plans?',
        answer: 'Premium plans offer unlimited queries, unlimited storage, priority processing, advanced analytics, team collaboration features, and priority customer support.'
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. Your account will remain active until the end of your current billing period, and you can always reactivate later.'
      }
    ]
  }
];

export default function LandingFAQ() {
  const sectionRef = useRef<HTMLElement>(null);
  const [openItems, setOpenItems] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-faq-category]', {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.2,
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

  const toggleItem = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-32 left-16 w-64 h-64 bg-gradient-to-br from-slate-100/30 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 right-16 w-64 h-64 bg-gradient-to-bl from-amber-100/20 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 max-w-4xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100/60 border border-slate-200/40 text-slate-700 rounded-full text-sm font-medium mb-6"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Frequently Asked Questions</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Got Questions?
            <br />
            <span className="bg-gradient-to-r from-amber-600/80 to-orange-600/80 bg-clip-text text-transparent">
              We&apos;ve Got Answers
            </span>
          </h2>

          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about PaperLM. Can&apos;t find what you&apos;re looking for? 
            <span className="text-amber-600 hover:text-amber-700 cursor-pointer"> Contact our support team</span>.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => {
            const IconComponent = category.icon;
            
            return (
              <motion.div
                key={category.category}
                data-faq-category
                className="bg-slate-50/50 rounded-2xl border border-slate-200/30 overflow-hidden"
              >
                {/* Category Header */}
                <div className="p-6 border-b border-slate-200/30 bg-white/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{category.category}</h3>
                  </div>
                </div>

                {/* Questions */}
                <div className="divide-y divide-slate-200/30">
                  {category.questions.map((faq, questionIndex) => {
                    const key = `${categoryIndex}-${questionIndex}`;
                    const isOpen = openItems[key];

                    return (
                      <div key={questionIndex}>
                        <button
                          onClick={() => toggleItem(categoryIndex, questionIndex)}
                          className="w-full p-6 text-left hover:bg-white/60 transition-colors duration-200 group"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-slate-900 font-medium pr-4 group-hover:text-amber-700 transition-colors">
                              {faq.question}
                            </h4>
                            <div className="flex-shrink-0">
                              {isOpen ? (
                                <Minus className="w-5 h-5 text-slate-500 group-hover:text-amber-600 transition-colors" />
                              ) : (
                                <Plus className="w-5 h-5 text-slate-500 group-hover:text-amber-600 transition-colors" />
                              )}
                            </div>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6">
                                <div className="pt-2 border-t border-slate-200/30 mt-2">
                                  <p className="text-slate-600 leading-relaxed">
                                    {faq.answer}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
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
          <div className="p-8 bg-slate-50/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl">
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Still have questions?</h3>
            <p className="text-slate-600 mb-6">Our support team is here to help you get the most out of PaperLM.</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500/90 to-amber-600/90 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                Contact Support
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200"
              >
                View Documentation
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}