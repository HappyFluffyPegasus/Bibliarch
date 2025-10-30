import { createClient } from '@/lib/supabase/client'

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user's ID (for organizing files)
 * @param nodeId - The node ID (for unique naming)
 * @returns The storage path (e.g., "user123/node456-1234567890.jpg")
 */
export async function uploadImage(file: File, userId: string, nodeId: string): Promise<string> {
  const supabase = createClient()

  // Create unique filename with timestamp
  const fileExt = file.name.split('.').pop() || 'jpg'
  const fileName = `${userId}/${nodeId}-${Date.now()}.${fileExt}`

  // Upload to storage with aggressive caching (1 year)
  const { data, error } = await supabase.storage
    .from('story-images')
    .upload(fileName, file, {
      cacheControl: '31536000', // 1 year in seconds - prevents repeated fetches
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    throw error
  }

  // Return the storage path (not full URL)
  // This path is what we save in the database
  return data.path
}

/**
 * Get the public URL for a storage path
 * @param storagePath - The path returned from uploadImage
 * @returns The full public URL to display the image
 */
export function getImageUrl(storagePath: string | null | undefined): string {
  if (!storagePath) return ''

  // If it's already a full URL or base64, return as-is (backward compatibility)
  if (storagePath.startsWith('http') || storagePath.startsWith('data:')) {
    return storagePath
  }

  const supabase = createClient()

  // Get public URL for the image
  const { data } = supabase.storage
    .from('story-images')
    .getPublicUrl(storagePath)

  return data.publicUrl
}

/**
 * Delete an image from storage
 * @param storagePath - The storage path to delete
 */
export async function deleteImage(storagePath: string): Promise<void> {
  // Don't try to delete base64 or external URLs
  if (storagePath.startsWith('data:') || storagePath.startsWith('http')) {
    return
  }

  const supabase = createClient()

  const { error } = await supabase.storage
    .from('story-images')
    .remove([storagePath])

  if (error) {
    console.error('Delete error:', error)
    throw error
  }
}

/**
 * Convert a base64 data URL to a File object
 * Useful for migrating old base64 images to storage
 */
export function dataURLToFile(dataURL: string, filename: string = 'image.jpg'): File {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }

  return new File([u8arr], filename, { type: mime })
}
