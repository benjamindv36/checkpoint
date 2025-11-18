# Spec Requirements: basic-visual-interface

## Initial Description
Let's make the basic visual interface for the app. Currently, nothing is implemented yet for the GUI. I want to be able to open the app in my browser.

## Requirements Discussion

### First Round Questions

**Q1:** I assume "basic visual interface" means starting with the nested outline view (the outliner) described in the roadmap (expand/collapse, indentation, parent-child relationships, type styling). Is that correct, or do you want the ReactFlow canvas view (node-based canvas) to be implemented first?
**Answer:** You indicated the canvas is the main feature but the outliner is more primal; you want a recommended order. (See Requirements Summary for the chosen order.)

**Q2:** I'm assuming we should include the quick keyboard input system for MVP (open quick-add with `/` or `Space`, markdown-style parsing: `> Text` = Direction, `- Text` = Waypoint, plain text = Step, Tab/Enter/→ behaviors). Is that correct, or should we begin with a simpler click-based add/edit UI for the first iteration?
**Answer:** Add the keyboard features.

**Q3:** For persistence in MVP, I'm assuming we should use browser `localStorage` (per tech-stack/roadmap) and include migration utilities for later Supabase migration. Is that correct, or do you want us to wire a minimal Supabase client now?
**Answer:** Use local storage for now.

**Q4:** I'm assuming we should implement the type/color conventions from the roadmap: Direction = purple/bold (100 pts), Waypoint = blue (25 pts), Step = default (5 pts). Should we also enforce accessible contrast and keyboard-only focus styles now (recommended), or leave visual accessibility polishing for a follow-up?
**Answer:** Do what is recommended (i.e., include accessibility considerations now).

**Q5:** I'm assuming the outliner should support manual connections (simple connection lines/indicators and circular-reference prevention) but that full visual connection drawing will wait for v2 canvas features. Is that correct, or should we implement drag-drop connection UI in this spec?
**Answer:** You clarified the outliner is not visual and does not have connection lines — it is just bullet points. Confirmed.

**Q6:** Confirmed scope exclusions: authentication, Supabase sync, and advanced features (ReactFlow auto-layout, procedural map generation) are out of scope for this spec. Anything else to exclude?
**Answer:** Confirmed.

### Existing Code to Reference
Based on the repository contents and common similarities, the following files/components are good starting points for reuse and reference.

**Similar Features Identified:**
- Feature: Outliner page - Path: `app/outline/page.tsx`
- Component: Outline placeholder - Path: `src/components/OutlinePlaceholder.tsx`
- Component: Header/navigation - Path: `src/components/Header.tsx`
- Data utilities: Achievements/data helpers - Path: `src/lib/data/achievements.ts`

Components to potentially reuse:
- `Header` for consistent page chrome and keyboard shortcut affordances
- `OutlinePlaceholder` as a layout reference for where the outliner will render

Backend logic to reference:
- `src/lib/data/achievements.ts` for achievement log interactions (read-only reference for now)

If the above paths are incomplete or you want other files referenced, provide their paths and I'll include them for the spec-writer.

### Follow-up Questions
No follow-up questions required at this time based on your answers.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
- No visuals were supplied; proceed using low-fidelity, accessible defaults and the product style guidance in `agent-os/product/tech-stack.md`.

## Requirements Summary

### Functional Requirements
- Build the Outliner (nested bullet list) as the initial UI for the waypoint data model.
- Support nesting (parent/child), expand/collapse, and indentation handling.
- Implement quick keyboard input for fast entry: open quick-add with `/` or `Space`, parse `> Text` as Direction, `- Text` as Waypoint, plain text as Step.
- Support `Tab` to indent/create child, `Enter` for new item at same level, and typing `>` or `→` at the end reserved for future manual-connection syntax (no visual lines in outliner V1).
- Implement completion toggle that awards points locally and moves completed items to the achievement log (local-only storage for MVP).
- Persist state in `localStorage` with migration utilities prepared for future Supabase migration.
- Apply visual conventions from roadmap: Direction (purple/bold – 100 pts), Waypoint (blue – 25 pts), Step (default – 5 pts).
- Include accessible contrast and keyboard-focus styles (implemented as recommended defaults).

### Reusability Opportunities
- Reuse `Header` and global layout components for consistent keyboard shortcut display and focus handling.
- Reuse `OutlinePlaceholder` layout and patterns for initial rendering and loading states.
- Reuse existing data helper patterns from `src/lib/data/achievements.ts` for achievement log behaviors.

### Scope Boundaries
**In Scope:**
- Outliner UI (nested bullet list) with keyboard-driven quick-add and local persistence
- Basic completion toggling and local achievement log
- Accessibility defaults (contrast, focus states)

**Out of Scope:**
- Visual node-based canvas (ReactFlow) and drag-drop connection interactions (v2)
- Supabase authentication and server-side persistence (v3+)
- Procedural map generation, fog-of-war, avatar, and map features (v4+)

### Technical Considerations
- Integration points: `app/outline/page.tsx` will host the outliner component; export a small API for reading/writing items to `localStorage`.
- Data model should follow roadmap item shape (id, text, type, level, parent_id, completed, completed_at, points, position) to ease future migration.
- Use Zod schemas (as in tech-stack) for local validation where practical.
- Keyboard handling must be robust: avoid interfering with browser shortcuts; provide visible help in UI (e.g., `?` or `Keyboard Shortcuts` tooltip).

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
