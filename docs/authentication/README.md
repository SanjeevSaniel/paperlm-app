# Authentication Documentation

This directory contains comprehensive documentation for PaperLM's authentication and user management system.

## 📋 Documents

### [Authentication System Documentation](./AUTHENTICATION_DOCUMENTATION.md)
**Complete Implementation Guide**
- Architecture overview and system design
- Zustand auth store implementation
- Middleware and route protection
- User flow and signup process
- API endpoints documentation
- Database models and schemas
- Troubleshooting guide
- Best practices and security considerations

### [Authentication Quick Reference](./AUTH_QUICK_REFERENCE.md)
**Developer Quick Start Guide**
- Setup checklist
- Common code patterns
- Import statements
- API response examples
- Testing commands
- File locations

## 🚀 Quick Start

### For New Developers
1. **Read**: [Authentication System Documentation](./AUTHENTICATION_DOCUMENTATION.md#architecture-overview)
2. **Setup**: Follow [Quick Reference Guide](./AUTH_QUICK_REFERENCE.md#quick-setup-checklist)
3. **Test**: Use code patterns from [Quick Reference](./AUTH_QUICK_REFERENCE.md#common-code-patterns)

### For Existing Team Members
- **Reference**: [Quick Reference Guide](./AUTH_QUICK_REFERENCE.md) for common patterns
- **Troubleshooting**: [Authentication Documentation](./AUTHENTICATION_DOCUMENTATION.md#troubleshooting)
- **API Changes**: [Authentication Documentation](./AUTHENTICATION_DOCUMENTATION.md#api-endpoints)

## 🔧 Common Tasks

### Implementing Authentication Check
```typescript
import { useAuthData } from '@/stores/authStore';

function MyComponent() {
  const { isAuthenticated, user, isLoading } = useAuthData();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please sign in</div>;
  
  return <div>Welcome {user?.firstName}!</div>;
}
```

### Protecting API Routes
```typescript
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Your API logic here
}
```

## 🐛 Troubleshooting

- **User not redirecting after signup**: Check [Authentication Documentation](./AUTHENTICATION_DOCUMENTATION.md#user-not-redirecting-after-signup)
- **Auth state not persisting**: Check [Authentication Documentation](./AUTHENTICATION_DOCUMENTATION.md#authentication-state-not-persisting)
- **API returning 401**: Check [Authentication Documentation](./AUTHENTICATION_DOCUMENTATION.md#api-endpoints-returning-401)

## 📚 Related Documentation

- **[Development Workflow](../development/DEV_WORKFLOW.md)** - Team development practices
- **[Deployment Checklist](../deployment/DEPLOYMENT_CHECKLIST.md)** - Production deployment
- **[Configuration Guide](../configuration/)** - System configuration