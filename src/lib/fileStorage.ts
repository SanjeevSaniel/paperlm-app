import { v2 as cloudinary } from 'cloudinary';
import { GridFSBucket, MongoClient } from 'mongodb';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface FileStorageResult {
  fileId: string;
  url: string;
  publicId?: string;
  size: number;
  fileName: string;
  fileType: string;
  storageProvider: 'cloudinary' | 'gridfs' | 'local';
}

/**
 * Upload file to Cloudinary
 * Best for: Production apps, CDN delivery, automatic optimization
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'paperlm-uploads'
): Promise<FileStorageResult> {
  try {
    console.log('Uploading to Cloudinary:', file.name);
    
    // Convert File to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto', // Handles PDFs, images, videos, etc.
          public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    }) as any;

    return {
      fileId: result.public_id,
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
      fileName: file.name,
      fileType: file.type,
      storageProvider: 'cloudinary',
    };
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload file to MongoDB GridFS
 * Best for: When you want everything in MongoDB, large files
 */
export async function uploadToGridFS(
  file: File,
  mongoUri: string,
  dbName: string = 'paperlm'
): Promise<FileStorageResult> {
  let client: MongoClient | null = null;
  
  try {
    console.log('Uploading to GridFS:', file.name);
    
    client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
    
    // Convert File to stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);
    
    // Upload to GridFS
    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        originalName: file.name,
        contentType: file.type,
        uploadedAt: new Date(),
      },
    });
    
    const fileId = await new Promise<string>((resolve, reject) => {
      uploadStream.on('error', reject);
      uploadStream.on('finish', () => resolve(uploadStream.id.toString()));
      stream.pipe(uploadStream);
    });

    return {
      fileId,
      url: `/api/files/${fileId}`, // You'll need to create this endpoint
      size: file.size,
      fileName: file.name,
      fileType: file.type,
      storageProvider: 'gridfs',
    };
  } catch (error) {
    console.error('GridFS upload failed:', error);
    throw new Error(`GridFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

/**
 * Smart upload function - tries Cloudinary first, falls back to GridFS
 */
export async function uploadFile(file: File): Promise<FileStorageResult> {
  // Try Cloudinary first (if configured)
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      return await uploadToCloudinary(file);
    } catch (error) {
      console.warn('Cloudinary upload failed, trying GridFS fallback:', error);
    }
  }

  // Fallback to GridFS (if MongoDB is configured)
  if (process.env.MONGODB_URI) {
    try {
      return await uploadToGridFS(file, process.env.MONGODB_URI);
    } catch (error) {
      console.warn('GridFS upload also failed:', error);
    }
  }

  // Ultimate fallback: return metadata only (current behavior)
  console.warn('No file storage configured, returning metadata only');
  return {
    fileId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: '', // No persistent storage
    size: file.size,
    fileName: file.name,
    fileType: file.type,
    storageProvider: 'local',
  };
}

/**
 * Delete file from storage
 */
export async function deleteFile(fileId: string, storageProvider: 'cloudinary' | 'gridfs' | 'local'): Promise<void> {
  try {
    switch (storageProvider) {
      case 'cloudinary':
        await cloudinary.uploader.destroy(fileId);
        break;
        
      case 'gridfs':
        if (!process.env.MONGODB_URI) throw new Error('MongoDB URI not configured');
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        try {
          const db = client.db('paperlm');
          const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
          await bucket.delete(fileId as any);
        } finally {
          await client.close();
        }
        break;
        
      case 'local':
        // No-op for local storage
        break;
    }
  } catch (error) {
    console.error('File deletion failed:', error);
    throw new Error(`File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get file download URL
 */
export async function getFileUrl(
  fileId: string, 
  storageProvider: 'cloudinary' | 'gridfs' | 'local'
): Promise<string> {
  switch (storageProvider) {
    case 'cloudinary':
      return cloudinary.url(fileId, { resource_type: 'auto' });
      
    case 'gridfs':
      return `/api/files/${fileId}`;
      
    case 'local':
      return ''; // No persistent storage
      
    default:
      throw new Error(`Unsupported storage provider: ${storageProvider}`);
  }
}