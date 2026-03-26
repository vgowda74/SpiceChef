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
  { id: 'cb1', title: 'Famous Indian Dishes', author: 'Culinary India', accent_color: '#6B4A2A', recipe_count: 10, created_at: '2026-03-01' },
  { id: 'cb2', title: 'Italian Classics', author: 'La Cucina Italiana', accent_color: '#7A3B28', recipe_count: 10, created_at: '2026-03-02' },
  { id: 'cb3', title: 'Mexican Fiesta', author: 'Casa Mexico', accent_color: '#5A6B2A', recipe_count: 10, created_at: '2026-03-03' },
  { id: 'cb4', title: 'Thai Kitchen', author: 'Bangkok Table', accent_color: '#2C4A3E', recipe_count: 10, created_at: '2026-03-04' },
  { id: 'cb5', title: 'Chinese Favorites', author: 'Wok & Fire', accent_color: '#6B2A2A', recipe_count: 10, created_at: '2026-03-05' },
  { id: 'cb6', title: 'Mediterranean Table', author: 'Olive & Herb', accent_color: '#2A4A6B', recipe_count: 10, created_at: '2026-03-06' },
  { id: 'cb7', title: 'Japanese Essentials', author: 'Umami Kitchen', accent_color: '#3D2A4A', recipe_count: 10, created_at: '2026-03-07' },
  { id: 'cb8', title: 'French Bistro', author: 'Maison Culinaire', accent_color: '#2A3D4A', recipe_count: 10, created_at: '2026-03-08' },
  { id: 'cb9', title: 'Middle Eastern Mezze', author: 'Souk & Spice', accent_color: '#4A3A2A', recipe_count: 10, created_at: '2026-03-09' },
  { id: 'cb10', title: 'American BBQ & Classics', author: 'Smoke & Grill', accent_color: '#3A2A1A', recipe_count: 10, created_at: '2026-03-10' },
  { id: 'cb11', title: 'Korean Home Cooking', author: 'Seoul Kitchen', accent_color: '#2A3A5A', recipe_count: 10, created_at: '2026-03-11' },
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
  { id: 'mx6', cookbook_id: 'cb3', title: 'Pork Carnitas', ingredients: [{ name: 'Pork shoulder', amount: 800, unit: 'g', category: 'PROTEIN' }, { name: 'Orange juice', amount: 150, unit: 'ml', category: 'PANTRY' }, { name: 'Cumin', amount: 2, unit: 'tsp', category: 'SPICES' }, { name: 'Garlic', amount: 4, unit: 'cloves', category: 'PRODUCE' }, { name: 'Corn tortillas', amount: 8, unit: '', category: 'PANTRY' }], steps: [{ order: 1, title: 'Season and slow cook', text: 'Rub pork with **cumin**, garlic, and salt. Place in a pot with **orange juice** and enough water to cover. Simmer on low for **90 minutes** until very tender.', timer_seconds: 5400, timer_label: 'Slow cook timer' }, { order: 2, title: 'Crisp the pork', text: 'Shred the pork. Spread on a baking tray and broil for **5 minutes** until edges crisp up.', timer_seconds: 300, timer_label: 'Crisping timer' }, { order: 3, title: 'Serve', text: 'Load into warm **tortillas** with onion, coriander, lime, and salsa.' }], base_serves: 4, tags: ['Non-Veg', 'Mexican', 'Pork'], duration_mins: 105 },
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
