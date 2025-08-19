'use client';

import { DocumentProvider } from '@/contexts/DocumentContext';
import { UsageProvider, useUsage } from '@/contexts/UsageContext';
import { PanelType } from '@/types';
import { useUser, UserButton } from '@clerk/nextjs';
import { updateUserAuth } from '@/lib/sessionStorage';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  NotebookPen,
  Plus,
  Zap,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import Logo from './Logo';
import AIChatPanel from './panels/AIChatPanel';
import DocumentSourcesPanel from './panels/DocumentSourcesPanel';
import SmartNotebookPanel from './panels/SmartNotebookPanel';
import { Card, CardContent, CardHeader } from './ui';
import { GuidedTourProvider, TourButton } from './GuidedTour';

// Props typing for the three panels
type ChatPanelComponent = React.ComponentType<{ isCollapsed?: boolean }>;
type SourcesPanelComponent = typeof DocumentSourcesPanel;
type NotebookPanelComponent = typeof SmartNotebookPanel;

type BasePanelDef<I extends string, C> = {
  id: I;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  component: C;
  position: 'left' | 'center' | 'right';
};

type SourcesPanelDef = BasePanelDef<'sources', SourcesPanelComponent>;
type NotebookPanelDef = BasePanelDef<'notebook', NotebookPanelComponent>;
type ChatPanelDef = BasePanelDef<'chat', ChatPanelComponent>;

type PanelDef = SourcesPanelDef | NotebookPanelDef | ChatPanelDef;

function AppLayoutContent() {
  const { user } = useUser();
  const { usageCount, maxFreeUsage } = useUsage();
  const [activeCards] = useState<PanelType[]>(['sources', 'notebook', 'chat']);
  const [collapsedPanels, setCollapsedPanels] = useState<Set<PanelType>>(
    new Set(),
  );
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Sync user authentication with session storage
  useEffect(() => {
    if (user?.id && user?.primaryEmailAddress?.emailAddress) {
      updateUserAuth(user.id, user.primaryEmailAddress.emailAddress);
    }
  }, [user]);

  const panels: PanelDef[] = [
    {
      id: 'sources',
      label: 'Sources',
      icon: FileText,
      description: 'Upload and manage your documents',
      component: DocumentSourcesPanel,
      position: 'left',
    },
    {
      id: 'notebook',
      label: 'Notebook',
      icon: NotebookPen,
      description: 'Take notes and organize insights',
      component: SmartNotebookPanel,
      position: 'center',
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      description: 'Ask questions about your documents',
      component: AIChatPanel as ChatPanelComponent,
      position: 'right',
    },
  ];

  const togglePanelCollapse = (panelId: PanelType) => {
    setCollapsedPanels((prev) => {
      const next = new Set(prev);
      if (next.has(panelId)) next.delete(panelId);
      else next.add(panelId);
      return next;
    });
  };

  // Equal widths for Notebook (center) and Chat (right) when both expanded
  // - Sources expanded: 280px | 1fr | 1fr
  // - Sources collapsed: 48px  | 1fr | 1fr
  // - Chat collapsed:    280px | 1fr | 48px
  // - Both collapsed:    48px  | 1fr | 48px
  const getGridLayoutClasses = () => {
    const sourcesCollapsed = collapsedPanels.has('sources');
    const chatCollapsed = collapsedPanels.has('chat');

    if (sourcesCollapsed && chatCollapsed) return 'grid-cols-[48px_1fr_48px]';
    if (sourcesCollapsed) return 'grid-cols-[48px_1fr_1fr]';
    if (chatCollapsed) return 'grid-cols-[280px_minmax(0,1fr)_48px]';
    return 'grid-cols-[280px_minmax(0,1fr)_1fr]';
  };

  // Page loading component
  if (isPageLoading) {
    return (
      <motion.div 
        className='h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex items-center justify-center'
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}>
        <motion.div 
          className='text-center'
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}>
            <Logo size='lg' showText={true} animated={true} />
          </motion.div>
          <motion.div
            className='mt-6 flex items-center justify-center gap-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}>
            <motion.div 
              className='w-2 h-2 bg-purple-400 rounded-full'
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }} 
            />
            <motion.div 
              className='w-2 h-2 bg-amber-400 rounded-full'
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} 
            />
            <motion.div 
              className='w-2 h-2 bg-orange-400 rounded-full'
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} 
            />
          </motion.div>
          <motion.p 
            className='mt-4 text-sm text-gray-600 font-light'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}>
Bringing your documents to life with AI...
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className='h-screen max-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex flex-col overflow-hidden'
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
        {/* Header */}
        <header className='px-4 md:px-6 py-1.5'>
          <div className='max-w-screen-2xl mx-auto flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <Logo
                size='sm'
                showText={true}
                animated={true}
              />
              <div className='hidden sm:block w-px h-6 bg-slate-300/60'></div>
              <p
                className='hidden sm:block text-sm text-slate-500 font-light tracking-wide'
              style={{ fontWeight: 300 }}>
              Transform documents into intelligent conversations
              </p>
            </div>

            <div className='flex items-center gap-4'>
              {/* Tour Button */}
              <TourButton />
              
              {/* Usage Status */}
              <div className='flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-full' data-tour="usage-indicator">
                <Zap className={`w-4 h-4 ${usageCount >= maxFreeUsage ? 'text-red-500' : 'text-amber-500'}`} />
                <span className='text-sm font-medium text-gray-700'>
                  {usageCount}/{maxFreeUsage}
                </span>
                {usageCount >= maxFreeUsage && (
                  <span className='text-xs text-red-600 font-medium ml-1'>
                    Limit reached
                  </span>
                )}
              </div>

              {/* User Authentication */}
              {user ? (
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                      userButtonTrigger: "focus:shadow-none"
                    }
                  }}
                />
              ) : (
                <div className='flex items-center gap-2'>
                  <Link
                    href='/sign-in'
                    className='px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors'>
                    Sign In
                  </Link>
                  <Link
                    href='/sign-up'
                    className='px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors'>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className='flex-1 p-3 md:p-4 overflow-hidden min-h-0'>
          <div className='max-w-screen-2xl mx-auto h-full min-h-0'>
            <div
              className={`h-full min-h-0 grid gap-4 transition-all duration-700 ease-in-out ${getGridLayoutClasses()}`}>
              <AnimatePresence mode='popLayout'>
                {activeCards.map((cardId, index) => {
                  const panel = panels.find((p) => p.id === cardId)!;
                  const Icon = panel.icon;
                  const isCollapsed = collapsedPanels.has(cardId);
                  const canCollapse = cardId === 'sources' || cardId === 'chat';

                  if (isCollapsed && canCollapse) {
                    const isSourcesPanel = cardId === 'sources';
                    const expandIcon = isSourcesPanel
                      ? ChevronRight
                      : ChevronLeft;

                    return (
                      <motion.div
                        key={cardId}
                        className='relative h-full min-h-0'
                        initial={{ opacity: 0, scale: 0.95, x: cardId === 'sources' ? -20 : cardId === 'chat' ? 20 : 0 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: cardId === 'sources' ? -20 : cardId === 'chat' ? 20 : 0 }}
                        transition={{
                          duration: 0.6,
                          delay: index * 0.1,
                          ease: [0.25, 0.1, 0.25, 1],
                        }}>
                        <div className='relative bg-white/90 backdrop-blur-sm shadow-lg border border-amber-200/50 rounded-2xl flex flex-col h-full w-12 overflow-hidden'>
                          {/* Collapsed header */}
                          <div className='px-2 py-3 border-b border-amber-100/80 bg-amber-50/30'>
                            <div className='flex flex-col items-center space-y-2'>
                              <motion.button
                                onClick={() => togglePanelCollapse(cardId)}
                                className='group relative w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden'
                                title={`Expand ${panel.label}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                <div className='absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                                <motion.div
                                  className='relative flex items-center justify-center w-full h-full'
                                  whileHover={{ scale: 1.1 }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 25,
                                  }}>
                                  {React.createElement(expandIcon, {
                                    className:
                                      'w-4 h-4 text-slate-500 group-hover:text-amber-600 transition-colors duration-200',
                                  })}
                                </motion.div>
                                <div className='absolute inset-0.5 rounded-lg bg-gradient-to-br from-white/40 to-transparent pointer-events-none' />
                              </motion.button>

                              <div className='w-4 h-4 bg-gradient-to-br from-amber-100/60 to-orange-100/40 rounded-md flex items-center justify-center border border-amber-200/40'>
                                <Icon className='w-2.5 h-2.5 text-slate-500' />
                              </div>
                            </div>
                          </div>

                          {/* Vertical actions */}
                          <div className='flex-1 flex flex-col items-center py-6 space-y-6 overflow-hidden'>
                            {cardId === 'sources' && (
                              <motion.button
                                onClick={() => togglePanelCollapse(cardId)}
                                className='group relative w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/70 border border-blue-200/60 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden'
                                title='Expand to Add Content'
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.9 }}>
                                <motion.div
                                  className='absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                />
                                <div className='absolute inset-0.5 rounded-xl bg-gradient-to-br from-white/90 to-blue-50/50' />
                                <motion.div
                                  className='relative flex items-center justify-center w-full h-full'
                                  whileHover={{ rotate: 90 }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 15,
                                  }}>
                                  <Plus className='w-5 h-5 text-blue-700 group-hover:text-blue-800 transition-colors duration-200' />
                                </motion.div>
                                <motion.div
                                  className='absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-200/40 to-blue-300/40 opacity-0 group-hover:opacity-100 blur-sm'
                                  animate={{ scale: [0.9, 1.1, 0.9] }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                />
                              </motion.button>
                            )}

                            {cardId === 'chat' && (
                              <motion.button
                                onClick={() => togglePanelCollapse(cardId)}
                                className='group relative w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200/60 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden'
                                title='Expand to Chat'
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.9 }}>
                                <motion.div
                                  className='absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                />
                                <div className='absolute inset-0.5 rounded-xl bg-gradient-to-br from-white/90 to-emerald-50/50' />
                                <motion.div
                                  className='relative flex items-center justify-center w-full h-full'
                                  whileHover={{ scale: [1, 1.2, 1] }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 10,
                                  }}>
                                  <MessageSquare className='w-5 h-5 text-emerald-700 group-hover:text-emerald-800 transition-colors duration-200' />
                                </motion.div>
                                <motion.div
                                  className='absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-200/40 to-emerald-300/40 opacity-0 group-hover:opacity-100 blur-sm'
                                  animate={{ scale: [0.9, 1.1, 0.9] }}
                                  transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                  }}
                                />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={cardId}
                      className='relative h-full min-h-0 min-w-0'
                      initial={{ opacity: 0, scale: 0.95, x: cardId === 'sources' ? -20 : cardId === 'chat' ? 20 : 0 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, x: cardId === 'sources' ? -20 : cardId === 'chat' ? 20 : 0 }}
                      transition={{
                        duration: 0.6,
                        delay: index * 0.1,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}>
                      <Card 
                        className='h-full min-h-0 flex flex-col overflow-hidden min-w-0'
                        data-tour={
                          cardId === 'sources' ? 'sources-panel' :
                          cardId === 'notebook' ? 'notebook-panel' :
                          cardId === 'chat' ? 'chat-panel' : undefined
                        }>
                        <CardHeader>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                              <panel.icon className='w-4 h-4 text-slate-600' />
                              <span className='font-semibold'>
                                {panel.label}
                              </span>
                            </div>
                            {canCollapse && (
                              <motion.button
                                onClick={() => togglePanelCollapse(cardId)}
                                className='group relative w-8 h-8 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden'
                                title={`Collapse ${panel.label}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                <div className='absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                                <motion.div
                                  className='relative flex items-center justify-center w-full h-full'
                                  whileHover={{ scale: 1.1 }}
                                  transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 25,
                                  }}>
                                  {cardId === 'sources' ? (
                                    <ChevronLeft className='w-3.5 h-3.5 text-slate-500 group-hover:text-amber-600 transition-colors duration-200' />
                                  ) : (
                                    <ChevronRight className='w-3.5 h-3.5 text-slate-500 group-hover:text-amber-600 transition-colors duration-200' />
                                  )}
                                </motion.div>
                                <div className='absolute inset-0.5 rounded-md bg-gradient-to-br from-white/40 to-transparent pointer-events-none' />
                              </motion.button>
                            )}
                          </div>
                          <div className='text-sm text-slate-500 font-light'>
                            {panel.description}
                          </div>
                        </CardHeader>
                        <CardContent className='h-full min-h-0 p-0 min-w-0'>
                          {panel.id === 'chat' ? (
                            <panel.component
                              isCollapsed={collapsedPanels.has('chat')}
                            />
                          ) : (
                            <panel.component />
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </main>

        <Toaster
          position='top-right'
          toastOptions={{
            duration: 5000,
            style: {
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow:
                '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#ffffff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
            },
          }}
        />
      </motion.div>
  );
}

export default function AppLayout() {
  return (
    <GuidedTourProvider>
      <UsageProvider>
        <DocumentProvider>
          <AppLayoutContent />
        </DocumentProvider>
      </UsageProvider>
    </GuidedTourProvider>
  );
}
