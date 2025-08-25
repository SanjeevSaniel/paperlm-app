'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuthData } from '@/stores/authStore';
import {
  useAppPreferencesStore,
  useProfileFormStore,
  useUserMenuStore,
} from '@/stores/userMenuStore';
import { useClerk, useUser } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  CreditCard,
  LogOut,
  Settings,
  User,
  X,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface NotionUserMenuProps {
  children: React.ReactNode;
  userId?: string;
}

// type MenuSection =
//   | 'profile'
//   | 'preferences'
//   | 'notifications'
//   | 'billing'
//   | 'usage';

export default function UserMenu({ children }: NotionUserMenuProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const authData = useAuthData();
  const { isOpen, activeSection, setIsOpen, setActiveSection, closeMenu } =
    useUserMenuStore();
  const { formData, setFormData, hasChanges, saveForm, resetForm } =
    useProfileFormStore();
  const { theme, setTheme, emailNotifications, setEmailNotifications, savePreferences } =
    useAppPreferencesStore();

  const userLimits = authData.user?.usage || {
    documentsUploaded: 0,
    messagesUsed: 0,
  };
  const isPro = authData.user?.subscription.plan === 'pro';

  useEffect(() => {
    if (user && (!formData.firstName || !formData.email)) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailAddresses[0]?.emailAddress || '',
        bio: '',
      });
    }
  }, [user, formData.firstName, formData.email, setFormData]);

  if (!user) return <>{children}</>;

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <motion.div
            className='p-6'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}>
            <div className='max-w-xl'>
              <h1 className='text-xl font-semibold text-gray-900 mb-1'>
                Profile
              </h1>
              <p className='text-sm text-gray-600 mb-6'>
                Manage your account information.
              </p>

              {/* Profile Header */}
              <div className='bg-gray-50 rounded-lg p-4 mb-5 border border-gray-200'>
                <div className='flex items-center gap-4'>
                  <div className='relative'>
                    <Image
                      src={user.imageUrl}
                      alt={user.fullName || 'User'}
                      width={56}
                      height={56}
                      className='w-14 h-14 rounded-lg shadow-sm ring-2 ring-white'
                    />
                    {isPro && (
                      <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center border-2 border-white'>
                        <Zap className='w-2.5 h-2.5 text-white' />
                      </div>
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <h2 className='font-medium text-gray-900 truncate'>
                      {user.fullName || user.firstName || 'User'}
                    </h2>
                    <p className='text-sm text-gray-600 truncate mb-2'>
                      {user.emailAddresses[0]?.emailAddress}
                    </p>
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                        isPro
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                      {isPro && <Zap className='w-3 h-3' />}
                      <span>{isPro ? 'Pro' : 'Free'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className='space-y-4 mb-5'>
                <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2'>
                  <User className='w-4 h-4 text-gray-500' />
                  Personal Information
                </h3>
                <div className='space-y-3'>
                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                        Full Name
                      </label>
                      <input
                        type='text'
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ firstName: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                        placeholder='Enter full name'
                      />
                    </div>
                    <div>
                      <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                        Display Name
                      </label>
                      <input
                        type='text'
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ lastName: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
                        placeholder='Display name'
                      />
                    </div>
                  </div>
                  <div>
                    <label className='block text-xs font-medium text-gray-700 mb-1.5'>
                      Email Address
                    </label>
                    <div className='relative'>
                      <input
                        type='email'
                        value={formData.email}
                        disabled
                        className='w-full px-3 py-2 pr-16 border border-gray-200 rounded-md text-sm bg-gray-50 text-gray-500'
                      />
                      <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                        <span className='px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded'>
                          ✓
                        </span>
                      </div>
                    </div>
                    <p className='text-xs text-gray-500 mt-1'>
                      Managed by your auth provider
                    </p>
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div className='mb-5'>
                <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3'>
                  <BarChart3 className='w-4 h-4 text-gray-500' />
                  Usage This Month
                </h3>
                <div className='grid grid-cols-3 gap-3'>
                  <div className='text-center p-3 bg-blue-50 rounded-md border border-blue-100'>
                    <div className='text-lg font-bold text-blue-600'>
                      {userLimits.documentsUploaded}
                    </div>
                    <div className='text-xs text-blue-700'>Documents</div>
                  </div>
                  <div className='text-center p-3 bg-green-50 rounded-md border border-green-100'>
                    <div className='text-lg font-bold text-green-600'>
                      {userLimits.messagesUsed}
                    </div>
                    <div className='text-xs text-green-700'>Messages</div>
                  </div>
                  <div className='text-center p-3 bg-purple-50 rounded-md border border-purple-100'>
                    <div className='text-lg font-bold text-purple-600'>
                      {isPro ? '∞' : '5'}
                    </div>
                    <div className='text-xs text-purple-700'>Monthly Limit</div>
                  </div>
                </div>
              </div>

              {/* Additional Settings for Testing Scroll */}
              <div className='mb-5'>
                <h3 className='text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3'>
                  <Settings className='w-4 h-4 text-gray-500' />
                  Additional Settings
                </h3>
                <div className='space-y-3'>
                  <div className='p-3 bg-gray-50 rounded-md border border-gray-200'>
                    <div className='text-sm font-medium text-gray-900 mb-1'>
                      Language Preference
                    </div>
                    <select className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white'>
                      <option>English (US)</option>
                      <option>English (UK)</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div className='p-3 bg-gray-50 rounded-md border border-gray-200'>
                    <div className='text-sm font-medium text-gray-900 mb-1'>
                      Timezone
                    </div>
                    <select className='w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white'>
                      <option>UTC-8 (Pacific)</option>
                      <option>UTC-5 (Eastern)</option>
                      <option>UTC (London)</option>
                      <option>UTC+1 (Berlin)</option>
                    </select>
                  </div>
                  <div className='p-3 bg-gray-50 rounded-md border border-gray-200'>
                    <div className='text-sm font-medium text-gray-900 mb-1'>
                      Date Format
                    </div>
                    <div className='flex items-center gap-4'>
                      <label className='flex items-center gap-2 text-sm'>
                        <input
                          type='radio'
                          name='dateFormat'
                          defaultChecked
                        />
                        MM/DD/YYYY
                      </label>
                      <label className='flex items-center gap-2 text-sm'>
                        <input
                          type='radio'
                          name='dateFormat'
                        />
                        DD/MM/YYYY
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className='flex gap-3 pt-4 border-t border-gray-200 mb-6'>
                <motion.button
                  onClick={saveForm}
                  disabled={!hasChanges}
                  className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${
                    hasChanges
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  whileHover={hasChanges ? { scale: 1.02 } : {}}
                  whileTap={hasChanges ? { scale: 0.98 } : {}}>
                  Save Changes
                </motion.button>
                <motion.button
                  onClick={resetForm}
                  className='px-4 py-2 border border-gray-300 text-gray-700 font-medium text-sm rounded-md hover:bg-gray-50 transition-colors'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}>
                  Reset
                </motion.button>
              </div>
            </div>
          </motion.div>
        );

      case 'preferences':
        return (
          <motion.div
            className='p-6 pb-8'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>
              Preferences
            </h2>

            <div className='space-y-6'>
              <div>
                <h3 className='text-sm font-medium text-gray-900 mb-2'>
                  Appearance
                </h3>
                <p className='text-sm text-gray-600 mb-4'>
                  Customize how PaperLM looks on your device.
                </p>
                <div className='flex items-center justify-between py-2'>
                  <span className='text-sm text-gray-700'>Theme</span>
                  <select
                    value={theme}
                    onChange={async (e) => {
                      const newTheme = e.target.value as 'light' | 'dark' | 'system';
                      setTheme(newTheme);
                      try {
                        await savePreferences();
                      } catch (error) {
                        console.error('Failed to save theme preference:', error);
                      }
                    }}
                    className='px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 min-w-[100px]'>
                    <option value='light'>Light</option>
                    <option value='dark'>Dark</option>
                    <option value='system'>System</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className='text-sm font-medium text-gray-900 mb-2'>
                  Document Processing
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between py-2'>
                    <div>
                      <span className='text-sm text-gray-700'>
                        Auto-process uploads
                      </span>
                      <p className='text-xs text-gray-500'>
                        Automatically start processing when files are uploaded
                      </p>
                    </div>
                    <input
                      type='checkbox'
                      defaultChecked
                      className='w-4 h-4 text-orange-600'
                    />
                  </div>
                  <div className='flex items-center justify-between py-2'>
                    <div>
                      <span className='text-sm text-gray-700'>
                        OCR for images
                      </span>
                      <p className='text-xs text-gray-500'>
                        Extract text from images and scanned documents
                      </p>
                    </div>
                    <input
                      type='checkbox'
                      defaultChecked
                      className='w-4 h-4 text-orange-600'
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-sm font-medium text-gray-900 mb-2'>
                  AI Chat
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between py-2'>
                    <div>
                      <span className='text-sm text-gray-700'>
                        Response length
                      </span>
                      <p className='text-xs text-gray-500'>
                        Preferred length for AI responses
                      </p>
                    </div>
                    <select className='px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900'>
                      <option>Concise</option>
                      <option>Balanced</option>
                      <option>Detailed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div
            className='p-6 pb-8'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>
              Notifications
            </h2>
            <div className='space-y-6'>
              <div>
                <h3 className='text-sm font-medium text-gray-900 mb-3'>
                  Email Notifications
                </h3>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between py-2'>
                    <div>
                      <p className='text-sm text-gray-700'>
                        Document processing complete
                      </p>
                      <p className='text-xs text-gray-500'>
                        Get notified when your documents finish processing
                      </p>
                    </div>
                    <input
                      type='checkbox'
                      checked={emailNotifications}
                      onChange={async (e) => {
                        setEmailNotifications(e.target.checked);
                        try {
                          await savePreferences();
                        } catch (error) {
                          console.error('Failed to save notification preference:', error);
                        }
                      }}
                      className='w-4 h-4 text-orange-600'
                    />
                  </div>
                  <div className='flex items-center justify-between py-2'>
                    <div>
                      <p className='text-sm text-gray-700'>
                        Usage limit warnings
                      </p>
                      <p className='text-xs text-gray-500'>
                        Alert when approaching monthly limits
                      </p>
                    </div>
                    <input
                      type='checkbox'
                      defaultChecked
                      className='w-4 h-4 text-orange-600'
                    />
                  </div>
                  <div className='flex items-center justify-between py-2'>
                    <div>
                      <p className='text-sm text-gray-700'>Product updates</p>
                      <p className='text-xs text-gray-500'>
                        News about new features and improvements
                      </p>
                    </div>
                    <input
                      type='checkbox'
                      className='w-4 h-4 text-orange-600'
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'billing':
        return (
          <motion.div
            className='p-6 pb-8'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>
              Billing & Subscription
            </h2>
            <div className='space-y-6'>
              <div className='p-4 border border-gray-200 rounded-lg'>
                <div className='flex items-center justify-between mb-2'>
                  <h3 className='text-sm font-medium text-gray-900'>
                    Current Plan
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isPro
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                    {isPro ? 'Pro' : 'Free'}
                  </span>
                </div>
                <p className='text-sm text-gray-600 mb-4'>
                  {isPro
                    ? 'Unlimited documents and advanced features'
                    : 'Limited to 5 documents and 10 chats per month'}
                </p>
                {!isPro && (
                  <motion.button 
                    onClick={() => {
                      closeMenu();
                      window.location.href = '/subscription';
                    }}
                    className='w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium transition-colors'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Upgrade to Pro
                  </motion.button>
                )}
              </div>

              {userLimits && (
                <div>
                  <h3 className='text-sm font-medium text-gray-900 mb-3'>
                    Usage this month
                  </h3>
                  <div className='space-y-3'>
                    <div>
                      <div className='flex justify-between text-sm mb-1'>
                        <span className='text-gray-600'>Documents</span>
                        <span className='text-gray-900'>
                          {userLimits.documentsUploaded} / {isPro ? '∞' : '1'}
                        </span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-orange-600 h-2 rounded-full'
                          style={{
                            width: isPro
                              ? '100%'
                              : `${Math.min(
                                  (userLimits.documentsUploaded / 1) * 100,
                                  100,
                                )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className='flex justify-between text-sm mb-1'>
                        <span className='text-gray-600'>Chat messages</span>
                        <span className='text-gray-900'>
                          {userLimits.messagesUsed} / {isPro ? '∞' : '5'}
                        </span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-orange-600 h-2 rounded-full'
                          style={{
                            width: isPro
                              ? '100%'
                              : `${Math.min(
                                  (userLimits.messagesUsed / 5) * 100,
                                  100,
                                )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'usage':
        return (
          <motion.div
            className='p-6 pb-8'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}>
            <h2 className='text-lg font-medium text-gray-900 mb-4'>
              Usage Analytics
            </h2>
            {isPro ? (
              <div className='space-y-6'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='p-4 border border-gray-200 rounded-lg'>
                    <p className='text-sm text-gray-600'>Documents processed</p>
                    <p className='text-2xl font-semibold text-gray-900'>24</p>
                    <p className='text-xs text-gray-500'>This month</p>
                  </div>
                  <div className='p-4 border border-gray-200 rounded-lg'>
                    <p className='text-sm text-gray-600'>Chat messages</p>
                    <p className='text-2xl font-semibold text-gray-900'>156</p>
                    <p className='text-xs text-gray-500'>This month</p>
                  </div>
                </div>
                <div>
                  <h3 className='text-sm font-medium text-gray-900 mb-3'>
                    Most active days
                  </h3>
                  <p className='text-sm text-gray-500'>
                    Analytics features coming soon...
                  </p>
                </div>
              </div>
            ) : (
              <div className='text-center py-8'>
                <p className='text-sm text-gray-500 mb-4'>
                  Usage analytics are available with Pro plan
                </p>
                <motion.button 
                  onClick={() => {
                    closeMenu();
                    window.location.href = '/subscription';
                  }}
                  className='px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm font-medium transition-colors'
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Upgrade to Pro
                </motion.button>
              </div>
            )}
          </motion.div>
        );

      default:
        return (
          <motion.div
            className='p-6 pb-8 flex items-center justify-center h-full'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}>
            <div className='text-center'>
              <p className='text-sm text-gray-500'>
                This section is coming soon.
              </p>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}>
      <DialogTrigger
        asChild
        onClick={() => setIsOpen(true)}>
        {children}
      </DialogTrigger>
      <DialogContent
        className='w-[95vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] 2xl:w-[1400px] h-[90vh] md:h-[85vh] lg:h-[80vh] p-0 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-xl max-w-[95vw] sm:max-w-[95vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] 2xl:max-w-[1400px]'
        showCloseButton={false}>
        <VisuallyHidden>
          <DialogTitle>User Account Settings</DialogTitle>
        </VisuallyHidden>
        <motion.div
          className='flex h-full min-h-0'
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}>
          {/* Left Sidebar */}
          <motion.div
            className='w-64 bg-gradient-to-br from-gray-50 to-gray-100/50 flex flex-col border-r border-gray-200/80'
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}>
            {/* User Header */}
            <motion.div
              className='p-4 border-b border-gray-200/60'
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}>
              <div className='flex items-center gap-2.5'>
                <div className='relative'>
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || 'User'}
                    width={36}
                    height={36}
                    className='w-9 h-9 rounded-full ring-2 ring-white shadow-md'
                  />
                  {isPro && (
                    <div className='absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center border-2 border-white'>
                      <Zap className='w-2.5 h-2.5 text-white' />
                    </div>
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-semibold text-gray-900 truncate'>
                    {user.fullName || user.firstName || 'User'}
                  </p>
                  <p className='text-xs text-gray-500 truncate'>
                    {user.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>

              {/* Plan Badge */}
              <div className='mt-3'>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    isPro
                      ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border-orange-200 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}>
                  {isPro && <Zap className='w-3 h-3' />}
                  <span>{isPro ? 'Pro Plan' : 'Free Plan'}</span>
                  {!isPro && <span className='ml-1 text-orange-600'>↗</span>}
                </div>
              </div>
            </motion.div>

            {/* Navigation */}
            <div className='flex-1 py-3 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full'>
              {/* Personal Section */}
              <motion.div
                className='px-4 mb-4'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}>
                <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2'>
                  Personal
                </h3>
                <div className='space-y-1'>
                  <motion.button
                    onClick={() => setActiveSection('profile')}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer w-full text-left transition-all duration-200 ${
                      activeSection === 'profile'
                        ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-200/50'
                        : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                    }`}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}>
                    <div
                      className={`p-1 rounded-md transition-all duration-200 ${
                        activeSection === 'profile'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-200/60 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'
                      }`}>
                      <User className='w-3 h-3' />
                    </div>
                    <span>{user.fullName || user.firstName || 'Profile'}</span>
                  </motion.button>

                  <motion.button
                    onClick={() => setActiveSection('preferences')}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer w-full text-left transition-all duration-200 ${
                      activeSection === 'preferences'
                        ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-200/50'
                        : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                    }`}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}>
                    <div
                      className={`p-1 rounded-md transition-all duration-200 ${
                        activeSection === 'preferences'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-gray-200/60 text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600'
                      }`}>
                      <Settings className='w-3 h-3' />
                    </div>
                    <span>Preferences</span>
                  </motion.button>

                  <motion.button
                    onClick={() => setActiveSection('notifications')}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer w-full text-left transition-all duration-200 ${
                      activeSection === 'notifications'
                        ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-200/50'
                        : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                    }`}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}>
                    <div
                      className={`p-1 rounded-md transition-all duration-200 ${
                        activeSection === 'notifications'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-200/60 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600'
                      }`}>
                      <Bell className='w-3 h-3' />
                    </div>
                    <span>Notifications</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Billing Section */}
              <motion.div
                className='px-4 mb-4'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}>
                <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2'>
                  Billing & Usage
                </h3>
                <div className='space-y-1'>
                  <motion.button
                    onClick={() => setActiveSection('billing')}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer w-full text-left transition-all duration-200 ${
                      activeSection === 'billing'
                        ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-200/50'
                        : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                    }`}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}>
                    <div
                      className={`p-1 rounded-md transition-all duration-200 ${
                        activeSection === 'billing'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-gray-200/60 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600'
                      }`}>
                      <CreditCard className='w-3 h-3' />
                    </div>
                    <div className='flex items-center justify-between flex-1'>
                      <span>Billing</span>
                      {!isPro && (
                        <div className='px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded'>
                          Upgrade
                        </div>
                      )}
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={() => setActiveSection('usage')}
                    className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer w-full text-left transition-all duration-200 ${
                      activeSection === 'usage'
                        ? 'bg-white text-gray-900 shadow-md ring-1 ring-gray-200/50'
                        : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                    }`}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}>
                    <div
                      className={`p-1 rounded-md transition-all duration-200 ${
                        activeSection === 'usage'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-200/60 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                      }`}>
                      <BarChart3 className='w-3 h-3' />
                    </div>
                    <div className='flex items-center justify-between flex-1'>
                      <span>Analytics</span>
                      {!isPro && (
                        <div className='w-2 h-2 bg-gray-300 rounded-full'></div>
                      )}
                    </div>
                  </motion.button>
                </div>
              </motion.div>

              {/* Account Actions */}
              <motion.div
                className='px-4 mt-4 mb-3'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}>
                <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2'>
                  Account
                </h3>
                <div className='space-y-1'>
                  {!isPro && (
                    <motion.a
                      href='/subscription'
                      className='group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer w-full text-left transition-all duration-200 text-gray-600 hover:bg-white/70 hover:text-gray-900'
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}>
                      <div className='p-1.5 rounded-md transition-all duration-200 bg-gray-200/60 text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600'>
                        <Zap className='w-3 h-3' />
                      </div>
                      <div className='flex items-center justify-between flex-1'>
                        <span>Upgrade to Pro</span>
                        <div className='px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded'>
                          New
                        </div>
                      </div>
                    </motion.a>
                  )}

                  <motion.button
                    onClick={() => signOut()}
                    className='flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer w-full transition-all duration-200 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300'
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}>
                    <LogOut className='w-3.5 h-3.5' />
                    <span>Log out</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Content Area */}
          <motion.div
            className='flex-1 bg-white flex flex-col min-h-0'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}>
            {/* Close Button Header */}
            <div className='flex justify-end px-3 py-1.5'>
              <motion.button
                onClick={closeMenu}
                className='w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200'
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}>
                <X className='w-4 h-4' />
              </motion.button>
            </div>
            {/* Content */}
            <div className='flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 scrollbar-thumb-rounded-full'>
              <AnimatePresence
                mode='wait'
                key={activeSection}>
                {renderContent()}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
