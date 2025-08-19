'use client';

import { PanelType } from '@/types';
import { AnimatePresence } from 'framer-motion';
import {
  FileText,
  Globe,
  MessageSquare,
  NotebookPen,
  Type,
  Upload,
  X,
  Youtube,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import Logo from './Logo';
import ChatPanel from './panels/ChatPanel';
import NotebookPanel from './panels/NotebookPanel';
import SourcesPanel from './panels/SourcesPanel';
import UsageIndicator from './UsageIndicator';
import UpgradeModal from './UpgradeModal';
import { FreemiumProvider } from '@/contexts/FreemiumContext';
import { DocumentProvider } from '@/contexts/DocumentContext';
import { Button, Card, CardContent, CardHeader } from './ui';

// Solid active tab color (Obsidian Plum)
const ACTIVE_TAB_SOLID_PLUM =
  'focus:ring-0 focus:ring-offset-0 bg-[#4e2a4f] text-white border-0 shadow-md hover:bg-[#5a325d]';

const ACTIVE_TAB_CLASS = ACTIVE_TAB_SOLID_PLUM;

const INACTIVE_TAB_CLASS =
  'focus:ring-0 focus:ring-offset-0 border-slate-300 text-slate-700 bg-white/80 hover:bg-white hover:border-slate-400 hover:text-slate-800 shadow-sm hover:shadow-md transition-all';

// Distinct solid color for the Sign Up button - matching app logo orange
const SIGNUP_CTA_CLASS =
  'bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-md hover:shadow-lg focus:ring-0 focus:ring-offset-0 transition-all duration-300';

export default function Layout() {
  const [activeCards, setActiveCards] = useState<PanelType[]>(['sources']);
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalData, setUpgradeModalData] = useState({
    currentUsage: { uploads: 0, queries: 0, total: 0 },
    limits: { uploads: 3, queries: 5, total: 5 },
    trigger: 'upload' as 'upload' | 'query',
  });
  const [collapsedPanels, setCollapsedPanels] = useState<Set<PanelType>>(new Set());

  const panels = [
    {
      id: 'sources' as PanelType,
      label: 'Sources',
      icon: FileText,
      description: 'Upload and manage your documents',
      component: SourcesPanel,
      position: 'left',
    },
    {
      id: 'notebook' as PanelType,
      label: 'Notebook',
      icon: NotebookPen,
      description: 'Take notes and organize insights',
      component: NotebookPanel,
      position: 'center',
    },
    {
      id: 'chat' as PanelType,
      label: 'Chat',
      icon: MessageSquare,
      description: 'Ask questions about your documents',
      component: ChatPanel,
      position: 'right',
    },
  ];

  const openCard = (panelId: PanelType) => {
    if (!activeCards.includes(panelId)) {
      if (activeCards.length >= 3) {
        setActiveCards([...activeCards.slice(1), panelId]);
      } else {
        setActiveCards([...activeCards, panelId]);
      }
    }
  };

  const closeCard = (panelId: PanelType) => {
    setActiveCards(activeCards.filter((id) => id !== panelId));
  };

  const togglePanelCollapse = (panelId: PanelType) => {
    setCollapsedPanels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(panelId)) {
        newSet.delete(panelId);
      } else {
        newSet.add(panelId);
      }
      return newSet;
    });
  };

  const getGridLayoutClasses = () => {
    if (activeCards.length === 1) {
      return 'grid-cols-1 max-w-4xl mx-auto';
    }
    
    if (activeCards.length === 2) {
      // Check if sources is collapsed
      const sourcesCollapsed = collapsedPanels.has('sources');
      const chatCollapsed = collapsedPanels.has('chat');
      
      if (sourcesCollapsed) return 'grid-cols-[60px_1fr]';
      if (chatCollapsed) return 'grid-cols-[300px_60px]';
      return 'grid-cols-[300px_1fr]';
    }
    
    // 3 panels
    const sourcesCollapsed = collapsedPanels.has('sources');
    const chatCollapsed = collapsedPanels.has('chat');
    
    if (sourcesCollapsed && chatCollapsed) {
      return 'grid-cols-[60px_1fr_60px]';
    } else if (sourcesCollapsed) {
      return 'grid-cols-[60px_1fr_380px]';
    } else if (chatCollapsed) {
      return 'grid-cols-[280px_1fr_60px]';
    }
    
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
        <div className='h-screen bg-gradient-to-br from-purple-50/60 via-amber-50/50 to-orange-50/40 flex flex-col'>
          {/* Header */}
          <header className='px-4 md:px-6 py-2.5'>
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
                {/* Card Tabs */}
                <div className='flex items-center gap-2'>
                  {panels.map((panel) => {
                    const Icon = panel.icon;
                    const isOpen = activeCards.includes(panel.id);

                    return (
                      <Button
                        key={panel.id}
                        onClick={() => openCard(panel.id)}
                        variant={isOpen ? 'primary' : 'outline'}
                        size='sm'
                        className={
                          isOpen ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS
                        }>
                        <Icon className='w-4 h-4' />
                        <span className='hidden sm:inline ml-2'>
                          {panel.label}
                        </span>
                      </Button>
                    );
                  })}
                </div>

                {/* User Menu or Usage Counter */}
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
                        {/* Smooth animated usage indicator */}
                        <UsageIndicator />
                        <Button
                          onClick={() => (window.location.href = '/sign-up')}
                          variant='outline'
                          size='sm'
                          className={SIGNUP_CTA_CLASS}>
                          <User className='w-4 h-4' />
                          <span className='hidden sm:inline ml-2'>Sign Up</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content - Card Layout */}
          <main className='flex-1 p-4 md:p-6 overflow-hidden'>
            <div className='max-w-screen-2xl mx-auto h-full'>
              {activeCards.length === 0 ? (
                // Welcome State
                <div className='h-full flex items-center justify-center'>
                  <div className='text-center max-w-lg'>
                    <div className='bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-purple-200/50'>
                      <div className='mb-6'>
                        <div className='flex justify-center mb-6'>
                          <Logo
                            size='lg'
                            showText={true}
                          />
                        </div>
                        <h2 className='text-2xl font-bold text-slate-800 tracking-tight mb-2'>
                          Welcome to PaperLM
                        </h2>
                        <p className='text-slate-600 font-semibold tracking-tight'>
                          Get started by opening a panel to upload documents,
                          take notes, or chat with your content.
                        </p>
                      </div>

                      <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6'>
                        {panels.map((panel) => {
                          const Icon = panel.icon;
                          return (
                            <Button
                              key={panel.id}
                              onClick={() => openCard(panel.id)}
                              variant='outline'
                              className='p-4 h-auto flex-col group cursor-pointer hover:border-[#9bd098] hover:bg-green-50/40'
                              animated={true}>
                              <Icon className='w-6 h-6 text-slate-400 mx-auto mb-2 group-hover:text-[#7bc478]' />
                              <div className='text-sm font-semibold text-slate-800 tracking-tight mb-1'>
                                {panel.label}
                              </div>
                              <div className='text-xs text-slate-500 font-medium'>
                                {panel.description}
                              </div>
                            </Button>
                          );
                        })}
                      </div>

                      <div className='pt-4 border-t border-slate-200'>
                        <p className='text-xs text-slate-500 font-medium text-center mb-4'>
                          Multiple ways to add content:
                        </p>
                        <div className='space-y-3 text-xs'>
                          <div className='flex justify-center'>
                            <div className='flex items-center gap-2 px-3 py-2 bg-blue-50/60 rounded-lg border border-blue-200/40'>
                              <div className='w-4 h-4 bg-slate-50 rounded flex items-center justify-center border border-blue-200/50'>
                                <Upload className='w-2 h-2 text-blue-600' />
                              </div>
                              <span className='text-blue-800 font-semibold tracking-tight'>
                                Upload Files
                              </span>
                            </div>
                          </div>
                          <div className='flex justify-center gap-2'>
                            <div className='flex items-center gap-2 px-2 py-1 bg-slate-50/60 rounded border border-slate-200/50'>
                              <div className='w-4 h-4 bg-slate-50 rounded flex items-center justify-center border border-slate-200/50'>
                                <Type className='w-2 h-2 text-slate-600' />
                              </div>
                              <span className='text-slate-700 font-semibold'>
                                Text
                              </span>
                            </div>
                            <div className='flex items-center gap-2 px-2 py-1 bg-red-50/60 rounded border border-red-200/50'>
                              <div className='w-4 h-4 bg-red-50 rounded flex items-center justify-center border border-red-200/50'>
                                <Youtube className='w-2 h-2 text-red-600' />
                              </div>
                              <span className='text-red-700 font-semibold'>
                                YouTube
                              </span>
                            </div>
                            <div className='flex items-center gap-2 px-2 py-1 bg-emerald-50/60 rounded border border-emerald-200/50'>
                              <div className='w-4 h-4 bg-emerald-50 rounded flex items-center justify-center border border-emerald-200/50'>
                                <Globe className='w-2 h-2 text-emerald-600' />
                              </div>
                              <span className='text-emerald-700 font-semibold'>
                                Websites
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Cards Layout - Optimized for screen space with collapsible panels
                <div
                  className={`h-full grid gap-4 grid-cols-1 md:${getGridLayoutClasses()}`}>
                  <AnimatePresence mode='popLayout'>
                    {activeCards
                      .sort((a, b) => {
                        // Sort cards by their intended position: sources (left), notebook (center), chat (right)
                        const panelA = panels.find((p) => p.id === a)!;
                        const panelB = panels.find((p) => p.id === b)!;
                        const positions = { left: 0, center: 1, right: 2 };
                        return (
                          positions[panelA.position as keyof typeof positions] -
                          positions[panelB.position as keyof typeof positions]
                        );
                      })
                      .map((cardId, index) => {
                        const panel = panels.find((p) => p.id === cardId)!;
                        const Icon = panel.icon;
                        const Component = panel.component;
                        const isCollapsed = collapsedPanels.has(cardId);
                        const canCollapse = cardId === 'sources' || cardId === 'chat';

                        if (isCollapsed && canCollapse) {
                          // Render collapsed view
                          return (
                            <div
                              key={cardId}
                              className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                              <div className="p-3 border-b border-gray-100 flex items-center justify-center">
                                <Button
                                  onClick={() => togglePanelCollapse(cardId)}
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-auto hover:bg-gray-100"
                                  title={`Expand ${panel.label}`}>
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                </Button>
                              </div>
                              <div className="flex-1 flex flex-col items-center gap-3 p-3">
                                <Button
                                  onClick={() => openCard(cardId)}
                                  variant="ghost"
                                  size="sm"
                                  className="p-2 h-auto hover:bg-gray-100 group"
                                  title={panel.label}>
                                  <Icon className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
                                </Button>
                                {cardId === 'sources' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-2 h-auto hover:bg-blue-50 group"
                                    title="Add Content">
                                    <Plus className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <Card
                            key={cardId}
                            animated={true}
                            className='motion-safe:animate-none'
                            style={{
                              animationDelay: `${index * 100}ms`,
                            }}>
                            <CardHeader
                              title={panel.label}
                              description={panel.description}
                              icon={<Icon className='w-4 h-4 text-slate-600' />}
                              action={
                                <div className="flex items-center gap-1">
                                  {canCollapse && (
                                    <Button
                                      onClick={() => togglePanelCollapse(cardId)}
                                      variant='ghost'
                                      size='sm'
                                      className='p-1 h-auto'
                                      title={`Collapse ${panel.label}`}>
                                      <ChevronLeft className='w-4 h-4 text-gray-500' />
                                    </Button>
                                  )}
                                  {activeCards.length > 1 && (
                                    <Button
                                      onClick={() => closeCard(cardId)}
                                      variant='ghost'
                                      size='sm'
                                      className='p-1 h-auto'>
                                      <X className='w-4 h-4 text-gray-500' />
                                    </Button>
                                  )}
                                </div>
                              }
                            />
                            <CardContent>
                              <Component />
                            </CardContent>
                          </Card>
                        );
                      })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </main>

          {/* Upgrade Modal */}
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            currentUsage={upgradeModalData.currentUsage}
            limits={upgradeModalData.limits}
            trigger={upgradeModalData.trigger}
          />
        </div>
      </DocumentProvider>
    </FreemiumProvider>
  );
}
