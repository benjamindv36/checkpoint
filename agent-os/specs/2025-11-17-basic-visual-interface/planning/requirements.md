# Spec Requirements: basic-visual-interface

## Initial Description
Let's make the basic visual interface for the app. Currently, nothing is implemented yet for the GUI. I want to be able to open the app in my browser.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the first visual work should be a single, minimal landing view that opens in the browser and shows the app shell (header, main content area, and a placeholder for the outline or canvas). Is that correct, or do you want a multi-route skeleton (e.g., `/` + `/canvas` + `/achievements`) from the start?
**Answer:** Multi-route skeleton from the start.

**Q2:** I'm assuming we should implement the UI using the existing tech stack defaults (Next.js App Router + TypeScript + Tailwind CSS). Should we instead use plain CSS or another styling approach for the initial iteration?
**Answer:** Use the tech stack (Next.js + TypeScript + Tailwind CSS).

**Q3:** For data shown on the initial UI, I'm assuming we should use a small set of hard-coded example items (or localStorage seed) rather than wiring Supabase yet. Is that okay, or do you want Supabase stubbed in from the beginning?
**Answer:** Use Supabase from the beginning.

**Q4:** I'm thinking the minimal components to implement now are: `Header`, `OutlinePlaceholder`, and `CanvasPlaceholder` (static visuals / stub interactions). Should we also add a small `DevToolbar` (port display, reset data) to help testing, or keep it strictly minimal?
**Answer:** No dev toolbar; keep minimal components with placeholders for advanced features.

**Q5:** For developer experience, I assume `npm run dev` (or `pnpm` if you prefer) on port 3000 is the target to open the app in the browser. Is that acceptable, or do you use another dev command/port?
**Answer:** That is good (use `npm run dev` / port 3000).

**Q6:** I assume keyboard shortcuts, quick-add parsing, and ReactFlow canvas features are out of scope for this basic visual interface and will be added in follow-ups. Confirm that's out-of-scope for this initial pass, or tell me if you want any of those proto-interactions included now.
**Answer:** Save them for the next step. Just get a visual in the browser first.

**Q7:** Are there any visual or interaction constraints I should avoid (for example: no modals, no sidebar, strict focus on mobile-first layout)? If so, please list exclusions.
**Answer:** Write the UI so mobile screen size is easily handled or implementable from the start. It doesn't have to be fully functional now, but design for mobile-first and easy adjustments.

### Existing Code to Reference
No similar existing features identified for reference.

**Similar Features Identified:**
- Feature: None - Path: N/A

### Follow-up Questions
No follow-up questions at this time.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
- No mockups were provided. Implementation should follow product mission and roadmap defaults (Next.js + Tailwind + responsive-first layout).

## Requirements Summary

### Functional Requirements
- Multi-route skeleton pages: `/` (home), `/outline`, `/canvas`, `/achievements`, `/settings`.
- A shared `Header` with navigation linking to the routes.
- Minimal placeholder components for each route demonstrating layout and responsive behavior.
- Supabase client integrated and used by the achievements placeholder to read `achievement_log` if configured.

### Reusability Opportunities
- Use shared components (`Header`, placeholders) across routes.
- Centralize Supabase client in `src/lib/supabaseClient.ts` for reuse across features.

### Scope Boundaries
**In Scope:**
- Visual route skeleton and minimal components for the routes listed above.
- Supabase client integration and graceful handling when env vars or tables are not present.

**Out of Scope:**
- Keyboard quick-add parsing, ReactFlow interactive canvas, advanced interactions, and authentication flows (to be added later).

### Technical Considerations
- Use Next.js App Router and TypeScript for pages and components.
- Use Tailwind CSS for responsive styling and mobile-first design.
- Read Supabase configuration from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Achievements page will attempt a simple `.from('achievement_log').select('*')` query and fall back gracefully if there is no table or credentials are missing.
- Keep components small and client-first where interactivity is expected; server components can remain for static content.
