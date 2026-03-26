# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Concept
SpiceChef lets users upload any cookbook PDF they own and transforms it into a fully guided cooking experience — ingredient checklists, step-by-step cook mode, built-in timers, and auto-scaled serving quantities. It is a **tool, not a content platform**. Users bring their own content.

---

## Commands

```bash
# Start the dev server (opens Expo Go QR code)
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

The app runs via Expo Go on device or simulator. There is no build step for development. TypeScript is checked by the editor only — there is no `tsc` script.

### Supabase Edge Function
The `parse-cookbook` function lives in `supabase/functions/parse-cookbook/index.ts` and runs on Deno. Deploy with:
```bash
supabase functions deploy parse-cookbook
```
Set `ANTHROPIC_API_KEY` as a Supabase secret (not a `.env` variable) — it is only accessed server-side in the Edge Function.

---

## Architecture

### Navigation
The root stack (`App.tsx`) has two logical sections:
1. **Onboarding flow** — `Splash → OnboardingDiet → OnboardingSkill → OnboardingServes`
2. **Main app** — `HomeLibrary` route renders `MainTabs` (bottom tab navigator), which contains Library, Recent, and Profile tabs. Stack screens pushed on top of tabs: `RecipeBrowser → IngredientChecklist → CookMode → Completion`.

### State Management (Zustand)
Three stores in `src/store/`:
- **`useRecipeStore`** — source of truth for `Cookbook[]` and `Recipe[]`. Currently seeded with `MOCK_COOKBOOKS` / `MOCK_RECIPES` as initial state. Real data from Supabase is merged in via `addParsedCookbook()`.
- **`useOnboardingStore`** — collects dietary restrictions, skill level, and default serves during onboarding. Not yet flushed to Supabase (auth is incomplete).
- **`useCookStore`** — tracks the active cooking session: current step index, checked ingredients, serves override. Resets on `endSession()`.

### PDF Upload & Parsing Pipeline
`src/lib/cookbookService.ts` orchestrates the full flow:
1. Upload PDF to Supabase Storage bucket `cookbooks` via `expo-file-system` → `File.bytes()`
2. Invoke `parse-cookbook` Edge Function with `{ file_path, user_id }`
3. Edge Function downloads the PDF, base64-encodes it, and sends it to Claude (`claude-sonnet-4-20250514`) as a `document` content block
4. Claude returns structured JSON matching `ParsedCookbook` — cookbook + recipes with ingredients, steps, timers, and tags
5. Edge Function saves to DB; client maps rows to `Cookbook` / `Recipe` types and calls `addParsedCookbook()`

### Theme
`src/lib/theme.ts` exports three typed const objects used everywhere:
- `Colors` — bg, surface, border, accent, text, muted
- `Fonts` — heading, headingItalic, body, bodySemiBold (font family name strings)
- `Spacing` — xs(4), sm(8), md(16), lg(24), xl(32), xxl(48)

Always import from `theme.ts` rather than using raw hex values or magic numbers.

### Design System
| Token       | Hex       | Usage                          |
|-------------|-----------|--------------------------------|
| `bg`        | `#0B1610` | Dark forest green — app background |
| `accent`    | `#C8A44A` | Aged gold — CTAs, highlights   |
| `text`      | `#F3ECD8` | Cream — primary text           |
| `surface`   | `#162216` | Cards / elevated surfaces      |
| `border`    | `#2A3B2A` | Subtle borders / dividers      |
| `muted`     | `#7A8C7A` | Secondary / placeholder text   |

**Headings**: Cormorant Garamond (`Fonts.heading` / `Fonts.headingItalic`)
**Body / UI**: Plus Jakarta Sans (`Fonts.body` / `Fonts.bodySemiBold`)

Tone: calm, refined, culinary-magazine. Not gamified, not fitness-app.

---

## Supabase Schema

The actual migration (`supabase/migrations/001_initial_schema.sql`) is the authoritative schema. Key differences from the original design: `users` table not yet created; `cookbooks` has `author` and `recipe_count` columns. RLS policies are currently permissive (`USING (true)`) pending auth implementation.

### `cookbooks`
```sql
id uuid, user_id uuid, title text, author text, file_url text, cover_url text, recipe_count int, created_at timestamptz
```

### `recipes`
```sql
id uuid, cookbook_id uuid, user_id uuid, title text,
ingredients jsonb  -- [{ name, amount, unit, category }]
steps jsonb        -- [{ order, title, text, timer_seconds?, timer_label?, needed_ingredients? }]
base_serves int, tags text[], duration_mins int, created_at timestamptz
```

### `cook_sessions`
```sql
id uuid, user_id uuid, recipe_id uuid, started_at timestamptz, completed boolean, step_index int, serves int
```

Storage bucket: `cookbooks` (private) — PDFs stored at `uploads/{timestamp}_{filename}`.

---

## Screen Map
| Route               | Screen file                     | Notes                          |
|---------------------|---------------------------------|--------------------------------|
| `Splash`            | `SplashScreen.tsx`              | Fade animation                 |
| `OnboardingDiet`    | `OnboardingDietScreen.tsx`      | Uses `OnboardingLayout`        |
| `OnboardingSkill`   | `OnboardingSkillScreen.tsx`     | Uses `OnboardingLayout`        |
| `OnboardingServes`  | `OnboardingServesScreen.tsx`    | Uses `OnboardingLayout`        |
| `HomeLibrary`       | → `MainTabs` (bottom tabs)      | Fade animation                 |
| `RecipeBrowser`     | `RecipeBrowserScreen.tsx`       | Param: `cookbookId: string`    |
| `IngredientChecklist` | `IngredientChecklistScreen.tsx` | Param: `recipeId: string`    |
| `CookMode`          | `CookModeScreen.tsx`            | Params: `recipeId`, `serves`   |
| `Completion`        | `CompletionScreen.tsx`          | Param: `recipeId: string`      |

Bottom tabs inside `MainTabs`: `HomeLibrary` (Library), `Recent`, `Profile`.

---

## Key Architecture Decisions
- **Serving scale** computed client-side: `scaledAmount = (baseAmount / recipe.base_serves) * serves`
- **Fonts** loaded in `App.tsx` with `useFonts` — renders a blank `Colors.bg` view until ready (no splash screen delay needed)
- **Auth not yet implemented** — `user_id` is passed as `null` throughout; onboarding data is not persisted to Supabase yet
- All screens use `SafeAreaView` from `react-native-safe-area-context`
- The `OnboardingLayout` component provides consistent padding and back-navigation for all onboarding screens

---

## Environment Variables (`.env`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```
`ANTHROPIC_API_KEY` is a Supabase secret, not a client env var.

---

## Current Phase
**Phase 1 complete** — full onboarding flow, home library with mock data, PDF upload + Claude parsing pipeline, recipe browser, ingredient checklist, cook mode with per-step timers, and completion screen.

**Next:** Wire up real auth (Supabase Auth), flush onboarding data to `users` table, replace mock cookbook seed data with Supabase-fetched data.
