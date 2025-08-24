import { pgTable, text, timestamp, integer, boolean, json, uuid, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { generateUUID } from '@/lib/utils/uuid';

// Enums
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'pro']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'expired', 'cancelled']);
export const documentStatusEnum = pgEnum('document_status', ['uploading', 'processing', 'ready', 'error']);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant', 'system']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);
export const activityTypeEnum = pgEnum('activity_type', ['login', 'logout', 'document_upload', 'message_sent', 'note_created', 'subscription_change', 'profile_updated']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => generateUUID()),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  
  // Profile information
  profileImageUrl: text('profile_image_url'),
  bio: text('bio'),
  organization: varchar('organization', { length: 100 }),
  jobTitle: varchar('job_title', { length: 100 }),
  website: varchar('website', { length: 200 }),
  location: varchar('location', { length: 100 }),
  
  // Account status
  emailVerified: boolean('email_verified').default(false),
  lastLoginAt: timestamp('last_login_at'),
  
  // Subscription details
  subscriptionPlan: subscriptionPlanEnum('subscription_plan').notNull().default('free'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull().default('active'),
  subscriptionStartDate: timestamp('subscription_start_date'),
  subscriptionEndDate: timestamp('subscription_end_date'),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  razorpayCustomerId: varchar('razorpay_customer_id', { length: 255 }),
  razorpaySubscriptionId: varchar('razorpay_subscription_id', { length: 255 }),
  
  // Usage tracking
  documentsUploaded: integer('documents_uploaded').notNull().default(0),
  messagesUsed: integer('messages_used').notNull().default(0),
  storageUsedBytes: integer('storage_used_bytes').default(0),
  apiCallsToday: integer('api_calls_today').default(0),
  lastResetDate: timestamp('last_reset_date'),
  
  // Preferences
  preferences: json('preferences').$type<{
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email?: boolean;
      browser?: boolean;
      usageWarnings?: boolean;
    };
    language?: string;
    timezone?: string;
  }>(),
  
  // Onboarding state
  hasCompletedOnboarding: boolean('has_completed_onboarding').notNull().default(false),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Documents table
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().$defaultFn(() => generateUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  
  name: varchar('name', { length: 500 }).notNull(),
  content: text('content'),
  
  // File metadata
  fileType: varchar('file_type', { length: 100 }),
  fileSize: integer('file_size'),
  sourceUrl: text('source_url'),
  
  // Processing status
  status: documentStatusEnum('status').notNull().default('uploading'),
  
  // Vector database references
  qdrantCollectionId: varchar('qdrant_collection_id', { length: 255 }),
  chunksCount: integer('chunks_count').default(0),
  
  // Additional metadata
  metadata: json('metadata'),
  
  // Timestamps
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chat conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().$defaultFn(() => generateUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  
  title: varchar('title', { length: 500 }),
  summary: text('summary'),
  
  // Conversation metadata
  documentIds: json('document_ids').$type<string[]>().default([]),
  totalMessages: integer('total_messages').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chat messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().$defaultFn(() => generateUUID()),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  role: messageRoleEnum('role').notNull(),
  content: text('content').notNull(),
  
  // Message metadata
  tokenCount: integer('token_count'),
  model: varchar('model', { length: 100 }),
  citations: json('citations'),
  metadata: json('metadata'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notes table
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().$defaultFn(() => generateUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).default('summary'),
  
  // Note metadata
  documentIds: json('document_ids').$type<string[]>().default([]),
  tags: json('tags').$type<string[]>().default([]),
  isAutoGenerated: boolean('is_auto_generated').default(false),
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  
  // Processing info
  model: varchar('model', { length: 100 }),
  tokenCount: integer('token_count'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User sessions table (for tracking user activity)
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().$defaultFn(() => generateUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  
  // Session metadata
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  
  // Session data
  documentCount: integer('document_count').default(0),
  messageCount: integer('message_count').default(0),
  noteCount: integer('note_count').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Billing History table
export const billingHistory = pgTable('billing_history', {
  id: uuid('id').primaryKey().$defaultFn(() => generateUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Payment details
  amount: integer('amount').notNull(), // Amount in cents
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  paymentMethod: varchar('payment_method', { length: 50 }), // 'stripe', 'razorpay', etc.
  paymentStatus: paymentStatusEnum('payment_status').notNull(),
  
  // External IDs
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  razorpayPaymentId: varchar('razorpay_payment_id', { length: 255 }),
  
  // Plan details
  planId: varchar('plan_id', { length: 50 }).notNull(),
  planName: varchar('plan_name', { length: 100 }).notNull(),
  billingPeriodStart: timestamp('billing_period_start').notNull(),
  billingPeriodEnd: timestamp('billing_period_end').notNull(),
  
  // Invoice details
  invoiceUrl: text('invoice_url'),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  
  // Metadata
  metadata: json('metadata').$type<Record<string, any>>(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Activity Logs table
export const userActivityLogs = pgTable('user_activity_logs', {
  id: uuid('id').primaryKey().$defaultFn(() => generateUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Activity details
  activityType: activityTypeEnum('activity_type').notNull(),
  description: text('description'),
  
  // Context data
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible
  userAgent: text('user_agent'),
  sessionId: varchar('session_id', { length: 255 }),
  
  // Additional data
  metadata: json('metadata').$type<Record<string, any>>(),
  
  // Timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Settings table (for app-specific settings separate from preferences)
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().$defaultFn(() => generateUUID()),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // UI Settings
  sidebarCollapsed: boolean('sidebar_collapsed').notNull().default(false),
  panelSizes: json('panel_sizes').$type<{
    sources?: number;
    notebook?: number;
    chat?: number;
  }>(),
  
  // Feature settings
  enableRealTimeSync: boolean('enable_real_time_sync').notNull().default(true),
  enableUsageWarnings: boolean('enable_usage_warnings').notNull().default(true),
  enableEmailDigest: boolean('enable_email_digest').notNull().default(false),
  
  // Privacy settings
  enableAnalytics: boolean('enable_analytics').notNull().default(true),
  enableCrashReporting: boolean('enable_crash_reporting').notNull().default(true),
  
  // Export settings
  defaultExportFormat: varchar('default_export_format', { length: 10 }).default('pdf'),
  
  // Advanced settings
  advancedSettings: json('advanced_settings').$type<Record<string, any>>(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type BillingHistory = typeof billingHistory.$inferSelect;
export type NewBillingHistory = typeof billingHistory.$inferInsert;
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type NewUserActivityLog = typeof userActivityLogs.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;