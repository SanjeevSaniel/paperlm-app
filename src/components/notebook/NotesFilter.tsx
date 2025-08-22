'use client';

import { Search } from 'lucide-react';
import { Input } from '../ui';
import { FilterState, NoteTypeFilter, Document } from './types';

/**
 * Props for the NotesFilter component
 */
interface NotesFilterProps {
  /** Current filter state */
  filters: FilterState;
  /** Available documents for filtering */
  documents: Document[];
  /** Available tags for filtering */
  availableTags: string[];
  /** Callback when filters change */
  onFiltersChange: (filters: FilterState) => void;
}

/**
 * NotesFilter provides filtering and search controls for notes
 * 
 * Features:
 * - Text search across note content
 * - Filter by note type (summary, insight, quote)
 * - Filter by source document
 * - Filter by tags
 * - Real-time filter updates
 * 
 * @param props - The component props
 * @returns JSX element representing the notes filter controls
 */
export default function NotesFilter({
  filters,
  documents,
  availableTags,
  onFiltersChange,
}: NotesFilterProps) {
  
  /**
   * Update a specific filter value
   */
  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className='space-y-3 mb-4'>
      {/* Search Input */}
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
        <Input
          type='text'
          placeholder='Search notes...'
          value={filters.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
          className='pl-10 h-9 text-sm'
        />
      </div>

      {/* Filter Controls */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
        {/* Note Type Filter */}
        <select
          value={filters.selectedType}
          onChange={(e) => updateFilter('selectedType', e.target.value as NoteTypeFilter)}
          className='px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'>
          <option value='all'>All Types</option>
          <option value='summary'>📖 Summary</option>
          <option value='insight'>💡 Insight</option>
          <option value='quote'>💬 Quote</option>
        </select>

        {/* Document Filter */}
        <select
          value={filters.selectedDocument}
          onChange={(e) => updateFilter('selectedDocument', e.target.value)}
          className='px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'>
          <option value=''>All Documents</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              📄 {doc.name.length > 30 ? doc.name.substring(0, 30) + '...' : doc.name}
            </option>
          ))}
        </select>

        {/* Tag Filter */}
        <select
          value={filters.selectedTag}
          onChange={(e) => updateFilter('selectedTag', e.target.value)}
          className='px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'>
          <option value=''>All Tags</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              🏷️ {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Active Filters Count */}
      {(filters.searchTerm || 
        filters.selectedType !== 'all' || 
        filters.selectedDocument || 
        filters.selectedTag) && (
        <div className='text-xs text-gray-500'>
          {[
            filters.searchTerm && 'search',
            filters.selectedType !== 'all' && 'type',
            filters.selectedDocument && 'document',
            filters.selectedTag && 'tag'
          ].filter(Boolean).length} active filter(s)
        </div>
      )}
    </div>
  );
}