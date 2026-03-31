// Supabase Edge Function: admin-add-cookbook
// Adds a featured cookbook with recipes to the database.
// Protected by ADMIN_SECRET header — only callable by admin scripts.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify admin secret
    const adminSecret = Deno.env.get('ADMIN_SECRET');
    const providedSecret = req.headers.get('x-admin-secret');

    if (!adminSecret || providedSecret !== adminSecret) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { cookbook, recipes } = await req.json();

    if (!cookbook?.title || !Array.isArray(recipes) || recipes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Must provide cookbook (with title) and recipes array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Create a service-role client to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check for duplicate title
    const { data: existing } = await supabase
      .from('cookbooks')
      .select('id')
      .eq('title', cookbook.title)
      .eq('is_featured', true)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(
        JSON.stringify({ error: `Cookbook "${cookbook.title}" already exists (id: ${existing[0].id}). Skipping.` }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Insert the cookbook
    const { data: insertedCookbook, error: cbError } = await supabase
      .from('cookbooks')
      .insert({
        title: cookbook.title,
        author: cookbook.author || '',
        recipe_count: recipes.length,
        is_featured: true,
        user_id: null,
      })
      .select('id')
      .single();

    if (cbError) {
      return new Response(
        JSON.stringify({ error: `Cookbook insert failed: ${cbError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const cookbookId = insertedCookbook.id;

    // Insert all recipes linked to this cookbook
    const recipeRows = recipes.map((r: any) => ({
      cookbook_id: cookbookId,
      user_id: null,
      title: r.title,
      ingredients: r.ingredients || [],
      steps: r.steps || [],
      base_serves: r.base_serves || 4,
      tags: r.tags || [],
      duration_mins: r.duration_mins || 0,
    }));

    const { data: insertedRecipes, error: rError } = await supabase
      .from('recipes')
      .insert(recipeRows)
      .select('id, title');

    if (rError) {
      return new Response(
        JSON.stringify({ error: `Recipe insert failed: ${rError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        cookbook_id: cookbookId,
        recipes_added: insertedRecipes?.length ?? 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
