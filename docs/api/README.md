# API Documentation

This directory contains API specifications and technical documentation.

## 📋 Documents

### [Session Isolation Documentation](./SESSION_ISOLATION_DOCS.md)
**API Session Management**
- Session isolation implementation
- User session handling
- API security patterns
- Session-based data management

## 🚀 API Overview

### Authentication Endpoints
```bash
GET  /api/user          # Get user data
POST /api/user          # Update user usage
GET  /api/user-id       # Get user ID
POST /api/user-id       # Generate/retrieve user ID
```

### Document Processing
```bash
POST /api/upload         # Upload documents
POST /api/scrape         # Scrape web content
POST /api/query          # Query documents
POST /api/generate-insights # Generate document insights
POST /api/format-document   # Format documents
```

### System APIs
```bash
POST /api/cleanup        # Cleanup expired data
POST /api/webhooks/clerk # Clerk webhook handler
```

## 🔐 API Security

### Authentication Required
All API endpoints require authentication except:
- `/api/cleanup` (public cleanup)
- Webhook endpoints with proper verification

### Request Format
```typescript
// Headers required for authenticated requests
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

### Response Format
```typescript
// Success response
{
  "success": true,
  "data": {...},
  "message": "Operation completed"
}

// Error response  
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE"
}
```

## 🔧 API Usage Examples

### User Authentication
```bash
# Get user data
curl -X GET http://localhost:3000/api/user \
  -H "Cookie: __session=..."

# Increment document usage
curl -X POST http://localhost:3000/api/user \
  -H "Content-Type: application/json" \
  -d '{"action": "increment_document"}'
```

### Document Operations
```bash
# Upload document
curl -X POST http://localhost:3000/api/upload \
  -F "file=@document.pdf" \
  -F "sessionId=user123"

# Query documents
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the main points?", "userId": "user123"}'
```

## 🐛 API Troubleshooting

### Common Issues
- **401 Unauthorized**: Check authentication headers
- **403 Forbidden**: Verify user permissions
- **500 Server Error**: Check server logs
- **Rate Limited**: Implement retry logic

### Error Codes
- `AUTH_REQUIRED`: Authentication needed
- `INVALID_INPUT`: Request validation failed
- `QUOTA_EXCEEDED`: Usage limits reached
- `SERVER_ERROR`: Internal server error

## 📚 Related Documentation

- **[Authentication Documentation](../authentication/AUTHENTICATION_DOCUMENTATION.md)** - Auth implementation
- **[Development Workflow](../development/DEV_WORKFLOW.md)** - API development
- **[Configuration Guide](../configuration/)** - API configuration