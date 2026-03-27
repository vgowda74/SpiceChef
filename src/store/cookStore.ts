import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentCook {
  recipeId: string;
  cookbookId: string;
  completedAt: string; // ISO date string
}

interface CookState {
  recipeId: string | null;
  serves: number;
  currentStepIndex: number;
  checkedIngredients: number[];
  recentlyCooked: RecentCook[];
  startSession: (recipeId: string, serves: number) => void;
  setStepIndex: (index: number) => void;
  toggleIngredient: (index: number) => void;
  endSession: () => void;
  logCompletion: (recipeId: string, cookbookId: string) => void;
}

const MAX_RECENT = 30;

export const useCookStore = create<CookState>()(persist((set) => ({
  recipeId: null,
  serves: 2,
  currentStepIndex: 0,
  checkedIngredients: [],
  recentlyCooked: [],

  startSession: (recipeId, serves) =>
    set({ recipeId, serves, currentStepIndex: 0, checkedIngredients: [] }),

  setStepIndex: (index) => set({ currentStepIndex: index }),

  toggleIngredient: (index) =>
    set((state) => ({
      checkedIngredients: state.checkedIngredients.includes(index)
        ? state.checkedIngredients.filter((i) => i !== index)
        : [...state.checkedIngredients, index],
    })),

  endSession: () =>
    set({ recipeId: null, serves: 2, currentStepIndex: 0, checkedIngredients: [] }),

  logCompletion: (recipeId, cookbookId) =>
    set((state) => {
      const entry: RecentCook = {
        recipeId,
        cookbookId,
        completedAt: new Date().toISOString(),
      };
      // Most recent first, cap at MAX_RECENT
      return { recentlyCooked: [entry, ...state.recentlyCooked].slice(0, MAX_RECENT) };
    }),
}), {
  name: 'spicechef-cook',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    // Only persist recent history, not active session state
    recentlyCooked: state.recentlyCooked,
  }),
}));
