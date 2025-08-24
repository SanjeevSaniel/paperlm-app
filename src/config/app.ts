// Central application configuration for PaperLM

// App metadata and branding
export const APP_CONFIG = {
  name: 'PaperLM',
  description: 'AI-powered document analysis and chat platform',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://paperlm.com',
  supportEmail: 'support@paperlm.com',
  logo: {
    text: 'PaperLM',
    tagline: 'AI-powered document analysis'
  }
} as const;

// Authentication configuration
export const AUTH_CONFIG = {
  provider: 'clerk',
  redirects: {
    signIn: '/paper',
    signUp: '/paper',
    afterSignOut: '/',
    afterSignIn: '/paper',
    afterSignUp: '/paper'
  },
  features: {
    enableSignUp: true,
    enablePasswordReset: true,
    enableSocialLogin: true,
    requireEmailVerification: true
  }
} as const;

// User profile configuration
export const USER_PROFILE_CONFIG = {
  fields: {
    required: ['firstName', 'lastName', 'email'],
    optional: ['profileImage', 'bio', 'organization', 'jobTitle', 'website', 'location'],
    editable: ['firstName', 'lastName', 'bio', 'organization', 'jobTitle', 'website', 'location', 'profileImage'],
    system: ['clerkId', 'createdAt', 'updatedAt', 'lastLoginAt', 'emailVerified']
  },
  profileImage: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    dimensions: {
      min: { width: 100, height: 100 },
      max: { width: 2048, height: 2048 }
    }
  },
  limits: {
    bioMaxLength: 500,
    organizationMaxLength: 100,
    jobTitleMaxLength: 100,
    websiteMaxLength: 200,
    locationMaxLength: 100
  }
} as const;

// Billing and subscription configuration
export const BILLING_CONFIG = {
  currency: {
    primary: 'USD',
    supported: ['USD', 'INR']
  },
  paymentMethods: {
    stripe: {
      enabled: true,
      publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
    },
    razorpay: {
      enabled: true,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ''
    }
  },
  features: {
    enableInvoices: true,
    enableBillingHistory: true,
    enablePaymentMethodManagement: true,
    enableAutoRenewal: false, // Non-recurring subscriptions
    enableProration: false
  }
} as const;

// Usage tracking configuration
export const USAGE_CONFIG = {
  tracking: {
    enableRealTime: true,
    resetSchedule: 'monthly', // Reset usage monthly
    resetDay: 1 // Reset on 1st of each month
  },
  limits: {
    free: {
      documents: 2,
      messages: 10,
      storageBytes: 100 * 1024 * 1024, // 100MB
      apiCallsPerDay: 100
    },
    pro: {
      documents: -1, // Unlimited
      messages: -1, // Unlimited
      storageBytes: 10 * 1024 * 1024 * 1024, // 10GB
      apiCallsPerDay: 10000
    }
  },
  warnings: {
    enableUsageWarnings: true,
    warningThresholds: [0.75, 0.9, 0.95], // Warn at 75%, 90%, 95%
    notifyUpgrade: true
  }
} as const;

// Feature flags configuration
export const FEATURES_CONFIG = {
  chat: {
    enabled: true,
    maxMessageLength: 2000,
    enableFileUploads: true,
    enableImageAnalysis: false, // Future feature
    enableVoiceInput: false // Future feature
  },
  documents: {
    enabled: true,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ],
    enableOCR: true,
    enablePreview: true
  },
  notes: {
    enabled: true,
    autoGeneration: {
      freeUsers: false, // Pro only
      proUsers: true
    },
    maxNotesPerUser: {
      free: 50,
      pro: -1 // Unlimited
    },
    enableExport: true,
    exportFormats: ['pdf', 'docx', 'md', 'txt']
  },
  workspace: {
    enableSharing: false, // Future feature
    enableCollaboration: false, // Future feature
    enablePublicLinks: false, // Future feature
    maxWorkspaces: {
      free: 1,
      pro: 5
    }
  }
} as const;

// UI/UX configuration
export const UI_CONFIG = {
  theme: {
    default: 'light',
    enableDarkMode: false, // Future feature
    enableSystemTheme: false // Future feature
  },
  layout: {
    sidebarCollapsed: false,
    panelSizes: {
      sources: { min: 280, max: 500, default: 280 },
      notebook: { min: 300, max: 800, default: 400 },
      chat: { min: 300, max: 600, default: 400 }
    }
  },
  animations: {
    enabled: true,
    reducedMotion: false
  },
  notifications: {
    position: 'top-right',
    duration: 5000,
    enableSound: false
  }
} as const;

// Security configuration
export const SECURITY_CONFIG = {
  session: {
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    rolling: true, // Extend session on activity
    secure: process.env.NODE_ENV === 'production'
  },
  rateLimit: {
    enabled: true,
    requests: {
      auth: { max: 10, window: '15m' }, // 10 auth attempts per 15 minutes
      api: { max: 100, window: '1h' }, // 100 API calls per hour
      upload: { max: 10, window: '1h' } // 10 uploads per hour
    }
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    enableAtRest: true, // Encrypt sensitive data at rest
    enableInTransit: true // Always use HTTPS
  }
} as const;

// Integration configuration
export const INTEGRATIONS_CONFIG = {
  openai: {
    enabled: true,
    model: 'gpt-4',
    maxTokens: 4000,
    temperature: 0.1
  },
  qdrant: {
    enabled: true,
    collectionPrefix: 'paperlm',
    vectorSize: 1536,
    distance: 'cosine'
  },
  analytics: {
    enabled: false, // Future feature
    provider: 'mixpanel', // or 'amplitude'
    trackingId: process.env.NEXT_PUBLIC_ANALYTICS_ID || ''
  },
  monitoring: {
    sentry: {
      enabled: true,
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || ''
    },
    logging: {
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      enableClientLogging: false
    }
  }
} as const;

// Environment-specific overrides
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  enableDebugMode: process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG === 'true'
} as const;

// Helper functions
export const getConfig = () => ({
  app: APP_CONFIG,
  auth: AUTH_CONFIG,
  userProfile: USER_PROFILE_CONFIG,
  billing: BILLING_CONFIG,
  usage: USAGE_CONFIG,
  features: FEATURES_CONFIG,
  ui: UI_CONFIG,
  security: SECURITY_CONFIG,
  integrations: INTEGRATIONS_CONFIG,
  env: ENV_CONFIG
});

export default getConfig;