# GPT-4.1 Configuration Guide

## Overview
This document outlines the GPT-4.1 model configuration throughout the PaperLM application. All OpenAI API calls have been updated to use GPT-4.1 by default, with flexible configuration options.

## Current Configuration

### ✅ Files Updated for GPT-4.1

1. **`src/lib/openai.ts`** - Core OpenAI library
   - Default model: `gpt-4.1`
   - Configurable via `OPENAI_MODEL` environment variable
   - Used by: Document formatting, main chat completions

2. **`src/app/api/query/route.ts`** - Query processing
   - Model: `OPENAI_MODEL` (defaults to `gpt-4.1`)
   - Used for: Query variations and search optimization

3. **`src/app/api/generate-insights/route.ts`** - Insight generation
   - Model: `OPENAI_MODEL` (defaults to `gpt-4.1`)
   - Used for: Document summaries, insights, and quote extraction

4. **`src/app/api/format-document/route.ts`** - Document formatting
   - Model: Uses `generateChatCompletion` → `OPENAI_MODEL` (defaults to `gpt-4.1`)
   - Used for: Document structure and formatting

### Environment Configuration

**`.env.example` and `.env.local`:**
```bash
# Primary OpenAI Model Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1

# Optional: Individual model overrides (if needed)
CHAT_MODEL=gpt-4.1
INSIGHTS_MODEL=gpt-4.1
QUERY_VARIATIONS_MODEL=gpt-4.1
DOCUMENT_FORMAT_MODEL=gpt-4.1
```

## Model Usage by Feature

### 1. **Chat & Document Q&A** (`src/lib/openai.ts`)
- **Model**: `gpt-4.1` (via `OPENAI_MODEL`)
- **Purpose**: Main conversational interface
- **Configuration**: 
  - Temperature: 0.3
  - Max tokens: 900
  - System prompt: Document-grounded assistant

### 2. **Query Processing** (`src/app/api/query/route.ts`)
- **Model**: `gpt-4.1` (via `OPENAI_MODEL`)
- **Purpose**: Generate query variations for better search
- **Configuration**:
  - Temperature: 0.7
  - Max tokens: 150
  - Used for semantic search optimization

### 3. **Insight Generation** (`src/app/api/generate-insights/route.ts`)
- **Model**: `gpt-4.1` (via `OPENAI_MODEL`)
- **Purpose**: Document summaries, insights, quotes
- **Configuration**:
  - Temperature: 0.7
  - Max tokens: 1000
  - Multiple insight types supported

### 4. **Document Formatting** (`src/app/api/format-document/route.ts`)
- **Model**: `gpt-4.1` (via `generateChatCompletion`)
- **Purpose**: Format and structure documents
- **Configuration**:
  - Uses default chat completion settings
  - Markdown formatting focus

### 5. **YouTube Processing** (`src/app/api/scrape/route.ts`)
- **Model**: `gemini-2.5-flash` (Google AI)
- **Purpose**: YouTube transcript summarization
- **Note**: Uses Gemini, not OpenAI GPT models

## Configuration Options

### Option 1: Global Model Setting (Recommended)
Set one model for all OpenAI operations:
```bash
OPENAI_MODEL=gpt-4.1
```

### Option 2: Individual Model Configuration
Override specific use cases:
```bash
# Global default
OPENAI_MODEL=gpt-4.1

# Specific overrides (if needed)
CHAT_MODEL=gpt-4o
INSIGHTS_MODEL=gpt-4.1
```

### Option 3: Runtime Model Selection
For advanced use cases, models can be selected programmatically:
```typescript
import { OPENAI_MODEL } from '@/lib/openai';

// Use the configured model
const response = await openai.chat.completions.create({
  model: OPENAI_MODEL,
  messages: [...],
});
```

## Model Comparison

| Model | Speed | Cost | Quality | Best For |
|-------|-------|------|---------|----------|
| gpt-4.1 | Fast | Moderate | High | Balanced performance |
| gpt-4o | Fastest | Low | Good | High-volume operations |
| gpt-4 | Slow | High | Highest | Complex reasoning |

## Testing GPT-4.1 Integration

### 1. **Chat Functionality**
```bash
# Test main chat interface
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the main points?", "userId": "test"}'
```

### 2. **Document Insights**
```bash
# Test insight generation
curl -X POST http://localhost:3000/api/generate-insights \
  -H "Content-Type: application/json" \
  -d '{"documentIds": ["doc1"], "type": "summary"}'
```

### 3. **Document Formatting**
```bash
# Test document formatting
curl -X POST http://localhost:3000/api/format-document \
  -H "Content-Type: application/json" \
  -d '{"content": "test content", "documentName": "test.txt"}'
```

## Cost Considerations

### GPT-4.1 Pricing (Approximate)
- **Input tokens**: ~$0.01 per 1K tokens
- **Output tokens**: ~$0.03 per 1K tokens
- **Typical chat**: ~$0.02-0.05 per interaction
- **Document processing**: ~$0.10-0.50 per document

### Optimization Strategies
1. **Token Management**: Limit max_tokens based on use case
2. **Caching**: Cache frequent queries where possible
3. **Selective Upgrading**: Use gpt-4o for simple tasks, gpt-4.1 for complex ones
4. **User Limits**: Implement usage limits for free users

## Performance Monitoring

### Key Metrics to Track
- **Response Time**: GPT-4.1 should be faster than GPT-4
- **Token Usage**: Monitor input/output token consumption
- **Success Rate**: Track completion success/failure rates
- **User Satisfaction**: Quality of generated content

### Logging
Each API endpoint logs model usage:
```typescript
console.log(`🤖 Using model: ${OPENAI_MODEL} for ${operation}`);
```

## Rollback Plan

If issues arise with GPT-4.1:

### Quick Rollback
```bash
# Change environment variable
OPENAI_MODEL=gpt-4o-mini

# Restart application
npm run dev
```

### Gradual Rollback
Update individual endpoints:
```typescript
// In specific API route
const model = 'gpt-4o-mini'; // Override global setting
```

## Model Availability

### Verify GPT-4.1 Access
```typescript
// Test model availability
const models = await openai.models.list();
const gpt41Available = models.data.find(m => m.id === 'gpt-4.1');
console.log('GPT-4.1 available:', !!gpt41Available);
```

### Fallback Configuration
```typescript
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 
  (await checkModelAvailability('gpt-4.1') ? 'gpt-4.1' : 'gpt-4o-mini');
```

## Troubleshooting

### Common Issues

#### 1. **Model Not Found Error**
```
Error: model 'gpt-4.1' not found
```
**Solution**: Check OpenAI API key has GPT-4.1 access, or fallback to gpt-4o

#### 2. **Rate Limiting**
```
Error: Rate limit exceeded
```
**Solution**: Implement retry logic with exponential backoff

#### 3. **Token Limit Exceeded**
```
Error: Maximum context length exceeded
```
**Solution**: Reduce input size or increase max_tokens limit

#### 4. **Poor Response Quality**
- **Check prompts**: Ensure clear, specific instructions
- **Adjust temperature**: Lower for consistency, higher for creativity
- **Review context**: Provide relevant, focused context

## Development Workflow

### Adding New GPT-4.1 Endpoints
1. Import the model configuration:
   ```typescript
   import { OPENAI_MODEL } from '@/lib/openai';
   ```

2. Use in API calls:
   ```typescript
   const response = await openai.chat.completions.create({
     model: OPENAI_MODEL,
     messages: [...],
   });
   ```

3. Add logging:
   ```typescript
   console.log(`🤖 Using ${OPENAI_MODEL} for [operation]`);
   ```

### Best Practices
- **Always use** `OPENAI_MODEL` instead of hardcoded model names
- **Test thoroughly** with different model configurations
- **Monitor costs** and performance in production
- **Implement fallbacks** for model unavailability

---

## Summary

✅ **GPT-4.1 Successfully Configured** across all OpenAI API endpoints
✅ **Flexible Configuration** via environment variables  
✅ **Backward Compatible** with model fallback options
✅ **Production Ready** with monitoring and rollback plans

The application is now optimized to use GPT-4.1's improved performance and capabilities while maintaining flexibility for different deployment scenarios.