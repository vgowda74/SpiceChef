import { create } from 'zustand';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category?: string; // e.g. "PRODUCE", "DAIRY", "SPICES"
}

export interface RecipeStep {
  order: number;
  title?: string; // e.g. "Sauté the aromatics"
  text: string;
  timer_seconds?: number;
  timer_label?: string; // e.g. "Onion softening timer"
  needed_ingredients?: string[]; // items needed this step
}

export interface Recipe {
  id: string;
  cookbook_id: string;
  title: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  base_serves: number;
  tags: string[];
  duration_mins: number;
}

export interface Cookbook {
  id: string;
  title: string;
  author: string;
  accent_color: string;
  recipe_count: number;
  created_at: string;
}

const ACCENT_PALETTE = ['#6B3A2A', '#2C4A3E', '#3D3228', '#1B3A4B', '#4A3728'];

const MOCK_COOKBOOKS: Cookbook[] = [
  {
    id: 'cb1',
    title: 'Plenty More',
    author: 'Yotam Ottolenghi',
    accent_color: '#4A5E3A',
    recipe_count: 39,
    created_at: '2026-03-01',
  },
  {
    id: 'cb2',
    title: 'Indian-ish',
    author: 'Priya Krishna',
    accent_color: '#6B4A2A',
    recipe_count: 52,
    created_at: '2026-03-10',
  },
  {
    id: 'cb3',
    title: 'Death & Co.',
    author: 'David Kaplan',
    accent_color: '#2C3A4E',
    recipe_count: 148,
    created_at: '2026-03-15',
  },
];

const MOCK_RECIPES: Recipe[] = [
  {
    id: 'r1',
    cookbook_id: 'cb2',
    title: 'Saag Paneer',
    ingredients: [
      { name: 'Fresh spinach', amount: 400, unit: 'g', category: 'PRODUCE' },
      { name: 'Yellow onion', amount: 1, unit: 'large', category: 'PRODUCE' },
      { name: 'Garlic cloves', amount: 4, unit: 'cloves', category: 'PRODUCE' },
      { name: 'Fresh ginger', amount: 1, unit: 'inch', category: 'PRODUCE' },
      { name: 'Paneer', amount: 200, unit: 'g', category: 'DAIRY' },
      { name: 'Heavy cream', amount: 60, unit: 'ml', category: 'DAIRY' },
      { name: 'Cumin seeds', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Turmeric', amount: 0.5, unit: 'tsp', category: 'SPICES' },
      { name: 'Garam masala', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Vegetable oil', amount: 2, unit: 'tbsp', category: 'PANTRY' },
      { name: 'Salt', amount: 1, unit: 'tsp', category: 'PANTRY' },
    ],
    steps: [
      {
        order: 1,
        title: 'Blanch the spinach',
        text: 'Bring a large pot of water to a boil. Add the **fresh spinach** and blanch for **2 minutes** until wilted. Drain and plunge into ice water. Squeeze out excess moisture and roughly chop.',
        timer_seconds: 120,
        timer_label: 'Spinach blanching timer',
        needed_ingredients: ['400g spinach'],
      },
      {
        order: 2,
        title: 'Sauté the aromatics',
        text: 'Heat **2 tbsp oil** in a large pan over medium heat. Add the diced onion and cook, stirring occasionally, until softened and translucent — about **8 minutes**. Add the minced garlic and ginger, cook for another **2 minutes** until fragrant.',
        timer_seconds: 480,
        timer_label: 'Onion softening timer',
        needed_ingredients: ['2 tbsp oil', '1 onion, diced', '4 garlic cloves', '1 inch ginger'],
      },
      {
        order: 3,
        title: 'Toast the spices',
        text: 'Add the **cumin seeds**, **turmeric**, and **garam masala** to the pan. Stir constantly for **1 minute** until the spices are fragrant and well combined with the aromatics.',
        timer_seconds: 60,
        timer_label: 'Spice toasting timer',
        needed_ingredients: ['1 tsp cumin', '½ tsp turmeric', '1 tsp garam masala'],
      },
      {
        order: 4,
        title: 'Build the saag',
        text: 'Add the blanched spinach to the pan and stir well. Cook for **3 minutes**, then add the **heavy cream**. Stir until everything is well combined and the sauce is creamy.',
        timer_seconds: 180,
        timer_label: 'Spinach cooking timer',
        needed_ingredients: ['Blanched spinach', '60ml heavy cream'],
      },
      {
        order: 5,
        title: 'Pan-fry the paneer',
        text: 'In a separate non-stick pan, heat a splash of oil over medium-high heat. Cut the **paneer** into cubes and fry for **4 minutes**, turning occasionally, until golden on all sides.',
        timer_seconds: 240,
        timer_label: 'Paneer frying timer',
        needed_ingredients: ['200g paneer', 'Oil for frying'],
      },
      {
        order: 6,
        title: 'Combine and season',
        text: 'Gently fold the golden paneer cubes into the spinach sauce. Season with **salt** to taste. Let everything simmer together for **2 minutes** so the paneer absorbs the flavours.',
        timer_seconds: 120,
        timer_label: 'Final simmer timer',
        needed_ingredients: ['Pan-fried paneer', 'Salt to taste'],
      },
      {
        order: 7,
        title: 'Serve',
        text: 'Transfer to a warm serving bowl. Serve immediately with steamed basmati rice or warm naan bread. Garnish with a drizzle of cream if desired.',
      },
    ],
    base_serves: 2,
    tags: ['Vegetarian', 'Indian', 'Spinach'],
    duration_mins: 35,
  },
  {
    id: 'r2',
    cookbook_id: 'cb2',
    title: 'Chicken Tikka Masala',
    ingredients: [
      { name: 'Chicken thighs', amount: 500, unit: 'g', category: 'PROTEIN' },
      { name: 'Yogurt', amount: 150, unit: 'ml', category: 'DAIRY' },
      { name: 'Tomato paste', amount: 3, unit: 'tbsp', category: 'PANTRY' },
      { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' },
      { name: 'Heavy cream', amount: 100, unit: 'ml', category: 'DAIRY' },
      { name: 'Tikka masala spice blend', amount: 2, unit: 'tbsp', category: 'SPICES' },
    ],
    steps: [
      { order: 1, title: 'Marinate the chicken', text: 'Cut chicken into chunks and marinate in yogurt and half the spice blend for at least 30 minutes.' },
      { order: 2, title: 'Cook the chicken', text: 'Cook marinated chicken in a hot pan until charred on the edges, about **6 minutes** per side.', timer_seconds: 360, timer_label: 'Chicken cooking timer', needed_ingredients: ['Marinated chicken'] },
      { order: 3, title: 'Build the sauce', text: 'In the same pan, cook the diced onion until soft. Add tomato paste, remaining spices, and cook for **3 minutes**.', timer_seconds: 180, timer_label: 'Sauce cooking timer', needed_ingredients: ['1 onion', '3 tbsp tomato paste', 'Spice blend'] },
      { order: 4, title: 'Simmer together', text: 'Add the cream and chicken back to the sauce. Simmer for **10 minutes** until thick and rich.', timer_seconds: 600, timer_label: 'Simmer timer', needed_ingredients: ['100ml cream', 'Cooked chicken'] },
    ],
    base_serves: 4,
    tags: ['Chicken', 'Tomato', 'Medium'],
    duration_mins: 55,
  },
  {
    id: 'r3',
    cookbook_id: 'cb2',
    title: 'Dal Makhani',
    ingredients: [
      { name: 'Black lentils', amount: 200, unit: 'g', category: 'PANTRY' },
      { name: 'Kidney beans', amount: 100, unit: 'g', category: 'PANTRY' },
      { name: 'Butter', amount: 60, unit: 'g', category: 'DAIRY' },
      { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' },
      { name: 'Tomato puree', amount: 200, unit: 'ml', category: 'PANTRY' },
      { name: 'Heavy cream', amount: 100, unit: 'ml', category: 'DAIRY' },
    ],
    steps: [
      { order: 1, title: 'Soak the lentils', text: 'Soak black lentils and kidney beans overnight, or for at least 8 hours. Drain and rinse.' },
      { order: 2, title: 'Cook the lentils', text: 'Pressure cook or boil the lentils until tender, about **45 minutes** on the stove.', timer_seconds: 2700, timer_label: 'Lentil cooking timer', needed_ingredients: ['200g black lentils', '100g kidney beans'] },
      { order: 3, title: 'Make the masala', text: 'In a heavy pan, melt **butter** and cook the diced onion with tomato puree for **10 minutes**.', timer_seconds: 600, timer_label: 'Masala timer', needed_ingredients: ['60g butter', '1 onion', '200ml tomato puree'] },
      { order: 4, title: 'Slow cook', text: 'Combine lentils and masala. Add cream and simmer on low for **30 minutes**, stirring occasionally.', timer_seconds: 1800, timer_label: 'Slow cook timer', needed_ingredients: ['Cooked lentils', '100ml cream'] },
    ],
    base_serves: 4,
    tags: ['Lentils', 'Butter', 'Slow cook'],
    duration_mins: 90,
  },
  {
    id: 'r4',
    cookbook_id: 'cb2',
    title: 'Lamb Rogan Josh',
    ingredients: [
      { name: 'Lamb shoulder', amount: 600, unit: 'g', category: 'PROTEIN' },
      { name: 'Yogurt', amount: 150, unit: 'ml', category: 'DAIRY' },
      { name: 'Kashmiri chilli powder', amount: 2, unit: 'tbsp', category: 'SPICES' },
      { name: 'Onion', amount: 2, unit: 'large', category: 'PRODUCE' },
      { name: 'Tomatoes', amount: 3, unit: '', category: 'PRODUCE' },
      { name: 'Ginger-garlic paste', amount: 2, unit: 'tbsp', category: 'SPICES' },
    ],
    steps: [
      { order: 1, title: 'Sear the lamb', text: 'Cut lamb into chunks. Sear in batches in hot oil until browned, about **5 minutes** per batch.', timer_seconds: 300, timer_label: 'Searing timer', needed_ingredients: ['600g lamb', 'Oil for searing'] },
      { order: 2, title: 'Cook the base', text: 'In the same pot, cook the sliced onions until deep golden, about **15 minutes**. Add ginger-garlic paste.', timer_seconds: 900, timer_label: 'Onion browning timer', needed_ingredients: ['2 onions', '2 tbsp ginger-garlic paste'] },
      { order: 3, title: 'Add spices and tomatoes', text: 'Add Kashmiri chilli, tomatoes, and yogurt. Cook for **5 minutes** until oil separates.', timer_seconds: 300, timer_label: 'Spice cooking timer', needed_ingredients: ['Kashmiri chilli', '3 tomatoes', '150ml yogurt'] },
      { order: 4, title: 'Braise', text: 'Return lamb to the pot. Add water to cover. Simmer on low heat for **60 minutes** until tender.', timer_seconds: 3600, timer_label: 'Braising timer', needed_ingredients: ['Seared lamb', 'Water'] },
    ],
    base_serves: 4,
    tags: ['Lamb', 'Kashmiri chilli', 'Rich'],
    duration_mins: 75,
  },
  {
    id: 'r5',
    cookbook_id: 'cb2',
    title: 'Aloo Gobi',
    ingredients: [
      { name: 'Potato', amount: 3, unit: 'medium', category: 'PRODUCE' },
      { name: 'Cauliflower', amount: 1, unit: 'head', category: 'PRODUCE' },
      { name: 'Onion', amount: 1, unit: 'medium', category: 'PRODUCE' },
      { name: 'Turmeric', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Cumin seeds', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Green chilli', amount: 1, unit: '', category: 'PRODUCE' },
    ],
    steps: [
      { order: 1, title: 'Prep the vegetables', text: 'Cut potatoes and cauliflower into bite-sized florets and pieces. Dice the onion.' },
      { order: 2, title: 'Temper the spices', text: 'Heat oil in a pan. Add **cumin seeds** and let them splutter for **30 seconds**. Add diced onion and green chilli.', timer_seconds: 30, timer_label: 'Tempering timer', needed_ingredients: ['Oil', '1 tsp cumin seeds', '1 onion', '1 green chilli'] },
      { order: 3, title: 'Cook the vegetables', text: 'Add potatoes, cauliflower, and **turmeric**. Cover and cook on low heat for **20 minutes**, stirring occasionally.', timer_seconds: 1200, timer_label: 'Vegetable cooking timer', needed_ingredients: ['3 potatoes', '1 cauliflower', '1 tsp turmeric'] },
      { order: 4, title: 'Finish and serve', text: 'Season with salt. Garnish with fresh coriander. Serve with warm rotis or rice.' },
    ],
    base_serves: 4,
    tags: ['Potato', 'Cauliflower', 'Quick'],
    duration_mins: 25,
  },
  // Plenty More recipes
  {
    id: 'r6',
    cookbook_id: 'cb1',
    title: 'Mixed Mushroom Ragout',
    ingredients: [
      { name: 'Mixed mushrooms', amount: 500, unit: 'g', category: 'PRODUCE' },
      { name: 'Shallots', amount: 3, unit: '', category: 'PRODUCE' },
      { name: 'Thyme', amount: 4, unit: 'sprigs', category: 'PRODUCE' },
      { name: 'White wine', amount: 100, unit: 'ml', category: 'PANTRY' },
      { name: 'Butter', amount: 40, unit: 'g', category: 'DAIRY' },
    ],
    steps: [
      { order: 1, title: 'Prep mushrooms', text: 'Clean and slice the mixed mushrooms. Finely dice the shallots.' },
      { order: 2, title: 'Sauté', text: 'Melt butter in a large pan. Cook shallots for **3 minutes** until soft. Add mushrooms and thyme.', timer_seconds: 180, timer_label: 'Shallot timer', needed_ingredients: ['40g butter', '3 shallots', 'Thyme'] },
      { order: 3, title: 'Deglaze and finish', text: 'Cook mushrooms for **8 minutes** until golden. Deglaze with wine and reduce until syrupy.', timer_seconds: 480, timer_label: 'Mushroom timer', needed_ingredients: ['Mushrooms', '100ml white wine'] },
    ],
    base_serves: 4,
    tags: ['Vegetarian', 'Mushroom', 'Quick'],
    duration_mins: 20,
  },
];

interface RecipeState {
  cookbooks: Cookbook[];
  recipes: Recipe[];
  getCookbook: (id: string) => Cookbook | undefined;
  getRecipesByCookbook: (cookbookId: string) => Recipe[];
  getRecipe: (id: string) => Recipe | undefined;
  addCookbook: (title: string, author?: string, newRecipes?: Recipe[]) => Cookbook;
  addParsedCookbook: (cookbook: Cookbook, recipes: Recipe[]) => void;
  updateCookbookRecipeCount: (id: string, count: number) => void;
}

export const useRecipeStore = create<RecipeState>((set, get) => ({
  cookbooks: MOCK_COOKBOOKS,
  recipes: MOCK_RECIPES,

  getCookbook: (id) => get().cookbooks.find((c) => c.id === id),

  getRecipesByCookbook: (cookbookId) =>
    get().recipes.filter((r) => r.cookbook_id === cookbookId),

  getRecipe: (id) => get().recipes.find((r) => r.id === id),

  addCookbook: (title, author = 'Unknown', newRecipes = []) => {
    const id = `cb_${Date.now()}`;
    const cookbook: Cookbook = {
      id,
      title,
      author,
      accent_color: ACCENT_PALETTE[get().cookbooks.length % ACCENT_PALETTE.length],
      recipe_count: newRecipes.length,
      created_at: new Date().toISOString().split('T')[0],
    };
    set((state) => ({
      cookbooks: [...state.cookbooks, cookbook],
      recipes: [...state.recipes, ...newRecipes],
    }));
    return cookbook;
  },

  /** Add a cookbook + recipes returned from the Supabase Edge Function */
  addParsedCookbook: (cookbook, recipes) => {
    set((state) => ({
      cookbooks: [...state.cookbooks, cookbook],
      recipes: [...state.recipes, ...recipes],
    }));
  },

  /** Update recipe_count after parsing completes */
  updateCookbookRecipeCount: (id, count) => {
    set((state) => ({
      cookbooks: state.cookbooks.map((cb) =>
        cb.id === id ? { ...cb, recipe_count: count } : cb
      ),
    }));
  },
}));
