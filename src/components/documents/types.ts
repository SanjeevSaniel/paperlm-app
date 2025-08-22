import { Document } from '@/types';

/**
 * Extended document interface with additional properties
 */
export interface ExtendedDocument extends Document {
  sourceUrl?: string;
  loader?: string;
  fileType?: string;
}

/**
 * Document upload handlers interface
 */
export interface DocumentUploadHandlers {
  /** Handle file uploads */
  onFileUpload: (files: FileList) => Promise<void>;
  /** Handle text input */
  onTextSubmit: (text: string) => Promise<void>;
  /** Handle URL scraping */
  onUrlSubmit: (url: string, type: 'youtube' | 'website') => Promise<void>;
  /** Handle document removal */
  onDeleteDocument: (id: string) => Promise<void>;
}