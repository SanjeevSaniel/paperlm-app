export interface Document {
  id: string;
  name: string;
  content: string;
  metadata: {
    size: number;
    type: string;
    uploadedAt: Date;
    chunksCount?: number;
  };
  status: 'uploading' | 'processing' | 'ready' | 'error';
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: {
    chunkIndex: number;
    startChar: number;
    endChar: number;
  };
  embedding?: number[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
}

export interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  chunkId: string;
  content: string;
  startChar: number;
  endChar: number;
  relevanceScore: number;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  document: Document;
}

export type PanelType = 'sources' | 'notebook' | 'chat';

export interface AppState {
  documents: Document[];
  messages: ChatMessage[];
  activePanel: PanelType;
  selectedDocument?: string;
  isLoading: boolean;
}