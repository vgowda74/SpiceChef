import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Round up recipe amounts to practical minimum shoppable quantities.
 * e.g. "0.5 tsp" → "1 tsp", "150 g" → "200 g", "1.3 kg" → "1.5 kg"
 */
function toShoppableAmount(amount: string): string {
  if (!amount) return amount;

  // Extract number and unit
  const match = amount.match(/^([\d.]+)\s*(.*)$/);
  if (!match) return amount;

  const num = parseFloat(match[1]);
  const unit = match[2].trim().toLowerCase();
  if (isNaN(num)) return amount;

  let rounded = num;

  // Round up based on unit type
  if (['g', 'gm', 'gram', 'grams'].includes(unit)) {
    // Round up to nearest 50g for small, 100g for larger
    if (num <= 100) rounded = Math.ceil(num / 50) * 50;
    else rounded = Math.ceil(num / 100) * 100;
  } else if (['kg', 'kilogram', 'kilograms'].includes(unit)) {
    rounded = Math.ceil(num * 2) / 2; // Round to nearest 0.5 kg
  } else if (['ml', 'milliliter', 'milliliters'].includes(unit)) {
    if (num <= 100) rounded = Math.ceil(num / 50) * 50;
    else rounded = Math.ceil(num / 100) * 100;
  } else if (['l', 'liter', 'liters', 'litre', 'litres'].includes(unit)) {
    rounded = Math.ceil(num * 2) / 2; // Round to nearest 0.5 L
  } else if (['tsp', 'teaspoon'].includes(unit)) {
    rounded = Math.ceil(num); // Round up to whole tsp
  } else if (['tbsp', 'tablespoon'].includes(unit)) {
    rounded = Math.ceil(num); // Round up to whole tbsp
  } else if (['cup', 'cups'].includes(unit)) {
    rounded = Math.ceil(num * 4) / 4; // Round to nearest ¼ cup
  } else if (['whole', 'piece', 'pieces', ''].includes(unit)) {
    rounded = Math.ceil(num); // Always round up whole items
  } else {
    rounded = Math.ceil(num); // Default: round up
  }

  // Format nicely
  const formatted = rounded === Math.floor(rounded) ? rounded.toString() : rounded.toFixed(1);
  return unit ? `${formatted} ${match[2].trim()}` : formatted;
}

export interface PantryItem {
  name: string;
  amount: string;
  group: string;
  addedAt: string;
}

export interface GroceryItem {
  name: string;
  amount: string;
  group: string;
  checked: boolean;
  isManual?: boolean;
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
  addGroceryItems: (items: { name: string; amount: string; group: string }[]) => void;
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
    const shoppable = toShoppableAmount(amount);
    set((state) => ({
      groceryItems: [
        ...state.groceryItems,
        { name, amount: shoppable, group, checked: false, isManual: true },
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

  addGroceryItems: (items) =>
    set((state) => {
      const existingNames = new Set(state.groceryItems.map((i) => i.name.toLowerCase()));
      const newItems = items
        .filter((i) => !existingNames.has(i.name.toLowerCase()))
        .map((i) => ({ ...i, amount: toShoppableAmount(i.amount), checked: false }));
      // Remove added items from pantry
      const addedNames = new Set(newItems.map((i) => i.name.toLowerCase()));
      const updatedPantry = state.pantryItems.filter(
        (p) => !addedNames.has(p.name.toLowerCase())
      );
      return {
        groceryItems: [...state.groceryItems, ...newItems],
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
        { name: item.name, amount: item.amount, group: item.group, checked: false },
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
}));
