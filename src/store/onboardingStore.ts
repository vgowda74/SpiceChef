import { create } from 'zustand';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'halal'
  | 'kosher';

interface OnboardingState {
  dietary: DietaryRestriction[];
  skillLevel: SkillLevel | null;
  serves: number;
  toggleDietary: (tag: DietaryRestriction) => void;
  setSkillLevel: (level: SkillLevel) => void;
  setServes: (n: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  dietary: [],
  skillLevel: null,
  serves: 2,

  toggleDietary: (tag) =>
    set((state) => ({
      dietary: state.dietary.includes(tag)
        ? state.dietary.filter((d) => d !== tag)
        : [...state.dietary, tag],
    })),

  setSkillLevel: (level) => set({ skillLevel: level }),

  setServes: (n) => set({ serves: n }),

  reset: () => set({ dietary: [], skillLevel: null, serves: 2 }),
}));
