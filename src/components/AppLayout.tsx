'use client';

import { DocumentProvider } from '@/contexts/DocumentContext';
import { NotebookProvider } from '@/contexts/NotebookContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { UsageProvider, useUsage } from '@/contexts/UsageContext';
import { hasLocalStorageData } from '@/lib/dataMigration';
import { getSessionId, setSessionId } from '@/lib/sessionStorage';
import { useAuthData } from '@/stores/authStore';
import { PanelType } from '@/types';
import { useUser } from '@clerk/nextjs';
import { createId } from '@paralleldrive/cuid2';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  NotebookPen,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import AuthProvider from './AuthProvider';
import DataMigrationDialog from './DataMigrationDialog';
import { GuidedTourProvider, TourButton } from './GuidedTour';
import Logo from './Logo';
import AIChatPanel from './panels/AIChatPanel';
import DocumentSourcesPanel from './panels/DocumentSourcesPanel';
import SmartNotebookPanel from './panels/SmartNotebookPanel';
import { Card, CardContent, CardHeader } from './ui';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import UserMenu from './UserMenu';
import WelcomeScreen from './WelcomeScreen';

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

function AppLayoutContent({ userId }: { userId?: string }) {
  const { user } = useUser();
  const { user: authUser, isFullyLoaded } = useAuthData();
  const {
    chatCount,
    documentCount,
    maxFreeChats,
    maxFreeDocuments,
    canChat,
    canUploadDocument,
  } = useUsage();
  const [activeCards] = useState<PanelType[]>(['sources', 'notebook', 'chat']);
  const [collapsedPanels, setCollapsedPanels] = useState<Set<PanelType>>(
    new Set(),
  );
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  // Initialize session and check for migration on component mount
  useEffect(() => {
    // Initialize session
    const initializeUserSession = () => {
      let sessionId = getSessionId();
      if (!sessionId) {
        // Create new session ID
        sessionId = createId();
        setSessionId(sessionId);
      }

      // Check if there's data to migrate
      if (hasLocalStorageData()) {
        setShowMigrationDialog(true);
      }
    };

    // Delay to ensure localStorage is accessible
    setTimeout(initializeUserSession, 1000);
  }, []);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Check if user needs onboarding
  useEffect(() => {
    if (isFullyLoaded && authUser && user) {
      // Show welcome screen only for first-time users who haven't completed onboarding
      if (authUser.needsOnboarding && !authUser.hasCompletedOnboarding) {
        setShowWelcomeScreen(true);
      }
    }
  }, [isFullyLoaded, authUser, user]);

  // Note: User auth is now handled by auth store and auth manager

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
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}>
            <Logo
              size='lg'
              showText={true}
              animated={true}
            />
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
      <header className='px-8 py-2'>
        <div className='w-full px-6 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div data-tour='welcome'>
              <Link href='/'>
                <Logo
                  size='sm'
                  showText={true}
                  animated={true}
                />
              </Link>
            </div>
            <div className='hidden sm:block w-px h-6 bg-slate-300/60'></div>
          </div>

          <div className='flex items-center gap-4'>
            {/* Tour Button */}
            <TourButton />

            {/* Usage Status - Only show for guest users */}
            {!user && (
              <div
                className='flex items-center gap-3 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-full'
                data-tour='usage-indicator'>
                <div className='flex items-center gap-1'>
                  <FileText
                    className={`w-3 h-3 ${
                      !canUploadDocument ? 'text-red-500' : 'text-blue-500'
                    }`}
                  />
                  <span className='text-xs font-medium text-gray-700'>
                    {documentCount}/{maxFreeDocuments}
                  </span>
                </div>
                <div className='flex items-center gap-1'>
                  <MessageSquare
                    className={`w-3 h-3 ${
                      !canChat ? 'text-red-500' : 'text-green-500'
                    }`}
                  />
                  <span className='text-xs font-medium text-gray-700'>
                    {chatCount}/{maxFreeChats}
                  </span>
                </div>
                {(!canChat || !canUploadDocument) && (
                  <span className='text-xs text-red-600 font-medium'>
                    Limit reached
                  </span>
                )}
              </div>
            )}

            {/* User Authentication */}
            {user ? (
              <div className='flex items-center gap-3'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-gray-700 hidden md:inline'>
                    {user.fullName ||
                      user.firstName ||
                      user.emailAddresses[0]?.emailAddress?.split('@')[0]}
                  </span>
                </div>

                <UserMenu userId={userId}>
                  <Avatar>
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback>SK</AvatarFallback>
                  </Avatar>

                  {/* <Button className='flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors '>
                    <Image
                      width={32}
                      height={32}
                      src={user.imageUrl}
                      alt={user.fullName || 'User'}
                      className='w-8 h-8 rounded-full border border-gray-200'
                    />
                  </Button> */}
                </UserMenu>
              </div>
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
      <main className='flex-1 p-3 md:px-4 md:py-1 md:pb-4 overflow-hidden min-h-0'>
        <div className='w-full h-full min-h-0'>
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
                      initial={{
                        opacity: 0,
                        scale: 0.95,
                        x:
                          cardId === 'sources'
                            ? -20
                            : cardId === 'chat'
                            ? 20
                            : 0,
                      }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        x:
                          cardId === 'sources'
                            ? -20
                            : cardId === 'chat'
                            ? 20
                            : 0,
                      }}
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

                        {/* Vertical actions - removed per user request */}
                        <div className='flex-1 flex flex-col items-center py-6 space-y-6 overflow-hidden'>
                          {/* Icon buttons removed as requested */}
                        </div>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={cardId}
                    className='relative h-full min-h-0 min-w-0'
                    initial={{
                      opacity: 0,
                      scale: 0.95,
                      x:
                        cardId === 'sources' ? -20 : cardId === 'chat' ? 20 : 0,
                    }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      x:
                        cardId === 'sources' ? -20 : cardId === 'chat' ? 20 : 0,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}>
                    <Card
                      className='h-full min-h-0 flex flex-col overflow-hidden min-w-0 pb-0'
                      data-tour={
                        cardId === 'sources'
                          ? 'sources-panel'
                          : cardId === 'notebook'
                          ? 'notebook-panel'
                          : cardId === 'chat'
                          ? 'chat-panel'
                          : undefined
                      }>
                      <CardHeader>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                            <panel.icon className='w-4 h-4 text-slate-600' />
                            <span className='font-semibold'>{panel.label}</span>
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

      {/* Data Migration Dialog */}
      <DataMigrationDialog
        isOpen={showMigrationDialog}
        onClose={() => setShowMigrationDialog(false)}
        onMigrationComplete={() => {
          // Refresh the page to ensure all components load fresh data from API
          window.location.reload();
        }}
      />

      {/* Welcome Screen for first-time users */}
      <WelcomeScreen
        isVisible={showWelcomeScreen}
        onComplete={() => setShowWelcomeScreen(false)}
      />
    </motion.div>
  );
}

interface AppLayoutProps {
  userId?: string;
}

export default function AppLayout({ userId }: AppLayoutProps) {
  return (
    <AuthProvider>
      <GuidedTourProvider>
        <SubscriptionProvider>
          <UsageProvider>
            <DocumentProvider>
              <NotebookProvider>
                <AppLayoutContent userId={userId} />
              </NotebookProvider>
            </DocumentProvider>
          </UsageProvider>
        </SubscriptionProvider>
      </GuidedTourProvider>
    </AuthProvider>
  );
}
