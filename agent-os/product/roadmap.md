# Product Roadmap

## MVP v1: Core Achievement Tracking

1. [ ] Database Schema & Models — Create Supabase PostgreSQL schema for items (id, text, type, level, parent_id, completed, completed_at, points, position), achievements log table, and daily baseline points. Include TypeScript types and Zod schemas. `S`

2. [ ] Item Type System — Implement three core item types (Direction/100pts, Waypoint/25pts, Step/5pts) with type indicators, color coding (purple/bold for Direction, blue for Waypoint, default for Step), and point calculation logic. `S`

3. [ ] Nested Outline View — Build the main outline interface showing items in a hierarchical tree structure with visual parent-child relationships, indentation levels, connection indicators, and type-specific styling. Include expand/collapse for children. `M`

4. [ ] Quick Keyboard Input System — Implement quick-add dialog triggered by `/` or `Space` with markdown-style parsing (`> Text` for Direction, `- Text` for Waypoint, plain text for Step), Tab for indent/child creation, Enter for same-level items, and `→` or `>` for manual connections. `M`

5. [ ] Toggle Completion & Points — Build completion toggling for items that calculates and awards points based on type, moves completed items to achievement log with timestamp, and updates total score. Ensure items can be unmarked to remove from log. `S`

6. [ ] Achievement Log Sidebar — Create a sidebar displaying completed items chronologically with timestamps, points earned per item, automatic daily baseline (+10 points), and running total score. Include basic filtering by date. `M`

7. [ ] Manual Connection System — Implement ability to create explicit connections between items beyond parent-child relationships, with visual connection lines in outline view and validation to prevent circular references. `S`

8. [ ] Local Storage & Persistence — Set up client-side persistence using browser localStorage for MVP testing before Supabase integration. Include data migration utilities for later backend integration. `S`

## v2: Visual Canvas & Enhanced Features

9. [ ] ReactFlow Canvas View — Integrate ReactFlow library to create a node-based visual canvas where items appear as connected nodes. Include view toggle between outline and canvas, and basic node positioning. `L`

10. [ ] Canvas Auto-Layout Algorithm — Implement automatic layout algorithm for canvas view that arranges Direction, Waypoint, and Step nodes hierarchically with appropriate spacing and connection routing. Include layout refresh functionality. `M`

11. [ ] Drag-Drop Connections — Add ability to create connections by dragging from one node/item to another in canvas view, with automatic outline sync and connection validation. `M`

12. [ ] Multi-Direction Support — Extend data model and UI to support multiple Direction items simultaneously. Add Direction selector/filter in outline view and color-coding for Direction groups in canvas. `M`

13. [ ] Supertag System Foundation — Build user-defined item type system allowing users to create custom tags (responsibilities, chores, wishes, projects, interests). Items can have multiple supertags and appear on auto-generated tag collection pages. `L`

14. [ ] Supertag Collection Pages — Create dynamic pages for each supertag that auto-gather all items with that tag. Include inline editing, filtering, and ability to create new items directly on tag pages. `M`

15. [ ] Advanced Search & Filtering — Implement full-text search across all items, filter by completion status, item type, supertag, date range, and point values. Include saved filter sets. `M`

16. [ ] Export & Reporting — Add export functionality for achievement log (CSV, JSON, Markdown) and generate summary reports showing points over time, completion rates, and achievement patterns. `S`

## v3: Collaboration & Polish

17. [ ] Supabase Authentication — Integrate Supabase Auth with email/password and social providers. Include user profile management and secure row-level security policies. `S`

18. [ ] Supabase Data Migration — Migrate from localStorage to Supabase PostgreSQL with real-time subscriptions for live updates. Include data sync utilities and offline support strategy. `M`

19. [ ] User Preferences & Customization — Build preferences panel for point values, color schemes, default item types, keyboard shortcuts, and daily baseline configuration. Store preferences in user profile. `S`

20. [ ] Mobile Responsive Design — Optimize all views (outline, canvas, achievement log) for mobile devices with touch-friendly interactions and adaptive layouts. Include mobile-specific quick-add patterns. `M`

21. [ ] Performance Optimization — Implement virtualized scrolling for large item lists, lazy loading for canvas nodes, debounced search, and optimistic UI updates for better perceived performance. `S`

22. [ ] Onboarding Flow — Create first-run experience explaining the journey metaphor, demonstrating quick-add keyboard shortcuts, and guiding users to create their first Direction with waypoints. Include skippable tutorial. `M`

## v4: Interactive Map Canvas

23. [ ] Fog-of-War Map Foundation — Implement base map canvas with fog layer, user avatar at center, and basic camera controls (pan, zoom). Use Canvas API or WebGL framework (PixiJS, Three.js) for rendering. Include coordinate system for item placement. `L`

24. [ ] Procedural Terrain Generation — Build terrain generation system using Perlin noise or similar algorithm to create landscapes when fog is revealed. Include biome system for different terrain types (mountains, plains, forests, water). `L`

25. [ ] Progressive Fog Revelation — Connect Direction creation to fog-lifting mechanic. When user creates a Direction, reveal a region of map and generate a major landmark (mountain, city, lake). User can choose landmark type or accept random generation. `M`

26. [ ] Waypoint Terrain Generation — Extend fog revelation to Waypoints. When Waypoints are added between current position and Direction, reveal intermediate terrain with villages, farms, rivers, and natural features. Auto-place features based on distance and density rules. `M`

27. [ ] Step Path Rendering — Implement road/path rendering when Steps are defined between Waypoints. Use pathfinding algorithm to generate natural-looking roads that follow terrain. Include visual distinction between planned paths and completed paths. `M`

28. [ ] Avatar System — Create avatar customization UI allowing users to design their map character. Include avatar rendering on map canvas with position synced to progress. Add avatar animation for completing items. `S`

29. [ ] Map-Outline Sync — Build two-way synchronization between map canvas and outline view. Clicking items in outline highlights them on map; manipulating items on map updates outline. Include smooth camera transitions. `M`

30. [ ] Missions (Side Quests) — Introduce fourth item type for off-path achievements. Display Missions as points of interest on map that aren't on the main road network. Include distinct visual style and point value (10 points suggested). `S`

31. [ ] Map State Persistence — Store generated map data (terrain chunks, landmarks, avatar position) in database with efficient caching. Include map regeneration logic if algorithms change in future versions. `S`

## v5: Advanced Map Features

32. [ ] Multi-Direction Map Regions — Extend map to support multiple Directions as separate regions or continents. Include world map overview showing all regions and teleport/navigation between them. `M`

33. [ ] Themeable Landscapes — Allow users to set visual themes per Direction (e.g., mountain ranges for challenging goals, peaceful meadows for creative projects, urban landscapes for professional goals). Include theme presets and customization. `M`

34. [ ] Achievement Celebration Animations — Add celebratory visual effects on map when items are completed. Examples: fireworks at landmarks when Directions complete, path glowing when Steps complete, waypoint flags appearing. `S`

35. [ ] Map Export & Sharing — Enable users to export their map as image or interactive HTML. Include privacy controls and optional sharing for showing journey progress to others. `S`

> Notes
> - Order items by technical dependencies and product architecture
> - Each item represents an end-to-end (frontend + backend) functional and testable feature
> - MVP v1 focuses on core achievement tracking with local storage for fast iteration
> - v2 adds visual canvas and supertag flexibility for power users
> - v3 focuses on multi-user support, polish, and production readiness
> - v4 introduces the interactive map canvas with fog-of-war and procedural generation
> - v5 extends map with advanced features, themes, and social sharing
> - Effort scale: XS (1 day), S (2-3 days), M (1 week), L (2 weeks), XL (3+ weeks)
