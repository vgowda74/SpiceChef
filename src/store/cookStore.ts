import { create } from 'zustand';

interface CookState {
  recipeId: string | null;
  serves: number;
  currentStepIndex: number;
  checkedIngredients: number[];
  startSession: (recipeId: string, serves: number) => void;
  setStepIndex: (index: number) => void;
  toggleIngredient: (index: number) => void;
  endSession: () => void;
}

export const useCookStore = create<CookState>((set) => ({
  recipeId: null,
  serves: 2,
  currentStepIndex: 0,
  checkedIngredients: [],

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
}));
