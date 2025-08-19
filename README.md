# PaperLM - NotebookLM Clone

A full-featured NotebookLM clone built with Next.js 15, featuring RAG (Retrieval Augmented Generation) capabilities for document analysis and AI-powered chat.

## ✨ Features

- **Multiple Input Methods**: Upload files, paste text, add YouTube videos, or import websites
- **Document Upload & Processing**: Support for PDF and text files with automatic chunking
- **AI-Powered Chat**: Ask questions about your uploaded documents
- **Smart Citations**: Get responses with source citations and relevance scores
- **Notebook System**: Create and manage notes, summaries, and insights
- **Three-Card Layout**: Card-based interface exactly like Google NotebookLM with fixed positioning
- **Modern Typography**: Inter font for professional, clean appearance
- **Smooth Animations**: Framer Motion animations for a polished user experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI/ML**: OpenAI GPT-4, Text Embeddings
- **Vector Database**: In-memory vector store (production-ready for Qdrant)
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment Setup**
   Create/update `.env.local` file:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   QDRANT_URL=your_qdrant_url_here  # Optional for production
   QDRANT_API_KEY=your_qdrant_key_here  # Optional for production
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
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
