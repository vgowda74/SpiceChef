import { supabase } from './supabase';

/**
 * Generate a food photo for a recipe via Supabase edge function.
 * The edge function calls fal.ai and uploads to Supabase Storage.
 * Returns the public URL of the uploaded image, or null on failure.
 */
export async function generateRecipeImage(
  recipeId: string,
  title: string,
  type: 'recipe' | 'cookbook' = 'recipe',
): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { id: recipeId, title, type },
    });

    if (error || !data?.image_url) {
      console.warn('Image generation failed:', error?.message || 'No image URL');
      return null;
    }

    return data.image_url;
  } catch (err) {
    console.warn('Image generation error:', err);
    return null;
  }
}
