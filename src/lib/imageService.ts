import { supabase } from './supabase';

const FAL_API_URL = 'https://fal.run/fal-ai/flux-1/schnell';
const FAL_KEY = '9885ee8c-ab68-480f-aa8f-368bf3bc85b0:5b09196c29cb21ed847da1ede98d0276';
const STORAGE_BUCKET = 'recipe-images';

/**
 * Generate a food photo for a recipe using fal.ai and upload to Supabase Storage.
 * Returns the public URL of the uploaded image, or null on failure.
 */
export async function generateRecipeImage(
  recipeId: string,
  title: string,
  type: 'recipe' | 'cookbook' = 'recipe',
): Promise<string | null> {
  try {
    const prompt = type === 'cookbook'
      ? `Premium cookbook cover design, elegant food magazine style, '${title}' cookbook, stunning hero dish photograph, dramatic moody lighting, dark elegant background, gold accents, cinematic composition, professional food styling, portrait orientation, 4k quality`
      : `${title} served in a ceramic bowl on a dark wooden table, natural soft lighting, realistic food photo, not styled, authentic home cooking, warm tones, slightly imperfect plating, shot with a 50mm lens`;

    // Generate image via fal.ai
    const falResponse = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'portrait_4_3',
        num_images: 1,
      }),
    });

    if (!falResponse.ok) return null;

    const falData = await falResponse.json();
    const imageUrl = falData?.images?.[0]?.url;
    if (!imageUrl) return null;

    // Download the image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return null;
    const imgBlob = await imgResponse.blob();

    // Upload to Supabase Storage
    if (!supabase) return null;
    const folder = type === 'cookbook' ? 'cookbooks' : 'recipes';
    const storagePath = `images/${folder}/${recipeId}.jpg`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, imgBlob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.warn('Image upload failed:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath);

    return urlData.publicUrl;
  } catch (err) {
    console.warn('Image generation failed:', err);
    return null;
  }
}

/**
 * Generate images for multiple recipes in the background.
 * Updates the callback with each completed image.
 */
export async function generateImagesForRecipes(
  recipes: { id: string; title: string }[],
  onImageReady?: (recipeId: string, imageUrl: string) => void,
): Promise<void> {
  for (const recipe of recipes) {
    const url = await generateRecipeImage(recipe.id, recipe.title, 'recipe');
    if (url && onImageReady) {
      onImageReady(recipe.id, url);
    }
  }
}
