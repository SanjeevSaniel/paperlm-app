import { db } from '../neon';
import { users, type User, type NewUser } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class UserRepository {
  
  // Find user by Clerk ID
  static async findByClerkId(clerkId: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by Clerk ID:', error);
      return null;
    }
  }

  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  // Create new user
  static async create(userData: NewUser): Promise<User | null> {
    try {
      const result = await db.insert(users).values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  // Update user
  static async update(clerkId: string, userData: Partial<NewUser>): Promise<User | null> {
    try {
      const result = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Get or create user (for authentication flow)
  static async getOrCreate(clerkId: string, email: string, additionalData?: Partial<NewUser>): Promise<User | null> {
    try {
      // Try to find existing user
      let user = await this.findByClerkId(clerkId);
      
      if (!user) {
        // Create new user if doesn't exist
        user = await this.create({
          clerkId,
          email,
          ...additionalData,
        });
      } else if (email !== user.email) {
        // Update email if it has changed
        user = await this.update(clerkId, { email });
      }
      
      return user;
    } catch (error) {
      console.error('Error in getOrCreate user:', error);
      return null;
    }
  }

  // Increment document usage
  static async incrementDocumentUsage(clerkId: string): Promise<User | null> {
    try {
      const user = await this.findByClerkId(clerkId);
      if (!user) return null;

      // Check if we need to reset monthly usage
      const currentDate = new Date();
      const lastResetDate = user.lastResetDate ? new Date(user.lastResetDate) : new Date(0);
      const shouldReset = (
        currentDate.getFullYear() !== lastResetDate.getFullYear() ||
        currentDate.getMonth() !== lastResetDate.getMonth()
      );

      if (shouldReset) {
        return await this.update(clerkId, {
          documentsUploaded: 1,
          messagesUsed: 0,
          lastResetDate: currentDate,
        });
      } else {
        return await this.update(clerkId, {
          documentsUploaded: user.documentsUploaded + 1,
        });
      }
    } catch (error) {
      console.error('Error incrementing document usage:', error);
      return null;
    }
  }

  // Increment message usage
  static async incrementMessageUsage(clerkId: string): Promise<User | null> {
    try {
      const user = await this.findByClerkId(clerkId);
      if (!user) return null;

      // Check if we need to reset monthly usage
      const currentDate = new Date();
      const lastResetDate = user.lastResetDate ? new Date(user.lastResetDate) : new Date(0);
      const shouldReset = (
        currentDate.getFullYear() !== lastResetDate.getFullYear() ||
        currentDate.getMonth() !== lastResetDate.getMonth()
      );

      if (shouldReset) {
        return await this.update(clerkId, {
          documentsUploaded: 0,
          messagesUsed: 1,
          lastResetDate: currentDate,
        });
      } else {
        return await this.update(clerkId, {
          messagesUsed: user.messagesUsed + 1,
        });
      }
    } catch (error) {
      console.error('Error incrementing message usage:', error);
      return null;
    }
  }

  // Check if user can upload documents
  static canUploadDocument(user: User): boolean {
    if (user.subscriptionPlan === 'pro' && user.subscriptionStatus === 'active') {
      return true; // Pro users have unlimited uploads
    }
    
    // Free users have a monthly limit
    const FREE_UPLOAD_LIMIT = 2;
    return user.documentsUploaded < FREE_UPLOAD_LIMIT;
  }

  // Check if user can send messages
  static canSendMessage(user: User): boolean {
    if (user.subscriptionPlan === 'pro' && user.subscriptionStatus === 'active') {
      return true; // Pro users have unlimited messages
    }
    
    // Free users have a monthly limit
    const FREE_MESSAGE_LIMIT = 10;
    return user.messagesUsed < FREE_MESSAGE_LIMIT;
  }

  // Check if subscription is expired
  static isSubscriptionExpired(user: User): boolean {
    if (user.subscriptionPlan === 'free') {
      return false; // Free plan doesn't expire
    }
    
    if (!user.subscriptionEndDate) {
      return true; // Pro plan without end date is considered expired
    }
    
    return new Date() > new Date(user.subscriptionEndDate);
  }

  // Mark onboarding as completed
  static async completeOnboarding(clerkId: string): Promise<User | null> {
    try {
      return await this.update(clerkId, {
        hasCompletedOnboarding: true,
        onboardingCompletedAt: new Date(),
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return null;
    }
  }

  // Check if user needs onboarding
  static needsOnboarding(user: User): boolean {
    return !user.hasCompletedOnboarding;
  }
}