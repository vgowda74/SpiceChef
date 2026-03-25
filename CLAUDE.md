# SpiceChef — Claude Context File

## Concept
SpiceChef lets users upload any cookbook PDF they own and transforms it into a fully guided cooking experience — ingredient checklists, step-by-step cook mode, built-in timers, and auto-scaled serving quantities. It is a **tool, not a content platform**. Users bring their own content.

---

## Design System

### Colors
| Token       | Hex       | Usage                          |
|-------------|-----------|--------------------------------|
| `BG`        | `#0B1610` | Dark forest green — app background |
| `ACCENT`    | `#C8A44A` | Aged gold — CTAs, highlights   |
| `TEXT`      | `#F3ECD8` | Cream — primary text           |
| `SURFACE`   | `#162216` | Slightly lighter bg for cards  |
| `BORDER`    | `#2A3B2A` | Subtle borders / dividers      |
| `MUTED`     | `#7A8C7A` | Secondary / placeholder text   |

### Typography
- **Headings**: Cormorant Garamond (serif, loaded via `@expo-google-fonts/cormorant-garamond`)
- **Body / UI**: Plus Jakarta Sans (sans-serif, loaded via `@expo-google-fonts/plus-jakarta-sans`)

### Tone
Calm, refined, culinary-magazine. Not gamified, not fitness-app. Think *Monocle* meets *Bon Appétit*.

---

## Tech Stack
| Layer        | Choice                              |
|--------------|-------------------------------------|
| Framework    | React Native (Expo SDK 55)          |
| Navigation   | React Navigation v7 (native stack)  |
| Auth + DB    | Supabase                            |
| State        | Zustand                             |
| AI           | Claude API (PDF extraction + parsing) |
| TTS          | ElevenLabs (Phase 2)                |
| Images       | DALL-E 3 (Phase 2)                  |
| Fonts        | expo-font + @expo-google-fonts      |

---

## Folder Structure
```
src/
  screens/       # One file per screen
  components/    # Shared UI components
  lib/           # supabase.ts, claude.ts, etc.
  hooks/         # useRecipes, useSession, etc.
  store/         # Zustand stores
```

---

## Supabase Schema

### `users`
```sql
id          uuid primary key references auth.users
email       text
dietary     text[]        -- e.g. ["vegetarian", "gluten-free"]
skill_level text          -- "beginner" | "intermediate" | "advanced"
serves      int           -- default serving size preference
created_at  timestamptz default now()
```

### `cookbooks`
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references users(id)
title       text
file_url    text          -- Supabase Storage path
cover_url   text
created_at  timestamptz default now()
```

### `recipes`
```sql
id            uuid primary key default gen_random_uuid()
cookbook_id   uuid references cookbooks(id)
user_id       uuid references users(id)
title         text
ingredients   jsonb         -- [{ name, amount, unit }]
steps         jsonb         -- [{ order, text, timer_seconds? }]
base_serves   int
tags          text[]
created_at    timestamptz default now()
```

### `cook_sessions`
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references users(id)
recipe_id   uuid references recipes(id)
started_at  timestamptz default now()
completed   boolean default false
step_index  int default 0
serves      int
```

---

## Screen Map (Phase 1)
| # | Screen               | Route name          |
|---|----------------------|---------------------|
| 0 | Splash               | `Splash`            |
| 1 | Onboarding — Diet    | `OnboardingDiet`    |
| 2 | Onboarding — Skill   | `OnboardingSkill`   |
| 3 | Onboarding — Serves  | `OnboardingServes`  |
| 4 | Home Library         | `HomeLibrary`       |
| 5 | Recipe Browser       | `RecipeBrowser`     |
| 6 | Ingredient Checklist | `IngredientChecklist` |
| 7 | Cook Mode            | `CookMode`          |
| 8 | Completion           | `Completion`        |

---

## Architecture Decisions
- **Onboarding data** is stored in Zustand (`useOnboardingStore`) and flushed to Supabase `users` table on completion.
- **PDF parsing** happens server-side via a Supabase Edge Function that calls the Claude API. The raw PDF is uploaded to Storage first, then the Edge Function is invoked.
- **Serving scale** is computed client-side: `scaledAmount = (baseAmount / recipe.base_serves) * user.serves`.
- **Cook Mode** uses `react-native-reanimated` for step transitions. Timer state lives in a Zustand slice.
- **Fonts** are loaded in `App.tsx` with `useFonts` before the navigator renders (guarded by `AppLoading` / `SplashScreen`).
- All screens use `SafeAreaView` from `react-native-safe-area-context`.

---

## Environment Variables (`.env`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_CLAUDE_API_KEY=      # used in Edge Function, not client
```

---

## Current Phase
**Phase 1** — Onboarding flow complete. Next: Home Library + PDF upload.
