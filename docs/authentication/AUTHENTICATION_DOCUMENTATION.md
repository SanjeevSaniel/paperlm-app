# PaperLM Authentication & User Management System

## Overview

This document provides comprehensive documentation for the authentication and user management system implemented in PaperLM. The system ensures that only authenticated users can access the application while providing seamless user experience and proper state management.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication Store (Zustand)](#authentication-store-zustand)
3. [Middleware & Route Protection](#middleware--route-protection)
4. [User Flow & Signup Process](#user-flow--signup-process)
5. [API Endpoints](#api-endpoints)
6. [Components & Hooks](#components--hooks)
7. [Database Models](#database-models)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Architecture Overview

The authentication system is built on several key components:

```
┌─────────────────────────────────────────────────────────┐
│                    Authentication Flow                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────┐ │
│  │   Landing   │───▶│   Clerk      │───▶│  PaperLM    │ │
│  │    Page     │    │ Sign-up/in   │    │    App      │ │
│  └─────────────┘    └──────────────┘    └─────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Middleware Protection                  │ │
│  │  - Route validation                                 │ │
│  │  - User authentication check                       │ │
│  │  │  - Redirect unauthenticated users               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Auth Store (Zustand)                   │ │
│  │  - User data management                             │ │
│  │  - Authentication state                             │ │
│  │  - Usage tracking                                   │ │
│  │  - Subscription management                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Technologies

- **Clerk**: Authentication provider for user sign-up/sign-in
- **Zustand**: State management for user data and authentication state
- **Next.js Middleware**: Route protection and authentication enforcement
- **MongoDB**: User data persistence
- **TypeScript**: Type safety for user data structures

---

## Authentication Store (Zustand)

### Location
`src/stores/authStore.ts`

### Purpose
Centralized state management for user authentication and data across the entire application.

### Key Features

#### 1. User Data Management
```typescript
interface UserData {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscription: {
    plan: 'free' | 'pro';
    status: 'active' | 'expired' | 'cancelled';
    startDate: Date;
    endDate: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  usage: {
    documentsUploaded: number;
    messagesUsed: number;
    lastResetDate: Date;
  };
  canUploadDocument: boolean;
  canSendMessage: boolean;
  isSubscriptionExpired: boolean;
  paperlmUserId?: string;
}
```

#### 2. Authentication State
```typescript
interface AuthState {
  // User data
  user: UserData | null;
  paperlmUserId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Authentication state
  isAuthenticated: boolean;
  isInitialized: boolean;
  
  // Actions
  setUser: (user: UserData | null) => void;
  setPaperlmUserId: (id: string) => void;
  fetchUserData: () => Promise<void>;
  incrementDocumentUsage: () => Promise<boolean>;
  incrementMessageUsage: () => Promise<boolean>;
  updateUserProfile: (data: Partial<UserData>) => Promise<void>;
  reset: () => void;
}
```

#### 3. State Persistence
The store uses Zustand's `persist` middleware to maintain authentication state across browser sessions:
```typescript
persist(
  (set, get) => ({
    // Store implementation
  }),
  {
    name: 'auth-store',
    partialize: (state) => ({
      paperlmUserId: state.paperlmUserId,
      isAuthenticated: state.isAuthenticated,
    }),
  }
)
```

### Usage Example
```typescript
import { useAuthData } from '@/stores/authStore';

function UserComponent() {
  const {
    user,
    isAuthenticated,
    isLoading,
    incrementDocumentUsage,
    incrementMessageUsage
  } = useAuthData();
  
  const handleUpload = async () => {
    const success = await incrementDocumentUsage();
    if (success) {
      // Proceed with upload
    } else {
      // Handle limit reached
    }
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.firstName}!</p>
      ) : (
        <p>Please sign in</p>
      )}
    </div>
  );
}
```

---

## Middleware & Route Protection

### Location
`middleware.ts` (root directory)

### Purpose
Enforces authentication requirements and protects routes from unauthorized access.

### Configuration

#### Public Routes (No Authentication Required)
```typescript
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/',
  '/how-it-works',
  '/privacy',
  '/terms',
  '/help',
  '/contact',
  '/api/cleanup' // Public cleanup endpoint
]);
```

#### Protected Routes Logic
```typescript
export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const { userId } = await auth();
  
  // For public routes, allow access without authentication
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // For all other routes, require authentication
  if (!userId) {
    // Redirect to sign-in page for unauthenticated users
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // Handle specific route validations for authenticated users
  if (pathname.startsWith('/paper')) {
    // Paper route specific logic
  }
  
  return NextResponse.next();
});
```

### Route Protection Behavior

1. **Unauthenticated Users**: Redirected to `/sign-in` with `redirect_url` parameter
2. **Authenticated Users**: Allowed to access all protected routes
3. **Paper Routes**: Additional validation for user session ownership
4. **API Routes**: Most require authentication (except cleanup)

---

## User Flow & Signup Process

### 1. Landing Page Experience

#### For Unauthenticated Users
- **Call-to-Action Buttons**: All point to `/sign-up`
- **Sign In Button**: Points to `/sign-in`
- **"Get Started" Button**: Points to `/sign-up`

#### For Authenticated Users
- **Dashboard Button**: Points to `/paper`
- **User Avatar**: Shows UserButton component with profile options

### 2. Sign-up Flow

```mermaid
graph TD
    A[User clicks 'Get Started'] --> B[/sign-up page]
    B --> C[Clerk Sign-up Form]
    C --> D[User creates account]
    D --> E[Automatic redirect to /paper]
    E --> F[AuthProvider initializes]
    F --> G[Fetch user data from API]
    G --> H[Generate PaperLM user ID]
    H --> I[Redirect to /paper/{userId}]
    I --> J[User accesses main app]
```

#### Sign-up Page Configuration
```typescript
// src/app/sign-up/[[...sign-up]]/page.tsx
<SignUp 
  redirectUrl="/paper"
  forceRedirectUrl="/paper"
  appearance={{
    elements: {
      rootBox: "mx-auto",
      card: "shadow-xl border-0",
    }
  }}
/>
```

### 3. Sign-in Flow

Similar to sign-up but for returning users:
```typescript
// src/app/sign-in/[[...sign-in]]/page.tsx
<SignIn 
  redirectUrl="/paper"
  forceRedirectUrl="/paper"
  appearance={{
    elements: {
      rootBox: "mx-auto",
      card: "shadow-xl border-0",
    }
  }}
/>
```

### 4. Post-Authentication Flow

1. **AuthProvider Initialization** (`src/components/AuthProvider.tsx`)
   - Detects authentication state
   - Fetches user data from API
   - Initializes auth store

2. **Paper Route Handler** (`src/app/paper/page.tsx`)
   - Generates or retrieves PaperLM user ID
   - Redirects to user-specific workspace
   - Handles error cases

3. **User Workspace** (`src/app/paper/[userId]/page.tsx`)
   - Validates user session
   - Initializes app components
   - Renders main application interface

---

## API Endpoints

### User Management API

#### GET `/api/user`
**Purpose**: Fetch authenticated user data

**Authentication**: Required (Clerk)

**Response**:
```json
{
  "user": {
    "id": "user_id",
    "clerkId": "clerk_user_id",
    "email": "user@example.com",
    "subscription": {
      "plan": "free",
      "status": "active"
    },
    "usage": {
      "documentsUploaded": 0,
      "messagesUsed": 2
    },
    "canUploadDocument": true,
    "canSendMessage": true,
    "isSubscriptionExpired": false
  }
}
```

#### POST `/api/user`
**Purpose**: Update user usage (increment document or message count)

**Authentication**: Required (Clerk)

**Request Body**:
```json
{
  "action": "increment_document" | "increment_message"
}
```

**Response**:
```json
{
  "success": true,
  "usage": {
    "documentsUploaded": 1,
    "messagesUsed": 2
  },
  "canUploadDocument": true,
  "canSendMessage": true
}
```

### User ID Management API

#### POST `/api/user-id`
**Purpose**: Generate or retrieve PaperLM user ID

**Authentication**: Required (Clerk)

**Request Body**:
```json
{
  "action": "get_or_create",
  "tempUserId": "optional_temp_id"
}
```

**Response**:
```json
{
  "success": true,
  "paperlmUserId": "registered_1234567890123",
  "userType": "registered_free",
  "isNewUser": false,
  "isAuthenticated": true
}
```

#### GET `/api/user-id`
**Purpose**: Get current user's PaperLM ID

**Authentication**: Required (Clerk)

**Response**:
```json
{
  "success": true,
  "paperlmUserId": "registered_1234567890123",
  "userType": "registered_free",
  "isAuthenticated": true
}
```

### Document Upload API

#### POST `/api/upload`
**Purpose**: Upload and process documents

**Authentication**: Required (Clerk)

**Request**: `multipart/form-data`
- `file`: Document file
- `sessionId`: Session identifier
- `userEmail`: User email

**Response**:
```json
{
  "documentId": "doc_1234567890",
  "fileName": "document.pdf",
  "chunksCount": 15,
  "textLength": 5420,
  "content": "extracted text...",
  "success": true
}
```

### Web Scraping API

#### POST `/api/scrape`
**Purpose**: Scrape and process web content

**Authentication**: Required (Clerk)

**Request Body**:
```json
{
  "url": "https://example.com",
  "type": "website",
  "maxDepth": 2,
  "sameOrigin": true,
  "loader": "cheerio"
}
```

**Response**:
```json
{
  "success": true,
  "documentId": "web-1234567890",
  "chunks": 8,
  "title": "Page Title",
  "contentLength": 3420
}
```

---

## Components & Hooks

### AuthProvider Component

**Location**: `src/components/AuthProvider.tsx`

**Purpose**: Initialize authentication state when app loads

**Usage**:
```tsx
// Wrap your app with AuthProvider
<AuthProvider>
  <YourAppComponent />
</AuthProvider>
```

**Features**:
- Detects Clerk authentication state
- Fetches user data from API
- Initializes Zustand auth store
- Handles authentication errors

### useAuthData Hook

**Location**: `src/stores/authStore.ts`

**Purpose**: Combined hook for Clerk user data and auth store

**Returns**:
```typescript
{
  // Clerk data
  clerkUser: User | null;
  clerkLoaded: boolean;
  isSignedIn: boolean;
  
  // Auth store data
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Combined status
  isFullyLoaded: boolean;
  displayName: string;
  email: string;
  
  // Actions
  fetchUserData: () => Promise<void>;
  incrementDocumentUsage: () => Promise<boolean>;
  incrementMessageUsage: () => Promise<boolean>;
}
```

### Updated Usage Context

**Location**: `src/contexts/UsageContext.tsx`

**Changes**: Now integrates with auth store instead of localStorage

**Key Functions**:
```typescript
const incrementChatUsage = async (): Promise<boolean> => {
  if (isSignedIn && authUser) {
    const success = await authIncrementMessage();
    if (success) {
      setChatCount(prev => prev + 1);
    }
    return success;
  }
  return false;
};
```

---

## Database Models

### User Model

**Location**: `src/models/User.ts`

**Schema**:
```typescript
interface IUser {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscription: {
    plan: 'free' | 'pro';
    status: 'active' | 'expired' | 'cancelled';
    startDate: Date;
    endDate: Date;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  usage: {
    documentsUploaded: number;
    messagesUsed: number;
    lastResetDate: Date;
  };
  purchaseHistory: Array<{
    id: string;
    plan: string;
    amount: number;
    currency: string;
    status: 'completed' | 'failed' | 'pending';
    purchaseDate: Date;
    validUntil: Date;
    stripePaymentIntentId?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

**Methods**:
- `isSubscriptionExpired()`: Check if pro subscription is expired
- `canUploadDocument()`: Check if user can upload documents
- `canSendMessage()`: Check if user can send messages
- `resetMonthlyUsage()`: Reset usage counters monthly

---

## Troubleshooting

### Common Issues & Solutions

#### 1. User Not Redirecting After Signup
**Symptoms**: User stuck on signup page or redirected to wrong route

**Solution**:
```tsx
// Ensure redirectUrl and forceRedirectUrl are set
<SignUp 
  redirectUrl="/paper"
  forceRedirectUrl="/paper"
/>
```

#### 2. Authentication State Not Persisting
**Symptoms**: User data disappears on page refresh

**Causes**:
- Zustand persist not configured properly
- AuthProvider not wrapping the app
- Multiple auth stores instantiated

**Solution**:
```tsx
// Ensure AuthProvider wraps the entire app
export default function AppLayout({ userId }: AppLayoutProps) {
  return (
    <AuthProvider>
      {/* Rest of your app */}
    </AuthProvider>
  );
}
```

#### 3. Infinite Loading States
**Symptoms**: App shows loading spinner indefinitely

**Causes**:
- AuthProvider not calling `setInitialized(true)`
- Clerk not loading properly
- API endpoints returning errors

**Debugging**:
```typescript
// Check auth store state
const authData = useAuthData();
console.log({
  clerkLoaded: authData.clerkLoaded,
  isInitialized: authData.isInitialized,
  isAuthenticated: authData.isAuthenticated,
  error: authData.error
});
```

#### 4. API Endpoints Returning 401
**Symptoms**: API calls fail with authentication errors

**Causes**:
- Missing `auth()` call in API routes
- Incorrect Clerk configuration
- Missing environment variables

**Solution**:
```typescript
// Ensure all protected API routes check authentication
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Rest of API logic
}
```

#### 5. Usage Limits Not Updating
**Symptoms**: Document/message counts not reflecting in UI

**Causes**:
- Usage context not connected to auth store
- API not returning updated usage data
- Race conditions in state updates

**Solution**:
```typescript
// Ensure usage updates go through auth store
const incrementDocumentUsage = async (): Promise<boolean> => {
  const success = await authIncrementDocument();
  if (success) {
    // Update local state only after API success
    setChatCount(prev => prev + 1);
  }
  return success;
};
```

### Development Environment Issues

#### Environment Variables Required
```bash
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database
MONGODB_URI=mongodb://...

# AI Services
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...
```

#### Build Issues
Common TypeScript errors and solutions:

1. **Property does not exist on type errors**
   - Use type assertions: `(obj as any).property`
   - Update interface definitions
   - Add optional properties with `?`

2. **Import/Export errors**
   - Check file paths are correct
   - Ensure proper TypeScript configurations
   - Use proper Next.js import patterns

---

## Best Practices

### 1. Authentication Checks
Always check authentication status before sensitive operations:

```typescript
// Good
const handleSensitiveOperation = async () => {
  if (!isAuthenticated) {
    router.push('/sign-in');
    return;
  }
  
  // Proceed with operation
};

// Better
const { isAuthenticated, user } = useAuthData();

if (!isAuthenticated || !user) {
  return <RedirectToLogin />;
}
```

### 2. Error Handling
Implement comprehensive error handling:

```typescript
const fetchUserData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await fetch('/api/user');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    setUser(data.user);
    
  } catch (error) {
    console.error('Error fetching user data:', error);
    setError(error instanceof Error ? error.message : 'Failed to fetch user data');
  } finally {
    setLoading(false);
  }
};
```

### 3. Usage Limit Enforcement
Always check limits before allowing operations:

```typescript
const handleDocumentUpload = async () => {
  const canUpload = await incrementDocumentUsage();
  
  if (!canUpload) {
    toast.error('Document upload limit reached. Please upgrade to Pro.');
    return;
  }
  
  // Proceed with upload
};
```

### 4. State Management
Keep auth state synchronized across components:

```typescript
// Use the centralized auth store
const { user, isAuthenticated } = useAuthData();

// Don't create separate user state
// const [user, setUser] = useState(null); // ❌ Don't do this
```

### 5. Component Organization
Structure authentication-dependent components properly:

```tsx
function ProtectedComponent() {
  const { isAuthenticated, isLoading } = useAuthData();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <RedirectToLogin />;
  }
  
  return <MainContent />;
}
```

---

## Migration Notes

### From Previous Version
If upgrading from a version that supported unauthenticated users:

1. **Remove localStorage usage** for user data
2. **Update API endpoints** to require authentication
3. **Migrate existing user sessions** to authenticated accounts
4. **Update UI components** to remove "free user" flows
5. **Test all user flows** end-to-end

### Breaking Changes
- All users must now create accounts
- API endpoints require authentication
- Temporary user sessions no longer supported
- Usage tracking moved from localStorage to database

---

This documentation provides a comprehensive guide to the authentication system. For specific implementation details, refer to the source code in the respective files mentioned throughout this document.