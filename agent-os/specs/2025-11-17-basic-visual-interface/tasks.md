# Task List: Basic Visual Interface

This task list breaks the spec into small, actionable implementation tasks. Each task includes a short description, an estimated effort, dependencies, and acceptance criteria.

- [x] **T1 — Header & Global Layout** (Estimate: XS)
  - Create `src/components/Header.tsx` and mount it in `app/layout.tsx`.
  - Ensure header contains brand link and nav to `/outline`, `/canvas`, `/achievements`, `/settings`.
  - Acceptance: Header appears on every page and links navigate client-side.

- [x] **T2 — Outline Page & Placeholder** (Estimate: XS)
  - Add `app/outline/page.tsx` and `src/components/OutlinePlaceholder.tsx`.
  - Acceptance: `/outline` shows a nested example list (Direction → Waypoint → Step) and is responsive.

- [x] **T3 — Canvas Page & Placeholder** (Estimate: XS)
  - Add `app/canvas/page.tsx` and `src/components/CanvasPlaceholder.tsx`.
  - Acceptance: `/canvas` shows a large canvas-like placeholder area and adapts to viewport height.

- [x] **T4 — Achievements Page & Supabase Integration** (Estimate: S)
  - Add `app/achievements/page.tsx` and `src/components/AchievementsPlaceholder.tsx`.
  - Implement `src/lib/supabaseClient.ts` as a lazy factory that returns `null` when env vars are missing.
  - Acceptance: Achievements page attempts to load `achievement_log` when env vars are set; shows friendly empty state when not.

- [x] **T5 — Settings Page Placeholder** (Estimate: XS)
  - Add `app/settings/page.tsx` with a short settings placeholder explaining future work.
  - Acceptance: `/settings` renders and is reachable via header nav.

- [x] **T6 — Supabase Client Safety & Isolation** (Estimate: XS)
  - Ensure the Supabase client is not created at module import time and can be constructed at runtime.
  - Acceptance: `next build` and static prerendering do not throw when `NEXT_PUBLIC_SUPABASE_*` vars are absent.

- [x] **T7 — TypeScript & Path Aliases** (Estimate: XS)
  - Update `tsconfig.json` target to `ES2018`, add `baseUrl: '.'` and map `@/*` to `src/*`.
  - Acceptance: `npx tsc --noEmit` does not fail on path alias resolution for app code.

- [x] **T8 — Jest Path Mapping (if running tests)** (Estimate: XS, optional)
  - Confirm `jest.config.js` contains `moduleNameMapper` for `^@/(.*)$` → `<rootDir>/$1`.
  - Acceptance: Jest runs tests that import using `@/` aliases without module resolution errors.

- [x] **T9 — Sanity Checks: Typecheck & Build** (Estimate: XS)
  - Run `npx tsc --noEmit`, `npm run build`, and `npm run dev` to verify the app starts.
  - Acceptance: Build completes, dev server starts at `http://localhost:3000`, and primary routes render without errors.

- [x] **T10 — Documentation & Spec Files** (Estimate: XS)
  - Save `agent-os/specs/2025-11-17-basic-visual-interface/planning/requirements.md` and `spec.md`.
  - Acceptance: Files exist and match the approved content.

- [x] **T11 — (Optional) Seed Demo Data for Achievements** (Estimate: S)
  - Add a small local seed or migration utility to populate `achievement_log` for local demo when Supabase is available, or provide a local fallback file.
  - Acceptance: Developers can run a script to seed example achievements for UI testing.

## Task Ordering & Notes
- Start with T1 → T2 → T3 → T4 to get visible pages in place.
- T6 and T7 are cross-cutting and should be applied early to avoid build/prerender issues.
- T9 should be run after the above tasks to validate everything.

## Next Steps
- Assign tasks to a developer or create PR branches for each task.
- After T1-T5 are merged, consider adding minimal interactive prototypes (ReactFlow minimal node) for `/canvas` as a follow-up.
