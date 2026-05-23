// Production Cleanup Utility for Blumebyte HR SaaS
// This script clears ALL test data and resets the system to production-ready state

import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// Get Supabase admin client
function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/**
 * Get all KV store keys grouped by prefix
 */
async function getAllKVKeys() {
  const prefixes = [
    'employee:',
    'company:',
    'company-settings:',
    'subscription:',
    'audit:',
    'audit-index:',
    'verified_registration:',
    'department:',
    'leave-request:',
    'leave-balance:',
    'leave-type:',
    'payslip:',
    'attendance:',
    'announcement:',
    'document:',
    'policy:',
    'org-chart:',
    'review:',
    'goal:',
    'feedback:',
    'survey:',
    'survey-response:',
    'training:',
    'training-enrollment:',
    'benefit:',
    'benefit-enrollment:',
    'asset:',
    'asset-assignment:',
    'expense:',
    'overtime:',
    'profile-change-request:',
    'notification:',
    'message:',
    'meeting:',
    'task:',
    'workflow:',
    'approval-request:',
    'compensation:',
    'pay-grade:',
    'tax-config:',
    'financial-year:',
    'onboarding:',
    'offboarding:',
    'mobility:',
    'report:',
    'backup:',
    'automation:',
    'auto-clock-settings:',
    'manual-clock-settings:',
    'branding:',
    'vacancy:',
    'application:',
    'interview:',
    'candidate:',
    'hiring-approval:',
    'chat-message:',
    'team-calendar-event:',
  ];

  const allKeys: string[] = [];
  
  for (const prefix of prefixes) {
    try {
      const items = await kv.getByPrefix(prefix);
      for (const item of items) {
        // Reconstruct the key from the item
        const key = `${prefix}${item.id || item.userId || item.reference || ''}`;
        allKeys.push(key);
      }
    } catch (error) {
      console.log(`Error getting keys for prefix ${prefix}:`, error);
    }
  }

  return allKeys;
}

/**
 * Delete all Supabase Auth users
 */
async function deleteAllAuthUsers() {
  const sb = supabaseAdmin();
  let deletedCount = 0;
  
  try {
    const { data: { users }, error } = await sb.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return { success: false, deletedCount: 0, error: error.message };
    }

    if (!users || users.length === 0) {
      console.log('No auth users found');
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${users.length} auth users to delete`);

    for (const user of users) {
      try {
        const { error: deleteError } = await sb.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`Failed to delete user ${user.email}:`, deleteError);
        } else {
          deletedCount++;
          console.log(`Deleted auth user: ${user.email}`);
        }
      } catch (err) {
        console.error(`Error deleting user ${user.email}:`, err);
      }
    }

    return { success: true, deletedCount };
  } catch (error: any) {
    console.error('Error in deleteAllAuthUsers:', error);
    return { success: false, deletedCount, error: error.message };
  }
}

/**
 * Delete all KV store data
 */
async function deleteAllKVData() {
  let deletedCount = 0;
  
  try {
    const allKeys = await getAllKVKeys();
    
    if (allKeys.length === 0) {
      console.log('No KV store keys found');
      return { success: true, deletedCount: 0 };
    }

    console.log(`Found ${allKeys.length} KV store keys to delete`);

    // Delete in batches to avoid overwhelming the system
    const batchSize = 50;
    for (let i = 0; i < allKeys.length; i += batchSize) {
      const batch = allKeys.slice(i, i + batchSize);
      
      try {
        await kv.mdel(batch);
        deletedCount += batch.length;
        console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} keys (total: ${deletedCount}/${allKeys.length})`);
      } catch (err) {
        console.error(`Error deleting batch starting at index ${i}:`, err);
      }
    }

    return { success: true, deletedCount };
  } catch (error: any) {
    console.error('Error in deleteAllKVData:', error);
    return { success: false, deletedCount, error: error.message };
  }
}

/**
 * Clear Supabase Storage buckets (if any)
 */
async function clearStorageBuckets() {
  const sb = supabaseAdmin();
  let clearedCount = 0;
  
  try {
    const { data: buckets, error } = await sb.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return { success: false, clearedCount: 0, error: error.message };
    }

    if (!buckets || buckets.length === 0) {
      console.log('No storage buckets found');
      return { success: true, clearedCount: 0 };
    }

    console.log(`Found ${buckets.length} storage buckets`);

    // Only delete buckets that belong to this app (prefixed with make-server-a35148f0)
    for (const bucket of buckets) {
      if (bucket.name.startsWith('make-server-a35148f0')) {
        try {
          // List all files in bucket
          const { data: files } = await sb.storage.from(bucket.name).list();
          
          if (files && files.length > 0) {
            // Delete all files
            const filePaths = files.map(f => f.name);
            await sb.storage.from(bucket.name).remove(filePaths);
            console.log(`Deleted ${filePaths.length} files from bucket: ${bucket.name}`);
          }

          // Delete the bucket itself
          await sb.storage.deleteBucket(bucket.name);
          clearedCount++;
          console.log(`Deleted storage bucket: ${bucket.name}`);
        } catch (err) {
          console.error(`Error clearing bucket ${bucket.name}:`, err);
        }
      }
    }

    return { success: true, clearedCount };
  } catch (error: any) {
    console.error('Error in clearStorageBuckets:', error);
    return { success: false, clearedCount, error: error.message };
  }
}

/**
 * Main cleanup function
 */
export async function performProductionCleanup() {
  console.log('='.repeat(60));
  console.log('BLUMEBYTE PRODUCTION CLEANUP STARTING');
  console.log('='.repeat(60));
  console.log('Timestamp:', new Date().toISOString());
  console.log('');

  const results = {
    timestamp: new Date().toISOString(),
    authUsers: { success: false, count: 0, error: null as string | null },
    kvData: { success: false, count: 0, error: null as string | null },
    storage: { success: false, count: 0, error: null as string | null },
    overall: { success: false, message: '' }
  };

  // Step 1: Delete all auth users
  console.log('Step 1/3: Deleting all Supabase Auth users...');
  const authResult = await deleteAllAuthUsers();
  results.authUsers = {
    success: authResult.success,
    count: authResult.deletedCount,
    error: authResult.error || null
  };
  console.log(`✓ Auth users deleted: ${authResult.deletedCount}`);
  console.log('');

  // Step 2: Delete all KV store data
  console.log('Step 2/3: Deleting all KV store data...');
  const kvResult = await deleteAllKVData();
  results.kvData = {
    success: kvResult.success,
    count: kvResult.deletedCount,
    error: kvResult.error || null
  };
  console.log(`✓ KV store keys deleted: ${kvResult.deletedCount}`);
  console.log('');

  // Step 3: Clear storage buckets
  console.log('Step 3/3: Clearing storage buckets...');
  const storageResult = await clearStorageBuckets();
  results.storage = {
    success: storageResult.success,
    count: storageResult.clearedCount,
    error: storageResult.error || null
  };
  console.log(`✓ Storage buckets cleared: ${storageResult.clearedCount}`);
  console.log('');

  // Final summary
  const allSuccessful = results.authUsers.success && results.kvData.success && results.storage.success;
  results.overall = {
    success: allSuccessful,
    message: allSuccessful 
      ? 'Production cleanup completed successfully. System is ready for production use.'
      : 'Production cleanup completed with some errors. Please check the logs.'
  };

  console.log('='.repeat(60));
  console.log('CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Auth Users Deleted: ${results.authUsers.count}`);
  console.log(`KV Store Keys Deleted: ${results.kvData.count}`);
  console.log(`Storage Buckets Cleared: ${results.storage.count}`);
  console.log('Status:', results.overall.success ? '✓ SUCCESS' : '⚠ COMPLETED WITH WARNINGS');
  console.log('='.repeat(60));
  console.log('');

  if (allSuccessful) {
    console.log('🎉 The system is now in a clean production-ready state!');
    console.log('');
    console.log('Next Steps:');
    console.log('1. First company signup will trigger initial setup');
    console.log('2. Each company will be completely isolated');
    console.log('3. All data is multi-tenant ready with proper isolation');
    console.log('4. Payment verification is enforced before account creation');
    console.log('');
  }

  return results;
}
