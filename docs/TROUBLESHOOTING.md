# PaperLM Troubleshooting Guide

## 🚨 Common Issues and Solutions

### Authentication Errors

#### Error: "Failed to get user ID from API"

**Symptoms**: User gets redirected to sign-in page with this error after successful signup/signin.

**Possible Causes:**
1. **Clerk API Key Issues**
   - Missing or incorrect `CLERK_SECRET_KEY` environment variable
   - API key doesn't have proper permissions

2. **Clerk User Profile Issues**
   - User doesn't have email address in profile
   - Clerk profile not fully created

3. **Database Connection Issues**
   - MongoDB connection failing
   - `userIdPersistence` functions throwing errors

**Debugging Steps:**
1. **Check Browser Console**
   ```javascript
   // Look for detailed error logs in console
   // Should show HTTP status and error details
   ```

2. **Check Server Logs**
   ```bash
   # Look for these log entries:
   User-ID API called: { clerkUserId, action, hasBody }
   Clerk API response status: 200
   Retrieved user email: present
   ```

3. **Verify Environment Variables**
   ```bash
   # Check that these are set:
   echo $CLERK_SECRET_KEY
   echo $MONGODB_URI
   ```

**Solutions:**

##### Solution 1: Fix Clerk Configuration
```bash
# 1. Verify Clerk Secret Key
# Go to Clerk Dashboard > API Keys
# Copy the Secret Key (starts with sk_)

# 2. Update environment variable
CLERK_SECRET_KEY=sk_live_your_actual_secret_key_here
```

##### Solution 2: Check User Email
If user doesn't have email in profile:
```typescript
// The API will now show: "Retrieved user email: missing"
// User needs to add email to their Clerk profile
```

##### Solution 3: Database Connection
```bash
# Test MongoDB connection
mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')"

# If connection fails, check:
# 1. MongoDB is running
# 2. Connection string is correct  
# 3. Network access (for Atlas)
```

#### Error: "Authentication required" on API calls

**Quick Fix:**
```typescript
// Check if user is signed in before API calls
const { isSignedIn, user } = useUser();

if (!isSignedIn) {
  // Redirect to sign in
  router.push('/sign-in');
  return;
}

// Proceed with API call
```

### GPT-4.1 Configuration Issues

#### Error: "model 'gpt-4.1' not found"

**Solution:**
```bash
# 1. Check OpenAI API key has GPT-4.1 access
# 2. Fallback to gpt-4o if needed:
OPENAI_MODEL=gpt-4o

# 3. Test API access:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" | grep gpt-4
```

### Build Issues

#### TypeScript Errors

**MongoDB Type Error:**
```typescript
// If you see MongoDB type errors in build:
// This is a known issue and doesn't affect functionality
// Can be ignored or fixed by updating mongoose types
```

**Auth Store Type Errors:**
```typescript
// Make sure auth store is properly imported:
import { useAuthData } from '@/stores/authStore';
// Not: import { useAuthStore } from '@/stores/authStore';
```

## 🔧 Quick Fixes

### Reset Authentication State
```bash
# Clear auth state in browser
localStorage.removeItem('auth-store')
# Then refresh page
```

### Test API Endpoints
```bash
# Test user-id endpoint
curl -X POST http://localhost:3000/api/user-id \
  -H "Content-Type: application/json" \
  -d '{"action": "get_or_create"}' \
  -b "cookie-from-browser"

# Test user endpoint  
curl -X GET http://localhost:3000/api/user \
  -b "cookie-from-browser"
```

### Verify Environment Setup
```bash
# Check all required variables are set
node -e "
console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? 'SET' : 'MISSING');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'MISSING');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'MISSING');
"
```

## 🐛 Development Debugging

### Enable Detailed Logging
Add to your `.env.local`:
```bash
# Enable debug logging
DEBUG=true
NODE_ENV=development
```

### Browser DevTools Setup
1. **Open DevTools** (F12)
2. **Go to Application tab** → Local Storage
3. **Check `auth-store`** for current state
4. **Monitor Network tab** for API calls
5. **Check Console** for error logs

### Server-Side Debugging
```typescript
// Add to API routes for debugging:
console.log('Request body:', req.body);
console.log('Auth state:', { userId });
console.log('Environment check:', {
  hasClerkKey: !!process.env.CLERK_SECRET_KEY,
  hasMongoUri: !!process.env.MONGODB_URI
});
```

## 📞 Getting Help

### Information to Gather
When reporting issues, include:
1. **Error message** (exact text)
2. **Browser console** logs
3. **Server logs** (if available)
4. **Environment** (dev/production)
5. **Steps to reproduce**

### Useful Commands
```bash
# System info
node --version
npm --version

# Package info
npm list @clerk/nextjs
npm list openai
npm list mongoose

# Build test
npm run build --no-lint
```

---

**Need more help?** Check the specific documentation:
- **[Authentication Issues](./authentication/AUTHENTICATION_DOCUMENTATION.md#troubleshooting)**
- **[Development Issues](./development/DEV_WORKFLOW.md#common-development-issues)**
- **[Deployment Issues](./deployment/DEPLOYMENT_CHECKLIST.md#rollback-plan)**