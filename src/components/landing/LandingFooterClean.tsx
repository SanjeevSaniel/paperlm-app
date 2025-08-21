'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import { Github, Twitter, Linkedin } from 'lucide-react';

const navigation = {
  main: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'About', href: '/about' },
    { name: 'Help', href: '/help' },
    { name: 'Contact', href: '/contact' },
  ],
  social: [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'GitHub', href: '#', icon: Github },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
  ],
  legal: [
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
  ],
};

export default function LandingFooterClean() {
  return (
    <footer className="bg-white border-t border-slate-200/50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand */}
          <div className="grid grid-cols-2 gap-8 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <Link href="/" className="inline-flex items-center">
                  <Logo size="sm" showText={true} animated={false} />
                </Link>
                <p className="mt-4 text-sm text-slate-600 max-w-xs">
                  Transform your documents into intelligent conversations with AI-powered research assistance.
                </p>
              </div>
              
              <div className="mt-8 md:mt-0">
                <h3 className="text-sm font-semibold text-slate-900">Product</h3>
                <nav className="mt-4 space-y-2">
                  {navigation.main.slice(0, 3).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors block"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
            
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Support</h3>
                <nav className="mt-4 space-y-2">
                  {navigation.main.slice(3).map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors block"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              
              <div className="mt-8 md:mt-0">
                <h3 className="text-sm font-semibold text-slate-900">Legal</h3>
                <nav className="mt-4 space-y-2">
                  {navigation.legal.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-sm text-slate-600 hover:text-slate-900 transition-colors block"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
          
          {/* Social */}
          <div className="mt-8 xl:mt-0">
            <h3 className="text-sm font-semibold text-slate-900">Follow us</h3>
            <div className="mt-4 flex space-x-4">
              {navigation.social.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="sr-only">{item.name}</span>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="mt-8 border-t border-slate-200/50 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} PaperLM. All rights reserved.
          </p>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-4 text-sm text-slate-500">
            <span>Made for researchers worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}