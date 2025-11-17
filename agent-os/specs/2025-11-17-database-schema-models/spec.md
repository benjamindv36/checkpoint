# Specification: Database Schema & Models

## Goal
Create the foundational database schema for Waypoint App's achievement tracking system, including TypeScript types and Zod validation schemas. The schema supports auto-linking by text match, flexible parent-child relationships, soft deletion for achievement history preservation, and seamless migration from localStorage (v1) to Supabase PostgreSQL (v3).

## User Stories
- As a user, I want my waypoint items stored reliably so that I never lose my progress and achievements
- As a developer, I want type-safe data access with runtime validation so that bugs are caught early and data integrity is maintained

## Specific Requirements

**Items Table with Auto-Linking Foundation**
- UUID primary key with user_id (nullable for v1, populated in v3 with Supabase Auth)
- Text field stores item content and serves as the key for auto-linking duplicates
- Type enum supporting 'direction', 'waypoint', 'step' with check constraint validation
- Parent_id for tree hierarchy with cascade delete and position for sibling ordering
- Completed boolean and completed_at timestamp to track completion state
- Points integer field allowing per-item customization with default values by type
- Soft delete via deleted_at timestamp to preserve achievement history
- Created_at and updated_at timestamps with automatic update trigger

**Auto-Linking System Architecture**
- Items with identical text values are treated as the same logical entity despite being separate database rows
- Case-insensitive text index enables fast duplicate detection on item creation
- First occurrence by created_at is designated as "canonical" instance
- Application layer shows link indicators in UI and enables navigation to canonical location
- Editing one instance does NOT auto-update others unless user explicitly chooses to sync
- Deletion prompts user to delete single instance or all instances with matching text
- Completion of one instance does not mark others complete (different tree positions)
- This creates emergent graph relationships from natural text entry patterns

**Achievements Table for Completion Logging**
- UUID primary key with user_id and item_id foreign keys
- Points_earned stored at achievement time (not referenced from items.points) to preserve history if point values change
- Achieved_at timestamp defaults to NOW() for chronological sorting
- Records created when items marked complete and deleted when items unmarked
- Soft-deleted items remain in achievement log if completed before deletion
- Compound index on user_id and achieved_at DESC for efficient achievement log queries

**Daily Points Table for Baseline Tracking**
- UUID primary key with user_id and date (DATE type) fields
- Baseline_points defaults to 10 for daily existence points
- Unique constraint on (user_id, date) ensures one baseline per user per day
- Only stores baseline - total daily points calculated on-the-fly from achievements table
- Record created automatically when user accesses app on new day

**Users Table for v3 Auth Preparation**
- UUID primary key matching future Supabase Auth user ID
- Email (unique, nullable) and display_name fields prepared for v3 authentication
- Preferences JSONB field stores flexible user settings (point values, themes, daily baseline)
- In v1: create single hardcoded local user or leave user_id null on all tables
- In v3: populate user_id when Supabase Auth integration complete

**TypeScript Type Definitions**
- Database row types mirror exact schema structure with appropriate nullable fields
- Application types extend row types with computed properties (children array, linkedInstances, isCanonical)
- Item type includes optional children for tree structure and linkedInstances for auto-link UI
- Achievement type enriched with item details (text, type, points) for display
- Export all types from centralized location (e.g., @/types/database.ts)
- Include JSDoc comments for IDE autocomplete hints

**Zod Validation Schemas**
- ItemCreateSchema validates text (1-5000 chars), type enum, optional parent_id, position, and points
- ItemUpdateSchema allows partial updates with optional fields
- AchievementCreateSchema validates item_id and points_earned
- DailyPointsSchema validates date format (YYYY-MM-DD) and baseline_points
- UserPreferencesSchema validates nested preference object with defaults
- Use .parse() method to throw errors on invalid data (not .safeParse())
- Generate TypeScript types from Zod schemas using z.infer<typeof schema>

**localStorage Implementation Strategy (v1)**
- Store data in browser localStorage using JSON serialization
- Use consistent keys: 'waypoint:items', 'waypoint:achievements', 'waypoint:daily_points', 'waypoint:user'
- Maintain same UUID structure and data types as production schema
- Keep user_id null or use hardcoded value 'local-user' throughout
- Implement same validation and business logic as future Supabase version

**Supabase Migration Strategy (v3)**
- Create migration utility that reads localStorage and inserts into Supabase
- Map local-user to authenticated user_id during migration
- Preserve all timestamps and IDs where possible for continuity
- Handle conflicts for items that exist in both localStorage and cloud
- Provide clear migration UI prompting user to import local data
- Allow users to export localStorage backup before migration
- Track migration status to prevent duplicate migrations

**Database Indexing for Performance**
- Index on items.parent_id for parent-child hierarchy queries (B-tree)
- Case-insensitive index on items.text for auto-linking detection
- Compound index on items(user_id, completed, deleted_at) for filtering views
- Compound index on items(user_id, parent_id, position) for ordered child fetching
- Index on items.created_at to find canonical instances efficiently
- Compound index on achievements(user_id, achieved_at DESC) for achievement log
- Unique compound index on daily_points(user_id, date) for daily lookups
- Performance targets: outline load <100ms (1000 items), auto-link detection <50ms

## Existing Code to Leverage

**Fresh Next.js 16 Installation**
- App Router structure already established for file-based routing
- TypeScript configuration in place with next-env.d.ts
- Tailwind CSS 4 configured for styling
- React 19 and ReactFlow already installed per tech stack requirements
- No existing database or state management code to reference (greenfield implementation)

## Out of Scope
- Supertags table and supertag system (deferred to v2 per roadmap)
- Item_connections table with explicit connection types (deferred to v2+)
- Map-related fields including coordinates, terrain data, fog state (deferred to v4)
- Missions as fourth item type (deferred to v4 per roadmap)
- User authentication implementation code (schema prepared but auth deferred to v3)
- Actual localStorage implementation code (this is schema specification only)
- Actual Supabase integration code (this is schema specification only)
- Frontend React components or UI implementation
- Canvas view data structures (deferred to v2)
- Multi-direction support in data model (deferred to v2)
- Advanced search/filtering tables (deferred to v2)
- Materialized views for performance optimization (defer until v3 if needed)
- Badges, celebrations, or achievement metadata system (defer to v3+)
