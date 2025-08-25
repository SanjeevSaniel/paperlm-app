'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2, File, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Function to call when dialog should close */
  onClose: () => void;
  /** Function to call when deletion is confirmed */
  onConfirm: () => Promise<void>;
  /** Type of item being deleted */
  itemType: 'document' | 'note' | 'conversation' | 'session';
  /** Name of the item being deleted */
  itemName?: string;
  /** Additional details about the item */
  itemDetails?: {
    size?: string;
    type?: string;
    uploadDate?: string;
    chunkCount?: number;
  };
  /** Whether the deletion is in progress */
  isDeleting?: boolean;
  /** Custom title for the dialog */
  title?: string;
  /** Custom description for the dialog */
  description?: string;
}

/**
 * Professional deletion confirmation dialog using ShadCN components
 * 
 * Features:
 * - Consistent UI across all delete operations
 * - Visual indicators for different content types
 * - Loading states during deletion
 * - Comprehensive item details
 * - Accessible design with proper ARIA labels
 */
export default function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
  itemDetails,
  isDeleting = false,
  title,
  description,
}: DeleteConfirmationDialogProps) {
  
  // Get appropriate icon and colors for different item types
  const getItemConfig = (type: string) => {
    switch (type) {
      case 'document':
        return {
          icon: FileText,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'note':
        return {
          icon: File,
          iconColor: 'text-green-500', 
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'conversation':
        return {
          icon: FileText,
          iconColor: 'text-purple-500',
          bgColor: 'bg-purple-50', 
          borderColor: 'border-purple-200',
        };
      default:
        return {
          icon: File,
          iconColor: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const config = getItemConfig(itemType);
  const IconComponent = config.icon;

  // Handle confirm with loading state
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose(); // Close dialog after successful deletion
    } catch (error) {
      // Error handling is done by parent component
      console.error('Deletion failed:', error);
    }
  };

  // Default titles and descriptions
  const defaultTitle = title || `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`;
  const defaultDescription = description || 
    `Are you sure you want to delete this ${itemType}? This action cannot be undone and will permanently remove all associated data.`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 border border-red-200">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            {defaultTitle}
          </DialogTitle>
          <DialogDescription className="text-left mt-4">
            {defaultDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Item Details Card */}
        {itemName && (
          <div className={cn(
            'rounded-lg border p-4 space-y-3',
            config.bgColor,
            config.borderColor
          )}>
            <div className="flex items-start gap-3">
              <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg', config.bgColor)}>
                <IconComponent className={cn('w-5 h-5', config.iconColor)} />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {itemName}
                </h4>
                {itemDetails && (
                  <div className="space-y-1 text-sm text-gray-600">
                    {itemDetails.type && (
                      <p>Type: <span className="font-medium">{itemDetails.type}</span></p>
                    )}
                    {itemDetails.size && (
                      <p>Size: <span className="font-medium">{itemDetails.size}</span></p>
                    )}
                    {itemDetails.chunkCount && (
                      <p>Chunks: <span className="font-medium">{itemDetails.chunkCount} sections</span></p>
                    )}
                    {itemDetails.uploadDate && (
                      <p>Uploaded: <span className="font-medium">{itemDetails.uploadDate}</span></p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warning Message */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">This action is permanent</p>
              <ul className="space-y-1 text-amber-600">
                <li>• The {itemType} will be completely removed from your account</li>
                <li>• All associated data and embeddings will be deleted</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 sm:flex-initial"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}