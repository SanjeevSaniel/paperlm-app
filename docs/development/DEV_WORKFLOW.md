# Development Workflow Guide

## Getting Started with Authentication System

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd paperlm
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Fill in your development keys
   ```

3. **Required Environment Variables**
   ```bash
   # Clerk (Development)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_WEBHOOK_SECRET=whsec_...
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/paperlm-dev
   
   # AI Services  
   OPENAI_API_KEY=sk-...
   GEMINI_API_KEY=...
   
   # Qdrant
   QDRANT_URL=http://localhost:6333
   QDRANT_API_KEY=optional-for-dev
   ```

4. **Development Services**
   ```bash
   # Start MongoDB (if local)
   mongod
   
   # Start Qdrant (if local)
   docker run -p 6333:6333 qdrant/qdrant
   
   # Start Next.js dev server
   npm run dev
   ```

### Development Workflow

#### Working with Authentication

1. **Testing Authentication Locally**
   ```bash
   # Start dev server
   npm run dev
   
   # Open http://localhost:3000
   # Test sign-up flow
   # Test sign-in flow  
   # Test protected routes
   ```

2. **Common Development Tasks**
   ```typescript
   // Add authentication to new component
   import { useAuthData } from '@/stores/authStore';
   
   function NewComponent() {
     const { isAuthenticated, user } = useAuthData();
     
     if (!isAuthenticated) {
       return <div>Please sign in</div>;
     }
     
     return <div>Hello {user?.firstName}</div>;
   }
   ```

3. **Add Authentication to New API Route**
   ```typescript
   // src/app/api/new-endpoint/route.ts
   import { auth } from '@clerk/nextjs/server';
   import { NextRequest, NextResponse } from 'next/server';
   
   export async function POST(request: NextRequest) {
     const { userId } = await auth();
     
     if (!userId) {
       return NextResponse.json(
         { error: 'Authentication required' }, 
         { status: 401 }
       );
     }
     
     // Your API logic here
   }
   ```

#### Code Review Guidelines

##### Authentication Code Reviews

**✅ Check for these items:**
- [ ] All API routes check authentication
- [ ] Components handle loading states
- [ ] Error states are handled gracefully
- [ ] No sensitive data in client code
- [ ] Proper TypeScript types used
- [ ] Auth store used instead of local state

**❌ Red flags to watch for:**
- API routes without `auth()` check
- localStorage for user data storage
- Hardcoded user IDs or emails
- Missing error handling
- Direct Clerk API calls (use auth store instead)
- Unprotected sensitive operations

##### Example Code Review Comments

```typescript
// ❌ Bad: No authentication check
export async function POST(request: NextRequest) {
  const data = await request.json();
  // Process sensitive data without auth check
}

// ✅ Good: Proper authentication
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const data = await request.json();
  // Process data safely
}
```

### Testing Strategy

#### Unit Tests
```bash
# Run tests
npm test

# Test specific auth components
npm test -- --grep="auth"
```

#### Integration Tests
```typescript
// Example auth integration test
describe('Authentication Flow', () => {
  it('should redirect unauthenticated users', async () => {
    const response = await fetch('/api/user');
    expect(response.status).toBe(401);
  });
  
  it('should allow authenticated users', async () => {
    // Mock authentication
    const response = await authenticatedRequest('/api/user');
    expect(response.status).toBe(200);
  });
});
```

#### Manual Testing Checklist
- [ ] Sign-up flow works
- [ ] Sign-in flow works  
- [ ] Auto-redirect after signup works
- [ ] Protected routes redirect to login
- [ ] User data persists across page refresh
- [ ] Usage limits work correctly
- [ ] Error states display properly

### Common Development Issues

#### Issue: "Authentication required" on API calls
**Cause**: Missing authentication check or invalid session

**Solution**:
1. Check browser dev tools for auth cookies
2. Verify API route has `auth()` call
3. Check Clerk environment variables

#### Issue: User data not persisting
**Cause**: AuthProvider not wrapping app or store not configured

**Solution**:
```tsx
// Ensure AuthProvider wraps your app
export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ClerkProvider>
  );
}
```

#### Issue: Infinite loading state
**Cause**: AuthProvider not setting initialized state

**Debug**:
```typescript
// Add debugging to AuthProvider
useEffect(() => {
  console.log('Auth state:', { isLoaded, isSignedIn, isInitialized });
}, [isLoaded, isSignedIn, isInitialized]);
```

#### Issue: Build failures
**Common causes**:
- TypeScript errors in auth components
- Missing environment variables
- Import/export issues

**Solution**:
```bash
# Check build locally
npm run build

# Fix TypeScript errors
npx tsc --noEmit
```

### Git Workflow

#### Branch Naming
```bash
# Feature branches
git checkout -b feature/auth-improvement
git checkout -b feature/user-profile-update

# Bug fix branches  
git checkout -b fix/auth-redirect-issue
git checkout -b fix/usage-limit-bug

# Hot fix branches
git checkout -b hotfix/security-patch
```

#### Commit Messages
```bash
# Good commit messages
git commit -m "feat(auth): add automatic redirect after signup"
git commit -m "fix(auth): resolve infinite loading state issue"
git commit -m "refactor(auth): move user data to Zustand store"

# Bad commit messages
git commit -m "fix auth"
git commit -m "update code" 
git commit -m "changes"
```

#### Pull Request Template
```markdown
## Description
Brief description of changes

## Authentication Changes
- [ ] Added/modified API authentication  
- [ ] Updated user state management
- [ ] Modified route protection
- [ ] Updated user interface

## Testing
- [ ] Manual testing completed
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] No authentication regressions

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log statements left
```

### Debugging Tools

#### Browser Development Tools
```javascript
// Check auth state in console
JSON.parse(localStorage.getItem('auth-store'))

// Check Clerk session
window.Clerk?.session

// Debug auth store
window.__ZUSTAND__?.authStore?.getState()
```

#### Server-Side Debugging
```typescript
// Add logging to API routes
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  console.log('API called by user:', userId);
  
  if (!userId) {
    console.log('Unauthorized API access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### Performance Considerations

#### Auth Store Optimization
```typescript
// Good: Selective subscriptions
const userId = useAuthStore(state => state.user?.id);

// Less optimal: Full state subscription  
const authState = useAuthStore();
const userId = authState.user?.id;
```

#### API Call Optimization
```typescript
// Good: Batch operations
const result = await Promise.all([
  incrementDocumentUsage(),
  updateUserProfile(data)
]);

// Less optimal: Sequential calls
await incrementDocumentUsage();
await updateUserProfile(data);
```

### Documentation Updates

When making auth-related changes:

1. **Update code comments** for complex logic
2. **Update API documentation** for endpoint changes  
3. **Update type definitions** for data structure changes
4. **Update README** for setup instruction changes
5. **Update troubleshooting guide** for new common issues

### Deployment Preparation

Before creating a pull request:

1. **Run full test suite**
   ```bash
   npm test
   npm run build
   npm run lint
   ```

2. **Test authentication flows manually**
   - Sign up with new account
   - Sign in with existing account
   - Test all protected routes
   - Test API endpoints

3. **Check for security issues**
   - No hardcoded secrets
   - No sensitive data in logs
   - Proper error handling
   - Authentication on all sensitive endpoints

4. **Performance check**
   - No unnecessary re-renders
   - Optimized database queries
   - Proper loading states

This workflow ensures consistent, high-quality authentication features across the development team.