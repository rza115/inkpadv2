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

/**
 * Upload a file to the inkpad-media bucket with proper user folder structure
 * @param folder - Folder name (e.g., 'characters', 'covers')
 * @param file - File to upload
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(folder: string, file: File): Promise<string> {
  const supabase = createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const ext = file.name.split('.').pop();
  const filename = `${timestamp}-${randomString}.${ext}`;
  
  // Path: <user_id>/<folder>/<filename>
  const filePath = `${user.id}/${folder}/${filename}`;
  
  // Upload file to inkpad-media bucket
  const { data, error } = await supabase.storage
    .from('inkpad-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('inkpad-media')
    .getPublicUrl(data.path);
  
  return publicUrl;
}
