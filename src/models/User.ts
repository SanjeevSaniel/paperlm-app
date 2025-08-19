import mongoose, { Schema, Document as MongoDocument, model, models } from 'mongoose';
import { Document, ChatMessage } from '@/types';

// User document interface
export interface IUser extends MongoDocument {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  documents: Document[];
  chatHistory: ChatMessage[];
  notes: Array<{
    id: string;
    title: string;
    content: string;
    timestamp: Date;
    tags?: string[];
    metadata?: {
      wordCount: number;
      lastModified: Date;
    };
  }>;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    collapsedPanels: string[];
    layout: {
      sourcesWidth: number;
      chatWidth: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Document schema
const DocumentSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  metadata: {
    size: { type: Number, required: true },
    type: { type: String, required: true },
    uploadedAt: { type: Date, required: true },
    chunksCount: { type: Number },
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'ready', 'error'],
    default: 'uploading',
  },
});

// Chat message schema
const ChatMessageSchema = new Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, required: true },
  citations: [{
    id: { type: String, required: true },
    content: { type: String, required: true },
    documentName: { type: String, required: true },
    relevanceScore: { type: Number, required: true },
  }],
});

// Note schema
const NoteSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, required: true },
  tags: [{ type: String }],
  metadata: {
    wordCount: { type: Number, required: true },
    lastModified: { type: Date, required: true },
  },
});

// User schema
const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    documents: [DocumentSchema],
    chatHistory: [ChatMessageSchema],
    notes: [NoteSchema],
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      collapsedPanels: [{ type: String }],
      layout: {
        sourcesWidth: { type: Number, default: 280 },
        chatWidth: { type: Number, default: 380 },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better performance
UserSchema.index({ clerkId: 1 });
UserSchema.index({ email: 1 });

// Export the model
export default models.User || model<IUser>('User', UserSchema);