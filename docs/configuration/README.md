# Configuration Documentation

This directory contains system configuration guides and setup documentation.

## 📋 Documents

### [GPT-4.1 Configuration](./GPT4.1_CONFIGURATION.md)
**AI Model Configuration Guide**
- Complete GPT-4.1 setup across all endpoints
- Model performance comparison and optimization
- Environment variable configuration
- Cost considerations and monitoring
- Troubleshooting and rollback procedures

### [Storage Setup](./STORAGE_SETUP.md)
**Database and Storage Configuration**
- MongoDB setup and configuration
- Vector database (Qdrant) configuration
- Data persistence and backup strategies
- Performance optimization

## 🚀 Quick Start

### Environment Configuration
```bash
# AI Models
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1
GEMINI_API_KEY=...

# Database
MONGODB_URI=mongodb://localhost:27017/paperlm
QDRANT_URL=http://localhost:6333
```

### Model Testing
```bash
# Test GPT-4.1 integration
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "userId": "test"}'
```

## 🔧 Configuration Options

### GPT-4.1 Models
- **Global Setting**: `OPENAI_MODEL=gpt-4.1`
- **Individual Override**: `CHAT_MODEL=gpt-4.1`
- **Fallback Support**: Automatic model availability detection

### Storage Options
- **Local Development**: SQLite + Local Qdrant
- **Production**: MongoDB Atlas + Cloud Qdrant
- **Hybrid**: MongoDB + Self-hosted Qdrant

## 🐛 Troubleshooting

- **GPT-4.1 Issues**: Check [GPT-4.1 Configuration](./GPT4.1_CONFIGURATION.md#troubleshooting)
- **Database Connection**: Check [Storage Setup](./STORAGE_SETUP.md)
- **Model Performance**: Check [GPT-4.1 Configuration](./GPT4.1_CONFIGURATION.md#performance-monitoring)

## 📚 Related Documentation

- **[Development Workflow](../development/DEV_WORKFLOW.md)** - Development setup
- **[Deployment Checklist](../deployment/DEPLOYMENT_CHECKLIST.md)** - Production configuration
- **[Authentication](../authentication/)** - User system configuration