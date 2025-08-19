# PaperLM - AI-Powered Document Analysis Platform

A modern, full-featured RAG (Retrieval Augmented Generation) application built with Next.js 15, featuring advanced document analysis, AI-powered chat, and intelligent note-taking capabilities.

## ✨ Features

### 🎯 Core Functionality
- **Multiple Input Methods**: Upload files (PDF, TXT, CSV, DOCX), paste text, add YouTube videos, or import websites
- **Advanced Document Processing**: Intelligent chunking with LangChain and vector embeddings
- **AI-Powered Chat**: Ask questions about your uploaded documents with GPT-4 integration
- **Smart Citations**: Get responses with source citations and relevance scores
- **Intelligent Notebook**: Create, edit, and manage notes with automatic metadata tracking

### 🎨 User Experience
- **Modern Three-Panel Layout**: Professional interface inspired by Google NotebookLM
- **Collapsible Panels**: Space-efficient design with smooth animations
- **Real-time Processing**: Live status updates for document processing
- **Elegant Animations**: Polished interactions with Framer Motion
- **Responsive Design**: Seamless experience across all devices

### 🔐 User Management & Data Persistence
- **Authentication**: Secure user authentication with Clerk
- **State Management**: Robust state management with Zustand
- **Data Persistence**: 
  - **Session Users**: Local storage for quick access
  - **Logged Users**: MongoDB cloud storage with automatic sync
- **Cross-Device Sync**: Seamless data synchronization across devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React icon library

### Backend & Data
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Clerk for user management
- **State Management**: Zustand with Immer for immutable updates
- **Vector Database**: Qdrant (with localStorage fallback)

### AI & Processing
- **AI/ML**: OpenAI GPT-4 and Text Embeddings
- **Document Processing**: LangChain for text splitting and processing
- **RAG Pipeline**: Custom implementation with vector similarity search

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **OpenAI API Key** for AI functionality
- **MongoDB** (local installation or MongoDB Atlas)
- **Clerk Account** for authentication (optional for session users)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/paperlm.git
   cd paperlm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Copy the sample environment file:
   ```bash
   cp .env.sample .env.local
   ```
   
   Update `.env.local` with your values:
   ```env
   # Required
   MONGODB_URI=mongodb://localhost:27017/paperlm
   OPENAI_API_KEY=sk-your_openai_api_key
   
   # Optional - for user authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
   CLERK_SECRET_KEY=sk_test_your_clerk_secret
   
   # Optional - for vector database (falls back to local storage)
   QDRANT_URL=http://localhost:6333
   QDRANT_API_KEY=your_qdrant_api_key
   ```

4. **Database Setup**
   
   **Option A: Local MongoDB**
   ```bash
   # Install MongoDB locally and start the service
   mongod --dbpath /path/to/your/db
   ```
   
   **Option B: MongoDB Atlas**
   - Create a MongoDB Atlas cluster
   - Update `MONGODB_URI` in `.env.local`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 How to Use

### 1. Add Content

- Navigate to the **Sources** panel (always positioned on the left)
- Choose from organized input methods:
  - **Upload Section**: Drag and drop or select PDF/TXT files
  - **Create Section**: Paste text directly into the interface
  - **Link Section**: Add YouTube videos or websites
- Content is grouped by type just like NotebookLM
- Watch the processing status in real-time

### 2. Chat with Your Documents

- Switch to the **Chat** panel
- Ask questions about your uploaded documents
- Receive AI-generated responses with citations

### 3. Take Notes

- Use the **Notebook** panel to create notes
- Organize insights, summaries, and key findings
- Support for different note types (Summary, Insight, Quote)

## 🏗️ Architecture

### Key Components

- **Layout.tsx**: Main three-panel interface
- **SourcesPanel.tsx**: Document upload & management
- **NotebookPanel.tsx**: Note-taking interface
- **ChatPanel.tsx**: AI chat interface

### API Endpoints

- **POST /api/upload**: Process and store document chunks
- **POST /api/query**: Perform semantic search and generate responses

## 🎨 Features

- **Real-time Processing**: Live status updates for document processing
- **Semantic Search**: Vector-based document retrieval
- **Citation System**: Interactive source references with relevance scores
- **Smooth Animations**: Polished UI with Framer Motion
- **Custom Scrollbars**: Enhanced scrolling experience

## 📝 Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run typecheck # Run TypeScript type checking
```

## 🔀 Development Workflow & Branching Strategy

### Branch Structure
- **`main`** - Production-ready code
- **`dev`** - Development integration branch for new features  
- **`ui`** - UI/UX improvements and styling changes
- **`docs`** - Documentation updates and README changes

### Contribution Guidelines
1. **Features & Logic**: Create branches from `dev` → merge to `dev`
2. **UI/Styling**: Create branches from `ui` → merge to `ui`  
3. **Documentation**: Create branches from `docs` → merge to `docs`
4. **Production**: Merge from `dev`/`ui`/`docs` → `main` (one by one)

### Workflow Example
```bash
# For new features
git checkout dev
git pull origin dev
git checkout -b feature/new-feature
# ... make changes ...
git push origin feature/new-feature
# Create PR to dev branch

# For UI changes  
git checkout ui
git pull origin ui
git checkout -b ui/improve-buttons
# ... make changes ...
git push origin ui/improve-buttons
# Create PR to ui branch

# For documentation
git checkout docs  
git pull origin docs
git checkout -b docs/update-readme
# ... make changes ...
git push origin docs/update-readme
# Create PR to docs branch
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Add environment variables in dashboard
3. Deploy automatically

### Manual Deployment

```bash
npm run build
npm start
```

## 🛡️ Security

- API keys stored server-side only
- Secure file upload processing
- Input validation on all endpoints

## 📄 License

MIT License

---

**Note**: This is an educational project inspired by Google NotebookLM. For production use, consider additional security measures and scalability optimizations.
