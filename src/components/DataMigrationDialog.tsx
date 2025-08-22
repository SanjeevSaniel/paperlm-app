'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  X,
  Database,
  HardDrive,
} from 'lucide-react';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';
import {
  hasLocalStorageData,
  migrateToNeonDB,
  clearLocalStorageData,
  createLocalStorageBackup,
  extractLocalStorageData,
  type MigrationResult,
} from '@/lib/dataMigration';

interface DataMigrationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrationComplete?: () => void;
}

export default function DataMigrationDialog({
  isOpen,
  onClose,
  onMigrationComplete,
}: DataMigrationDialogProps) {
  const [hasData, setHasData] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] =
    useState<MigrationResult | null>(null);
  const [localDataStats, setLocalDataStats] = useState<{
    documents: number;
    notes: number;
    messages: number;
  }>({ documents: 0, notes: 0, messages: 0 });

  // Check for existing data when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsChecking(true);
      setMigrationResult(null);

      // Check if there's localStorage data to migrate
      const hasLocalData = hasLocalStorageData();
      setHasData(hasLocalData);

      if (hasLocalData) {
        const localData = extractLocalStorageData();
        if (localData) {
          setLocalDataStats({
            documents: localData.documents.length,
            notes: localData.notes.length,
            messages: localData.messages.length,
          });
        }
      }

      setIsChecking(false);
    }
  }, [isOpen]);

  const handleCreateBackup = () => {
    const backup = createLocalStorageBackup();
    if (backup) {
      // Create downloadable file
      const blob = new Blob([backup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `paperlm-backup-${
        new Date().toISOString().split('T')[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup created and downloaded!', {
        duration: 3000,
        icon: '💾',
      });
    } else {
      toast.error('Failed to create backup');
    }
  };

  const handleMigration = async () => {
    setIsMigrating(true);

    try {
      const result = await migrateToNeonDB();
      setMigrationResult(result);

      if (result.success) {
        toast.success('Migration completed successfully!', {
          duration: 4000,
          icon: '✅',
        });

        // Clear localStorage data after successful migration
        clearLocalStorageData();

        // Notify parent component
        onMigrationComplete?.();

        // Auto-close dialog after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        toast.error('Migration completed with errors. Check details below.', {
          duration: 5000,
          icon: '⚠️',
        });
      }
    } catch (error) {
      console.error('Migration failed:', error);
      toast.error('Migration failed. Please try again.');
      setMigrationResult({
        success: false,
        migratedDocuments: 0,
        migratedNotes: 0,
        migratedMessages: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
        onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className='bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'
          onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center'>
                <Database className='w-5 h-5 text-white' />
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>
                  Data Migration
                </h2>
                <p className='text-sm text-gray-500'>
                  Migrate your data to NeonDB
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant='ghost'
              size='sm'
              className='p-2 hover:bg-gray-100'>
              <X className='w-4 h-4' />
            </Button>
          </div>

          {/* Content */}
          <div className='px-6 py-6'>
            {isChecking ? (
              <div className='text-center py-8'>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className='w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4'
                />
                <p className='text-gray-600'>Checking for data to migrate...</p>
              </div>
            ) : !hasData ? (
              <div className='text-center py-8'>
                <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  No Migration Needed
                </h3>
                <p className='text-gray-600'>
                  You&#39;re already using the latest NeonDB storage system. No
                  local data found that needs migration.
                </p>
              </div>
            ) : migrationResult ? (
              // Migration Results
              <div className='space-y-4'>
                <div
                  className={`p-4 rounded-xl border-2 ${
                    migrationResult.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-orange-50 border-orange-200'
                  }`}>
                  <div className='flex items-center gap-2 mb-2'>
                    {migrationResult.success ? (
                      <CheckCircle className='w-5 h-5 text-green-600' />
                    ) : (
                      <AlertTriangle className='w-5 h-5 text-orange-600' />
                    )}
                    <h3
                      className={`font-semibold ${
                        migrationResult.success
                          ? 'text-green-900'
                          : 'text-orange-900'
                      }`}>
                      Migration{' '}
                      {migrationResult.success
                        ? 'Completed'
                        : 'Completed with Issues'}
                    </h3>
                  </div>

                  <div className='grid grid-cols-3 gap-4 mb-3'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {migrationResult.migratedDocuments}
                      </div>
                      <div className='text-xs text-gray-600'>Documents</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-purple-600'>
                        {migrationResult.migratedNotes}
                      </div>
                      <div className='text-xs text-gray-600'>Notes</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {migrationResult.migratedMessages}
                      </div>
                      <div className='text-xs text-gray-600'>Messages</div>
                    </div>
                  </div>

                  {migrationResult.errors.length > 0 && (
                    <div className='mt-4'>
                      <h4 className='font-medium text-orange-900 mb-2'>
                        Issues:
                      </h4>
                      <ul className='text-sm text-orange-700 space-y-1'>
                        {migrationResult.errors.map((error, index) => (
                          <li
                            key={index}
                            className='flex items-start gap-2'>
                            <span className='text-orange-500 mt-0.5'>•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {migrationResult.success && (
                  <div className='bg-blue-50 border border-blue-200 rounded-xl p-4'>
                    <p className='text-blue-800 text-sm'>
                      🎉 Your data has been successfully migrated to NeonDB! You
                      can now enjoy improved performance and reliability. Your
                      local storage has been automatically cleared.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Pre-migration state
              <div className='space-y-6'>
                <div className='bg-blue-50 border border-blue-200 rounded-xl p-4'>
                  <div className='flex items-start gap-3'>
                    <AlertTriangle className='w-5 h-5 text-blue-600 mt-0.5' />
                    <div>
                      <h3 className='font-semibold text-blue-900 mb-1'>
                        Migration Available
                      </h3>
                      <p className='text-blue-800 text-sm'>
                        We found local data that can be migrated to our new
                        NeonDB system for better performance, reliability, and
                        sync across devices.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Data Summary */}
                <div className='bg-gray-50 rounded-xl p-4'>
                  <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                    <HardDrive className='w-4 h-4' />
                    Local Data Found
                  </h3>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        {localDataStats.documents}
                      </div>
                      <div className='text-xs text-gray-600'>Documents</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-purple-600'>
                        {localDataStats.notes}
                      </div>
                      <div className='text-xs text-gray-600'>Notes</div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        {localDataStats.messages}
                      </div>
                      <div className='text-xs text-gray-600'>Messages</div>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className='space-y-3'>
                  <h3 className='font-semibold text-gray-900'>
                    Migration Benefits:
                  </h3>
                  <ul className='space-y-2 text-sm text-gray-600'>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-500' />
                      Improved performance and reliability
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-500' />
                      Data persistence across browser sessions
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-500' />
                      Better search and filtering capabilities
                    </li>
                    <li className='flex items-center gap-2'>
                      <CheckCircle className='w-4 h-4 text-green-500' />
                      Preparation for multi-device sync
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className='flex flex-col sm:flex-row gap-3 pt-4'>
                  <Button
                    onClick={handleCreateBackup}
                    variant='outline'
                    className='flex-1 flex items-center justify-center gap-2'>
                    <Download className='w-4 h-4' />
                    Create Backup First
                  </Button>
                  <Button
                    onClick={handleMigration}
                    disabled={isMigrating}
                    className='flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center justify-center gap-2'>
                    {isMigrating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                          className='w-4 h-4 border-2 border-white border-t-transparent rounded-full'
                        />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Upload className='w-4 h-4' />
                        Start Migration
                      </>
                    )}
                  </Button>
                </div>

                <div className='text-xs text-gray-500 text-center'>
                  💡 We recommend creating a backup before starting the
                  migration process. The migration is safe and can be run
                  multiple times.
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
