import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Wizard types ---

export type MealType = 'breakfast' | 'lunch_dinner' | 'snack' | 'dessert' | 'drinks';
export type DrinkType = 'coffee' | 'tea' | 'smoothie' | 'cocktail' | 'juice';

export interface MealPlanWizard {
  dietaryRestrictions: string[];
  availableIngredients: string[];
  mealTypes: MealType[];
  drinkTypes: DrinkType[];
  planMode: 'same' | 'varied';
  servingSize: number;
}

// --- Saved plan types ---

export interface MealSlot {
  mealType: string;
  title: string;
  description: string;
  duration_mins: number;
  recipeId: string | null; // null until full recipe is generated
}

export interface DayPlan {
  day: string;
  meals: MealSlot[];
}

export interface GroceryItem {
  name: string;
  amount: string;
  category: string; // default category from AI
  group: string;    // user-assigned group (defaults to category)
  checked: boolean;
  isManual?: boolean; // true if manually added by user
}

export interface MealPlan {
  id: string;
  createdAt: string;
  servingSize: number;
  days: DayPlan[];
  groceryList: GroceryItem[];
  customGroups: string[]; // user-created groups like "Walmart", "Costco"
}

// --- Store ---

interface MealPlanState {
  // Wizard state (ephemeral)
  wizard: MealPlanWizard;
  setWizardField: <K extends keyof MealPlanWizard>(key: K, value: MealPlanWizard[K]) => void;
  resetWizard: () => void;

  // Saved plans
  mealPlans: MealPlan[];
  activePlanId: string | null;
  addMealPlan: (plan: MealPlan) => void;
  removeMealPlan: (id: string) => void;
  getActivePlan: () => MealPlan | undefined;
  setActivePlan: (id: string) => void;
  updateMealSlotRecipeId: (planId: string, day: string, mealType: string, recipeId: string) => void;
  toggleGroceryItem: (planId: string, index: number) => void;
  addCustomGroup: (planId: string, groupName: string) => void;
  removeCustomGroup: (planId: string, groupName: string) => void;
  moveItemToGroup: (planId: string, itemIndex: number, group: string) => void;
  addGroceryItem: (planId: string, name: string, amount: string, group: string) => void;
  removeGroceryItem: (planId: string, index: number) => void;
  lifetimeMealPlans: number;
  incrementLifetimeMealPlans: () => void;
}

const DEFAULT_WIZARD: MealPlanWizard = {
  dietaryRestrictions: [],
  availableIngredients: [],
  mealTypes: ['breakfast', 'lunch_dinner'],
  drinkTypes: [],
  planMode: 'varied',
  servingSize: 2,
};

export const useMealPlanStore = create<MealPlanState>()(persist((set, get) => ({
  wizard: { ...DEFAULT_WIZARD },

  setWizardField: (key, value) =>
    set((state) => ({ wizard: { ...state.wizard, [key]: value } })),

  resetWizard: () => set({ wizard: { ...DEFAULT_WIZARD } }),

  mealPlans: [],
  activePlanId: null,
  lifetimeMealPlans: 0,

  addMealPlan: (plan) =>
    set((state) => ({
      mealPlans: [plan, ...state.mealPlans],
      activePlanId: plan.id,
    })),

  removeMealPlan: (id) =>
    set((state) => ({
      mealPlans: state.mealPlans.filter((p) => p.id !== id),
      activePlanId: state.activePlanId === id ? null : state.activePlanId,
    })),

  getActivePlan: () => {
    const { mealPlans, activePlanId } = get();
    return mealPlans.find((p) => p.id === activePlanId);
  },

  setActivePlan: (id) => set({ activePlanId: id }),

  updateMealSlotRecipeId: (planId, day, mealType, recipeId) =>
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              days: plan.days.map((d) =>
                d.day === day
                  ? {
                      ...d,
                      meals: d.meals.map((m) =>
                        m.mealType === mealType ? { ...m, recipeId } : m
                      ),
                    }
                  : d
              ),
            }
          : plan
      ),
    })),

  toggleGroceryItem: (planId, index) =>
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              groceryList: plan.groceryList.map((item, i) =>
                i === index ? { ...item, checked: !item.checked } : item
              ),
            }
          : plan
      ),
    })),

  addCustomGroup: (planId, groupName) =>
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) =>
        plan.id === planId && !(plan.customGroups || []).includes(groupName)
          ? { ...plan, customGroups: [...(plan.customGroups || []), groupName] }
          : plan
      ),
    })),

  removeCustomGroup: (planId, groupName) =>
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              customGroups: (plan.customGroups || []).filter((g) => g !== groupName),
              // Move items back to their default category
              groceryList: plan.groceryList.map((item) =>
                item.group === groupName ? { ...item, group: item.category } : item
              ),
            }
          : plan
      ),
    })),

  moveItemToGroup: (planId, itemIndex, group) =>
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              groceryList: plan.groceryList.map((item, i) =>
                i === itemIndex ? { ...item, group } : item
              ),
            }
          : plan
      ),
    })),

  addGroceryItem: (planId, name, amount, group) =>
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              groceryList: [
                ...plan.groceryList,
                { name, amount, category: group, group, checked: false, isManual: true },
              ],
            }
          : plan
      ),
    })),

  removeGroceryItem: (planId, index) =>
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) =>
        plan.id === planId
          ? { ...plan, groceryList: plan.groceryList.filter((_, i) => i !== index) }
          : plan
      ),
    })),

  incrementLifetimeMealPlans: () =>
    set((state) => ({ lifetimeMealPlans: state.lifetimeMealPlans + 1 })),
}), {
  name: 'spicechef-mealplans',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    mealPlans: state.mealPlans,
    activePlanId: state.activePlanId,
    lifetimeMealPlans: state.lifetimeMealPlans,
  }),
  merge: (persisted: any, current) => {
    if (!persisted) return current;
    // Ensure old cached plans get new fields
    const mealPlans = (persisted.mealPlans || []).map((plan: any) => ({
      ...plan,
      customGroups: plan.customGroups || [],
      groceryList: (plan.groceryList || []).map((item: any) => ({
        ...item,
        group: item.group || item.category || 'OTHER',
      })),
      days: (plan.days || []).map((day: any) => ({
        ...day,
        meals: day.meals || [],
      })),
    }));
    return {
      ...current,
      mealPlans,
      activePlanId: persisted.activePlanId ?? null,
      lifetimeMealPlans: persisted.lifetimeMealPlans ?? 0,
    };
  },
}));
