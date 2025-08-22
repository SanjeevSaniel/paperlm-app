'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
// import Logo from '@/components/Logo';
import { 
  ArrowRight, 
  Github, 
  Twitter, 
  Linkedin, 
  Mail,
  Sparkles,
  FileText,
  Brain,
  MessageSquare,
  Zap
} from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Documentation', href: '/docs' },
    { name: 'API', href: '/api' },
    { name: 'Integrations', href: '/integrations' }
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Careers', href: '/careers' },
    { name: 'Contact', href: '/contact' },
    { name: 'Press Kit', href: '/press' }
  ],
  resources: [
    { name: 'Help Center', href: '/help' },
    { name: 'Community', href: '/community' },
    { name: 'Tutorials', href: '/tutorials' },
    { name: 'Examples', href: '/examples' },
    { name: 'Status', href: '/status' }
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Security', href: '/security' },
    { name: 'GDPR', href: '/gdpr' }
  ]
};

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: '#', color: 'text-amber-400' },
  { name: 'Github', icon: Github, href: '#', color: 'text-gray-600' },
  { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'text-amber-600' },
  { name: 'Email', icon: Mail, href: 'mailto:hello@paperlm.com', color: 'text-red-500' }
];

const stats = [
  { icon: FileText, value: '1M+', label: 'Documents Processed', color: 'text-amber-500' },
  { icon: Brain, value: '500K+', label: 'AI Interactions', color: 'text-purple-500' },
  { icon: MessageSquare, value: '100K+', label: 'Happy Users', color: 'text-green-500' },
  { icon: Zap, value: '99.9%', label: 'Uptime', color: 'text-yellow-500' }
];

export default function LandingFooter() {
  return (
    <footer className="relative overflow-hidden">
      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 relative">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Ready to get started?</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Transform your documents
              <br />
              into intelligent conversations
            </h2>

            <p className="text-xl text-white/90 leading-relaxed max-w-3xl mx-auto mb-12">
              Join thousands of researchers, students, and professionals who are already using PaperLM to unlock the power of their documents.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/paper">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(255,255,255,0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group px-8 py-4 bg-white text-gray-900 font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <span>Start Free Today</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl border-2 border-white/20 hover:border-white/40 transition-all duration-300"
              >
                Schedule Demo
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className={`w-12 h-12 ${stat.color} mx-auto mb-3`}>
                    <IconComponent className="w-12 h-12" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4">
                <motion.div
                  className="w-10 h-10 relative cursor-pointer"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative w-full h-full bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200/60">
                    <div className="relative w-full h-full p-1.5 flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-1">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
                          <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
                          <div className="w-0.5 h-0.5 bg-gray-300 rounded-full"></div>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <div className="w-full h-0.5 bg-gray-200 rounded-full"></div>
                        <div className="w-4/5 h-0.5 bg-gray-300 rounded-full"></div>
                        <div className="w-full h-0.5 bg-blue-500 rounded-full"></div>
                        <div className="w-3/5 h-0.5 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="mt-1 flex justify-end">
                        <div className="w-2 h-0.5 bg-orange-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/20 rounded-lg pointer-events-none"></div>
                  </div>
                </motion.div>
                <div className="flex items-center">
                  <div className="flex items-baseline">
                    <span className="font-semibold tracking-tight text-white text-xl">
                      Paper
                    </span>
                    <span className="font-semibold tracking-tight text-orange-500 text-xl ml-0.5">
                      LM
                    </span>
                  </div>
                  <div className="w-1 h-1 bg-orange-400 rounded-full ml-1 mt-1 opacity-60"></div>
                </div>
              </Link>
              
              <p className="text-gray-400 leading-relaxed mb-6 max-w-sm">
                The AI-powered research assistant that transforms how you interact with documents. Upload, analyze, and chat with your content like never before.
              </p>

              <div className="flex items-center gap-4">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className={`w-10 h-10 ${social.color} bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Links Columns */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="font-semibold text-white mb-4">Product</h3>
                  <ul className="space-y-2">
                    {footerLinks.product.map((link) => (
                      <li key={link.name}>
                        <Link 
                          href={link.href}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-4">Company</h3>
                  <ul className="space-y-2">
                    {footerLinks.company.map((link) => (
                      <li key={link.name}>
                        <Link 
                          href={link.href}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-4">Resources</h3>
                  <ul className="space-y-2">
                    {footerLinks.resources.map((link) => (
                      <li key={link.name}>
                        <Link 
                          href={link.href}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-4">Legal</h3>
                  <ul className="space-y-2">
                    {footerLinks.legal.map((link) => (
                      <li key={link.name}>
                        <Link 
                          href={link.href}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © 2024 PaperLM. All rights reserved. Made with ❤️ for researchers worldwide.
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>🚀 Powered by AI</span>
              <span>🔒 SOC2 Compliant</span>
              <span>⚡ 99.9% Uptime</span>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}