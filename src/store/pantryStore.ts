import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PantryItem {
  name: string;
  amount: string;
  group: string;
  addedAt: string;
}

export type GrocerySource = 'manual' | 'mealplan' | 'recipe';

export interface GroceryItem {
  name: string;
  amount: string;
  group: string;
  checked: boolean;
  source: GrocerySource;
}

interface PantryGroceryState {
  // Pantry — what user already has (persists forever)
  pantryItems: PantryItem[];
  addPantryItem: (name: string, amount: string, group?: string) => void;
  removePantryItem: (index: number) => void;
  getPantryNames: () => string[];

  // Grocery — shopping list (persists forever)
  groceryItems: GroceryItem[];
  customGroups: string[];
  addGroceryItem: (name: string, amount: string, group?: string) => void;
  removeGroceryItem: (index: number) => void;
  toggleGroceryItem: (index: number) => void;
  addGroceryItems: (items: { name: string; amount: string; group: string }[], source?: GrocerySource) => void;
  clearCheckedGrocery: () => void;

  // Cross-transfer
  groceryToPantry: (index: number) => void; // check grocery → move to pantry
  pantryToGrocery: (index: number) => void; // check pantry → move to grocery (ran out)

  // Custom groups
  addCustomGroup: (name: string) => void;
  removeCustomGroup: (name: string) => void;
  moveGroceryToGroup: (index: number, group: string) => void;

  // Dietary restrictions (persisted, pre-filled everywhere)
  dietaryRestrictions: string[];
  setDietaryRestrictions: (restrictions: string[]) => void;
}

export const usePantryStore = create<PantryGroceryState>()(persist((set, get) => ({
  pantryItems: [],
  groceryItems: [],
  customGroups: [],
  dietaryRestrictions: [],

  // --- Pantry ---
  addPantryItem: (name, amount, group = 'PANTRY') => {
    // Don't add duplicates
    const exists = get().pantryItems.some(
      (i) => i.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) return;
    set((state) => ({
      pantryItems: [
        ...state.pantryItems,
        { name, amount, group, addedAt: new Date().toISOString() },
      ],
    }));
  },

  removePantryItem: (index) =>
    set((state) => ({
      pantryItems: state.pantryItems.filter((_, i) => i !== index),
    })),

  getPantryNames: () => get().pantryItems.map((i) => i.name),

  // --- Grocery ---
  addGroceryItem: (name, amount, group = 'OTHER') => {
    set((state) => ({
      groceryItems: [
        ...state.groceryItems,
        { name, amount, group, checked: false, source: 'manual' as GrocerySource },
      ],
      // Remove from pantry — if adding to grocery, user ran out
      pantryItems: state.pantryItems.filter(
        (p) => p.name.toLowerCase() !== name.toLowerCase()
      ),
    }));
  },

  removeGroceryItem: (index) =>
    set((state) => ({
      groceryItems: state.groceryItems.filter((_, i) => i !== index),
    })),

  toggleGroceryItem: (index) =>
    set((state) => ({
      groceryItems: state.groceryItems.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      ),
    })),

  addGroceryItems: (items, source: GrocerySource = 'mealplan') =>
    set((state) => {
      // If from meal plan, clear old mealplan/recipe items first (keep manual)
      const baseGrocery = source === 'mealplan'
        ? state.groceryItems.filter((i) => i.source === 'manual')
        : state.groceryItems;

      const existingNames = new Set(baseGrocery.map((i) => i.name.toLowerCase()));
      const newItems = items
        .filter((i) => !existingNames.has(i.name.toLowerCase()))
        .map((i) => ({ ...i, checked: false, source }));
      // Remove added items from pantry
      const addedNames = new Set(newItems.map((i) => i.name.toLowerCase()));
      const updatedPantry = state.pantryItems.filter(
        (p) => !addedNames.has(p.name.toLowerCase())
      );
      return {
        groceryItems: [...baseGrocery, ...newItems],
        pantryItems: updatedPantry,
      };
    }),

  clearCheckedGrocery: () =>
    set((state) => ({
      groceryItems: state.groceryItems.filter((i) => !i.checked),
    })),

  // --- Cross-transfer ---
  groceryToPantry: (index) => {
    const item = get().groceryItems[index];
    if (!item) return;
    set((state) => ({
      groceryItems: state.groceryItems.filter((_, i) => i !== index),
    }));
    // Add to pantry (dedup handled inside)
    get().addPantryItem(item.name, item.amount, item.group);
  },

  pantryToGrocery: (index) => {
    const item = get().pantryItems[index];
    if (!item) return;
    set((state) => ({
      pantryItems: state.pantryItems.filter((_, i) => i !== index),
      groceryItems: [
        ...state.groceryItems,
        { name: item.name, amount: item.amount, group: item.group, checked: false, source: 'manual' as GrocerySource },
      ],
    }));
  },

  // --- Custom groups ---
  addCustomGroup: (name) =>
    set((state) => ({
      customGroups: state.customGroups.includes(name)
        ? state.customGroups
        : [...state.customGroups, name],
    })),

  removeCustomGroup: (name) =>
    set((state) => ({
      customGroups: state.customGroups.filter((g) => g !== name),
      groceryItems: state.groceryItems.map((item) =>
        item.group === name ? { ...item, group: 'OTHER' } : item
      ),
    })),

  moveGroceryToGroup: (index, group) =>
    set((state) => ({
      groceryItems: state.groceryItems.map((item, i) =>
        i === index ? { ...item, group } : item
      ),
    })),

  // --- Dietary ---
  setDietaryRestrictions: (restrictions) => set({ dietaryRestrictions: restrictions }),
}), {
  name: 'spicechef-pantry',
  storage: createJSONStorage(() => AsyncStorage),
  merge: (persisted: any, current) => {
    if (!persisted) return current;
    return {
      ...current,
      ...persisted,
      // Ensure old cached items get source field
      groceryItems: (persisted.groceryItems || []).map((i: any) => ({
        ...i,
        source: i.source || (i.isManual ? 'manual' : 'manual'),
      })),
    };
  },
}));
