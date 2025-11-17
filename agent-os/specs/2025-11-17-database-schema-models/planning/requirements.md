# Spec Requirements: Database Schema & Models

## Initial Description

Create the foundational database schema for the Waypoint App's achievement tracking system. This includes designing tables for items (Directions, Waypoints, Steps), achievements log, daily baseline points, and user data. The schema must support auto-linking by text match (where identical text = same entity), flexible parent-child relationships for the outline view, soft deletion to preserve achievement history, and an easy migration path from localStorage (v1) to Supabase PostgreSQL (v3).

The schema should include TypeScript types and Zod validation schemas that align with the database structure, enabling type-safe data access throughout the application.

## Requirements Discussion

### First Round Questions

**Q1: Auto-linking approach - Should items with identical text be automatically treated as the same entity (auto-linking), or should users manually create connections between separate items that happen to have the same text?**

**Answer:** Use AUTO-LINKING by text match. If a user types text that matches an existing item, it automatically references that same underlying entity. No manual linking syntax needed. Items appear multiple times in the outline but are the same underlying entity. Hover reveals it's linked; click navigates to canonical location. Similar to Tana's system.

**Q2: Achievement logging - Should completed items be stored in a separate achievements table with timestamps, or should we add a completed_at field to the items table and query completed items from there?**

**Answer:** Separate `achievements` table. This provides better flexibility and enables future features like badges, celebrations, and detailed achievement analytics without bloating the items table.

**Q3: Daily baseline points (+10/day) - Should these be pre-computed and stored in the daily_points table, or calculated on-the-fly from date ranges?**

**Answer:** Baseline only (+10). Calculate totals on-the-fly. Don't aggregate in daily_points table - just store the baseline. This keeps the data model simple and makes it easier to recalculate totals if point values change.

**Q4: User data - Should we create a users table now even though v1 uses localStorage, or add it later when implementing authentication in v3?**

**Answer:** Create it now with nullable `user_id` on all tables. In v1, leave null or use hardcoded local user. When v3 adds Supabase Auth, just populate the field. This enables easier migration and avoids schema breaking changes later.

**Q5: Item connections - Should we create an explicit item_connections table with connection types (sequential, parallel, prerequisite), or keep it simple for v1?**

**Answer:** Defer explicit connection_type system for now. Focus on text-based auto-linking for v1. Future versions can add `item_connections` table with connection types (sequential, parallel, prerequisite) if needed.

**Q6: Supertags - Should we include supertag tables in this schema spec, or defer to v2 when the supertag system is actually built?**

**Answer:** Defer to v2 (not in this spec). Keep the initial schema focused on core item tracking and achievement logging.

**Q7: Soft delete - Should deleted items be permanently removed or soft-deleted (with a deleted_at timestamp) to preserve achievement history?**

**Answer:** Implement soft delete with `deleted_at` timestamp. This preserves achievement history and allows users to see what they accomplished even if they later deleted an item. Include cleanup mechanism (trash system that auto-empties, or manual empty trash feature).

**Q8: Point value customization - Should point values be hardcoded based on item type (Direction=100, Waypoint=25, Step=5) or should we allow per-item customization?**

**Answer:** Store point value directly in items table. Default based on type (Direction=100, Waypoint=25, Step=5), but allow per-item customization. This enables flexibility for users who want to weight certain achievements differently.

**Q9: Database indexing - Should we include index specifications for common queries (parent_id lookups, completion status filtering, etc.)?**

**Answer:** Yes, include database indexes in specification for common queries: parent_id, completion status, position, date ranges. This ensures good performance from the start.

**Q10: Scope boundaries - What should be explicitly out of scope for this database schema spec?**

**Answer:** Keep it minimal for v1. Focus on core items, achievements, and daily points tables. Defer supertags, advanced connection types, and map-related fields (coordinates, terrain data) to future versions.

### Existing Code to Reference

**Similar Features Identified:**
None - this is the first feature being built for the Waypoint App. The codebase is a fresh Next.js installation.

### Follow-up Questions

No follow-up questions were needed. The user provided clear, detailed answers to all initial questions.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - No visual files were provided for this specification. The database schema is being designed based on functional requirements and product context.

## Requirements Summary

### Core Database Schema Requirements

#### 1. Items Table
The central table for all waypoint items (Directions, Waypoints, Steps).

**Required Fields:**
- `id` (UUID, primary key) - Unique identifier for the item
- `user_id` (UUID, nullable, foreign key to users.id) - Owner of the item (null in v1, populated in v3)
- `text` (TEXT, required) - The content of the item (used for auto-linking)
- `type` (ENUM or TEXT, required) - Item type: 'direction', 'waypoint', 'step'
- `parent_id` (UUID, nullable, foreign key to items.id) - Parent item for outline hierarchy
- `position` (INTEGER, required) - Sort order among siblings
- `completed` (BOOLEAN, default false) - Completion status
- `completed_at` (TIMESTAMP, nullable) - When the item was completed
- `points` (INTEGER, required) - Point value for this specific item (default based on type)
- `deleted_at` (TIMESTAMP, nullable) - Soft delete timestamp
- `created_at` (TIMESTAMP, default NOW()) - Creation timestamp
- `updated_at` (TIMESTAMP, default NOW()) - Last update timestamp

**Critical Feature: Auto-Linking by Text Match**
- Items with identical `text` values are treated as the same logical entity
- The database stores them as separate rows, but the application treats them as linked
- First occurrence (by created_at) is the "canonical" instance
- Application logic handles:
  - Detecting duplicates on insert
  - Showing link indicators in UI
  - Navigation to canonical location
  - Updates to one instance should NOT auto-update others (user controls when to sync)
  - Deletion of one instance shows as "also appears in N other locations"

**Constraints:**
- Check constraint: `type IN ('direction', 'waypoint', 'step')`
- Check constraint: `points >= 0`
- Check constraint: `position >= 0`
- Foreign key: `parent_id` references `items.id` with ON DELETE CASCADE
- Foreign key: `user_id` references `users.id` with ON DELETE CASCADE

**Indexes:**
- Primary key index on `id`
- Index on `user_id` for user-specific queries
- Index on `parent_id` for parent-child hierarchy queries
- Index on `text` for auto-linking duplicate detection (case-insensitive)
- Compound index on `(user_id, completed, deleted_at)` for filtering completed/active items
- Index on `position` for ordering siblings
- Index on `created_at` for finding canonical instances
- Index on `deleted_at` for filtering soft-deleted items

#### 2. Achievements Table
Records completion events for the achievement log.

**Required Fields:**
- `id` (UUID, primary key) - Unique identifier for the achievement
- `user_id` (UUID, nullable, foreign key to users.id) - User who earned the achievement (null in v1)
- `item_id` (UUID, foreign key to items.id) - The item that was completed
- `points_earned` (INTEGER, required) - Points awarded for this achievement (stored at completion time)
- `achieved_at` (TIMESTAMP, default NOW()) - When the achievement was earned
- `created_at` (TIMESTAMP, default NOW()) - Record creation timestamp

**Key Behaviors:**
- Records are created when an item is marked complete
- Records are deleted when an item is unmarked (achievement removed)
- Soft-deleted items remain in achievement log if completed before deletion
- Store `points_earned` at achievement time (not reference item.points) to preserve history if point values change

**Constraints:**
- Foreign key: `item_id` references `items.id` with ON DELETE CASCADE
- Foreign key: `user_id` references `users.id` with ON DELETE CASCADE
- Check constraint: `points_earned >= 0`

**Indexes:**
- Primary key index on `id`
- Index on `user_id` for user-specific achievement queries
- Index on `item_id` for looking up achievements for specific items
- Index on `achieved_at` for chronological sorting and date range queries
- Compound index on `(user_id, achieved_at DESC)` for user's achievement log

#### 3. Daily Points Table
Tracks baseline points awarded for existing each day.

**Required Fields:**
- `id` (UUID, primary key) - Unique identifier
- `user_id` (UUID, nullable, foreign key to users.id) - User receiving baseline points (null in v1)
- `date` (DATE, required) - The date for this baseline entry
- `baseline_points` (INTEGER, default 10) - Baseline points for existing (typically +10)
- `created_at` (TIMESTAMP, default NOW()) - Record creation timestamp

**Key Behaviors:**
- One record per user per day
- Created automatically when user accesses app on a new day
- Only stores baseline (+10) - item completion points are calculated from achievements table
- Total daily points = baseline_points + SUM(achievements.points_earned WHERE DATE(achieved_at) = date)

**Constraints:**
- Unique constraint on `(user_id, date)` - one baseline per user per day
- Foreign key: `user_id` references `users.id` with ON DELETE CASCADE
- Check constraint: `baseline_points >= 0`

**Indexes:**
- Primary key index on `id`
- Unique index on `(user_id, date)`
- Index on `date` for date range queries

#### 4. Users Table
User accounts and profiles (prepared for v3 auth integration).

**Required Fields:**
- `id` (UUID, primary key) - Unique identifier (will match Supabase Auth user ID in v3)
- `email` (TEXT, unique, nullable) - User email (null in v1, populated in v3)
- `display_name` (TEXT, nullable) - User's display name
- `preferences` (JSONB, default '{}') - User preferences (point values, color schemes, etc.)
- `created_at` (TIMESTAMP, default NOW()) - Account creation timestamp
- `updated_at` (TIMESTAMP, default NOW()) - Last update timestamp

**Key Behaviors:**
- In v1: Create a single hardcoded local user or leave user_id null on all tables
- In v3: Integrate with Supabase Auth, populate user_id on items/achievements/daily_points
- Preferences stored as flexible JSONB for easy extension

**Constraints:**
- Unique constraint on `email` (when not null)

**Indexes:**
- Primary key index on `id`
- Unique index on `email` (partial index where email IS NOT NULL)

### Auto-Linking System Architecture

This is a CRITICAL architectural decision that shapes how the entire application works.

**Core Concept:**
Items with identical text are treated as the same logical entity, even though they exist as separate database rows. This creates an implicit graph structure on top of the explicit tree hierarchy.

**Implementation Strategy:**

1. **Detection Logic:**
   - On item creation/update, query for existing items with matching text (case-insensitive)
   - Use indexed query: `SELECT id, text, created_at FROM items WHERE LOWER(text) = LOWER($1) AND deleted_at IS NULL ORDER BY created_at ASC`
   - First result (earliest created_at) is the "canonical" instance
   - All other matches are "linked instances"

2. **UI Indicators:**
   - Items that match existing text show a link icon/indicator
   - Hover shows tooltip: "This appears in N locations" with preview of other contexts
   - Clicking the link indicator navigates to canonical location
   - Canonical instance shows "Referenced in N locations" indicator

3. **Update Behavior:**
   - User explicitly controls when to sync changes across linked instances
   - Editing one instance does NOT auto-update others
   - UI can offer "Update all instances" action when editing linked items
   - This preserves user intention (sometimes same text has different meaning in different contexts)

4. **Deletion Behavior:**
   - Deleting one instance (soft delete) leaves others intact
   - Before delete, show warning: "This item also appears in N other locations. Delete all instances or just this one?"
   - User chooses: delete this instance only, or delete all instances with same text

5. **Completion Behavior:**
   - Completing one instance marks it complete
   - Other instances remain incomplete (they represent different positions in the tree)
   - Achievement log records the specific item_id that was completed
   - UI can show "You completed this in another context" indicator on linked instances

6. **Graph View (v2+):**
   - Outline view shows tree structure (parent-child via parent_id)
   - Canvas view reveals graph structure (auto-linking creates edges between linked nodes)
   - Auto-link connections visualized differently from explicit parent-child connections

**Why This Matters:**
- Enables powerful reuse without forced structure
- Users naturally think "I need to do X" and type it - app recognizes it's already tracked
- Creates emergent graph relationships from natural text entry
- Supports both top-down planning (hierarchical outline) and bottom-up emergence (linked instances)

### TypeScript & Zod Requirements

**TypeScript Type Definitions:**
Create comprehensive TypeScript types that mirror the database schema:

```typescript
// Database row types (what comes from Supabase)
type ItemRow = {
  id: string;
  user_id: string | null;
  text: string;
  type: 'direction' | 'waypoint' | 'step';
  parent_id: string | null;
  position: number;
  completed: boolean;
  completed_at: string | null;
  points: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

type AchievementRow = {
  id: string;
  user_id: string | null;
  item_id: string;
  points_earned: number;
  achieved_at: string;
  created_at: string;
};

type DailyPointsRow = {
  id: string;
  user_id: string | null;
  date: string;
  baseline_points: number;
  created_at: string;
};

type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
};

// Application types (enriched with computed properties)
type Item = ItemRow & {
  children?: Item[];
  linkedInstances?: { id: string; parent_text: string }[];
  isCanonical?: boolean;
};

type Achievement = AchievementRow & {
  item: Pick<ItemRow, 'text' | 'type' | 'points'>;
};
```

**Zod Validation Schemas:**
Create Zod schemas for runtime validation of user inputs and API responses:

```typescript
// Schema for creating/updating items
const itemCreateSchema = z.object({
  text: z.string().min(1).max(5000),
  type: z.enum(['direction', 'waypoint', 'step']),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.number().int().min(0).optional(),
  points: z.number().int().min(0).optional(), // Optional, defaults based on type
});

const itemUpdateSchema = z.object({
  text: z.string().min(1).max(5000).optional(),
  type: z.enum(['direction', 'waypoint', 'step']).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  position: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
  points: z.number().int().min(0).optional(),
});

// Schema for achievement creation (mostly automatic)
const achievementCreateSchema = z.object({
  item_id: z.string().uuid(),
  points_earned: z.number().int().min(0),
});

// Schema for daily points
const dailyPointsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  baseline_points: z.number().int().min(0).default(10),
});

// Schema for user preferences
const userPreferencesSchema = z.object({
  defaultPointValues: z.object({
    direction: z.number().int().min(0).default(100),
    waypoint: z.number().int().min(0).default(25),
    step: z.number().int().min(0).default(5),
  }).optional(),
  theme: z.enum(['light', 'dark', 'auto']).default('auto').optional(),
  dailyBaseline: z.number().int().min(0).default(10).optional(),
}).optional();
```

**Key Requirements:**
- All Zod schemas must validate inputs before database operations
- TypeScript types must be exported from a central location (e.g., `@/types/database.ts`)
- Use Zod's `.parse()` for validation, not `.safeParse()`, to throw errors on invalid data
- Generate TypeScript types from Zod schemas where possible using `z.infer<typeof schema>`
- Include JSDoc comments on types for IDE autocomplete hints

### Migration Strategy: localStorage → Supabase

**Phase 1 (v1): localStorage Implementation**
- Store all data in browser localStorage
- Use same data structure as database schema (JSON objects)
- Implement same IDs (UUIDs) for consistency
- Keep user_id null or use hardcoded value ('local-user')

**localStorage Keys:**
```typescript
'waypoint:items' // Array<ItemRow>
'waypoint:achievements' // Array<AchievementRow>
'waypoint:daily_points' // Array<DailyPointsRow>
'waypoint:user' // UserRow
```

**Phase 2 (v3): Supabase Migration**
- Create migration utility that reads localStorage and inserts into Supabase
- Map local-user to authenticated user_id
- Preserve all timestamps and IDs where possible
- Handle conflicts (e.g., items created in localStorage that now exist in cloud)
- Provide migration UI: "Import local data to your account?"

**Migration Utility Requirements:**
```typescript
// Migration function signature
async function migrateLocalStorageToSupabase(userId: string): Promise<{
  itemsMigrated: number;
  achievementsMigrated: number;
  dailyPointsMigrated: number;
  errors: string[];
}>;
```

**Key Considerations:**
- Don't break localStorage in v1 when adding Supabase in v3
- Provide clear migration path and user communication
- Handle edge cases: duplicate items, orphaned achievements, date mismatches
- Allow users to export localStorage backup before migration

### Indexing & Performance Strategy

**Critical Query Patterns:**
1. Fetch all top-level items for outline view: `WHERE parent_id IS NULL AND deleted_at IS NULL`
2. Fetch children of a parent: `WHERE parent_id = $1 AND deleted_at IS NULL ORDER BY position`
3. Detect auto-linking duplicates: `WHERE LOWER(text) = LOWER($1) AND deleted_at IS NULL`
4. Fetch user's achievement log: `WHERE user_id = $1 ORDER BY achieved_at DESC`
5. Calculate daily totals: `WHERE user_id = $1 AND DATE(achieved_at) = $2`
6. Find canonical instance: `WHERE text = $1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`

**Required Indexes:**
- `items.parent_id` (B-tree) - For hierarchy queries
- `items.text` (B-tree, case-insensitive) - For auto-linking detection
- `items.(user_id, deleted_at, completed)` (Compound) - For filtering views
- `items.(user_id, parent_id, position)` (Compound) - For ordered child fetching
- `achievements.(user_id, achieved_at DESC)` (Compound) - For achievement log
- `daily_points.(user_id, date)` (Unique compound) - For daily lookups

**Performance Targets:**
- Outline view load: < 100ms for 1000 items
- Auto-link detection: < 50ms per item creation
- Achievement log fetch: < 100ms for 1 year of data
- Daily points calculation: < 50ms

**Optimization Notes:**
- Use database-level text matching for auto-linking (not application-level)
- Consider materialized view for achievement totals if queries become slow (defer to v3+)
- Implement pagination for achievement log if user has > 1000 achievements
- Use Supabase real-time subscriptions for live updates (v3+)

### Scope Boundaries

**In Scope for This Specification:**
- Items table with full field definitions and constraints
- Achievements table for completion logging
- Daily points table for baseline tracking
- Users table with nullable user_id for future auth
- Auto-linking system architecture and implementation strategy
- TypeScript types and Zod schemas for all tables
- Database indexes for common queries
- Migration strategy from localStorage to Supabase
- Soft delete implementation with deleted_at timestamps
- Per-item point value customization

**Explicitly Out of Scope:**
- Supertags table and supertag system (deferred to v2)
- Item connections table with explicit connection types (deferred to v2+)
- Map-related fields (coordinates, terrain data, fog state) (deferred to v4+)
- Missions as a fourth item type (deferred to v4+)
- User authentication implementation (deferred to v3, but schema prepared)
- Actual localStorage implementation code (this is schema spec only)
- Actual Supabase integration code (this is schema spec only)
- Frontend components or UI implementation
- Canvas view data structures (deferred to v2)
- Multi-direction support (deferred to v2)
- Advanced search/filtering tables (deferred to v2)

**Future Schema Additions (Not Now):**
- `supertags` table (v2)
- `item_supertags` junction table (v2)
- `item_connections` table with connection_type (v2+)
- `map_state` table for terrain/fog data (v4)
- `missions` table or type (v4)
- `achievements_metadata` for badges/celebrations (v3+)

### Technical Considerations

**Database Choice:**
- PostgreSQL via Supabase for production (v3+)
- SQLite or localStorage for local-first v1
- Schema must work in both environments

**Data Integrity:**
- Foreign key constraints ensure referential integrity
- Check constraints validate data ranges
- Unique constraints prevent duplicate daily point entries
- Soft delete preserves achievement history

**Scalability Concerns:**
- Text-based auto-linking could become slow with thousands of items
  - Mitigation: Indexed LOWER(text) queries, consider full-text search indexes later
- Achievement log could grow very large
  - Mitigation: Pagination, archiving strategies for v3+
- Real-time sync across devices in v3
  - Mitigation: Supabase real-time subscriptions, optimistic updates

**Security (v3+):**
- Row-Level Security (RLS) policies in Supabase:
  - Users can only see/modify their own items
  - Users can only see their own achievements
  - Users can only see their own daily points
- User preferences stored securely in users.preferences JSONB

**Trade-offs & Decisions:**
1. **Separate achievements table vs completed_at in items:**
   - Chose separate table for flexibility and future features
   - Trade-off: More complex queries, but cleaner data model

2. **Store points in items table vs always calculate from type:**
   - Chose to store per-item points for customization
   - Trade-off: Slight data duplication, but enables flexibility

3. **Auto-linking by text vs explicit connections:**
   - Chose auto-linking for v1, explicit connections for v2+
   - Trade-off: Less precise control, but much easier UX

4. **Soft delete vs hard delete:**
   - Chose soft delete to preserve achievement history
   - Trade-off: More complex queries (always filter deleted_at), but safer

5. **Nullable user_id now vs add later:**
   - Chose to add now with nullable constraint
   - Trade-off: Extra field in v1, but easier migration to v3

### Database Schema SQL

**Create Tables Statement (PostgreSQL):**
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  display_name TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('direction', 'waypoint', 'step')),
  parent_id UUID REFERENCES items(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  points INTEGER NOT NULL CHECK (points >= 0),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL CHECK (points_earned >= 0),
  achieved_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily points table
CREATE TABLE daily_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  baseline_points INTEGER DEFAULT 10 CHECK (baseline_points >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for items table
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_parent_id ON items(parent_id);
CREATE INDEX idx_items_text_lower ON items(LOWER(text));
CREATE INDEX idx_items_user_completed_deleted ON items(user_id, completed, deleted_at);
CREATE INDEX idx_items_user_parent_position ON items(user_id, parent_id, position);
CREATE INDEX idx_items_created_at ON items(created_at);
CREATE INDEX idx_items_deleted_at ON items(deleted_at) WHERE deleted_at IS NOT NULL;

-- Indexes for achievements table
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_item_id ON achievements(item_id);
CREATE INDEX idx_achievements_achieved_at ON achievements(achieved_at);
CREATE INDEX idx_achievements_user_achieved_desc ON achievements(user_id, achieved_at DESC);

-- Indexes for daily_points table
CREATE INDEX idx_daily_points_user_date ON daily_points(user_id, date);
CREATE INDEX idx_daily_points_date ON daily_points(date);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to items
CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to users
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### Validation Rules Summary

**Items Table:**
- text: Required, 1-5000 characters
- type: Required, must be 'direction', 'waypoint', or 'step'
- parent_id: Optional, must reference existing item
- position: Required, non-negative integer
- points: Required, non-negative integer
- completed: Boolean, defaults to false
- completed_at: Timestamp, set when completed becomes true
- deleted_at: Timestamp, set when soft-deleting

**Achievements Table:**
- item_id: Required, must reference existing item
- points_earned: Required, non-negative integer, copied from item at achievement time
- achieved_at: Timestamp, defaults to NOW()

**Daily Points Table:**
- date: Required, DATE format (YYYY-MM-DD)
- baseline_points: Integer, defaults to 10, non-negative
- Unique constraint: One entry per user per date

**Users Table:**
- email: Optional (null in v1), must be unique when provided
- display_name: Optional string
- preferences: JSONB object with flexible schema

### Default Point Values

**By Item Type:**
- Direction: 100 points
- Waypoint: 25 points
- Step: 5 points
- Daily baseline: 10 points

**Customization:**
- Users can override default points per-item via `items.points` field
- Users can set their preferred defaults in `users.preferences.defaultPointValues`
- Points are stored in achievement at completion time to preserve history

## Additional Notes

**Critical Success Factors:**
1. Auto-linking system must be fast and reliable - this is core to the UX
2. Schema must support easy migration from localStorage to Supabase
3. Soft delete must preserve achievement history without complicating queries too much
4. Indexes must be comprehensive to avoid performance issues as data grows

**Implementation Order:**
1. Create database schema with all tables and indexes
2. Write TypeScript types mirroring the schema
3. Write Zod schemas for validation
4. Implement auto-linking detection query
5. Test auto-linking performance with large datasets
6. Create localStorage wrapper with same interface
7. Plan migration utility architecture

**Testing Considerations:**
- Test auto-linking with thousands of items to ensure performance
- Test soft delete doesn't break foreign key relationships
- Test achievement log with years of data
- Test migration from localStorage with various edge cases
- Test concurrent updates in multi-tab scenarios (v3)

**Documentation Needs:**
- Document auto-linking behavior clearly for future developers
- Document migration process from localStorage to Supabase
- Document indexing strategy and when to add new indexes
- Document Zod schema usage patterns throughout the app
