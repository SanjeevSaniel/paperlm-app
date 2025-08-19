'use client';

import { DocumentProvider } from '@/contexts/DocumentContext';
import { FreemiumProvider } from '@/contexts/FreemiumContext';
import { PanelType } from '@/types';
import { useClerk, useUser } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LogOut,
  MessageSquare,
  NotebookPen,
  Plus,
  User,
} from 'lucide-react';
import React, { useState } from 'react';
import Logo from './Logo';
import AIChatPanel from './panels/AIChatPanel';
import DocumentSourcesPanel from './panels/DocumentSourcesPanel';
import SmartNotebookPanel from './panels/SmartNotebookPanel';
import { Button, Card, CardContent, CardHeader } from './ui';
import UpgradeModal from './UpgradeModal';
import UsageIndicator from './UsageIndicator';

const SIGNUP_CTA_CLASS =
  'bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md hover:shadow-lg focus:ring-0 focus:ring-offset-0 transition-all duration-300';

export default function AppLayout() {
  const [activeCards] = useState<PanelType[]>(['sources', 'notebook', 'chat']);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalData, setUpgradeModalData] = useState({
    currentUsage: { uploads: 0, queries: 0, total: 0 },
    limits: { uploads: 3, queries: 5, total: 5 },
    trigger: 'upload' as 'upload' | 'query',
  });
  const [collapsedPanels, setCollapsedPanels] = useState<Set<PanelType>>(
    new Set(),
  );

  const panels = [
    {
      id: 'sources' as PanelType,
      label: 'Sources',
      icon: FileText,
      description: 'Upload and manage your documents',
      component: DocumentSourcesPanel,
      position: 'left',
    },
    {
      id: 'notebook' as PanelType,
      label: 'Notebook',
      icon: NotebookPen,
      description: 'Take notes and organize insights',
      component: SmartNotebookPanel,
      position: 'center',
    },
    {
      id: 'chat' as PanelType,
      label: 'Chat',
      icon: MessageSquare,
      description: 'Ask questions about your documents',
      component: AIChatPanel,
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

  const getGridLayoutClasses = () => {
    const sourcesCollapsed = collapsedPanels.has('sources');
    const chatCollapsed = collapsedPanels.has('chat');

    if (sourcesCollapsed && chatCollapsed) return 'grid-cols-[48px_1fr_48px]';
    if (sourcesCollapsed) return 'grid-cols-[48px_1fr_420px]';
    if (chatCollapsed) return 'grid-cols-[320px_1fr_48px]';
    return 'grid-cols-[280px_1fr_380px]';
  };

  const handleShowUpgradeModal = (
    trigger: 'upload' | 'query',
    currentUsage: { uploads: number; queries: number; total: number },
  ) => {
    setUpgradeModalData({
      currentUsage,
      limits: { uploads: 3, queries: 5, total: 5 },
      trigger,
    });
    setShowUpgradeModal(true);
  };

  return (
    <FreemiumProvider onShowUpgradeModal={handleShowUpgradeModal}>
      <DocumentProvider>
        <div className='h-screen max-h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex flex-col overflow-hidden'>
          {/* Header */}
          <header className='px-4 md:px-6 py-1.5'>
            <div className='max-w-screen-2xl mx-auto flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Logo
                  size='md'
                  showText={true}
                  animated={true}
                />
                <div className='hidden sm:block w-px h-6 bg-slate-300/60'></div>
                <p
                  className='hidden sm:block text-sm text-slate-500 font-light tracking-wide'
                  style={{ fontWeight: 300 }}>
                  AI-powered document analysis
                </p>
              </div>

              <div className='flex items-center gap-4'>
                {isLoaded && (
                  <div className='flex items-center gap-3'>
                    {user ? (
                      <div className='flex items-center gap-2'>
                        <div className='hidden sm:flex items-center gap-2 px-3 py-2 bg-white/70 rounded-xl border border-purple-200/50'>
                          <User className='w-4 h-4 text-slate-600' />
                          <span className='text-sm font-medium text-slate-700'>
                            {user.firstName ||
                              user.emailAddresses[0]?.emailAddress}
                          </span>
                        </div>
                        <Button
                          onClick={() => signOut()}
                          variant='ghost'
                          size='sm'
                          className='focus:ring-0 focus:ring-offset-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100'>
                          <LogOut className='w-4 h-4' />
                          <span className='hidden sm:inline ml-2'>
                            Sign Out
                          </span>
                        </Button>
                      </div>
                    ) : (
                      <div className='flex items-center gap-3'>
                        <UsageIndicator />
                        <button
                          onClick={() => (window.location.href = '/sign-up')}
                          className={`${SIGNUP_CTA_CLASS} px-4 py-2 text-sm rounded-lg inline-flex items-center justify-center font-medium cursor-pointer`}>
                          <User className='w-4 h-4' />
                          <span className='hidden sm:inline ml-2'>Sign Up</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className='flex-1 p-3 md:p-4 overflow-hidden min-h-0'>
            <div className='max-w-screen-2xl mx-auto h-full min-h-0'>
              <div
                className={`h-full min-h-0 grid gap-4 transition-all duration-300 ${getGridLayoutClasses()}`}>
                <AnimatePresence mode='popLayout'>
                  {activeCards.map((cardId, index) => {
                    const panel = panels.find((p) => p.id === cardId)!;
                    const Icon = panel.icon;
                    const Component = panel.component;
                    const isCollapsed = collapsedPanels.has(cardId);
                    const canCollapse =
                      cardId === 'sources' || cardId === 'chat';

                    if (isCollapsed && canCollapse) {
                      const isSourcesPanel = cardId === 'sources';
                      const expandIcon = isSourcesPanel
                        ? ChevronRight
                        : ChevronLeft;

                      return (
                        <motion.div
                          key={cardId}
                          className='relative h-full min-h-0'
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.1,
                            ease: 'easeOut',
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
                        className='relative h-full min-h-0'
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.1,
                          ease: 'easeOut',
                        }}>
                        <Card
                          animated={true}
                          className='h-full min-h-0 flex flex-col overflow-hidden'>
                          <CardHeader
                            title={panel.label}
                            description={panel.description}
                            icon={
                              <panel.icon className='w-4 h-4 text-slate-600' />
                            }
                            action={
                              canCollapse ? (
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
                              ) : undefined
                            }
                          />
                          <CardContent className='h-full min-h-0 p-0'>
                            <Component />
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </main>

          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            currentUsage={upgradeModalData.currentUsage}
            limits={upgradeModalData.limits}
            trigger={upgradeModalData.trigger}
          />

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
        </div>
      </DocumentProvider>
    </FreemiumProvider>
  );
}
