# Specification: Basic Visual Interface

## Goal
Provide a minimal, production-ready visual skeleton for the Waypoint App so the project can be opened in a browser and navigated across the primary views. The goal is to establish routing, layout, and simple placeholders wired to the existing tech stack and a safe Supabase client.

## User Stories
- As a new developer, I want a multi-route app shell so I can navigate to primary views and iterate on UI features.
- As a product stakeholder, I want a visible placeholder for core screens (outline, canvas, achievements) so I can validate layout and responsive behavior before implementing interactions.

## Specific Requirements

**Routes & Navigation**
- Add multi-route pages: `/`, `/outline`, `/canvas`, `/achievements`, `/settings`.
- Pages must be implemented using Next.js App Router page components.
- Navigation links exist in the shared header and work with client-side transitions.
- Routes render static placeholders (no complex interactions required).
- Pages are included in site navigation and reachable via URL.

**Header & Global Layout**
- Implement a shared `Header` component mounted in `app/layout.tsx`.
- Header includes brand link and primary route links; hide secondary links on very small screens (mobile-first) using Tailwind breakpoints.
- Main content should be rendered below the header with correct spacing and min-height to fill viewport.
- Layout must use Tailwind utility classes for spacing, color, and responsiveness.

**Outline Placeholder**
- Provide an `OutlinePlaceholder` component demonstrating hierarchical layout (Direction → Waypoint → Step).
- Include simple visual nesting and example text to show indentation and list behavior.
- Component is client-enabled and sized responsively for mobile and desktop.

**Canvas Placeholder**
- Provide a `CanvasPlaceholder` component to reserve the visual canvas area (intended for ReactFlow later).
- Placeholder shows a centered message and occupies a large vertical area (vh-based) to emulate a canvas.
- Keep container styling adaptable for later ReactFlow integration (padding, min-height, full-width).

**Achievements Placeholder & Supabase Integration**
- Add `AchievementsPlaceholder` that attempts to read from `achievement_log` via a central Supabase client.
- Supabase client must be created lazily (runtime) and return `null` when env vars are not set to prevent prerender errors.
- Achievements page should gracefully fall back to an empty state with a helpful message if no data or credentials exist.
- Keep data access logic isolated in `src/lib/supabaseClient.ts` for easy reuse and replacement.

**Responsive & Mobile-First Design**
- Use Tailwind CSS utilities and mobile-first breakpoints throughout components.
- Ensure header nav collapses or hides secondary links on small screens; main content uses full-width stacking.
- Placeholder components must demonstrate that mobile layout considerations are possible without heavy refactors.

**Tech Stack & Tooling**
- Use Next.js (App Router), React (client components where interactivity is expected), TypeScript, and Tailwind CSS.
- Centralize environment usage: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Keep Supabase client creation safe for server-side rendering and static export.

**Build & Sanity Checks**
- Ensure `npx tsc --noEmit` runs without critical type errors for the changed code (adjust `tsconfig.json` as needed).
- Ensure `next build` completes successfully and pages prerender without throwing when env vars are absent.

## Visual Design

No visual assets provided.

## Existing Code to Leverage

**`src/components/Header.tsx`**
- Provides the shared header and navigation; reuse directly for the app shell.

**`src/components/OutlinePlaceholder.tsx`**
- Simple hierarchical placeholder; use as the basis for outline view implementation.

**`src/components/CanvasPlaceholder.tsx`**
- Canvas area placeholder; reserve layout and sizing for later ReactFlow integration.

**`src/components/AchievementsPlaceholder.tsx` & `src/lib/supabaseClient.ts`**
- Achievements placeholder already references a lazy Supabase client; reuse the pattern and client factory for subsequent pages.

**`app/layout.tsx`**
- Root layout updated to include the header and main content area; follow the same approach for other global shells.

## Out of Scope
- Implementing quick-add keyboard shortcuts and markdown-style parsers.
- Adding ReactFlow interactive nodes, drag/drop, or auto-layout behavior (canvas interactivity is for follow-up tasks).
- Implementing Supabase Auth flows or user account management in this spec.
- Building production-ready persistence or complex migrations — this spec focuses on visual structure only.

## Out of Scope (continued)
- Advanced performance optimizations (virtualized lists, lazy-loaded canvas nodes) are deferred.
- Visual polish and final theming; this spec provides structure and placeholders only.
