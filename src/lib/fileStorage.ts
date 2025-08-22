import { v2 as cloudinary } from 'cloudinary';
import { GridFSBucket, MongoClient } from 'mongodb';
import { Readable } from 'stream';

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

export async function uploadToCloudinary(
  file: File,
  folder = 'paperlm-uploads',
): Promise<FileStorageResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    bytes: number;
  }

  const result: CloudinaryUploadResult = await new Promise(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'auto',
            public_id: `${Date.now()}-${file.name.replace(
              /[^a-zA-Z0-9.-]/g,
              '_',
            )}`,
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResult);
          },
        )
        .end(buffer);
    },
  );

  return {
    fileId: result.public_id,
    url: result.secure_url,
    publicId: result.public_id,
    size: result.bytes,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    storageProvider: 'cloudinary',
  };
}

export async function uploadToGridFS(
  file: File,
  mongoUri: string,
  dbName = 'paperlm',
): Promise<FileStorageResult> {
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const stream = Readable.from(buffer);

    const uploadStream = bucket.openUploadStream(file.name, {
      metadata: {
        originalName: file.name,
        contentType: file.type || 'application/octet-stream',
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
      url: `/api/files/${fileId}`,
      size: file.size || buffer.length,
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
      storageProvider: 'gridfs',
    };
  } finally {
    if (client) await client.close();
  }
}

export async function uploadFile(file: File): Promise<FileStorageResult> {
  if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    try {
      return await uploadToCloudinary(file);
    } catch {}
  }
  if (process.env.MONGODB_URI) {
    try {
      return await uploadToGridFS(file, process.env.MONGODB_URI);
    } catch {}
  }
  // fallback metadata-only
  return {
    fileId: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url: '',
    size: file.size || 0,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    storageProvider: 'local',
  };
}
