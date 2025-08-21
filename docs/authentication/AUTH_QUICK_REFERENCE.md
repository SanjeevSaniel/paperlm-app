# Authentication Quick Reference Guide

## Quick Setup Checklist

### Environment Variables
```bash
# Required for authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
MONGODB_URI=mongodb://...
```

### Import Statements
```typescript
// Auth store
import { useAuthData } from '@/stores/authStore';

// Clerk components
import { useUser, SignIn, SignUp, UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server'; // For API routes

// Authentication check
import { redirect } from 'next/navigation'; // For server components
```

## Common Code Patterns

### 1. Check Authentication in Component
```tsx
function MyComponent() {
  const { isAuthenticated, user, isLoading } = useAuthData();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;
  
  return <div>Welcome {user?.firstName}!</div>;
}
```

### 2. Protect API Route
```typescript
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Your API logic here
}
```

### 3. Increment Usage
```typescript
const handleUpload = async () => {
  const { incrementDocumentUsage } = useAuthData();
  const canUpload = await incrementDocumentUsage();
  
  if (!canUpload) {
    toast.error('Limit reached!');
    return;
  }
  
  // Proceed with upload
};
```

### 4. Conditional Rendering Based on Plan
```tsx
const { user } = useAuthData();
const isPro = user?.subscription.plan === 'pro';

return (
  <div>
    {isPro ? (
      <ProFeature />
    ) : (
      <FreeFeature />
    )}
  </div>
);
```

## Authentication Flow States

```typescript
// Initial load
isLoading: true, isAuthenticated: false, user: null

// User signed in, data loading
isLoading: true, isAuthenticated: true, user: null

// Fully loaded
isLoading: false, isAuthenticated: true, user: {...}

// Not signed in
isLoading: false, isAuthenticated: false, user: null
```

## API Response Examples

### User Data Response
```json
{
  "user": {
    "id": "user_2abc123",
    "clerkId": "user_2abc123", 
    "email": "john@example.com",
    "subscription": {
      "plan": "free",
      "status": "active"
    },
    "usage": {
      "documentsUploaded": 1,
      "messagesUsed": 3
    },
    "canUploadDocument": false,
    "canSendMessage": true
  }
}
```

### Error Response
```json
{
  "error": "Authentication required",
  "status": 401
}
```

## Troubleshooting Commands

```bash
# Check auth state in browser console
localStorage.getItem('auth-store')

# Clear auth state
localStorage.removeItem('auth-store')

# Check environment variables
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

## File Locations

```
src/
├── stores/authStore.ts              # Main auth store
├── components/AuthProvider.tsx      # Auth initialization
├── middleware.ts                    # Route protection
├── app/
│   ├── sign-in/                     # Sign in pages
│   ├── sign-up/                     # Sign up pages
│   ├── paper/                       # Main app (protected)
│   └── api/
│       ├── user/route.ts            # User data API
│       ├── user-id/route.ts         # User ID management
│       └── webhooks/clerk/route.ts  # Clerk webhooks
└── models/User.ts                   # User database model
```

## Testing Authentication

### Test User Creation
1. Go to `/sign-up`
2. Create test account
3. Should auto-redirect to `/paper`
4. Check browser console for auth state

### Test Route Protection
1. Sign out
2. Try to access `/paper/test-id`
3. Should redirect to `/sign-in`

### Test API Endpoints
```bash
# Without auth (should fail)
curl -X GET http://localhost:3000/api/user

# With auth (get token from browser dev tools)
curl -X GET http://localhost:3000/api/user \
  -H "Cookie: __session=..."
```