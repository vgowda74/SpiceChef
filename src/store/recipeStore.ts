import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category?: string; // e.g. "PRODUCE", "DAIRY", "SPICES"
}

export interface StepIngredient {
  name: string;
  amount: number;
  unit: string;
}

export interface RecipeStep {
  order: number;
  title?: string; // e.g. "Sauté the aromatics"
  text: string;
  timer_seconds?: number;
  timer_label?: string; // e.g. "Onion softening timer"
  needed_ingredients?: (StepIngredient | string)[]; // structured or legacy string format
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
  loading?: boolean;
}

const ACCENT_PALETTE = ['#6B3A2A', '#2C4A3E', '#3D3228', '#1B3A4B', '#4A3728'];

const MOCK_COOKBOOKS: Cookbook[] = [
  { id: 'cb1', title: 'Famous Indian Dishes', author: 'Culinary India', accent_color: '#6B4A2A', recipe_count: 10, created_at: '2026-03-01' },
  { id: 'cb2', title: 'Italian Classics', author: 'La Cucina Italiana', accent_color: '#7A3B28', recipe_count: 10, created_at: '2026-03-02' },
  { id: 'cb3', title: 'Mexican Fiesta', author: 'Casa Mexico', accent_color: '#5A6B2A', recipe_count: 10, created_at: '2026-03-03' },
  { id: 'cb4', title: 'Thai Kitchen', author: 'Bangkok Table', accent_color: '#2C4A3E', recipe_count: 10, created_at: '2026-03-04' },
  { id: 'cb5', title: 'Chinese Favorites', author: 'Wok & Fire', accent_color: '#6B2A2A', recipe_count: 10, created_at: '2026-03-05' },
  { id: 'cb6', title: 'Mediterranean Table', author: 'Olive & Herb', accent_color: '#2A4A6B', recipe_count: 10, created_at: '2026-03-06' },
  { id: 'cb7', title: 'Japanese Essentials', author: 'Umami Kitchen', accent_color: '#3D2A4A', recipe_count: 10, created_at: '2026-03-07' },
  { id: 'cb8', title: 'French Bistro', author: 'Maison Culinaire', accent_color: '#2A3D4A', recipe_count: 10, created_at: '2026-03-08' },
  { id: 'cb9', title: 'Middle Eastern Mezze', author: 'Souk & Spice', accent_color: '#4A3A2A', recipe_count: 10, created_at: '2026-03-09' },
  { id: 'cb10', title: 'American BBQ & Classics', author: 'Smoke & Grill', accent_color: '#3A2A1A', recipe_count: 4, created_at: '2026-03-10' },
  { id: 'cb11', title: 'Korean Home Cooking', author: 'Seoul Kitchen', accent_color: '#2A3A5A', recipe_count: 4, created_at: '2026-03-11' },
];

const MOCK_RECIPES: Recipe[] = [
  // --- Vegetarian ---
  {
    id: 'r1',
    cookbook_id: 'cb1',
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
      { order: 1, title: 'Blanch the spinach', text: 'Bring a large pot of water to a boil. Add **fresh spinach** and blanch for **2 minutes** until wilted. Drain, plunge into ice water, squeeze out moisture, and roughly chop.', timer_seconds: 120, timer_label: 'Spinach blanching timer', needed_ingredients: ['400g spinach'] },
      { order: 2, title: 'Sauté the aromatics', text: 'Heat **2 tbsp oil** over medium heat. Cook diced onion for **8 minutes** until translucent. Add minced garlic and ginger, cook for another **2 minutes** until fragrant.', timer_seconds: 480, timer_label: 'Onion softening timer', needed_ingredients: ['2 tbsp oil', '1 onion', '4 garlic cloves', '1 inch ginger'] },
      { order: 3, title: 'Toast the spices', text: 'Add **cumin seeds**, **turmeric**, and **garam masala**. Stir constantly for **1 minute** until fragrant.', timer_seconds: 60, timer_label: 'Spice toasting timer', needed_ingredients: ['1 tsp cumin', '½ tsp turmeric', '1 tsp garam masala'] },
      { order: 4, title: 'Build the saag', text: 'Add blanched spinach and stir well. Cook for **3 minutes**, then stir in **heavy cream** until creamy.', timer_seconds: 180, timer_label: 'Spinach cooking timer', needed_ingredients: ['Blanched spinach', '60ml heavy cream'] },
      { order: 5, title: 'Pan-fry the paneer', text: 'In a separate pan, fry **paneer** cubes in hot oil for **4 minutes**, turning until golden on all sides.', timer_seconds: 240, timer_label: 'Paneer frying timer', needed_ingredients: ['200g paneer'] },
      { order: 6, title: 'Combine and serve', text: 'Fold paneer into the spinach sauce. Season with **salt** and simmer for **2 minutes**. Serve with rice or naan.', timer_seconds: 120, timer_label: 'Final simmer timer', needed_ingredients: ['Pan-fried paneer', 'Salt'] },
    ],
    base_serves: 2,
    tags: ['Vegetarian', 'Indian', 'Paneer'],
    duration_mins: 35,
  },
  {
    id: 'r2',
    cookbook_id: 'cb1',
    title: 'Dal Makhani',
    ingredients: [
      { name: 'Black lentils (urad dal)', amount: 200, unit: 'g', category: 'PANTRY' },
      { name: 'Kidney beans', amount: 100, unit: 'g', category: 'PANTRY' },
      { name: 'Butter', amount: 60, unit: 'g', category: 'DAIRY' },
      { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' },
      { name: 'Tomato puree', amount: 200, unit: 'ml', category: 'PANTRY' },
      { name: 'Heavy cream', amount: 100, unit: 'ml', category: 'DAIRY' },
      { name: 'Ginger-garlic paste', amount: 1, unit: 'tbsp', category: 'SPICES' },
      { name: 'Garam masala', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Salt', amount: 1, unit: 'tsp', category: 'PANTRY' },
    ],
    steps: [
      { order: 1, title: 'Soak the lentils', text: 'Soak black lentils and kidney beans in water overnight, or at least 8 hours. Drain and rinse well.' },
      { order: 2, title: 'Cook the lentils', text: 'Pressure cook or boil soaked lentils and beans until tender, about **45 minutes** on the stove.', timer_seconds: 2700, timer_label: 'Lentil cooking timer', needed_ingredients: ['200g urad dal', '100g kidney beans'] },
      { order: 3, title: 'Make the masala', text: 'Melt **butter** in a heavy pan. Cook diced onion and ginger-garlic paste for **10 minutes** until deep golden. Add tomato puree and cook for another **5 minutes**.', timer_seconds: 600, timer_label: 'Masala timer', needed_ingredients: ['60g butter', '1 onion', '1 tbsp ginger-garlic paste', '200ml tomato puree'] },
      { order: 4, title: 'Slow cook', text: 'Combine lentils with masala. Add **cream** and **garam masala**. Simmer on low for **30 minutes**, stirring occasionally, until thick and velvety.', timer_seconds: 1800, timer_label: 'Slow cook timer', needed_ingredients: ['Cooked lentils', '100ml cream', '1 tsp garam masala'] },
    ],
    base_serves: 4,
    tags: ['Vegetarian', 'Indian', 'Lentils'],
    duration_mins: 90,
  },
  {
    id: 'r3',
    cookbook_id: 'cb1',
    title: 'Aloo Gobi',
    ingredients: [
      { name: 'Potatoes', amount: 3, unit: 'medium', category: 'PRODUCE' },
      { name: 'Cauliflower', amount: 1, unit: 'head', category: 'PRODUCE' },
      { name: 'Onion', amount: 1, unit: 'medium', category: 'PRODUCE' },
      { name: 'Turmeric', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Cumin seeds', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Coriander powder', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Green chilli', amount: 1, unit: '', category: 'PRODUCE' },
      { name: 'Vegetable oil', amount: 2, unit: 'tbsp', category: 'PANTRY' },
      { name: 'Salt', amount: 1, unit: 'tsp', category: 'PANTRY' },
    ],
    steps: [
      { order: 1, title: 'Prep the vegetables', text: 'Peel and cut potatoes into small cubes. Break cauliflower into bite-sized florets. Dice the onion.' },
      { order: 2, title: 'Temper the spices', text: 'Heat **2 tbsp oil** in a wide pan. Add **cumin seeds** and let splutter for **30 seconds**. Add onion and green chilli, cook for **5 minutes**.', timer_seconds: 300, timer_label: 'Onion timer', needed_ingredients: ['2 tbsp oil', '1 tsp cumin seeds', '1 onion', '1 green chilli'] },
      { order: 3, title: 'Cook the vegetables', text: 'Add potatoes, cauliflower, **turmeric**, and **coriander powder**. Toss well. Cover and cook on low heat for **20 minutes**, stirring occasionally.', timer_seconds: 1200, timer_label: 'Vegetable cooking timer', needed_ingredients: ['3 potatoes', '1 cauliflower', '1 tsp turmeric', '1 tsp coriander powder'] },
      { order: 4, title: 'Finish and serve', text: 'Season with **salt**. Uncover and cook for another **2 minutes** to crisp the edges. Garnish with fresh coriander. Serve hot with rotis.', timer_seconds: 120, timer_label: 'Crisping timer', needed_ingredients: ['Salt'] },
    ],
    base_serves: 4,
    tags: ['Vegetarian', 'Indian', 'Quick'],
    duration_mins: 28,
  },
  {
    id: 'r4',
    cookbook_id: 'cb1',
    title: 'Paneer Butter Masala',
    ingredients: [
      { name: 'Paneer', amount: 250, unit: 'g', category: 'DAIRY' },
      { name: 'Butter', amount: 40, unit: 'g', category: 'DAIRY' },
      { name: 'Heavy cream', amount: 80, unit: 'ml', category: 'DAIRY' },
      { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' },
      { name: 'Tomatoes', amount: 3, unit: 'medium', category: 'PRODUCE' },
      { name: 'Cashews', amount: 10, unit: '', category: 'PANTRY' },
      { name: 'Ginger-garlic paste', amount: 1, unit: 'tbsp', category: 'SPICES' },
      { name: 'Kashmiri chilli powder', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Garam masala', amount: 0.5, unit: 'tsp', category: 'SPICES' },
      { name: 'Salt', amount: 1, unit: 'tsp', category: 'PANTRY' },
    ],
    steps: [
      { order: 1, title: 'Make the tomato base', text: 'Simmer onion, tomatoes, cashews, and ginger-garlic paste with a splash of water for **10 minutes**. Cool and blend to a smooth purée.', timer_seconds: 600, timer_label: 'Tomato base timer', needed_ingredients: ['1 onion', '3 tomatoes', '10 cashews', '1 tbsp ginger-garlic paste'] },
      { order: 2, title: 'Cook the sauce', text: 'Melt **butter** in a pan over medium heat. Add the purée, **Kashmiri chilli**, and **garam masala**. Cook for **8 minutes** until the butter separates.', timer_seconds: 480, timer_label: 'Sauce cooking timer', needed_ingredients: ['40g butter', 'Tomato purée', '1 tsp Kashmiri chilli', '½ tsp garam masala'] },
      { order: 3, title: 'Add cream and paneer', text: 'Stir in **cream** and season with **salt**. Add **paneer** cubes and simmer for **5 minutes** until the sauce coats each piece.', timer_seconds: 300, timer_label: 'Simmer timer', needed_ingredients: ['80ml cream', 'Salt', '250g paneer'] },
      { order: 4, title: 'Serve', text: 'Garnish with a swirl of cream and a pinch of garam masala. Serve with butter naan or steamed rice.' },
    ],
    base_serves: 3,
    tags: ['Vegetarian', 'Indian', 'Paneer'],
    duration_mins: 40,
  },
  {
    id: 'r5',
    cookbook_id: 'cb1',
    title: 'Chana Masala',
    ingredients: [
      { name: 'Chickpeas (cooked)', amount: 400, unit: 'g', category: 'PANTRY' },
      { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' },
      { name: 'Tomatoes', amount: 2, unit: 'medium', category: 'PRODUCE' },
      { name: 'Ginger-garlic paste', amount: 1, unit: 'tbsp', category: 'SPICES' },
      { name: 'Cumin seeds', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Chole masala powder', amount: 2, unit: 'tsp', category: 'SPICES' },
      { name: 'Turmeric', amount: 0.5, unit: 'tsp', category: 'SPICES' },
      { name: 'Vegetable oil', amount: 2, unit: 'tbsp', category: 'PANTRY' },
      { name: 'Salt', amount: 1, unit: 'tsp', category: 'PANTRY' },
    ],
    steps: [
      { order: 1, title: 'Build the base', text: 'Heat **oil** and splutter **cumin seeds**. Add onion and cook for **6 minutes** until golden. Add ginger-garlic paste and cook **1 minute** more.', timer_seconds: 360, timer_label: 'Onion timer', needed_ingredients: ['2 tbsp oil', '1 tsp cumin', '1 onion', '1 tbsp ginger-garlic paste'] },
      { order: 2, title: 'Add tomatoes and spices', text: 'Add diced tomatoes, **turmeric**, and **chole masala**. Cook for **8 minutes** until tomatoes break down and oil separates.', timer_seconds: 480, timer_label: 'Tomato timer', needed_ingredients: ['2 tomatoes', '½ tsp turmeric', '2 tsp chole masala'] },
      { order: 3, title: 'Simmer the chickpeas', text: 'Add **chickpeas** and ½ cup water. Simmer for **10 minutes**, lightly mashing a few to thicken the gravy. Season with **salt**.', timer_seconds: 600, timer_label: 'Simmer timer', needed_ingredients: ['400g chickpeas', 'Salt'] },
      { order: 4, title: 'Serve', text: 'Garnish with fresh coriander, chopped onion, and a squeeze of lemon. Serve with bhatura or rice.' },
    ],
    base_serves: 4,
    tags: ['Vegetarian', 'Indian', 'Chickpeas'],
    duration_mins: 30,
  },
  // --- Non-Veg ---
  {
    id: 'r6',
    cookbook_id: 'cb1',
    title: 'Chicken Tikka Masala',
    ingredients: [
      { name: 'Chicken thighs', amount: 500, unit: 'g', category: 'PROTEIN' },
      { name: 'Yogurt', amount: 150, unit: 'ml', category: 'DAIRY' },
      { name: 'Tomato paste', amount: 3, unit: 'tbsp', category: 'PANTRY' },
      { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' },
      { name: 'Heavy cream', amount: 100, unit: 'ml', category: 'DAIRY' },
      { name: 'Tikka masala spice blend', amount: 2, unit: 'tbsp', category: 'SPICES' },
      { name: 'Garlic cloves', amount: 3, unit: 'cloves', category: 'PRODUCE' },
      { name: 'Fresh ginger', amount: 1, unit: 'inch', category: 'PRODUCE' },
      { name: 'Vegetable oil', amount: 2, unit: 'tbsp', category: 'PANTRY' },
    ],
    steps: [
      { order: 1, title: 'Marinate the chicken', text: 'Cut chicken into chunks. Mix with **yogurt** and half the spice blend. Marinate for at least 30 minutes.' },
      { order: 2, title: 'Cook the chicken', text: 'Cook marinated chicken in a hot oiled pan for **6 minutes** per side until charred at the edges. Set aside.', timer_seconds: 360, timer_label: 'Chicken cooking timer', needed_ingredients: ['Marinated chicken', '1 tbsp oil'] },
      { order: 3, title: 'Build the sauce', text: 'In the same pan, cook diced onion until soft. Add garlic, ginger, **tomato paste**, remaining spices, and cook for **3 minutes**.', timer_seconds: 180, timer_label: 'Sauce timer', needed_ingredients: ['1 onion', 'Garlic', 'Ginger', '3 tbsp tomato paste'] },
      { order: 4, title: 'Simmer together', text: 'Return chicken to the sauce. Add **cream** and simmer for **10 minutes** until thick and rich. Serve with rice or naan.', timer_seconds: 600, timer_label: 'Simmer timer', needed_ingredients: ['100ml cream', 'Cooked chicken'] },
    ],
    base_serves: 4,
    tags: ['Non-Veg', 'Indian', 'Chicken'],
    duration_mins: 55,
  },
  {
    id: 'r7',
    cookbook_id: 'cb1',
    title: 'Lamb Rogan Josh',
    ingredients: [
      { name: 'Lamb shoulder', amount: 600, unit: 'g', category: 'PROTEIN' },
      { name: 'Yogurt', amount: 150, unit: 'ml', category: 'DAIRY' },
      { name: 'Kashmiri chilli powder', amount: 2, unit: 'tbsp', category: 'SPICES' },
      { name: 'Onions', amount: 2, unit: 'large', category: 'PRODUCE' },
      { name: 'Tomatoes', amount: 3, unit: 'medium', category: 'PRODUCE' },
      { name: 'Ginger-garlic paste', amount: 2, unit: 'tbsp', category: 'SPICES' },
      { name: 'Whole spices (bay leaf, cardamom, cloves)', amount: 1, unit: 'set', category: 'SPICES' },
      { name: 'Vegetable oil', amount: 3, unit: 'tbsp', category: 'PANTRY' },
    ],
    steps: [
      { order: 1, title: 'Sear the lamb', text: 'Cut lamb into large chunks. Sear in batches in hot oil for **5 minutes** per batch until well browned. Set aside.', timer_seconds: 300, timer_label: 'Searing timer', needed_ingredients: ['600g lamb', 'Oil'] },
      { order: 2, title: 'Cook the base', text: 'In the same pot, add whole spices and sliced onions. Cook for **15 minutes** until deep golden. Add ginger-garlic paste.', timer_seconds: 900, timer_label: 'Onion browning timer', needed_ingredients: ['Whole spices', '2 onions', '2 tbsp ginger-garlic paste'] },
      { order: 3, title: 'Add spices and tomatoes', text: 'Add **Kashmiri chilli powder**, diced tomatoes, and **yogurt**. Cook for **5 minutes** until oil separates on the surface.', timer_seconds: 300, timer_label: 'Spice cooking timer', needed_ingredients: ['2 tbsp Kashmiri chilli', '3 tomatoes', '150ml yogurt'] },
      { order: 4, title: 'Braise until tender', text: 'Return lamb to the pot. Add 1 cup water. Cover and simmer on low heat for **60 minutes** until the lamb is fall-off-the-bone tender.', timer_seconds: 3600, timer_label: 'Braising timer', needed_ingredients: ['Seared lamb', '1 cup water'] },
    ],
    base_serves: 4,
    tags: ['Non-Veg', 'Indian', 'Lamb'],
    duration_mins: 90,
  },
  {
    id: 'r8',
    cookbook_id: 'cb1',
    title: 'Butter Chicken',
    ingredients: [
      { name: 'Chicken breast', amount: 500, unit: 'g', category: 'PROTEIN' },
      { name: 'Butter', amount: 50, unit: 'g', category: 'DAIRY' },
      { name: 'Heavy cream', amount: 100, unit: 'ml', category: 'DAIRY' },
      { name: 'Tomato puree', amount: 250, unit: 'ml', category: 'PANTRY' },
      { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' },
      { name: 'Ginger-garlic paste', amount: 1, unit: 'tbsp', category: 'SPICES' },
      { name: 'Kashmiri chilli powder', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Garam masala', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Yogurt', amount: 100, unit: 'ml', category: 'DAIRY' },
      { name: 'Salt', amount: 1, unit: 'tsp', category: 'PANTRY' },
    ],
    steps: [
      { order: 1, title: 'Marinate and grill the chicken', text: 'Mix chicken with yogurt, ginger-garlic paste, and half the chilli powder. Grill or pan-sear for **7 minutes** per side until cooked through.', timer_seconds: 420, timer_label: 'Chicken grill timer', needed_ingredients: ['500g chicken', '100ml yogurt', '1 tbsp ginger-garlic paste'] },
      { order: 2, title: 'Cook the sauce', text: 'Melt **butter** in a pan. Cook onion for **6 minutes** until soft. Add remaining ginger-garlic paste, **Kashmiri chilli**, and cook for **2 minutes**.', timer_seconds: 360, timer_label: 'Sauce timer', needed_ingredients: ['50g butter', '1 onion', '1 tsp Kashmiri chilli'] },
      { order: 3, title: 'Add tomato and finish', text: 'Pour in **tomato puree** and simmer for **8 minutes**. Add **cream** and **garam masala**. Slice the grilled chicken and stir in. Simmer for **5 minutes**.', timer_seconds: 480, timer_label: 'Tomato cook timer', needed_ingredients: ['250ml tomato puree', '100ml cream', '1 tsp garam masala', 'Grilled chicken'] },
    ],
    base_serves: 4,
    tags: ['Non-Veg', 'Indian', 'Chicken'],
    duration_mins: 45,
  },
  {
    id: 'r9',
    cookbook_id: 'cb1',
    title: 'Prawn Masala',
    ingredients: [
      { name: 'Prawns (cleaned)', amount: 400, unit: 'g', category: 'PROTEIN' },
      { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' },
      { name: 'Tomatoes', amount: 2, unit: 'medium', category: 'PRODUCE' },
      { name: 'Ginger-garlic paste', amount: 1, unit: 'tbsp', category: 'SPICES' },
      { name: 'Turmeric', amount: 0.5, unit: 'tsp', category: 'SPICES' },
      { name: 'Red chilli powder', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Coriander powder', amount: 1, unit: 'tsp', category: 'SPICES' },
      { name: 'Coconut milk', amount: 100, unit: 'ml', category: 'PANTRY' },
      { name: 'Vegetable oil', amount: 2, unit: 'tbsp', category: 'PANTRY' },
    ],
    steps: [
      { order: 1, title: 'Marinate the prawns', text: 'Toss cleaned **prawns** with **turmeric**, a pinch of salt, and a little oil. Set aside for 10 minutes.' },
      { order: 2, title: 'Cook the masala', text: 'Heat **oil** in a pan. Cook diced onion for **5 minutes**. Add ginger-garlic paste, **chilli powder**, and **coriander powder**. Cook for **2 minutes**. Add diced tomatoes and cook for **5 minutes** until the masala thickens.', timer_seconds: 300, timer_label: 'Masala timer', needed_ingredients: ['1 onion', '1 tbsp ginger-garlic paste', '1 tsp chilli powder', '2 tomatoes'] },
      { order: 3, title: 'Add prawns and coconut milk', text: 'Add marinated **prawns** and **coconut milk**. Cook for **5 minutes** until prawns are pink and curled. Do not overcook.', timer_seconds: 300, timer_label: 'Prawn cooking timer', needed_ingredients: ['400g prawns', '100ml coconut milk'] },
      { order: 4, title: 'Serve', text: 'Garnish with fresh coriander. Serve hot with steamed rice or appam.' },
    ],
    base_serves: 3,
    tags: ['Non-Veg', 'Indian', 'Seafood'],
    duration_mins: 25,
  },
  {
    id: 'r10',
    cookbook_id: 'cb1',
    title: 'Chicken Biryani',
    ingredients: [
      { name: 'Chicken (bone-in pieces)', amount: 600, unit: 'g', category: 'PROTEIN' },
      { name: 'Basmati rice', amount: 300, unit: 'g', category: 'PANTRY' },
      { name: 'Yogurt', amount: 150, unit: 'ml', category: 'DAIRY' },
      { name: 'Onions', amount: 2, unit: 'large', category: 'PRODUCE' },
      { name: 'Fresh mint', amount: 1, unit: 'handful', category: 'PRODUCE' },
      { name: 'Biryani masala', amount: 2, unit: 'tbsp', category: 'SPICES' },
      { name: 'Saffron', amount: 1, unit: 'pinch', category: 'SPICES' },
      { name: 'Warm milk', amount: 50, unit: 'ml', category: 'DAIRY' },
      { name: 'Ghee', amount: 3, unit: 'tbsp', category: 'DAIRY' },
      { name: 'Salt', amount: 2, unit: 'tsp', category: 'PANTRY' },
    ],
    steps: [
      { order: 1, title: 'Marinate the chicken', text: 'Marinate chicken with yogurt, **biryani masala**, and salt for at least 30 minutes. Steep **saffron** in warm milk.' },
      { order: 2, title: 'Fry the onions and cook chicken', text: 'Fry sliced onions in **ghee** until deep golden and crispy, about **12 minutes**. Reserve half for garnish. Add marinated chicken to the remaining onions and cook for **15 minutes**.', timer_seconds: 720, timer_label: 'Onion frying timer', needed_ingredients: ['2 onions', '3 tbsp ghee', 'Marinated chicken'] },
      { order: 3, title: 'Par-cook the rice', text: 'Boil salted water. Cook **basmati rice** for **5 minutes** until 70% done. Drain immediately.', timer_seconds: 300, timer_label: 'Rice par-cook timer', needed_ingredients: ['300g basmati rice', 'Salted water'] },
      { order: 4, title: 'Layer and dum cook', text: 'Layer par-cooked rice over the chicken. Drizzle **saffron milk** and scatter **fresh mint** and reserved fried onions on top. Cover tightly with a lid or foil. Cook on lowest heat for **20 minutes**.', timer_seconds: 1200, timer_label: 'Dum cooking timer', needed_ingredients: ['Par-cooked rice', 'Saffron milk', 'Fresh mint', 'Fried onions'] },
    ],
    base_serves: 4,
    tags: ['Non-Veg', 'Indian', 'Rice'],
    duration_mins: 75,
  },

  // ── Italian Classics (cb2) ──
  { id: 'it1', cookbook_id: 'cb2', title: 'Spaghetti Carbonara', ingredients: [{ name: 'Spaghetti', amount: 200, unit: 'g', category: 'PANTRY' }, { name: 'Pancetta', amount: 100, unit: 'g', category: 'PROTEIN' }, { name: 'Eggs', amount: 3, unit: '', category: 'DAIRY' }, { name: 'Pecorino Romano', amount: 60, unit: 'g', category: 'DAIRY' }, { name: 'Black pepper', amount: 1, unit: 'tsp', category: 'SPICES' }], steps: [{ order: 1, title: 'Cook pasta', text: 'Boil spaghetti in salted water until al dente, about **9 minutes**. Reserve 1 cup pasta water.', timer_seconds: 540, timer_label: 'Pasta timer', needed_ingredients: ['200g spaghetti'] }, { order: 2, title: 'Crisp pancetta', text: 'Fry **pancetta** in a dry pan over medium heat for **5 minutes** until golden and crispy.', timer_seconds: 300, timer_label: 'Pancetta timer', needed_ingredients: ['100g pancetta'] }, { order: 3, title: 'Make the sauce', text: 'Whisk eggs with pecorino and black pepper. Off the heat, toss hot pasta with pancetta, then quickly stir in egg mixture, adding pasta water to create a creamy sauce. Serve immediately.' }], base_serves: 2, tags: ['Non-Veg', 'Italian', 'Pasta'], duration_mins: 25 },
  { id: 'it2', cookbook_id: 'cb2', title: 'Margherita Pizza', ingredients: [{ name: 'Pizza dough', amount: 250, unit: 'g', category: 'PANTRY' }, { name: 'Tomato passata', amount: 150, unit: 'ml', category: 'PANTRY' }, { name: 'Fresh mozzarella', amount: 125, unit: 'g', category: 'DAIRY' }, { name: 'Fresh basil', amount: 1, unit: 'handful', category: 'PRODUCE' }, { name: 'Olive oil', amount: 1, unit: 'tbsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Prep and shape', text: 'Preheat oven to 250°C. Stretch dough into a thin round on a floured surface. Spread **passata** leaving a border.' }, { order: 2, title: 'Top and bake', text: 'Tear **mozzarella** over the base. Drizzle with **olive oil**. Bake for **10 minutes** until crust is golden and cheese is bubbling.', timer_seconds: 600, timer_label: 'Pizza bake timer' }, { order: 3, title: 'Finish', text: 'Top with fresh **basil** leaves and serve immediately.' }], base_serves: 2, tags: ['Vegetarian', 'Italian', 'Pizza'], duration_mins: 25 },
  { id: 'it3', cookbook_id: 'cb2', title: 'Pasta Bolognese', ingredients: [{ name: 'Beef mince', amount: 400, unit: 'g', category: 'PROTEIN' }, { name: 'Tagliatelle', amount: 300, unit: 'g', category: 'PANTRY' }, { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' }, { name: 'Tomato passata', amount: 400, unit: 'ml', category: 'PANTRY' }, { name: 'Red wine', amount: 100, unit: 'ml', category: 'PANTRY' }, { name: 'Garlic', amount: 2, unit: 'cloves', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Brown the meat', text: 'Cook diced onion and garlic in oil for **5 minutes**. Add **beef mince** and cook for **8 minutes** until browned.', timer_seconds: 480, timer_label: 'Browning timer' }, { order: 2, title: 'Build the sauce', text: 'Add **red wine** and reduce for **2 minutes**. Add **passata** and simmer on low for **25 minutes** until rich.', timer_seconds: 1500, timer_label: 'Sauce simmer timer' }, { order: 3, title: 'Cook pasta and serve', text: 'Boil tagliatelle for **8 minutes**. Drain and toss with sauce. Top with grated Parmesan.', timer_seconds: 480, timer_label: 'Pasta timer' }], base_serves: 4, tags: ['Non-Veg', 'Italian', 'Pasta'], duration_mins: 45 },
  { id: 'it4', cookbook_id: 'cb2', title: 'Mushroom Risotto', ingredients: [{ name: 'Arborio rice', amount: 300, unit: 'g', category: 'PANTRY' }, { name: 'Mixed mushrooms', amount: 300, unit: 'g', category: 'PRODUCE' }, { name: 'Vegetable stock', amount: 1, unit: 'litre', category: 'PANTRY' }, { name: 'Parmesan', amount: 60, unit: 'g', category: 'DAIRY' }, { name: 'White wine', amount: 100, unit: 'ml', category: 'PANTRY' }, { name: 'Butter', amount: 40, unit: 'g', category: 'DAIRY' }], steps: [{ order: 1, title: 'Sauté mushrooms', text: 'Cook sliced **mushrooms** in butter for **6 minutes** until golden. Set aside.', timer_seconds: 360, timer_label: 'Mushroom timer' }, { order: 2, title: 'Cook the risotto', text: 'Toast **arborio rice** for 2 min. Add **wine**, stir until absorbed. Add warm stock ladle by ladle over **20 minutes**, stirring constantly.', timer_seconds: 1200, timer_label: 'Risotto timer' }, { order: 3, title: 'Finish and serve', text: 'Stir in mushrooms, **Parmesan**, and remaining butter. Season and serve immediately.' }], base_serves: 4, tags: ['Vegetarian', 'Italian', 'Rice'], duration_mins: 35 },
  { id: 'it5', cookbook_id: 'cb2', title: 'Chicken Piccata', ingredients: [{ name: 'Chicken breast', amount: 400, unit: 'g', category: 'PROTEIN' }, { name: 'Lemon', amount: 2, unit: '', category: 'PRODUCE' }, { name: 'Capers', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Butter', amount: 40, unit: 'g', category: 'DAIRY' }, { name: 'Plain flour', amount: 3, unit: 'tbsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Flatten and coat', text: 'Slice chicken breast in half horizontally. Dust with **flour** and season with salt and pepper.' }, { order: 2, title: 'Pan-fry', text: 'Fry chicken in butter and oil for **4 minutes** per side until golden. Remove and set aside.', timer_seconds: 240, timer_label: 'Chicken timer' }, { order: 3, title: 'Make lemon caper sauce', text: 'Add **lemon juice**, **capers**, and a splash of water to the pan. Simmer **3 minutes**, swirl in butter, and pour over chicken.', timer_seconds: 180, timer_label: 'Sauce timer' }], base_serves: 2, tags: ['Non-Veg', 'Italian', 'Chicken'], duration_mins: 25 },
  { id: 'it6', cookbook_id: 'cb2', title: 'Eggplant Parmigiana', ingredients: [{ name: 'Eggplant', amount: 2, unit: 'large', category: 'PRODUCE' }, { name: 'Tomato passata', amount: 400, unit: 'ml', category: 'PANTRY' }, { name: 'Mozzarella', amount: 200, unit: 'g', category: 'DAIRY' }, { name: 'Parmesan', amount: 60, unit: 'g', category: 'DAIRY' }, { name: 'Olive oil', amount: 3, unit: 'tbsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Fry the eggplant', text: 'Slice **eggplant** into 1cm rounds. Fry in batches in olive oil for **3 minutes** per side until golden.', timer_seconds: 360, timer_label: 'Frying timer' }, { order: 2, title: 'Layer and bake', text: 'In a baking dish, layer passata, eggplant, and mozzarella. Repeat. Top with **Parmesan**. Bake at 200°C for **25 minutes**.', timer_seconds: 1500, timer_label: 'Bake timer' }], base_serves: 4, tags: ['Vegetarian', 'Italian', 'Baked'], duration_mins: 40 },

  // ── Mexican Fiesta (cb3) ──
  { id: 'mx1', cookbook_id: 'cb3', title: 'Chicken Tacos', ingredients: [{ name: 'Chicken thighs', amount: 400, unit: 'g', category: 'PROTEIN' }, { name: 'Corn tortillas', amount: 8, unit: '', category: 'PANTRY' }, { name: 'Taco spice blend', amount: 2, unit: 'tbsp', category: 'SPICES' }, { name: 'Lime', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Avocado', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Sour cream', amount: 4, unit: 'tbsp', category: 'DAIRY' }], steps: [{ order: 1, title: 'Season and cook chicken', text: 'Coat chicken with **taco spice**. Pan-fry for **6 minutes** per side until cooked through. Rest for 5 minutes, then slice.', timer_seconds: 360, timer_label: 'Chicken timer' }, { order: 2, title: 'Warm tortillas', text: 'Heat each **tortilla** in a dry pan for **30 seconds** per side.' }, { order: 3, title: 'Assemble', text: 'Fill tortillas with sliced chicken, mashed **avocado**, and **sour cream**. Squeeze over lime and serve.' }], base_serves: 4, tags: ['Non-Veg', 'Mexican', 'Chicken'], duration_mins: 25 },
  { id: 'mx2', cookbook_id: 'cb3', title: 'Bean & Cheese Quesadillas', ingredients: [{ name: 'Flour tortillas', amount: 4, unit: 'large', category: 'PANTRY' }, { name: 'Refried beans', amount: 200, unit: 'g', category: 'PANTRY' }, { name: 'Cheddar cheese', amount: 150, unit: 'g', category: 'DAIRY' }, { name: 'Jalapeño', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Sour cream', amount: 4, unit: 'tbsp', category: 'DAIRY' }], steps: [{ order: 1, title: 'Fill and fold', text: 'Spread **refried beans** on half of each tortilla. Top with grated **cheddar** and sliced **jalapeño**. Fold in half.' }, { order: 2, title: 'Cook until crispy', text: 'Cook in a dry pan for **2 minutes** per side until golden and cheese is melted.', timer_seconds: 120, timer_label: 'Quesadilla timer' }, { order: 3, title: 'Serve', text: 'Slice into wedges and serve with **sour cream** and salsa.' }], base_serves: 2, tags: ['Vegetarian', 'Mexican', 'Quick'], duration_mins: 15 },
  { id: 'mx3', cookbook_id: 'cb3', title: 'Beef Enchiladas', ingredients: [{ name: 'Beef mince', amount: 400, unit: 'g', category: 'PROTEIN' }, { name: 'Flour tortillas', amount: 6, unit: '', category: 'PANTRY' }, { name: 'Enchilada sauce', amount: 400, unit: 'ml', category: 'PANTRY' }, { name: 'Cheddar cheese', amount: 200, unit: 'g', category: 'DAIRY' }, { name: 'Onion', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Cumin', amount: 1, unit: 'tsp', category: 'SPICES' }], steps: [{ order: 1, title: 'Cook the filling', text: 'Brown **beef mince** with diced onion and **cumin** for **8 minutes**. Season well.', timer_seconds: 480, timer_label: 'Beef timer' }, { order: 2, title: 'Roll and arrange', text: 'Spoon filling into tortillas, roll tightly, and place seam-down in a baking dish. Pour **enchilada sauce** over and top with **cheddar**.' }, { order: 3, title: 'Bake', text: 'Bake at 190°C for **20 minutes** until cheese is melted and bubbling.', timer_seconds: 1200, timer_label: 'Bake timer' }], base_serves: 3, tags: ['Non-Veg', 'Mexican', 'Baked'], duration_mins: 40 },
  { id: 'mx4', cookbook_id: 'cb3', title: 'Guacamole', ingredients: [{ name: 'Ripe avocados', amount: 3, unit: '', category: 'PRODUCE' }, { name: 'Lime', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Red onion', amount: 0.5, unit: '', category: 'PRODUCE' }, { name: 'Fresh coriander', amount: 1, unit: 'handful', category: 'PRODUCE' }, { name: 'Jalapeño', amount: 1, unit: '', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Mash avocados', text: 'Halve and scoop **avocados** into a bowl. Mash with a fork to your preferred texture.' }, { order: 2, title: 'Mix and season', text: 'Stir in finely diced **red onion**, **jalapeño**, and **coriander**. Squeeze over **lime juice** and season with salt. Taste and adjust.' }], base_serves: 4, tags: ['Vegetarian', 'Mexican', 'Quick'], duration_mins: 10 },
  { id: 'mx5', cookbook_id: 'cb3', title: 'Veggie Fajitas', ingredients: [{ name: 'Bell peppers', amount: 3, unit: '', category: 'PRODUCE' }, { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' }, { name: 'Mushrooms', amount: 200, unit: 'g', category: 'PRODUCE' }, { name: 'Fajita spice blend', amount: 2, unit: 'tbsp', category: 'SPICES' }, { name: 'Flour tortillas', amount: 6, unit: '', category: 'PANTRY' }, { name: 'Sour cream', amount: 4, unit: 'tbsp', category: 'DAIRY' }], steps: [{ order: 1, title: 'Cook the vegetables', text: 'Slice peppers, onion, and mushrooms. Toss with **fajita spice** and cook in a hot oiled pan for **10 minutes** until charred.', timer_seconds: 600, timer_label: 'Veggie timer' }, { order: 2, title: 'Warm and serve', text: 'Warm **tortillas** in a dry pan. Fill with veggies and top with **sour cream**, salsa, and guacamole.' }], base_serves: 3, tags: ['Vegetarian', 'Mexican', 'Quick'], duration_mins: 20 },
  // ── Thai Kitchen (cb4) ──
  { id: 'th1', cookbook_id: 'cb4', title: 'Pad Thai with Prawns', ingredients: [{ name: 'Rice noodles', amount: 200, unit: 'g', category: 'PANTRY' }, { name: 'Prawns', amount: 300, unit: 'g', category: 'PROTEIN' }, { name: 'Eggs', amount: 2, unit: '', category: 'DAIRY' }, { name: 'Bean sprouts', amount: 100, unit: 'g', category: 'PRODUCE' }, { name: 'Pad Thai sauce', amount: 4, unit: 'tbsp', category: 'PANTRY' }, { name: 'Spring onions', amount: 3, unit: '', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Soak noodles', text: 'Soak **rice noodles** in warm water for **15 minutes** until pliable. Drain well.', timer_seconds: 900, timer_label: 'Noodle soak timer' }, { order: 2, title: 'Stir-fry', text: 'Heat oil in a wok over high heat. Stir-fry **prawns** for **2 minutes**. Push to one side, scramble **eggs**, then toss in noodles and **Pad Thai sauce**. Stir-fry for **3 minutes**.', timer_seconds: 180, timer_label: 'Stir-fry timer' }, { order: 3, title: 'Finish and serve', text: 'Toss in **bean sprouts** and **spring onions**. Serve topped with crushed peanuts, lime, and chilli flakes.' }], base_serves: 2, tags: ['Non-Veg', 'Thai', 'Noodles'], duration_mins: 25 },
  { id: 'th2', cookbook_id: 'cb4', title: 'Green Curry Chicken', ingredients: [{ name: 'Chicken thighs', amount: 500, unit: 'g', category: 'PROTEIN' }, { name: 'Coconut milk', amount: 400, unit: 'ml', category: 'PANTRY' }, { name: 'Green curry paste', amount: 3, unit: 'tbsp', category: 'SPICES' }, { name: 'Thai eggplant', amount: 200, unit: 'g', category: 'PRODUCE' }, { name: 'Fish sauce', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Fresh basil', amount: 1, unit: 'handful', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Fry the paste', text: 'Heat a splash of oil in a wok. Fry **green curry paste** for **2 minutes** until fragrant.' }, { order: 2, title: 'Add coconut milk and chicken', text: 'Pour in **coconut milk** and bring to a simmer. Add chicken pieces and **eggplant**. Cook for **15 minutes** until chicken is cooked through.', timer_seconds: 900, timer_label: 'Curry simmer timer' }, { order: 3, title: 'Season and serve', text: 'Season with **fish sauce**. Stir in fresh **basil**. Serve with steamed jasmine rice.' }], base_serves: 4, tags: ['Non-Veg', 'Thai', 'Curry'], duration_mins: 25 },
  { id: 'th3', cookbook_id: 'cb4', title: 'Mango Sticky Rice', ingredients: [{ name: 'Glutinous rice', amount: 300, unit: 'g', category: 'PANTRY' }, { name: 'Coconut milk', amount: 400, unit: 'ml', category: 'PANTRY' }, { name: 'Ripe mangoes', amount: 2, unit: '', category: 'PRODUCE' }, { name: 'Sugar', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Salt', amount: 0.5, unit: 'tsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Cook the rice', text: 'Soak **glutinous rice** for 1 hour, drain, then steam for **20 minutes** until tender.', timer_seconds: 1200, timer_label: 'Rice steaming timer' }, { order: 2, title: 'Make coconut sauce', text: 'Warm **coconut milk** with **sugar** and **salt** until dissolved. Pour two-thirds over the hot rice and stir. Rest for **10 minutes**.', timer_seconds: 600, timer_label: 'Resting timer' }, { order: 3, title: 'Serve', text: 'Slice **mangoes** and serve alongside the sticky rice. Drizzle remaining coconut sauce over the top.' }], base_serves: 4, tags: ['Vegetarian', 'Thai', 'Dessert'], duration_mins: 40 },
  { id: 'th4', cookbook_id: 'cb4', title: 'Thai Basil Chicken', ingredients: [{ name: 'Chicken mince', amount: 400, unit: 'g', category: 'PROTEIN' }, { name: 'Thai basil', amount: 1, unit: 'large handful', category: 'PRODUCE' }, { name: 'Garlic', amount: 4, unit: 'cloves', category: 'PRODUCE' }, { name: 'Red chilli', amount: 2, unit: '', category: 'PRODUCE' }, { name: 'Oyster sauce', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Fish sauce', amount: 1, unit: 'tbsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Stir-fry aromatics', text: 'Heat oil over high heat. Fry minced **garlic** and sliced **chilli** for **1 minute** until fragrant.' }, { order: 2, title: 'Cook the chicken', text: 'Add **chicken mince** and stir-fry for **5 minutes**, breaking it up. Add **oyster sauce** and **fish sauce**.', timer_seconds: 300, timer_label: 'Chicken timer' }, { order: 3, title: 'Finish with basil', text: 'Turn off heat and stir in **Thai basil** until just wilted. Serve over steamed rice with a fried egg.' }], base_serves: 2, tags: ['Non-Veg', 'Thai', 'Quick'], duration_mins: 15 },

  // ── Chinese Favorites (cb5) ──
  { id: 'cn1', cookbook_id: 'cb5', title: 'Kung Pao Chicken', ingredients: [{ name: 'Chicken breast', amount: 400, unit: 'g', category: 'PROTEIN' }, { name: 'Dried red chillies', amount: 6, unit: '', category: 'SPICES' }, { name: 'Roasted peanuts', amount: 60, unit: 'g', category: 'PANTRY' }, { name: 'Soy sauce', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Rice vinegar', amount: 1, unit: 'tbsp', category: 'PANTRY' }, { name: 'Spring onions', amount: 3, unit: '', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Marinate chicken', text: 'Dice chicken and marinate with 1 tbsp **soy sauce** and a pinch of cornstarch for 10 minutes.' }, { order: 2, title: 'Stir-fry', text: 'Heat oil in a wok until smoking. Fry **dried chillies** for 30 seconds. Add chicken and stir-fry for **5 minutes** until cooked.', timer_seconds: 300, timer_label: 'Stir-fry timer' }, { order: 3, title: 'Sauce and serve', text: 'Add remaining **soy sauce**, **rice vinegar**, **peanuts**, and spring onions. Toss for 1 minute and serve with rice.' }], base_serves: 3, tags: ['Non-Veg', 'Chinese', 'Chicken'], duration_mins: 20 },
  { id: 'cn2', cookbook_id: 'cb5', title: 'Vegetable Fried Rice', ingredients: [{ name: 'Cooked jasmine rice', amount: 400, unit: 'g', category: 'PANTRY' }, { name: 'Eggs', amount: 3, unit: '', category: 'DAIRY' }, { name: 'Mixed vegetables', amount: 200, unit: 'g', category: 'PRODUCE' }, { name: 'Soy sauce', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Sesame oil', amount: 1, unit: 'tsp', category: 'PANTRY' }, { name: 'Spring onions', amount: 3, unit: '', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Scramble eggs', text: 'Heat oil in a wok. Scramble **eggs** until just set, then push to the side.' }, { order: 2, title: 'Fry rice and veg', text: 'Add vegetables and stir-fry for **3 minutes**. Add **cold rice** and toss everything together for **3 minutes** until rice is lightly crispy.', timer_seconds: 180, timer_label: 'Frying timer' }, { order: 3, title: 'Season and serve', text: 'Add **soy sauce** and **sesame oil**. Toss well. Top with **spring onions** and serve.' }], base_serves: 3, tags: ['Vegetarian', 'Chinese', 'Rice'], duration_mins: 20 },
  { id: 'cn3', cookbook_id: 'cb5', title: 'Beef & Broccoli', ingredients: [{ name: 'Beef sirloin', amount: 400, unit: 'g', category: 'PROTEIN' }, { name: 'Broccoli', amount: 300, unit: 'g', category: 'PRODUCE' }, { name: 'Oyster sauce', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Soy sauce', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Garlic', amount: 3, unit: 'cloves', category: 'PRODUCE' }, { name: 'Ginger', amount: 1, unit: 'inch', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Prep and marinate', text: 'Slice beef thinly against the grain. Marinate with soy sauce and a pinch of cornstarch for 10 minutes.' }, { order: 2, title: 'Blanch broccoli', text: 'Blanch **broccoli** in boiling water for **2 minutes**. Drain and set aside.', timer_seconds: 120, timer_label: 'Blanching timer' }, { order: 3, title: 'Stir-fry and sauce', text: 'Stir-fry garlic and ginger for 30 seconds. Add beef and cook for **3 minutes**. Add broccoli and **oyster sauce**. Toss for 1 minute and serve with rice.', timer_seconds: 180, timer_label: 'Stir-fry timer' }], base_serves: 3, tags: ['Non-Veg', 'Chinese', 'Beef'], duration_mins: 25 },
  { id: 'cn4', cookbook_id: 'cb5', title: 'Mapo Tofu', ingredients: [{ name: 'Soft tofu', amount: 400, unit: 'g', category: 'PANTRY' }, { name: 'Pork mince', amount: 150, unit: 'g', category: 'PROTEIN' }, { name: 'Doubanjiang (chilli bean paste)', amount: 2, unit: 'tbsp', category: 'SPICES' }, { name: 'Soy sauce', amount: 1, unit: 'tbsp', category: 'PANTRY' }, { name: 'Garlic', amount: 3, unit: 'cloves', category: 'PRODUCE' }, { name: 'Sichuan peppercorns', amount: 1, unit: 'tsp', category: 'SPICES' }], steps: [{ order: 1, title: 'Fry pork and paste', text: 'Fry **pork mince** with garlic and **doubanjiang** for **4 minutes** until fragrant and oil turns red.', timer_seconds: 240, timer_label: 'Pork timer' }, { order: 2, title: 'Add tofu', text: 'Add 200ml water and **soy sauce**. Gently slide in **tofu** cut into cubes. Simmer for **5 minutes**.', timer_seconds: 300, timer_label: 'Simmer timer' }, { order: 3, title: 'Finish and serve', text: 'Thicken with a cornstarch slurry. Top with ground **Sichuan peppercorns** and spring onions. Serve with steamed rice.' }], base_serves: 3, tags: ['Non-Veg', 'Chinese', 'Tofu'], duration_mins: 20 },

  { id: 'mx6', cookbook_id: 'cb3', title: 'Pork Carnitas', ingredients: [{ name: 'Pork shoulder', amount: 800, unit: 'g', category: 'PROTEIN' }, { name: 'Orange juice', amount: 150, unit: 'ml', category: 'PANTRY' }, { name: 'Cumin', amount: 2, unit: 'tsp', category: 'SPICES' }, { name: 'Garlic', amount: 4, unit: 'cloves', category: 'PRODUCE' }, { name: 'Corn tortillas', amount: 8, unit: '', category: 'PANTRY' }], steps: [{ order: 1, title: 'Season and slow cook', text: 'Rub pork with **cumin**, garlic, and salt. Place in a pot with **orange juice** and enough water to cover. Simmer on low for **90 minutes** until very tender.', timer_seconds: 5400, timer_label: 'Slow cook timer' }, { order: 2, title: 'Crisp the pork', text: 'Shred the pork. Spread on a baking tray and broil for **5 minutes** until edges crisp up.', timer_seconds: 300, timer_label: 'Crisping timer' }, { order: 3, title: 'Serve', text: 'Load into warm **tortillas** with onion, coriander, lime, and salsa.' }], base_serves: 4, tags: ['Non-Veg', 'Mexican', 'Pork'], duration_mins: 105 },

  // ── Mediterranean Table (cb6) ──
  { id: 'med1', cookbook_id: 'cb6', title: 'Shakshuka', ingredients: [{ name: 'Eggs', amount: 4, unit: '', category: 'DAIRY' }, { name: 'Canned tomatoes', amount: 400, unit: 'g', category: 'PANTRY' }, { name: 'Red pepper', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Onion', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Cumin', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'Paprika', amount: 1, unit: 'tsp', category: 'SPICES' }], steps: [{ order: 1, title: 'Make the sauce', text: 'Cook diced onion and pepper in olive oil for **5 minutes**. Add **cumin**, **paprika**, and **canned tomatoes**. Simmer for **10 minutes** until thick.', timer_seconds: 600, timer_label: 'Sauce timer' }, { order: 2, title: 'Poach the eggs', text: 'Make 4 wells in the sauce and crack in **eggs**. Cover and cook for **5 minutes** until whites are set but yolks are still runny.', timer_seconds: 300, timer_label: 'Egg timer' }, { order: 3, title: 'Serve', text: 'Top with crumbled feta and fresh parsley. Serve directly from the pan with crusty bread.' }], base_serves: 2, tags: ['Vegetarian', 'Mediterranean', 'Eggs'], duration_mins: 25 },
  { id: 'med2', cookbook_id: 'cb6', title: 'Grilled Chicken Souvlaki', ingredients: [{ name: 'Chicken breast', amount: 500, unit: 'g', category: 'PROTEIN' }, { name: 'Lemon', amount: 2, unit: '', category: 'PRODUCE' }, { name: 'Garlic', amount: 3, unit: 'cloves', category: 'PRODUCE' }, { name: 'Olive oil', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Oregano', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'Pita bread', amount: 4, unit: '', category: 'PANTRY' }], steps: [{ order: 1, title: 'Marinate', text: 'Cut chicken into chunks. Mix with **lemon juice**, garlic, **olive oil**, and **oregano**. Marinate for 30 minutes.' }, { order: 2, title: 'Grill', text: 'Thread chicken onto skewers. Grill or pan-sear for **5 minutes** per side until charred and cooked through.', timer_seconds: 300, timer_label: 'Grill timer' }, { order: 3, title: 'Serve', text: 'Serve in warm **pita** with tzatziki, sliced tomatoes, and red onion.' }], base_serves: 4, tags: ['Non-Veg', 'Mediterranean', 'Chicken'], duration_mins: 45 },
  { id: 'med3', cookbook_id: 'cb6', title: 'Falafel', ingredients: [{ name: 'Chickpeas (dried)', amount: 250, unit: 'g', category: 'PANTRY' }, { name: 'Fresh parsley', amount: 1, unit: 'handful', category: 'PRODUCE' }, { name: 'Onion', amount: 1, unit: 'small', category: 'PRODUCE' }, { name: 'Cumin', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'Coriander powder', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'Garlic', amount: 3, unit: 'cloves', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Blend the mix', text: 'Soak dried **chickpeas** overnight. Drain and blend with onion, garlic, **parsley**, **cumin**, and **coriander** to a coarse paste. Do not over-blend.' }, { order: 2, title: 'Shape and fry', text: 'Form into small balls. Deep-fry or shallow-fry in hot oil for **4 minutes**, turning until deep golden all over.', timer_seconds: 240, timer_label: 'Frying timer' }, { order: 3, title: 'Serve', text: 'Serve in pita with hummus, salad, and tahini sauce.' }], base_serves: 4, tags: ['Vegetarian', 'Mediterranean', 'Chickpeas'], duration_mins: 30 },
  { id: 'med4', cookbook_id: 'cb6', title: 'Lamb Kofta', ingredients: [{ name: 'Lamb mince', amount: 500, unit: 'g', category: 'PROTEIN' }, { name: 'Onion', amount: 1, unit: 'small', category: 'PRODUCE' }, { name: 'Cumin', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'Coriander powder', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'Fresh parsley', amount: 1, unit: 'handful', category: 'PRODUCE' }, { name: 'Cinnamon', amount: 0.5, unit: 'tsp', category: 'SPICES' }], steps: [{ order: 1, title: 'Mix and shape', text: 'Combine lamb mince with grated onion, **cumin**, **coriander**, **cinnamon**, and parsley. Shape around skewers into logs.' }, { order: 2, title: 'Grill', text: 'Grill on high heat for **4 minutes** per side until cooked through and charred.', timer_seconds: 240, timer_label: 'Grill timer' }, { order: 3, title: 'Serve', text: 'Serve with warm flatbread, tzatziki, and a simple tomato salad.' }], base_serves: 4, tags: ['Non-Veg', 'Mediterranean', 'Lamb'], duration_mins: 25 },

  // ── Japanese Essentials (cb7) ──
  { id: 'jp1', cookbook_id: 'cb7', title: 'Chicken Teriyaki', ingredients: [{ name: 'Chicken thighs', amount: 400, unit: 'g', category: 'PROTEIN' }, { name: 'Soy sauce', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Mirin', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Sugar', amount: 1, unit: 'tbsp', category: 'PANTRY' }, { name: 'Sesame seeds', amount: 1, unit: 'tsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Make teriyaki sauce', text: 'Mix **soy sauce**, **mirin**, and **sugar** in a bowl.' }, { order: 2, title: 'Cook chicken', text: 'Pan-fry chicken thighs skin-side down for **6 minutes** until golden. Flip and cook for **4 more minutes**.', timer_seconds: 360, timer_label: 'Chicken timer' }, { order: 3, title: 'Glaze and serve', text: 'Pour **teriyaki sauce** into the pan. Cook for **2 minutes** until sauce thickens and coats chicken. Serve over rice with **sesame seeds**.', timer_seconds: 120, timer_label: 'Glazing timer' }], base_serves: 2, tags: ['Non-Veg', 'Japanese', 'Chicken'], duration_mins: 20 },
  { id: 'jp2', cookbook_id: 'cb7', title: 'Miso Soup', ingredients: [{ name: 'Dashi stock', amount: 600, unit: 'ml', category: 'PANTRY' }, { name: 'White miso paste', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Silken tofu', amount: 150, unit: 'g', category: 'PANTRY' }, { name: 'Wakame seaweed', amount: 1, unit: 'tbsp', category: 'PANTRY' }, { name: 'Spring onions', amount: 2, unit: '', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Heat dashi', text: 'Bring **dashi stock** to a gentle simmer. Rehydrate **wakame** in cold water for 5 minutes, drain.' }, { order: 2, title: 'Add miso', text: 'Dissolve **miso paste** in a ladle of hot dashi, then stir back into the pot. Do not boil.' }, { order: 3, title: 'Add toppings and serve', text: 'Add cubed **tofu** and **wakame**. Ladle into bowls and top with sliced **spring onions**.' }], base_serves: 4, tags: ['Vegetarian', 'Japanese', 'Soup'], duration_mins: 15 },
  { id: 'jp3', cookbook_id: 'cb7', title: 'Gyoza Dumplings', ingredients: [{ name: 'Pork mince', amount: 250, unit: 'g', category: 'PROTEIN' }, { name: 'Gyoza wrappers', amount: 24, unit: '', category: 'PANTRY' }, { name: 'Cabbage', amount: 150, unit: 'g', category: 'PRODUCE' }, { name: 'Ginger', amount: 1, unit: 'tsp', category: 'PRODUCE' }, { name: 'Soy sauce', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Sesame oil', amount: 1, unit: 'tsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Make the filling', text: 'Mix pork mince with finely shredded cabbage, **ginger**, **soy sauce**, and **sesame oil**.' }, { order: 2, title: 'Fill and fold', text: 'Place a teaspoon of filling in each wrapper. Moisten edges with water and pleat to seal.' }, { order: 3, title: 'Pan-fry and steam', text: 'Fry gyoza in oil for **2 minutes** until golden on the bottom. Add 60ml water, cover and steam for **4 minutes** until cooked through.', timer_seconds: 240, timer_label: 'Steam timer' }], base_serves: 4, tags: ['Non-Veg', 'Japanese', 'Dumplings'], duration_mins: 30 },
  // ── French Bistro (cb8) ──
  { id: 'fr1', cookbook_id: 'cb8', title: 'French Onion Soup', ingredients: [{ name: 'Onions', amount: 6, unit: 'large', category: 'PRODUCE' }, { name: 'Beef stock', amount: 1, unit: 'litre', category: 'PANTRY' }, { name: 'Baguette', amount: 4, unit: 'slices', category: 'PANTRY' }, { name: 'Gruyère cheese', amount: 150, unit: 'g', category: 'DAIRY' }, { name: 'Butter', amount: 40, unit: 'g', category: 'DAIRY' }, { name: 'White wine', amount: 150, unit: 'ml', category: 'PANTRY' }], steps: [{ order: 1, title: 'Caramelise onions', text: 'Melt **butter** in a heavy pot. Cook thinly sliced onions over low heat for **40 minutes**, stirring occasionally, until deep golden and caramelised.', timer_seconds: 2400, timer_label: 'Caramelising timer' }, { order: 2, title: 'Build the soup', text: 'Add **wine** and reduce for 2 minutes. Add **beef stock** and simmer for **10 minutes**.', timer_seconds: 600, timer_label: 'Simmer timer' }, { order: 3, title: 'Gratinée and serve', text: 'Ladle into oven-safe bowls. Top with **baguette** slices and grated **Gruyère**. Grill under the broiler for **3 minutes** until bubbling and golden.', timer_seconds: 180, timer_label: 'Broil timer' }], base_serves: 4, tags: ['Vegetarian', 'French', 'Soup'], duration_mins: 60 },
  { id: 'fr2', cookbook_id: 'cb8', title: 'Coq au Vin', ingredients: [{ name: 'Chicken pieces', amount: 1, unit: 'kg', category: 'PROTEIN' }, { name: 'Red wine', amount: 400, unit: 'ml', category: 'PANTRY' }, { name: 'Bacon lardons', amount: 150, unit: 'g', category: 'PROTEIN' }, { name: 'Mushrooms', amount: 250, unit: 'g', category: 'PRODUCE' }, { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' }, { name: 'Thyme', amount: 3, unit: 'sprigs', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Brown chicken and bacon', text: 'Fry **bacon lardons** until crispy. Brown **chicken** in batches for **5 minutes** per side.', timer_seconds: 300, timer_label: 'Browning timer' }, { order: 2, title: 'Build the braise', text: 'Sauté onion and **mushrooms** for 5 minutes. Return chicken and bacon to the pot. Add **red wine** and **thyme**. Cover and braise on low for **45 minutes**.', timer_seconds: 2700, timer_label: 'Braising timer' }, { order: 3, title: 'Serve', text: 'Serve with crusty bread or mashed potatoes.' }], base_serves: 4, tags: ['Non-Veg', 'French', 'Chicken'], duration_mins: 65 },
  { id: 'fr3', cookbook_id: 'cb8', title: 'Ratatouille', ingredients: [{ name: 'Eggplant', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Zucchini', amount: 2, unit: '', category: 'PRODUCE' }, { name: 'Tomatoes', amount: 4, unit: '', category: 'PRODUCE' }, { name: 'Red pepper', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Garlic', amount: 3, unit: 'cloves', category: 'PRODUCE' }, { name: 'Olive oil', amount: 4, unit: 'tbsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Roast the vegetables', text: 'Dice all vegetables. Toss with **olive oil**, garlic, salt, and herbs. Roast at 200°C for **25 minutes**.', timer_seconds: 1500, timer_label: 'Roasting timer' }, { order: 2, title: 'Combine and simmer', text: 'Transfer to a pot and simmer for **15 minutes** until the vegetables are tender and the sauce has thickened.', timer_seconds: 900, timer_label: 'Simmer timer' }, { order: 3, title: 'Serve', text: 'Serve warm or at room temperature with crusty bread or as a side dish.' }], base_serves: 4, tags: ['Vegetarian', 'French', 'Roasted'], duration_mins: 50 },
  { id: 'fr4', cookbook_id: 'cb8', title: 'Beef Bourguignon', ingredients: [{ name: 'Beef chuck', amount: 800, unit: 'g', category: 'PROTEIN' }, { name: 'Red wine', amount: 500, unit: 'ml', category: 'PANTRY' }, { name: 'Bacon lardons', amount: 150, unit: 'g', category: 'PROTEIN' }, { name: 'Carrots', amount: 3, unit: '', category: 'PRODUCE' }, { name: 'Pearl onions', amount: 200, unit: 'g', category: 'PRODUCE' }, { name: 'Mushrooms', amount: 200, unit: 'g', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Brown beef and bacon', text: 'Cut beef into large cubes. Brown in batches with **bacon** until deeply coloured, about **6 minutes** per batch.', timer_seconds: 360, timer_label: 'Browning timer' }, { order: 2, title: 'Braise', text: 'Add **red wine**, carrots, and onions. Bring to a boil, then braise at 160°C for **2 hours** until beef is very tender.', timer_seconds: 7200, timer_label: 'Braise timer' }, { order: 3, title: 'Add mushrooms and serve', text: 'Sauté **mushrooms** and add in the last 15 minutes. Serve with mashed potatoes.' }], base_serves: 6, tags: ['Non-Veg', 'French', 'Beef'], duration_mins: 135 },

  // ── Middle Eastern Mezze (cb9) ──
  { id: 'me1', cookbook_id: 'cb9', title: 'Hummus', ingredients: [{ name: 'Chickpeas (cooked)', amount: 400, unit: 'g', category: 'PANTRY' }, { name: 'Tahini', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Lemon', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Garlic', amount: 1, unit: 'clove', category: 'PRODUCE' }, { name: 'Olive oil', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Cumin', amount: 0.5, unit: 'tsp', category: 'SPICES' }], steps: [{ order: 1, title: 'Blend', text: 'Blend **chickpeas**, **tahini**, lemon juice, garlic, and **cumin** in a food processor until smooth. Add 2-3 tbsp cold water to adjust consistency.' }, { order: 2, title: 'Season and serve', text: 'Season with salt. Spread in a bowl, drizzle with **olive oil**, and top with paprika. Serve with warm pita or crudités.' }], base_serves: 6, tags: ['Vegetarian', 'Middle Eastern', 'Quick'], duration_mins: 10 },
  { id: 'me2', cookbook_id: 'cb9', title: 'Chicken Shawarma', ingredients: [{ name: 'Chicken thighs', amount: 600, unit: 'g', category: 'PROTEIN' }, { name: 'Yogurt', amount: 150, unit: 'ml', category: 'DAIRY' }, { name: 'Shawarma spice blend', amount: 2, unit: 'tbsp', category: 'SPICES' }, { name: 'Lemon', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Garlic', amount: 3, unit: 'cloves', category: 'PRODUCE' }, { name: 'Flatbread', amount: 4, unit: '', category: 'PANTRY' }], steps: [{ order: 1, title: 'Marinate', text: 'Mix chicken with **yogurt**, **shawarma spice**, lemon juice, and garlic. Marinate for at least 1 hour.' }, { order: 2, title: 'Cook', text: 'Grill or roast chicken at 220°C for **20 minutes** until charred at the edges and cooked through.', timer_seconds: 1200, timer_label: 'Cooking timer' }, { order: 3, title: 'Serve', text: 'Slice thinly and serve in **flatbread** with garlic sauce, pickles, and fresh tomatoes.' }], base_serves: 4, tags: ['Non-Veg', 'Middle Eastern', 'Chicken'], duration_mins: 30 },
  { id: 'me3', cookbook_id: 'cb9', title: 'Lentil Soup', ingredients: [{ name: 'Red lentils', amount: 250, unit: 'g', category: 'PANTRY' }, { name: 'Onion', amount: 1, unit: 'large', category: 'PRODUCE' }, { name: 'Tomatoes', amount: 2, unit: '', category: 'PRODUCE' }, { name: 'Cumin', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'Turmeric', amount: 0.5, unit: 'tsp', category: 'SPICES' }, { name: 'Lemon', amount: 1, unit: '', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Cook the base', text: 'Sauté diced onion for **5 minutes**. Add **cumin**, **turmeric**, and diced tomatoes. Cook for **3 minutes**.', timer_seconds: 300, timer_label: 'Base timer' }, { order: 2, title: 'Simmer lentils', text: 'Add **red lentils** and 1 litre of water. Simmer for **20 minutes** until lentils are completely soft.', timer_seconds: 1200, timer_label: 'Simmer timer' }, { order: 3, title: 'Blend and serve', text: 'Blend until smooth. Add **lemon juice** and season with salt. Serve with a drizzle of olive oil and warm bread.' }], base_serves: 4, tags: ['Vegetarian', 'Middle Eastern', 'Soup'], duration_mins: 30 },
  { id: 'me4', cookbook_id: 'cb9', title: 'Lamb Kebabs', ingredients: [{ name: 'Lamb mince', amount: 500, unit: 'g', category: 'PROTEIN' }, { name: 'Onion', amount: 1, unit: 'small', category: 'PRODUCE' }, { name: 'Cumin', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'Paprika', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'Fresh parsley', amount: 1, unit: 'handful', category: 'PRODUCE' }, { name: 'Flatbread', amount: 4, unit: '', category: 'PANTRY' }], steps: [{ order: 1, title: 'Mix and shape', text: 'Mix lamb with grated onion, **cumin**, **paprika**, parsley, and salt. Knead well and shape onto skewers.' }, { order: 2, title: 'Grill', text: 'Grill over high heat for **4 minutes** per side until cooked through with good char marks.', timer_seconds: 240, timer_label: 'Grill timer' }, { order: 3, title: 'Serve', text: 'Serve in warm **flatbread** with yogurt sauce, salad, and pickled onions.' }], base_serves: 4, tags: ['Non-Veg', 'Middle Eastern', 'Lamb'], duration_mins: 25 },

  // ── American BBQ & Classics (cb10) ──
  { id: 'bbq1', cookbook_id: 'cb10', title: 'Smoked BBQ Ribs', ingredients: [{ name: 'Pork baby back ribs', amount: 1.5, unit: 'kg', category: 'PROTEIN' }, { name: 'Brown sugar', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Smoked paprika', amount: 2, unit: 'tsp', category: 'SPICES' }, { name: 'Garlic powder', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'BBQ sauce', amount: 200, unit: 'ml', category: 'PANTRY' }, { name: 'Cumin', amount: 1, unit: 'tsp', category: 'SPICES' }], steps: [{ order: 1, title: 'Apply dry rub', text: 'Mix **brown sugar**, **smoked paprika**, garlic powder, **cumin**, salt, and pepper. Remove the membrane from ribs and rub the spice mix all over. Let rest for 30 minutes.' }, { order: 2, title: 'Low and slow cook', text: 'Wrap ribs tightly in foil. Bake at 150°C for **2.5 hours** until tender and the meat pulls back from the bones.', timer_seconds: 9000, timer_label: 'Slow cook timer' }, { order: 3, title: 'Glaze and finish', text: 'Unwrap and brush generously with **BBQ sauce**. Grill or broil for **5 minutes** until caramelised and sticky.', timer_seconds: 300, timer_label: 'Glaze timer' }], base_serves: 4, tags: ['Non-Veg', 'American', 'BBQ', 'Pork'], duration_mins: 180 },
  { id: 'bbq2', cookbook_id: 'cb10', title: 'Classic Cheeseburger', ingredients: [{ name: 'Ground beef (80/20)', amount: 500, unit: 'g', category: 'PROTEIN' }, { name: 'Cheddar cheese', amount: 4, unit: 'slices', category: 'DAIRY' }, { name: 'Brioche buns', amount: 4, unit: '', category: 'PANTRY' }, { name: 'Onion', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Lettuce', amount: 4, unit: 'leaves', category: 'PRODUCE' }, { name: 'Tomato', amount: 2, unit: '', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Form patties', text: 'Divide beef into 4 equal portions. Form into patties slightly wider than your bun (they shrink). Season generously with salt and pepper on both sides.' }, { order: 2, title: 'Cook the burgers', text: 'Cook patties on a hot griddle or cast iron for **3 minutes** per side for medium. Add **cheddar** in the last minute and cover to melt.', timer_seconds: 180, timer_label: 'Cook timer' }, { order: 3, title: 'Assemble and serve', text: 'Toast the **brioche buns**. Build with lettuce, tomato, onion, and your patty. Add ketchup, mustard, and pickles.' }], base_serves: 4, tags: ['Non-Veg', 'American', 'Beef'], duration_mins: 20 },
  { id: 'bbq3', cookbook_id: 'cb10', title: 'Mac and Cheese', ingredients: [{ name: 'Macaroni pasta', amount: 300, unit: 'g', category: 'PANTRY' }, { name: 'Cheddar cheese', amount: 200, unit: 'g', category: 'DAIRY' }, { name: 'Butter', amount: 40, unit: 'g', category: 'DAIRY' }, { name: 'Plain flour', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Whole milk', amount: 500, unit: 'ml', category: 'DAIRY' }, { name: 'Mustard powder', amount: 0.5, unit: 'tsp', category: 'SPICES' }], steps: [{ order: 1, title: 'Cook pasta', text: 'Cook **macaroni** in salted boiling water for **8 minutes** until just al dente. Drain and set aside.', timer_seconds: 480, timer_label: 'Pasta timer' }, { order: 2, title: 'Make cheese sauce', text: 'Melt **butter** over medium heat. Whisk in **flour** and cook for 1 minute. Gradually whisk in **milk** until smooth. Simmer for **5 minutes** until thick. Remove from heat and stir in **cheddar** and **mustard powder**.', timer_seconds: 300, timer_label: 'Sauce timer' }, { order: 3, title: 'Combine and serve', text: 'Stir pasta into the cheese sauce. Serve immediately or transfer to a baking dish and bake at 180°C for **15 minutes** until golden on top.', timer_seconds: 900, timer_label: 'Bake timer' }], base_serves: 4, tags: ['Vegetarian', 'American', 'Pasta'], duration_mins: 30 },
  { id: 'bbq4', cookbook_id: 'cb10', title: 'BBQ Pulled Pork', ingredients: [{ name: 'Pork shoulder', amount: 1.5, unit: 'kg', category: 'PROTEIN' }, { name: 'BBQ sauce', amount: 250, unit: 'ml', category: 'PANTRY' }, { name: 'Brown sugar', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Smoked paprika', amount: 2, unit: 'tsp', category: 'SPICES' }, { name: 'Garlic powder', amount: 1, unit: 'tsp', category: 'SPICES' }, { name: 'Brioche buns', amount: 6, unit: '', category: 'PANTRY' }], steps: [{ order: 1, title: 'Season and cook', text: 'Rub pork shoulder with **brown sugar**, **smoked paprika**, garlic powder, salt, and pepper. Place in a slow cooker or oven dish. Cook at 140°C for **4 hours** until falling apart tender.', timer_seconds: 14400, timer_label: 'Slow cook timer' }, { order: 2, title: 'Shred the pork', text: 'Remove pork and shred with two forks. Discard excess fat. Mix shredded pork with **BBQ sauce** and a splash of the cooking juices.' }, { order: 3, title: 'Serve', text: 'Pile onto toasted **brioche buns** with coleslaw and extra BBQ sauce on the side.' }], base_serves: 6, tags: ['Non-Veg', 'American', 'BBQ', 'Pork'], duration_mins: 250 },

  // ── Korean Home Cooking (cb11) ──
  { id: 'kr1', cookbook_id: 'cb11', title: 'Bibimbap', ingredients: [{ name: 'Cooked rice', amount: 400, unit: 'g', category: 'PANTRY' }, { name: 'Minced beef', amount: 200, unit: 'g', category: 'PROTEIN' }, { name: 'Spinach', amount: 150, unit: 'g', category: 'PRODUCE' }, { name: 'Carrots', amount: 2, unit: '', category: 'PRODUCE' }, { name: 'Eggs', amount: 2, unit: '', category: 'DAIRY' }, { name: 'Gochujang paste', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Soy sauce', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Sesame oil', amount: 1, unit: 'tbsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Prepare vegetables', text: 'Blanch **spinach** for 1 minute, drain and squeeze dry. Season with sesame oil and salt. Julienne **carrots** and stir-fry for **3 minutes** until tender.' }, { order: 2, title: 'Cook the beef', text: 'Stir-fry **minced beef** with **soy sauce** and **sesame oil** for **5 minutes** until cooked and caramelised.', timer_seconds: 300, timer_label: 'Beef timer' }, { order: 3, title: 'Fry eggs and assemble', text: 'Fry **eggs** sunny-side up. Arrange everything over **rice** in a bowl. Add a spoonful of **gochujang** and mix everything together before eating.' }], base_serves: 2, tags: ['Non-Veg', 'Korean', 'Rice'], duration_mins: 30 },
  { id: 'kr2', cookbook_id: 'cb11', title: 'Kimchi Fried Rice', ingredients: [{ name: 'Cooked rice', amount: 400, unit: 'g', category: 'PANTRY' }, { name: 'Kimchi', amount: 200, unit: 'g', category: 'PANTRY' }, { name: 'Bacon', amount: 100, unit: 'g', category: 'PROTEIN' }, { name: 'Eggs', amount: 2, unit: '', category: 'DAIRY' }, { name: 'Soy sauce', amount: 1, unit: 'tbsp', category: 'PANTRY' }, { name: 'Sesame oil', amount: 1, unit: 'tsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Fry the bacon and kimchi', text: 'Cook **bacon** in a wok until crispy. Add chopped **kimchi** and stir-fry for **3 minutes** until slightly caramelised.', timer_seconds: 180, timer_label: 'Kimchi timer' }, { order: 2, title: 'Add rice', text: 'Add day-old **rice** and break up any clumps. Stir-fry on high heat for **3 minutes**. Season with **soy sauce** and **sesame oil**.', timer_seconds: 180, timer_label: 'Rice timer' }, { order: 3, title: 'Top and serve', text: 'Divide into bowls. Fry **eggs** and place on top. Garnish with sesame seeds and sliced spring onions.' }], base_serves: 2, tags: ['Non-Veg', 'Korean', 'Rice'], duration_mins: 20 },
  { id: 'kr3', cookbook_id: 'cb11', title: 'Korean Fried Chicken', ingredients: [{ name: 'Chicken wings', amount: 800, unit: 'g', category: 'PROTEIN' }, { name: 'Gochujang paste', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Honey', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Garlic', amount: 3, unit: 'cloves', category: 'PRODUCE' }, { name: 'Cornstarch', amount: 4, unit: 'tbsp', category: 'PANTRY' }, { name: 'Soy sauce', amount: 1, unit: 'tbsp', category: 'PANTRY' }], steps: [{ order: 1, title: 'Coat the chicken', text: 'Pat **chicken wings** dry. Toss in **cornstarch** until evenly coated. Let rest for 10 minutes.' }, { order: 2, title: 'Double fry', text: 'Fry wings in oil at 170°C for **8 minutes**. Remove and rest. Increase oil to 190°C and fry again for **4 minutes** until very crispy.', timer_seconds: 480, timer_label: 'First fry timer' }, { order: 3, title: 'Sauce and serve', text: 'Mix **gochujang**, **honey**, minced garlic, and **soy sauce** in a pan over low heat for 2 minutes. Toss wings in the sauce and serve with pickled radish.' }], base_serves: 4, tags: ['Non-Veg', 'Korean', 'Chicken', 'Fried'], duration_mins: 35 },
  { id: 'kr4', cookbook_id: 'cb11', title: 'Doenjang Jjigae (Soybean Stew)', ingredients: [{ name: 'Doenjang paste', amount: 3, unit: 'tbsp', category: 'PANTRY' }, { name: 'Tofu', amount: 200, unit: 'g', category: 'PANTRY' }, { name: 'Zucchini', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Potato', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Onion', amount: 1, unit: '', category: 'PRODUCE' }, { name: 'Mushrooms', amount: 100, unit: 'g', category: 'PRODUCE' }, { name: 'Garlic', amount: 3, unit: 'cloves', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Build the stew base', text: 'Bring 700ml of water or anchovy stock to a boil. Dissolve **doenjang paste** in the liquid. Add diced **potato** and **onion**. Simmer for **5 minutes**.', timer_seconds: 300, timer_label: 'Base timer' }, { order: 2, title: 'Add vegetables', text: 'Add sliced **zucchini**, **mushrooms**, and minced **garlic**. Simmer for another **5 minutes** until all vegetables are tender.', timer_seconds: 300, timer_label: 'Vegetable timer' }, { order: 3, title: 'Add tofu and serve', text: 'Add cubed **tofu** and cook for **2 minutes** to warm through. Serve immediately with steamed rice and side dishes.' }], base_serves: 2, tags: ['Vegetarian', 'Korean', 'Soup'], duration_mins: 20 },

  { id: 'jp4', cookbook_id: 'cb7', title: 'Vegetable Ramen', ingredients: [{ name: 'Ramen noodles', amount: 200, unit: 'g', category: 'PANTRY' }, { name: 'Vegetable stock', amount: 800, unit: 'ml', category: 'PANTRY' }, { name: 'Miso paste', amount: 2, unit: 'tbsp', category: 'PANTRY' }, { name: 'Soft-boiled eggs', amount: 2, unit: '', category: 'DAIRY' }, { name: 'Corn kernels', amount: 100, unit: 'g', category: 'PRODUCE' }, { name: 'Spring onions', amount: 3, unit: '', category: 'PRODUCE' }], steps: [{ order: 1, title: 'Make the broth', text: 'Heat **vegetable stock** and whisk in **miso paste**. Simmer for **5 minutes**.', timer_seconds: 300, timer_label: 'Broth timer' }, { order: 2, title: 'Cook noodles', text: 'Cook **ramen noodles** according to packet (usually **3 minutes**). Drain and divide into bowls.', timer_seconds: 180, timer_label: 'Noodle timer' }, { order: 3, title: 'Assemble', text: 'Pour hot broth over noodles. Top with **corn**, halved **soft-boiled eggs**, and **spring onions**.' }], base_serves: 2, tags: ['Vegetarian', 'Japanese', 'Noodles'], duration_mins: 20 },
];

/** IDs of cookbooks bundled with the app (not user-uploaded) */
const BUNDLED_COOKBOOK_IDS = new Set(MOCK_COOKBOOKS.map((cb) => cb.id));

/** IDs of featured cookbooks loaded from backend — populated at runtime */
const featuredCookbookIds = new Set<string>();

interface RecipeState {
  cookbooks: Cookbook[];
  recipes: Recipe[];
  lifetimeUploads: number;
  getCookbook: (id: string) => Cookbook | undefined;
  getRecipesByCookbook: (cookbookId: string) => Recipe[];
  getRecipe: (id: string) => Recipe | undefined;
  isUploadedCookbook: (id: string) => boolean;
  getActiveUploadCount: () => number;
  addCookbook: (title: string, author?: string, newRecipes?: Recipe[]) => Cookbook;
  addPendingCookbook: (title: string) => string;
  resolvePendingCookbook: (id: string, cookbook: Cookbook, recipes: Recipe[]) => void;
  rejectPendingCookbook: (id: string) => void;
  addParsedCookbook: (cookbook: Cookbook, recipes: Recipe[]) => void;
  addGeneratedRecipe: (recipe: Recipe) => void;
  updateCookbookRecipeCount: (id: string, count: number) => void;
  removeCookbook: (id: string) => void;
  removeRecipe: (recipeId: string) => void;
  incrementLifetimeUploads: () => void;
  mergeFeaturedCookbooks: (cookbooks: Cookbook[], recipes: Recipe[]) => void;
  isFeaturedCookbook: (id: string) => boolean;
  mergeMyRecipes: (cookbook: Cookbook, recipes: Recipe[]) => void;
}

export const useRecipeStore = create<RecipeState>()(persist((set, get) => ({
  cookbooks: MOCK_COOKBOOKS,
  recipes: MOCK_RECIPES,
  lifetimeUploads: 0,

  getCookbook: (id) => get().cookbooks.find((c) => c.id === id),

  getRecipesByCookbook: (cookbookId) =>
    get().recipes.filter((r) => r.cookbook_id === cookbookId),

  getRecipe: (id) => get().recipes.find((r) => r.id === id),

  isUploadedCookbook: (id) => !BUNDLED_COOKBOOK_IDS.has(id) && !featuredCookbookIds.has(id) && id !== 'cb_my_recipes',

  isFeaturedCookbook: (id) => featuredCookbookIds.has(id),

  getActiveUploadCount: () =>
    get().cookbooks.filter((cb) => !BUNDLED_COOKBOOK_IDS.has(cb.id) && !featuredCookbookIds.has(cb.id) && cb.id !== 'cb_my_recipes').length,

  incrementLifetimeUploads: () =>
    set((state) => ({ lifetimeUploads: state.lifetimeUploads + 1 })),

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

  /** Add a placeholder cookbook with loading=true immediately (background upload flow) */
  addPendingCookbook: (title) => {
    const id = `cb_${Date.now()}`;
    const cookbook: Cookbook = {
      id,
      title,
      author: 'Parsing…',
      accent_color: ACCENT_PALETTE[get().cookbooks.length % ACCENT_PALETTE.length],
      recipe_count: 0,
      created_at: new Date().toISOString().split('T')[0],
      loading: true,
    };
    set((state) => ({ cookbooks: [...state.cookbooks, cookbook] }));
    return id;
  },

  /** Replace a pending cookbook with the fully parsed result */
  resolvePendingCookbook: (id, cookbook, recipes) => {
    set((state) => ({
      cookbooks: state.cookbooks.map((cb) =>
        cb.id === id ? { ...cookbook, id, loading: false } : cb
      ),
      recipes: [...state.recipes, ...recipes.map((r) => ({ ...r, cookbook_id: id }))],
    }));
  },

  /** Remove a pending cookbook if parsing failed */
  rejectPendingCookbook: (id) => {
    set((state) => ({
      cookbooks: state.cookbooks.filter((cb) => cb.id !== id),
    }));
  },

  /** Add a cookbook + recipes returned from the Supabase Edge Function */
  addParsedCookbook: (cookbook, recipes) => {
    set((state) => ({
      cookbooks: [...state.cookbooks, cookbook],
      recipes: [...state.recipes, ...recipes],
    }));
  },

  /** Add a Claude-generated recipe to the My Recipes cookbook, creating it if needed */
  addGeneratedRecipe: (recipe) => {
    const MY_ID = 'cb_my_recipes';
    set((state) => {
      const exists = state.cookbooks.some((cb) => cb.id === MY_ID);
      const myCookbook: Cookbook = {
        id: MY_ID,
        title: 'My Recipes',
        author: 'Created by you',
        accent_color: '#3A4A2A',
        recipe_count: 0,
        created_at: new Date().toISOString().split('T')[0],
      };
      const updatedCookbooks = exists
        ? state.cookbooks.map((cb) =>
            cb.id === MY_ID ? { ...cb, recipe_count: cb.recipe_count + 1 } : cb
          )
        : [...state.cookbooks, { ...myCookbook, recipe_count: 1 }];
      return {
        cookbooks: updatedCookbooks,
        recipes: [...state.recipes, recipe],
      };
    });
  },

  /** Update recipe_count after parsing completes */
  updateCookbookRecipeCount: (id, count) => {
    set((state) => ({
      cookbooks: state.cookbooks.map((cb) =>
        cb.id === id ? { ...cb, recipe_count: count } : cb
      ),
    }));
  },

  /** Remove a cookbook and all its recipes */
  removeCookbook: (id) => {
    set((state) => ({
      cookbooks: state.cookbooks.filter((cb) => cb.id !== id),
      recipes: state.recipes.filter((r) => r.cookbook_id !== id),
    }));
  },

  /** Remove a single recipe and update its cookbook's count */
  removeRecipe: (recipeId) => {
    set((state) => {
      const recipe = state.recipes.find((r) => r.id === recipeId);
      const updatedRecipes = state.recipes.filter((r) => r.id !== recipeId);
      const updatedCookbooks = recipe
        ? state.cookbooks.map((cb) =>
            cb.id === recipe.cookbook_id
              ? { ...cb, recipe_count: Math.max(0, cb.recipe_count - 1) }
              : cb
          )
        : state.cookbooks;
      return { recipes: updatedRecipes, cookbooks: updatedCookbooks };
    });
  },

  /** Merge featured cookbooks from backend — no limits, no duplicates */
  mergeFeaturedCookbooks: (newCookbooks, newRecipes) => {
    // Track featured IDs
    newCookbooks.forEach((cb) => featuredCookbookIds.add(cb.id));

    set((state) => {
      const existingCbIds = new Set(state.cookbooks.map((cb) => cb.id));
      const existingRecipeIds = new Set(state.recipes.map((r) => r.id));

      const addedCookbooks = newCookbooks.filter((cb) => !existingCbIds.has(cb.id));
      const addedRecipes = newRecipes.filter((r) => !existingRecipeIds.has(r.id));

      return {
        cookbooks: [...state.cookbooks, ...addedCookbooks],
        recipes: [...state.recipes, ...addedRecipes],
      };
    });
  },

  /** Merge "My Recipes" fetched from Supabase — restores recipes that were lost locally */
  mergeMyRecipes: (cookbook, newRecipes) => {
    set((state) => {
      const existingRecipeIds = new Set(state.recipes.map((r) => r.id));
      const addedRecipes = newRecipes.filter((r) => !existingRecipeIds.has(r.id));

      const hasCookbook = state.cookbooks.some((cb) => cb.id === cookbook.id);
      const updatedCookbooks = hasCookbook
        ? state.cookbooks.map((cb) =>
            cb.id === cookbook.id ? { ...cb, recipe_count: cookbook.recipe_count } : cb
          )
        : [...state.cookbooks, cookbook];

      return {
        cookbooks: updatedCookbooks,
        recipes: [...state.recipes, ...addedRecipes],
      };
    });
  },
}), {
  name: 'spicechef-recipes',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    // Only persist user-added data and lifetime counter
    cookbooks: state.cookbooks,
    recipes: state.recipes,
    lifetimeUploads: state.lifetimeUploads,
  }),
  merge: (persisted: any, current) => {
    if (!persisted) return current;

    // Ensure all bundled cookbooks are present (in case we add new ones in updates)
    const persistedCookbookIds = new Set((persisted.cookbooks || []).map((cb: Cookbook) => cb.id));
    const missingBundled = MOCK_COOKBOOKS.filter((cb) => !persistedCookbookIds.has(cb.id));

    // Ensure all bundled recipes are present
    const persistedRecipeIds = new Set((persisted.recipes || []).map((r: Recipe) => r.id));
    const missingRecipes = MOCK_RECIPES.filter((r) => !persistedRecipeIds.has(r.id));

    return {
      ...current,
      cookbooks: [...(persisted.cookbooks || []), ...missingBundled],
      recipes: [...(persisted.recipes || []), ...missingRecipes],
      lifetimeUploads: persisted.lifetimeUploads ?? 0,
    };
  },
}));
