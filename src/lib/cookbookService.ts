import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';
import { Cookbook, Recipe } from '../store/recipeStore';

const ACCENT_PALETTE = ['#6B3A2A', '#2C4A3E', '#3D3228', '#1B3A4B', '#4A3728'];

export interface UploadProgress {
  stage: 'uploading' | 'parsing' | 'saving' | 'done' | 'error';
  message: string;
}

/**
 * Upload a PDF cookbook, parse it with Claude via Supabase Edge Function,
 * and return the cookbook + recipes.
 */
export async function uploadAndParseCookbook(
  fileUri: string,
  fileName: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<{ cookbook: Cookbook; recipes: Recipe[] }> {
  const notify = (stage: UploadProgress['stage'], message: string) => {
    onProgress?.({ stage, message });
  };

  // 1. Upload PDF to Supabase Storage
  notify('uploading', 'Uploading PDF...');

  const fileExt = fileName.split('.').pop()?.toLowerCase() || 'pdf';
  const storagePath = `uploads/${Date.now()}_${fileName}`;

  // Read file as base64 for upload
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64' as any,
  });

  // Decode base64 to Uint8Array for upload
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const { error: uploadError } = await supabase.storage
    .from('cookbooks')
    .upload(storagePath, bytes, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    notify('error', `Upload failed: ${uploadError.message}`);
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // 2. Call Edge Function to parse with Claude
  notify('parsing', 'Claude is reading your cookbook...');

  const { data: fnData, error: fnError } = await supabase.functions.invoke(
    'parse-cookbook',
    {
      body: {
        file_path: storagePath,
        user_id: null, // TODO: use real user ID after auth
      },
    },
  );

  if (fnError) {
    notify('error', `Parsing failed: ${fnError.message}`);
    throw new Error(`Edge function failed: ${fnError.message}`);
  }

  if (!fnData?.cookbook || !fnData?.recipes) {
    const detail = fnData?.error || 'Unknown error';
    notify('error', `Parsing failed: ${detail}`);
    throw new Error(`Parse failed: ${detail}`);
  }

  // 3. Map database rows to app types
  notify('saving', 'Saving recipes...');

  const dbCookbook = fnData.cookbook;
  const dbRecipes = fnData.recipes;

  const cookbook: Cookbook = {
    id: dbCookbook.id,
    title: dbCookbook.title,
    author: dbCookbook.author || 'Unknown',
    accent_color: ACCENT_PALETTE[Math.floor(Math.random() * ACCENT_PALETTE.length)],
    recipe_count: dbRecipes.length,
    created_at: dbCookbook.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  };

  const recipes: Recipe[] = dbRecipes.map((r: any) => ({
    id: r.id,
    cookbook_id: r.cookbook_id,
    title: r.title,
    ingredients: r.ingredients || [],
    steps: r.steps || [],
    base_serves: r.base_serves || 4,
    tags: r.tags || [],
    duration_mins: r.duration_mins || 0,
  }));

  notify('done', `Found ${recipes.length} recipes!`);

  return { cookbook, recipes };
}

/**
 * Fetch all cookbooks from Supabase for the current user.
 */
export async function fetchCookbooks(): Promise<Cookbook[]> {
  const { data, error } = await supabase
    .from('cookbooks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch cookbooks: ${error.message}`);

  return (data || []).map((row: any, idx: number) => ({
    id: row.id,
    title: row.title,
    author: row.author || 'Unknown',
    accent_color: ACCENT_PALETTE[idx % ACCENT_PALETTE.length],
    recipe_count: row.recipe_count || 0,
    created_at: row.created_at?.split('T')[0] || '',
  }));
}

/**
 * Fetch all recipes for a specific cookbook from Supabase.
 */
export async function fetchRecipesByCookbook(cookbookId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('cookbook_id', cookbookId);

  if (error) throw new Error(`Failed to fetch recipes: ${error.message}`);

  return (data || []).map((r: any) => ({
    id: r.id,
    cookbook_id: r.cookbook_id,
    title: r.title,
    ingredients: r.ingredients || [],
    steps: r.steps || [],
    base_serves: r.base_serves || 4,
    tags: r.tags || [],
    duration_mins: r.duration_mins || 0,
  }));
}
