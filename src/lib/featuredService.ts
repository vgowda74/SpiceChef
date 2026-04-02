import { supabase } from './supabase';
import { Cookbook, Recipe } from '../store/recipeStore';

const ACCENT_PALETTE = ['#6B3A2A', '#2C4A3E', '#3D3228', '#1B3A4B', '#4A3728', '#5A6B2A', '#6B2A2A', '#2A4A6B'];

/**
 * Fetch all featured (admin-loaded) cookbooks and their recipes from Supabase.
 * Returns empty arrays if Supabase is not configured or request fails.
 */
export async function fetchFeaturedCookbooks(): Promise<{
  cookbooks: Cookbook[];
  recipes: Recipe[];
}> {
  if (!supabase) return { cookbooks: [], recipes: [] };

  try {
    // Fetch featured cookbooks
    const { data: cbRows, error: cbError } = await supabase
      .from('cookbooks')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: true });

    if (cbError || !cbRows?.length) return { cookbooks: [], recipes: [] };

    // Deduplicate by title — keep only the first of each
    const seenTitles = new Set<string>();
    const uniqueCbRows = cbRows.filter((cb: any) => {
      if (seenTitles.has(cb.title)) return false;
      seenTitles.add(cb.title);
      return true;
    });

    const cookbookIds = uniqueCbRows.map((cb: any) => cb.id);

    // Fetch all recipes for featured cookbooks
    const { data: recipeRows, error: rError } = await supabase
      .from('recipes')
      .select('*')
      .in('cookbook_id', cookbookIds);

    if (rError) return { cookbooks: [], recipes: [] };

    // Map to app types
    const cookbooks: Cookbook[] = uniqueCbRows.map((cb: any, idx: number) => ({
      id: cb.id,
      title: cb.title,
      author: cb.author || '',
      accent_color: ACCENT_PALETTE[idx % ACCENT_PALETTE.length],
      recipe_count: cb.recipe_count || 0,
      created_at: cb.created_at,
      image_url: cb.cover_url || undefined,
    }));

    const recipes: Recipe[] = (recipeRows || []).map((r: any) => ({
      id: r.id,
      cookbook_id: r.cookbook_id,
      title: r.title,
      ingredients: r.ingredients || [],
      steps: r.steps || [],
      base_serves: r.base_serves || 4,
      tags: r.tags || [],
      duration_mins: r.duration_mins || 0,
      image_url: r.image_url || undefined,
    }));

    return { cookbooks, recipes };
  } catch {
    return { cookbooks: [], recipes: [] };
  }
}
