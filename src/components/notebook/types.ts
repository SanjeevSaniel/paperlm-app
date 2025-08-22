import { NotebookNote } from '@/lib/sessionStorage';

/**
 * Extended note type with additional properties
 */
export interface Note extends NotebookNote {
  type: 'summary' | 'insight' | 'quote';
  createdAt: string;
  updatedAt: string;
  sourceDocumentId?: string;
  sourceUrl?: string;
  tags?: string[];
  isNew?: boolean;
}

/**
 * Document type for notebook context
 */
export interface Document {
  id: string;
  name: string;
  sourceUrl?: string;
  metadata: {
    type: string;
    size?: number;
    chunksCount?: number;
  };
  status?: string;
}

/**
 * Note type filter options
 */
export type NoteTypeFilter = 'all' | 'summary' | 'insight' | 'quote';

/**
 * Note handlers interface
 */
export interface NoteHandlers {
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onView: (note: Note) => void;
}

/**
 * Filter state interface
 */
export interface FilterState {
  searchTerm: string;
  selectedType: NoteTypeFilter;
  selectedDocument: string;
  selectedTag: string;
}