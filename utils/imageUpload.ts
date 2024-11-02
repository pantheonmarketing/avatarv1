import { supabase } from '@/services/supabaseService';

export async function uploadImageToSupabase(
  temporaryImageUrl: string, 
  filename: string,
  clerkUserId?: string
): Promise<string> {
  try {
    // Fetch the image through our fetch-image API route
    const response = await fetch('/api/fetch-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl: temporaryImageUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    // Get the image blob
    const blob = await response.blob();

    // Create a unique path for the image
    const path = `avatars/${filename}.png`;

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('avatars')
      .upload(path, blob, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('Supabase storage error:', error);
      throw error;
    }

    // Get the public URL using the correct path
    const publicUrlResponse = supabase
      .storage
      .from('avatars')
      .getPublicUrl(path);

    if (!publicUrlResponse.data) {
      throw new Error('Failed to get public URL');
    }

    return publicUrlResponse.data.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
} 