import { Recipe } from '../store/recipeStore';
import { supabase } from './supabase';

const MY_RECIPES_COOKBOOK_ID = 'cb_my_recipes';

export async function generateRecipe(description: string): Promise<Recipe> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke('generate-recipe', {
    body: { description },
  });

  if (error) throw new Error(`Recipe generation failed: ${error.message}`);
  if (!data?.recipe) throw new Error(data?.error || 'Could not generate recipe.');

  const parsed = data.recipe;

  const recipe: Recipe = {
    id: `my_${Date.now()}`,
    cookbook_id: MY_RECIPES_COOKBOOK_ID,
    title: parsed.title || 'My Recipe',
    base_serves: parsed.base_serves || 4,
    duration_mins: parsed.duration_mins || 30,
    tags: parsed.tags || [],
    ingredients: (parsed.ingredients || []).map((ing: any) => ({
      name: ing.name,
      amount: Number(ing.amount) || 1,
      unit: ing.unit || '',
      category: ing.category || 'PANTRY',
    })),
    steps: (parsed.steps || []).map((step: any) => ({
      order: step.order,
      title: step.title,
      text: step.text,
      timer_seconds: step.timer_seconds,
      timer_label: step.timer_label,
      needed_ingredients: step.needed_ingredients,
    })),
  };

  return recipe;
}

export { MY_RECIPES_COOKBOOK_ID };
