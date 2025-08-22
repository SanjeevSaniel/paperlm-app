import mongoose from 'mongoose';

export interface IUser {
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

const userSchema = new mongoose.Schema<IUser>({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: String,
  lastName: String,
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        return date;
      },
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },
  usage: {
    documentsUploaded: {
      type: Number,
      default: 0,
    },
    messagesUsed: {
      type: Number,
      default: 0,
    },
    lastResetDate: {
      type: Date,
      default: Date.now,
    },
  },
  purchaseHistory: [{
    id: String,
    plan: String,
    amount: Number,
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['completed', 'failed', 'pending'],
      default: 'pending',
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    validUntil: Date,
    stripePaymentIntentId: String,
  }],
}, {
  timestamps: true,
});

// Method to check if subscription is expired
userSchema.methods.isSubscriptionExpired = function() {
  if (this.subscription.plan === 'free') return false;
  return new Date() > this.subscription.endDate;
};

// Method to check if user can upload documents
userSchema.methods.canUploadDocument = function() {
  if (this.subscription.plan === 'pro' && !this.isSubscriptionExpired()) {
    return true;
  }
  // Free plan: 1 document per month
  return this.usage.documentsUploaded < 1;
};

// Method to check if user can send messages
userSchema.methods.canSendMessage = function() {
  if (this.subscription.plan === 'pro' && !this.isSubscriptionExpired()) {
    return true;
  }
  // Free plan: 5 messages per month
  return this.usage.messagesUsed < 5;
};

// Method to reset monthly usage
userSchema.methods.resetMonthlyUsage = function() {
  const now = new Date();
  const lastReset = this.usage.lastResetDate;
  
  // Check if it's been a month since last reset
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.documentsUploaded = 0;
    this.usage.messagesUsed = 0;
    this.usage.lastResetDate = now;
    return true;
  }
  return false;
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);