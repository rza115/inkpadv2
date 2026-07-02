/**
 * Storage Utilities
 * Handles file uploads to Supabase Storage
 */
import { createClient } from './supabase/client';

export class StorageAPI {
  /**
   * Upload a file to Supabase storage
   * @param bucket - Storage bucket name (e.g., 'covers')
   * @param file - File to upload
   * @returns Public URL of the uploaded file
   */
  static async upload(bucket: string, file: File): Promise<string> {
    const supabase = createClient();
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${ext}`;
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return publicUrl;
  }
}
