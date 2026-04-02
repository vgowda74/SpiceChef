import { supabase } from './supabase';
import {
  MealPlan,
  MealSlot,
  DayPlan,
  GroceryItem,
  MealPlanWizard,
} from '../store/mealPlanStore';

/**
 * Generate a 7-day meal plan via the Supabase edge function.
 */
export async function generateMealPlan(wizard: MealPlanWizard): Promise<MealPlan> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.functions.invoke('generate-meal-plan', {
    body: {
      dietaryRestrictions: wizard.dietaryRestrictions,
      availableIngredients: wizard.availableIngredients,
      mealTypes: wizard.mealTypes,
      drinkTypes: wizard.drinkTypes,
      planMode: wizard.planMode,
      servingSize: wizard.servingSize,
    },
  });

  if (error) throw new Error(`Meal plan generation failed: ${error.message}`);
  if (!data?.mealPlan) throw new Error(data?.error || 'Could not generate meal plan.');

  const parsed = data.mealPlan;

  const days: DayPlan[] = (parsed.plan || []).map((d: any) => ({
    day: d.day,
    meals: (d.meals || []).map((m: any): MealSlot => ({
      mealType: m.mealType,
      title: m.title,
      description: m.description || '',
      duration_mins: m.duration_mins || 0,
      recipeId: null,
    })),
  }));

  const groceryList: GroceryItem[] = (parsed.grocery_list || []).map((g: any) => ({
    name: g.name,
    amount: g.amount || '',
    category: g.category || 'PANTRY',
    group: g.category || 'PANTRY', // default group = category
    checked: false,
  }));

  const plan: MealPlan = {
    id: `mp_${Date.now()}`,
    createdAt: new Date().toISOString(),
    servingSize: wizard.servingSize,
    days,
    groceryList,
    customGroups: [],
  };

  return plan;
}
