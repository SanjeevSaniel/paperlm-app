'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Star,
  Quote,
  Building2,
  GraduationCap,
  UserCheck
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Research Director",
    company: "Stanford AI Lab",
    avatar: "SC",
    content: "PaperLM has transformed how our team conducts literature reviews. What used to take weeks now takes days, and we catch insights we would have missed.",
    rating: 5,
    icon: GraduationCap,
    category: "Academic Research"
  },
  {
    name: "Michael Rodriguez",
    role: "Senior Analyst",
    company: "McKinsey & Company",
    avatar: "MR",
    content: "The ability to chat with hundreds of market reports simultaneously has revolutionized our competitive intelligence process. Game-changing tool.",
    rating: 5,
    icon: Building2,
    category: "Business Intelligence"
  },
  {
    name: "Jennifer Walsh",
    role: "Partner",
    company: "Wilson & Associates Law",
    avatar: "JW",
    content: "Contract analysis that used to require hours of manual review now happens in minutes. PaperLM finds clauses and risks I might have overlooked.",
    rating: 5,
    icon: UserCheck,
    category: "Legal Research"
  },
  {
    name: "Dr. Ahmed Hassan",
    role: "Principal Investigator",
    company: "MIT Computer Science",
    avatar: "AH",
    content: "I can now keep up with the exponential growth of AI research papers. PaperLM helps me identify key trends and methodologies across thousands of papers.",
    rating: 5,
    icon: GraduationCap,
    category: "Academic Research"
  },
  {
    name: "Lisa Thompson",
    role: "Strategy Consultant",
    company: "Bain & Company",
    avatar: "LT",
    content: "Our clients love the depth of insights we can provide now. PaperLM helps us synthesize complex industry reports into clear, actionable recommendations.",
    rating: 5,
    icon: Building2,
    category: "Business Intelligence"
  },
  {
    name: "Robert Kim",
    role: "IP Attorney",
    company: "Kirkland & Ellis",
    avatar: "RK",
    content: "Patent research has never been more efficient. I can quickly identify prior art and understand patent landscapes across entire technology domains.",
    rating: 5,
    icon: UserCheck,
    category: "Legal Research"
  }
];

const stats = [
  { value: "50K+", label: "Documents Analyzed Daily", sublabel: "Across all users" },
  { value: "95%", label: "Time Saved", sublabel: "On research tasks" },
  { value: "4.9/5", label: "User Rating", sublabel: "From 2,000+ reviews" },
  { value: "99.2%", label: "Accuracy Rate", sublabel: "In citation matching" }
];

export default function LandingTestimonials() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stats animation
      gsap.from('[data-stat]', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.1,
        scrollTrigger: {
          trigger: '[data-stats-section]',
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse"
        }
      });

      // Testimonials animation
      gsap.from('[data-testimonial]', {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.15,
        scrollTrigger: {
          trigger: '[data-testimonials-grid]',
          start: "top 70%",
          end: "bottom 30%",
          toggleActions: "play none none reverse"
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-slate-50/50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-to-bl from-amber-100/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-to-tr from-orange-100/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Stats Section */}
        <div data-stats-section className="mb-20">
          <div className="text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
            >
              Trusted by Professionals Worldwide
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-slate-600 max-w-2xl mx-auto"
            >
              Join thousands of researchers, analysts, and professionals who rely on PaperLM for their most important work.
            </motion.p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                data-stat
                className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/30"
              >
                <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-slate-700 mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-slate-500">
                  {stat.sublabel}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonials Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 border border-slate-200/40 text-slate-700 rounded-full text-sm font-medium mb-6"
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>What People Say</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Loved by Teams
            <br />
            <span className="bg-gradient-to-r from-amber-600/80 to-orange-600/80 bg-clip-text text-transparent">
              Around the World
            </span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div data-testimonials-grid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => {
            const IconComponent = testimonial.icon;
            
            return (
              <motion.div
                key={`${testimonial.name}-${index}`}
                data-testimonial
                className="group p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/30 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center font-semibold text-slate-700 text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <IconComponent className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {/* Company */}
                <div className="text-xs font-medium text-slate-600 mb-4 flex items-center gap-2">
                  <Building2 className="w-3 h-3" />
                  {testimonial.company}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <div className="relative mb-4">
                  <Quote className="w-6 h-6 text-slate-300 mb-2" />
                  <p className="text-slate-700 leading-relaxed text-sm">
                    {testimonial.content}
                  </p>
                </div>

                {/* Category */}
                <div className="inline-flex items-center px-3 py-1 bg-slate-100/60 text-slate-600 rounded-full text-xs font-medium">
                  {testimonial.category}
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
          <div className="inline-flex flex-col items-center gap-4 p-8 bg-white/60 backdrop-blur-sm border border-slate-200/50 rounded-3xl max-w-md mx-auto">
            <div className="text-center">
              <h3 className="font-semibold text-slate-900 text-lg mb-2">Join the Community</h3>
              <p className="text-sm text-slate-600 mb-4">Experience the difference that intelligent document analysis can make</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-500/90 to-amber-600/90 text-white font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              Start Your Free Trial
            </motion.button>
            <p className="text-xs text-slate-500">No credit card required • 14-day free trial</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}