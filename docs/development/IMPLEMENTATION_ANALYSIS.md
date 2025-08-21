# PaperLM Implementation Analysis & Documentation

## Project Overview
PaperLM is a Next.js-based RAG (Retrieval Augmented Generation) system that allows users to upload documents, ask questions about them, and receive AI-powered responses with relevant citations. The app implements a complete document analysis pipeline with session-based persistence and automatic cleanup.

## RAG System Analysis

### Architecture Comparison with Standard RAG Pipeline

Our implementation follows the standard RAG architecture as shown in `public/RAG_working.webp`:

#### ✅ **Properly Implemented Components:**

1. **Data Preparation Pipeline (Steps A-D)**
   - **Raw Data Sources (A)** → `src/app/api/upload/route.ts` - Handles file uploads with 10MB limit
   - **Information Extraction (B)** → `src/lib/documentProcessing.ts:extractTextFromFile()` - Supports PDF, TXT, MD files
   - **Chunking (C)** → `src/lib/documentProcessing.ts:chunkDocument()` - Uses LangChain RecursiveCharacterTextSplitter
     - Chunk size: 1000 characters
     - Overlap: 200 characters  
     - Smart separators: `['\n\n', '\n', '.', '!', '?', ';', ':', ' ']`
   - **Embedding (D)** → `src/lib/qdrant.ts:addDocuments()` - OpenAI text-embedding-ada-002 (1536 dimensions)

2. **Vector Database**
   - **Technology**: Qdrant with Cosine similarity
   - **Collection**: `paperlm_documents`
   - **Configuration**: 1536-dim vectors with enhanced metadata
   - **Payload includes**: content, documentId, chunkId, timestamps, session info

3. **Query Processing (Steps 1-5)**
   - **Query Embedding (1)** → `src/lib/qdrant.ts:similaritySearch()` - Embeds user query
   - **Retrieval (3)** → Returns top 5 most relevant document chunks
   - **LLM Generation (4)** → `src/lib/openai.ts:generateChatCompletion()` with context
   - **Response (5)** → Returns AI response with citations and relevance scores

## Recent Implementations & Fixes

### 1. Session-Based Data Persistence ✅
**Issue**: User data (uploads, chats, notes) not persisting across page refreshes
**Solution**: Comprehensive session storage system

#### Files Modified:
- `src/lib/sessionStorage.ts` (NEW)
  - 48-hour session expiration
  - Unified storage for documents, chat messages, notebook notes
  - Automatic cleanup of expired sessions

- `src/components/panels/AIChatPanel.tsx`
  - Integrated session storage for chat history
  - Backward compatibility with localStorage
  - API sync for authenticated users

- `src/components/panels/SmartNotebookPanel.tsx`
  - Session persistence for notebook notes
  - Sample data initialization
  - Real-time saving on changes

- `src/components/panels/DocumentSourcesPanel.tsx`
  - Session-based document loading
  - Enhanced tempId generation for React keys

### 2. 48-Hour Automatic Cleanup System ✅
**Issue**: Uploaded files and vector data accumulating without cleanup
**Solution**: Complete automated cleanup system

#### Files Modified:
- `src/lib/cleanupDatabase.ts` (NEW)
  - SQLite database for tracking uploaded files
  - Tracks Cloudinary public_ids, upload timestamps, expiration dates
  - Cleanup statistics and old record deletion

- `src/app/api/cleanup/route.ts`
  - Comprehensive cleanup endpoint
  - Removes expired data from Cloudinary, Qdrant, and local storage
  - Vercel cron job support with security headers

- `src/app/api/upload/route.ts`
  - Integrated cleanup record creation
  - Tracks all uploads for future deletion

- `src/lib/qdrant.ts`
  - Enhanced payload with cleanup metadata
  - `cleanupAnonymousVectorsOlderThan()` function

### 3. Chat Window Scrolling Fix ✅
**Issue**: Long conversations causing app height to increase instead of scrolling within container
**Solution**: Fixed CSS overflow constraints

#### Files Modified:
- `src/components/ui/Card.tsx`
  - Added `overflow-hidden min-h-0` to CardContent
  - Ensures proper flexbox height constraints

- `src/components/panels/AIChatPanel.tsx`
  - Added `max-h-full` to messages container
  - Enhanced scroll behavior for long conversations

### 4. React Key Error Fix ✅
**Issue**: "Each child in a list should have a unique key prop" in DocumentSourcesPanel
**Solution**: Enhanced tempId generation

#### File Modified:
- `src/components/panels/DocumentSourcesPanel.tsx`
  - Changed from `Math.random().toString(36).substr(2, 9)`
  - To `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  - Ensures unique keys across multiple uploads

## File Storage System

### Architecture
- **Primary**: Cloudinary (production CDN with automatic optimization)
- **Fallback**: MongoDB GridFS (when Cloudinary unavailable)  
- **Development**: Local metadata storage

### Cleanup Integration
- Cloudinary public_ids tracked in cleanup database
- Automatic deletion after 48 hours
- Graceful error handling for failed deletions

## Database Schema

### MongoDB Collections
1. **documents** - User document metadata
2. **users** - User profiles and settings
3. **chunks** - Document chunk references

### SQLite (Cleanup Database)
```sql
CREATE TABLE cleanup_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    documentId TEXT UNIQUE NOT NULL,
    sessionId TEXT NOT NULL,
    cloudinaryPublicId TEXT,
    uploadedAt TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    isAnonymous BOOLEAN NOT NULL,
    fileName TEXT NOT NULL,
    fileType TEXT NOT NULL,
    fileSize INTEGER NOT NULL,
    cleaned BOOLEAN DEFAULT FALSE,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
)
```

## Security & Privacy

### Anonymous User Support
- Session-based storage for non-authenticated users
- Automatic 48-hour data expiration
- No permanent storage without explicit consent

### Data Protection
- Secure file upload with size limits (10MB)
- API key protection with environment variables
- Session-based access control

## Performance Optimizations

### Vector Search
- Efficient similarity search with top-k retrieval
- Metadata filtering for user/session isolation
- Batch processing for document chunks

### UI/UX Improvements
- Collapsible panels for space optimization
- Real-time typing indicators
- Smooth animations with Framer Motion
- Responsive design for mobile/desktop

## Current System Status

### ✅ Fully Implemented
- RAG pipeline matching industry standards
- Session-based data persistence 
- Automatic cleanup system
- Chat window scrolling fixes
- React key error resolution
- File upload and processing
- Vector similarity search
- AI response generation with citations

### 📊 System Health
- **Storage**: Cloudinary + MongoDB + Qdrant
- **Cleanup**: Automated 48-hour cycle
- **Session Management**: 48-hour TTL with graceful expiration
- **Error Handling**: Comprehensive error boundaries
- **Performance**: Optimized vector search and UI rendering

## Next.js App Structure

```
src/
├── app/
│   ├── api/
│   │   ├── cleanup/route.ts (cleanup system)
│   │   ├── upload/route.ts (file processing)
│   │   └── query/route.ts (RAG queries)
│   └── page.tsx (main app entry)
├── components/
│   ├── panels/
│   │   ├── AIChatPanel.tsx (chat interface)
│   │   ├── DocumentSourcesPanel.tsx (file management)
│   │   └── SmartNotebookPanel.tsx (note taking)
│   └── ui/ (shared UI components)
├── lib/
│   ├── sessionStorage.ts (session management)
│   ├── cleanupDatabase.ts (cleanup tracking)
│   ├── documentProcessing.ts (text extraction & chunking)
│   ├── qdrant.ts (vector operations)
│   └── openai.ts (LLM integration)
└── contexts/ (React context providers)
```

## Environment Variables Required
```bash
# Core Services
OPENAI_API_KEY=sk-...
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...
MONGODB_URI=mongodb://...

# File Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Security
CLERK_SECRET_KEY=...
CRON_SECRET=...
```

## Conclusion
The PaperLM implementation successfully follows the standard RAG architecture with additional enterprise features including session management, automatic cleanup, and comprehensive error handling. All major issues have been resolved and the system is production-ready with proper data lifecycle management.