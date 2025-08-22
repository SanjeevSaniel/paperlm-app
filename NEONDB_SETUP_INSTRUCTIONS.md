# NeonDB Setup Instructions

## Quick Setup

### 1. Get Your NeonDB Connection String

1. **Log into your NeonDB Console**
   - Visit: https://console.neon.tech/
   - Navigate to your project

2. **Get PostgreSQL Connection String**
   - Go to "Connection Details" 
   - Copy the PostgreSQL connection string
   - It should look like: `postgresql://username:password@hostname/database?sslmode=require`

3. **Update Environment Variables**
   - Replace the placeholder in `.env.local`:
   ```bash
   # Replace this line:
   NEON_DATABASE_URL=postgresql://username:password@app-dry-boat-65777059.dpl.myneon.app/main?sslmode=require
   
   # With your actual connection string:
   NEON_DATABASE_URL=postgresql://your_username:your_password@your_host/your_database?sslmode=require
   ```

### 2. Initialize Database

```bash
# Push the schema to your NeonDB database
npm run db:push
```

### 3. Test Connection

```bash
# Test the database connection
curl http://localhost:3001/api/test-neon
```

You should see:
```json
{
  "status": "success",
  "message": "NeonDB connection successful",
  "timestamp": "2025-08-21T23:52:00.000Z"
}
```

## What's Been Implemented

### ✅ Database Schema
- **Users table** - Clerk user data, subscriptions, usage tracking
- **Documents table** - File metadata, processing status, content
- **Conversations table** - Chat conversation management
- **Messages table** - Individual chat messages with citations
- **Notes table** - User notes and auto-generated summaries
- **User Sessions table** - Session activity tracking

### ✅ Repository Pattern
- **UserRepository** - User CRUD operations and business logic
- **DocumentRepository** - Document management and status tracking
- **ConversationRepository** & **MessageRepository** - Chat functionality
- **NotesRepository** - Notes management with search and tagging
- **SessionRepository** - Session activity and statistics

### ✅ API Endpoints
- **`/api/user`** - User management (updated for NeonDB)
- **`/api/upload`** - Document upload (now stores metadata in NeonDB)
- **`/api/documents`** - Document CRUD operations
- **`/api/chat`** - Chat conversations and messages
- **`/api/notes`** - Notes management
- **`/api/test-neon`** - Database connection testing

### ✅ Integration Points
- **Clerk Authentication** → **NeonDB User Management**
- **File Upload** → **NeonDB Metadata** + **Qdrant Vectors**
- **Chat System** → **NeonDB Storage** + **AI Processing**
- **Notes System** → **NeonDB Storage** with search capabilities

## Current Architecture

```
User Authentication (Clerk) → App Logic → Data Storage
                                    ├── Structured Data (NeonDB)
                                    └── Vector Embeddings (Qdrant)
```

### Data Flow
1. **User signs up/in** via Clerk
2. **User record created/updated** in NeonDB
3. **Documents uploaded** → metadata stored in NeonDB, vectors in Qdrant
4. **Chat conversations** → stored in NeonDB with message history
5. **Notes generated/created** → stored in NeonDB with document associations

## Benefits of This Setup

1. **Scalability** - NeonDB auto-scales PostgreSQL
2. **Data Integrity** - ACID compliance for user data
3. **Performance** - Proper indexing and relationships
4. **Developer Experience** - Type-safe ORM with Drizzle
5. **Separation of Concerns** - Each database optimized for its purpose

## Next Steps

Once you have the correct NeonDB connection string:

1. **Update `.env.local`** with your actual connection string
2. **Run `npm run db:push`** to create the database schema
3. **Test the connection** with `/api/test-neon`
4. **Use the app** - uploads, chat, and notes will now use NeonDB

## Need Help?

- Check the full documentation: `/docs/database/NEONDB_INTEGRATION.md`
- Test API endpoints manually to verify functionality
- Monitor the NeonDB console for query performance and connection status

---

**Important**: The app will work with the placeholder connection string, but database operations will fail until you provide the correct NeonDB credentials.