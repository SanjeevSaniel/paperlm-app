# 📁 File Storage Configuration Guide

The PaperLM RAG application supports multiple file storage options for uploaded documents. Choose the one that best fits your needs:

## 🚀 **Cloudinary (Recommended)**

**Best for**: Production applications, automatic optimization, CDN delivery

### Features:
- ✅ Automatic file optimization
- ✅ Global CDN delivery
- ✅ Supports all file types (PDF, images, videos, etc.)
- ✅ Built-in transformations
- ✅ Generous free tier (25GB storage, 25GB bandwidth/month)

### Setup:
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get your credentials from Dashboard > Settings > Account
3. Add to `.env.local`:
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key  
CLOUDINARY_API_SECRET=your-api-secret
```

### Pricing:
- **Free**: 25GB storage, 25GB bandwidth/month
- **Paid**: $89+/month for more storage and features

---

## 💾 **MongoDB GridFS**

**Best for**: When you want everything in MongoDB, large files (>16MB)

### Features:
- ✅ Integrated with existing MongoDB setup
- ✅ Handles files larger than 16MB
- ✅ Atomic operations
- ✅ Built-in metadata storage

### Setup:
1. Ensure MongoDB is configured (already required for the app)
2. Files automatically stored in GridFS if Cloudinary is not configured
3. Access files via `/api/files/[fileId]`

### Pricing:
- **Atlas Free**: 512MB storage
- **Atlas Paid**: $9+/month for more storage

---

## 🏢 **Alternative Options**

### **AWS S3**
```bash
# Add to .env.local
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key  
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_REGION=us-east-1
```

### **Google Cloud Storage**
```bash
# Add to .env.local
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_STORAGE_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-key.json
```

---

## 🔧 **How It Works**

### **Upload Process:**
1. **File Upload** → App receives file
2. **Storage Upload** → File saved to configured storage (Cloudinary/GridFS)
3. **Text Extraction** → Content extracted for RAG processing  
4. **Chunking & Embedding** → Text processed and vectorized
5. **Database Save** → Metadata + storage info saved to SQLite/MongoDB

### **Retrieval Process:**
1. **Query** → User asks question
2. **Vector Search** → Find relevant content chunks
3. **File Reference** → Access original file if needed
4. **Response** → AI generates answer with citations

---

## 📊 **Storage Comparison**

| Feature | Cloudinary | GridFS | AWS S3 | Google Cloud |
|---------|------------|---------|---------|--------------|
| Setup Complexity | ⭐⭐ Easy | ⭐ Minimal | ⭐⭐⭐ Medium | ⭐⭐⭐ Medium |
| File Size Limit | 100MB | None | 5TB | 5TB |
| CDN | ✅ Built-in | ❌ No | ✅ CloudFront | ✅ Cloud CDN |
| Free Tier | 25GB | 512MB | 5GB | 5GB |
| Best For | Production | Development | Enterprise | Enterprise |

---

## 🛠️ **Quick Setup**

### **For Development:**
```bash
# Copy example environment
cp .env.example .env.local

# Option 1: Use GridFS (MongoDB only)
MONGODB_URI=mongodb://localhost:27017/paperlm
# Cloudinary vars can be left empty

# Option 2: Add Cloudinary for better performance  
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### **For Production:**
1. **Recommended**: Set up Cloudinary for file storage
2. **Required**: Configure MongoDB for metadata  
3. **Required**: Set up Qdrant for vector storage
4. **Required**: Configure OpenAI for embeddings/chat

---

## 🔍 **Troubleshooting**

### **Files not uploading?**
- Check storage credentials in `.env.local`
- Verify file size is under 10MB limit
- Check console logs for specific errors

### **Files uploading but not accessible?**
- For GridFS: Check MongoDB connection
- For Cloudinary: Verify API permissions
- Check `/api/files/[fileId]` endpoint

### **Storage costs too high?**
- Use GridFS for development
- Implement file cleanup policies
- Consider file compression

---

## 📈 **Scaling Considerations**

### **Small Apps (< 1GB)**
- Use GridFS + MongoDB Atlas Free Tier
- Cost: $0/month

### **Medium Apps (1-25GB)**
- Use Cloudinary Free + MongoDB Atlas M0
- Cost: $0-9/month  

### **Large Apps (25GB+)**
- Use Cloudinary Pro + MongoDB Atlas M10+
- Cost: $89+ per month

---

**Need help?** Check the logs in your browser console or server terminal for detailed error messages.