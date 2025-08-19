import { NextRequest, NextResponse } from 'next/server';
import { cleanupAnonymousVectorsOlderThan } from '@/lib/qdrant';
import { anonymousStore } from '@/lib/anonymousStorage';
import { getExpiredRecords, markRecordCleaned, deleteOldCleanedRecords, getCleanupStats } from '@/lib/cleanupDatabase';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: NextRequest) {
  // Allow Vercel Cron via its special header, or require a secret for manual calls
  const isVercelCron = request.headers.get('x-vercel-cron') !== null;
  const secret = process.env.CRON_SECRET;
  const providedHeader = request.headers.get('x-cron-key');
  const providedQuery = new URL(request.url).searchParams.get('key');

  if (
    !isVercelCron &&
    (!secret || (providedHeader !== secret && providedQuery !== secret))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hours = 48;

  try {
    console.log('🧹 Starting comprehensive cleanup process...');
    
    // Get cleanup stats before starting
    const statsBefore = getCleanupStats();
    console.log('📊 Cleanup stats before:', statsBefore);
    
    // Get expired records from database
    const expiredRecords = getExpiredRecords();
    console.log(`📋 Found ${expiredRecords.length} expired records to cleanup`);
    
    let cloudinaryDeleted = 0;
    let cloudinaryErrors = 0;
    const errors: string[] = [];
    
    // Cleanup expired records from Cloudinary and mark as cleaned
    for (const record of expiredRecords) {
      try {
        // Delete from Cloudinary if we have a public ID
        if (record.cloudinaryPublicId) {
          console.log(`🗑️ Deleting from Cloudinary: ${record.cloudinaryPublicId}`);
          await cloudinary.uploader.destroy(record.cloudinaryPublicId);
          cloudinaryDeleted++;
          console.log(`✅ Deleted from Cloudinary: ${record.cloudinaryPublicId}`);
        }
        
        // Mark record as cleaned
        markRecordCleaned(record.documentId);
        
      } catch (error) {
        cloudinaryErrors++;
        const errorMsg = `Failed to cleanup ${record.documentId}: ${error}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }
    
    // Cleanup Qdrant vectors
    console.log('🧹 Cleaning up Qdrant vectors...');
    const qdrant = await cleanupAnonymousVectorsOlderThan(hours);
    
    // Cleanup anonymous storage
    console.log('🧹 Cleaning up anonymous storage...');
    const removedDocs = anonymousStore.cleanupOlderThan(hours);
    
    // Clean up old cleaned records (older than 30 days)
    const deletedOldRecords = deleteOldCleanedRecords(30);
    
    // Get final stats
    const statsAfter = getCleanupStats();
    console.log('📊 Cleanup stats after:', statsAfter);
    
    const result = {
      success: true,
      message: '🎉 Comprehensive cleanup completed',
      ttlHours: hours,
      cloudinary: {
        deleted: cloudinaryDeleted,
        errors: cloudinaryErrors,
      },
      qdrant,
      anonymousStoreRemovedDocs: removedDocs,
      database: {
        expiredRecords: expiredRecords.length,
        deletedOldRecords,
        statsBefore,
        statsAfter,
      },
      errors: errors.length > 0 ? errors : undefined,
    };
    
    console.log('✅ Cleanup completed successfully:', result);
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ Cleanup process failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Cleanup process failed'
    }, { status: 500 });
  }
}
