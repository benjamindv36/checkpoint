# Task Breakdown: Database Schema & Models

## Overview
Total Tasks: 7 task groups with approximately 35 sub-tasks

This tasks list breaks down the implementation of the foundational database schema for Waypoint App's achievement tracking system. The implementation focuses on creating type-safe data structures with auto-linking capabilities, localStorage implementation for v1, and preparation for future Supabase migration.

## Task List

### Database Schema Design

#### Task Group 1: Core Database Schema Definition
**Dependencies:** None

- [x] 1.0 Complete database schema definition
  - [x] 1.1 Write 2-8 focused tests for schema validation
    - Limit to 2-8 highly focused tests maximum
    - Test only critical schema constraints (e.g., foreign key cascades, check constraints, unique constraints)
    - Skip exhaustive coverage of all field combinations
  - [x] 1.2 Create SQL migration file for PostgreSQL schema
    - Create `supabase/migrations/001_initial_schema.sql` with complete schema
    - Include UUID extension enablement
    - Define users table with preferences JSONB field
    - Define items table with all fields per spec (id, user_id, text, type, parent_id, position, completed, completed_at, points, deleted_at, created_at, updated_at)
    - Define achievements table for completion logging
    - Define daily_points table for baseline tracking
    - Add check constraints for type enum ('direction', 'waypoint', 'step')
    - Add check constraints for non-negative integers (points, position, baseline_points, points_earned)
    - Add foreign key constraints with ON DELETE CASCADE behavior
    - Add unique constraint on daily_points(user_id, date)
    - Reference: Requirements lines 516-607 for complete SQL
  - [x] 1.3 Create database indexes for performance
    - Add index on items.user_id for user-specific queries
    - Add index on items.parent_id for hierarchy queries
    - Add case-insensitive index on items.text using LOWER(text) for auto-linking
    - Add compound index on items(user_id, completed, deleted_at) for filtering
    - Add compound index on items(user_id, parent_id, position) for ordered children
    - Add index on items.created_at for finding canonical instances
    - Add partial index on items.deleted_at WHERE deleted_at IS NOT NULL
    - Add compound index on achievements(user_id, achieved_at DESC) for achievement log
    - Add indexes on achievements.item_id and achievements.user_id
    - Add unique compound index on daily_points(user_id, date)
    - Add partial index on users.email WHERE email IS NOT NULL
    - Reference: Requirements lines 109-118, 145-147, 169-173, 194-196, 567-587
  - [x] 1.4 Create database triggers
    - Create update_updated_at_column() trigger function in PostgreSQL
    - Apply trigger to items table for automatic updated_at timestamp
    - Apply trigger to users table for automatic updated_at timestamp
    - Reference: Requirements lines 588-607
  - [x] 1.5 Ensure schema validation tests pass
    - Run ONLY the 2-8 tests written in 1.1
    - Verify all constraints enforce correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 1.1 pass
- SQL migration creates all tables with correct fields and types
- All indexes are created successfully
- Foreign key cascades work correctly
- Check constraints enforce valid data
- Triggers update timestamps automatically

### TypeScript Type System

#### Task Group 2: TypeScript Type Definitions
**Dependencies:** Task Group 1

- [x] 2.0 Complete TypeScript type definitions
  - [x] 2.1 Write 2-8 focused tests for type validation
    - Limit to 2-8 highly focused tests maximum
    - Test only critical type operations (e.g., type inference, nullable handling, computed properties)
    - Skip exhaustive testing of all type combinations
  - [x] 2.2 Create database row types file
    - Create `src/types/database.ts` for centralized type exports
    - Define ItemRow type matching items table schema
    - Define AchievementRow type matching achievements table schema
    - Define DailyPointsRow type matching daily_points table schema
    - Define UserRow type matching users table schema
    - Use string type for UUIDs and timestamps (as returned from database)
    - Mark nullable fields with `| null` type union
    - Use strict enum types for item type: 'direction' | 'waypoint' | 'step'
    - Reference: Requirements lines 252-292 for type structure
  - [x] 2.3 Create application-level enriched types
    - Define Item type extending ItemRow with computed properties
    - Add optional children array to Item for tree structure
    - Add optional linkedInstances array for auto-linking UI
    - Add optional isCanonical boolean flag for canonical instance detection
    - Define Achievement type extending AchievementRow with item details
    - Include item text, type, and points in Achievement type for display
    - Reference: Requirements lines 294-303 for enriched types
  - [x] 2.4 Add JSDoc comments to all types
    - Add description comments to each type explaining its purpose
    - Document nullable fields and why they're nullable (e.g., user_id null in v1)
    - Document computed properties and how they're populated
    - Provide examples in JSDoc for complex types
  - [x] 2.5 Export all types from central location
    - Export all row types from `@/types/database.ts`
    - Export all enriched application types
    - Ensure types are importable throughout the application
  - [x] 2.6 Ensure type definition tests pass
    - Run ONLY the 2-8 tests written in 2.1
    - Verify type inference works correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 2.1 pass
- All database tables have corresponding TypeScript types
- Types accurately reflect nullable and required fields
- Application types include computed properties
- JSDoc comments provide clear documentation
- Types are properly exported and importable

### Zod Validation Schemas

#### Task Group 3: Runtime Validation with Zod
**Dependencies:** Task Group 2

- [ ] 3.0 Complete Zod validation schemas
  - [ ] 3.1 Write 2-8 focused tests for Zod validation
    - Limit to 2-8 highly focused tests maximum
    - Test only critical validation scenarios (e.g., required fields, enum validation, numeric ranges)
    - Skip exhaustive testing of all validation combinations
  - [ ] 3.2 Create item validation schemas
    - Create `src/schemas/validation.ts` for centralized Zod schemas
    - Define itemCreateSchema for creating new items
    - Validate text: string, min 1 char, max 5000 chars
    - Validate type: enum 'direction', 'waypoint', 'step'
    - Validate parent_id: optional UUID string or null
    - Validate position: optional integer >= 0
    - Validate points: optional integer >= 0
    - Define itemUpdateSchema for partial updates with all fields optional
    - Reference: Requirements lines 311-326 for schema structure
  - [ ] 3.3 Create achievement validation schemas
    - Define achievementCreateSchema for logging achievements
    - Validate item_id: required UUID string
    - Validate points_earned: required integer >= 0
    - Reference: Requirements lines 328-332
  - [ ] 3.4 Create daily points validation schema
    - Define dailyPointsSchema for baseline tracking
    - Validate date: string matching YYYY-MM-DD format using regex
    - Validate baseline_points: integer >= 0 with default value 10
    - Reference: Requirements lines 334-338
  - [ ] 3.5 Create user preferences validation schema
    - Define userPreferencesSchema as optional nested object
    - Validate defaultPointValues.direction: optional integer >= 0, default 100
    - Validate defaultPointValues.waypoint: optional integer >= 0, default 25
    - Validate defaultPointValues.step: optional integer >= 0, default 5
    - Validate theme: optional enum 'light', 'dark', 'auto' with default 'auto'
    - Validate dailyBaseline: optional integer >= 0, default 10
    - Reference: Requirements lines 340-350
  - [ ] 3.6 Generate TypeScript types from Zod schemas
    - Use z.infer<typeof schema> to derive types from schemas
    - Export both schemas and inferred types
    - Ensure consistency between Zod types and database row types
  - [ ] 3.7 Ensure Zod validation tests pass
    - Run ONLY the 2-8 tests written in 3.1
    - Verify validation catches invalid inputs
    - Verify valid inputs pass through correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 3.1 pass
- All schemas validate required fields correctly
- All schemas reject invalid data with clear error messages
- Schemas enforce min/max constraints
- Enum validation works for type and theme fields
- Types can be inferred from schemas using z.infer

### localStorage Implementation (v1)

#### Task Group 4: localStorage Data Layer
**Dependencies:** Task Groups 1, 2, 3

- [ ] 4.0 Complete localStorage implementation
  - [ ] 4.1 Write 2-8 focused tests for localStorage operations
    - Limit to 2-8 highly focused tests maximum
    - Test only critical operations (e.g., CRUD operations, JSON serialization, key consistency)
    - Skip exhaustive testing of all edge cases
  - [ ] 4.2 Create localStorage utilities module
    - Create `src/lib/storage/localStorage.ts` for storage operations
    - Implement getItems() to retrieve items array from 'waypoint:items' key
    - Implement getAchievements() to retrieve achievements from 'waypoint:achievements' key
    - Implement getDailyPoints() to retrieve daily points from 'waypoint:daily_points' key
    - Implement getUser() to retrieve user from 'waypoint:user' key
    - Handle missing keys gracefully with empty array or default object returns
    - Parse JSON and handle parse errors
    - Reference: Requirements lines 368-373 for key structure
  - [ ] 4.3 Implement localStorage write operations
    - Implement setItems() to save items array with JSON.stringify
    - Implement setAchievements() to save achievements array
    - Implement setDailyPoints() to save daily points array
    - Implement setUser() to save user object
    - Use same localStorage keys consistently ('waypoint:*' prefix)
    - Handle write errors (quota exceeded, etc.)
  - [ ] 4.4 Implement UUID generation utilities
    - Create `src/lib/utils/uuid.ts` for client-side UUID generation
    - Implement generateUUID() using crypto.randomUUID() or fallback
    - Ensure UUIDs are RFC 4122 compliant
    - Use same UUID structure as future Supabase implementation
  - [ ] 4.5 Create localStorage data access layer
    - Create `src/lib/data/items.ts` for item CRUD operations
    - Implement createItem() that generates UUID, validates with Zod, saves to localStorage
    - Implement updateItem() that validates partial updates, merges with existing item
    - Implement deleteItem() that sets deleted_at timestamp (soft delete)
    - Implement getItemById() for fetching single items
    - Implement getItemsByParentId() for hierarchy queries
    - Keep user_id null or use hardcoded 'local-user' value throughout
    - Reference: Requirements lines 361-366 for v1 strategy
  - [ ] 4.6 Create localStorage achievement operations
    - Create `src/lib/data/achievements.ts` for achievement operations
    - Implement createAchievement() when item marked complete
    - Store points_earned from item.points at time of completion
    - Implement deleteAchievement() when item unmarked
    - Implement getAchievementsByUserId() for achievement log
    - Implement getAchievementsByDateRange() for daily totals calculation
  - [ ] 4.7 Create localStorage daily points operations
    - Create `src/lib/data/dailyPoints.ts` for baseline tracking
    - Implement ensureDailyPointsRecord() to create baseline entry if missing
    - Implement getDailyPointsForDate() to fetch baseline for specific date
    - Calculate total daily points = baseline + SUM(achievements on that date)
    - Enforce unique constraint (user_id, date) at application level
  - [ ] 4.8 Ensure localStorage tests pass
    - Run ONLY the 2-8 tests written in 4.1
    - Verify CRUD operations work correctly
    - Verify JSON serialization/deserialization works
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 4.1 pass
- All localStorage operations use consistent key naming
- Data is properly serialized to JSON
- UUIDs are generated consistently
- Soft delete works with deleted_at timestamps
- Read operations handle missing keys gracefully
- Write operations validate data with Zod before saving

### Auto-Linking System

#### Task Group 5: Auto-Linking Detection & Logic
**Dependencies:** Task Groups 1-4

- [ ] 5.0 Complete auto-linking system implementation
  - [ ] 5.1 Write 2-8 focused tests for auto-linking detection
    - Limit to 2-8 highly focused tests maximum
    - Test only critical auto-linking behaviors (e.g., duplicate detection, canonical instance, case-insensitivity)
    - Skip exhaustive testing of all linking scenarios
  - [ ] 5.2 Implement duplicate detection query function
    - Create `src/lib/autolink/detection.ts` for auto-linking logic
    - Implement findDuplicateItems(text: string) function
    - Query items where LOWER(text) equals LOWER(input text)
    - Filter out soft-deleted items (deleted_at IS NULL)
    - Order by created_at ASC to find canonical instance first
    - Return array of matching items with id, text, created_at, parent_id
    - Optimize for performance (target < 50ms per detection)
    - Reference: Requirements lines 206-210 for detection logic
  - [ ] 5.3 Implement canonical instance detection
    - Create determineCanonicalInstance(items: Item[]) utility function
    - First item by created_at is canonical instance
    - Mark canonical item with isCanonical: true flag
    - Return canonical item and array of linked instances
    - Reference: Requirements lines 23-27 for canonical logic
  - [ ] 5.4 Implement auto-linking enrichment for UI
    - Create enrichItemsWithAutoLinks(items: Item[]) function
    - For each item, detect duplicates using findDuplicateItems()
    - Add linkedInstances array with id and parent context info
    - Add isCanonical boolean flag
    - Return enriched items for UI consumption
    - Reference: Requirements lines 212-217 for UI indicators
  - [ ] 5.5 Implement auto-link aware deletion logic
    - Create handleItemDeletion(itemId: string, deleteAll: boolean) function
    - If deleteAll is false, soft delete only the specified item
    - If deleteAll is true, find all items with matching text and soft delete all
    - Return count of items deleted
    - Show warning before deletion: "Also appears in N locations"
    - Reference: Requirements lines 224-228 for deletion behavior
  - [ ] 5.6 Implement auto-link update utilities
    - Create syncLinkedItemUpdates(itemId: string, updates: Partial<Item>) function
    - Find all items with matching text
    - Optionally update all instances if user confirms
    - By default, only update the single instance (user controls sync)
    - Return count of items updated
    - Reference: Requirements lines 218-223 for update behavior
  - [ ] 5.7 Ensure auto-linking tests pass
    - Run ONLY the 2-8 tests written in 5.1
    - Verify duplicate detection works case-insensitively
    - Verify canonical instance is correctly identified
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 5.1 pass
- Duplicate detection is case-insensitive
- Canonical instance is determined by earliest created_at
- Linked instances are properly enriched for UI display
- Deletion logic handles single vs all instances correctly
- Update logic respects user intent (no automatic syncing)
- Performance meets target (< 50ms per detection)

### Data Migration Planning

#### Task Group 6: Supabase Migration Preparation
**Dependencies:** Task Groups 1-5

- [ ] 6.0 Complete migration utilities for v3 transition
  - [ ] 6.1 Write 2-8 focused tests for migration logic
    - Limit to 2-8 highly focused tests maximum
    - Test only critical migration scenarios (e.g., data export, ID preservation, conflict handling)
    - Skip exhaustive testing of all edge cases
  - [ ] 6.2 Create localStorage export utility
    - Create `src/lib/migration/export.ts` for data export
    - Implement exportLocalStorageToJSON() function
    - Read all localStorage data (items, achievements, daily_points, user)
    - Generate JSON export file with version metadata
    - Include timestamp and data counts in export
    - Provide downloadable backup file for user safety
    - Reference: Requirements lines 375-398 for migration strategy
  - [ ] 6.3 Create migration data mapper
    - Create `src/lib/migration/mapper.ts` for data transformation
    - Implement mapLocalUserToAuthUser(localData, supabaseUserId) function
    - Replace null or 'local-user' user_id with authenticated user_id
    - Preserve all UUIDs for items, achievements, daily_points
    - Preserve all timestamps (created_at, updated_at, completed_at, achieved_at)
    - Handle date format conversions if necessary
    - Reference: Requirements lines 376-381
  - [ ] 6.4 Create conflict resolution strategy
    - Create `src/lib/migration/conflicts.ts` for handling duplicates
    - Implement detectConflicts(localItems, supabaseItems) function
    - Identify items that exist in both localStorage and Supabase
    - Compare timestamps to determine which version is newer
    - Provide merge strategies: keep local, keep cloud, keep both, or manual review
    - Reference: Requirements lines 379 for conflict handling
  - [ ] 6.5 Create migration status tracking
    - Create `src/lib/migration/status.ts` for migration state
    - Implement getMigrationStatus() to check if migration already completed
    - Store migration status in localStorage or database
    - Prevent duplicate migrations from running multiple times
    - Track migration timestamp and data counts migrated
    - Reference: Requirements lines 384 for status tracking
  - [ ] 6.6 Design migration UI flow (types & interfaces only)
    - Define MigrationState type with status enum (pending, in_progress, completed, failed)
    - Define MigrationResult type with counts and errors
    - Define MigrationOptions type for user choices (delete local after migration, etc.)
    - Create type definitions in `src/types/migration.ts`
    - DO NOT implement actual UI components (out of scope)
    - Reference: Requirements lines 382-386 for migration UI concepts
  - [ ] 6.7 Ensure migration tests pass
    - Run ONLY the 2-8 tests written in 6.1
    - Verify export creates valid JSON
    - Verify mapper preserves IDs and timestamps
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 2-8 tests written in 6.1 pass
- Export utility creates complete data backup
- Mapper preserves all IDs and timestamps
- Conflict detection identifies duplicates correctly
- Migration status prevents duplicate runs
- Types and interfaces are well-defined for future UI implementation

### Testing & Performance

#### Task Group 7: Performance Testing & Gap Analysis
**Dependencies:** Task Groups 1-6

- [ ] 7.0 Review tests and verify performance targets
  - [ ] 7.1 Review all tests from Task Groups 1-6
    - Review the 2-8 tests written by schema-engineer (Task 1.1)
    - Review the 2-8 tests written by type-engineer (Task 2.1)
    - Review the 2-8 tests written by validation-engineer (Task 3.1)
    - Review the 2-8 tests written by storage-engineer (Task 4.1)
    - Review the 2-8 tests written by autolink-engineer (Task 5.1)
    - Review the 2-8 tests written by migration-engineer (Task 6.1)
    - Total existing tests: approximately 12-48 tests
  - [ ] 7.2 Analyze test coverage gaps for database schema feature
    - Identify critical workflows lacking test coverage (e.g., full item lifecycle, achievement logging flow, soft delete integrity)
    - Focus ONLY on gaps related to database schema specification
    - Do NOT assess entire application test coverage
    - Prioritize integration tests over isolated unit tests
  - [ ] 7.3 Write up to 10 additional strategic tests maximum
    - Add maximum of 10 new tests to fill critical gaps
    - Test auto-linking with large datasets (performance target: < 50ms)
    - Test soft delete preserves foreign key relationships
    - Test achievement logging preserves points at completion time
    - Test daily points calculation with multiple achievements
    - Test localStorage quota limits handling
    - Test concurrent updates in multi-tab scenarios
    - Focus on end-to-end workflows, not edge cases
    - Reference: Requirements lines 666-673 for testing considerations
  - [ ] 7.4 Create performance benchmark suite
    - Create `src/tests/performance/benchmarks.ts` for performance testing
    - Benchmark auto-linking detection with 1000+ items (target: < 50ms)
    - Benchmark outline view load with 1000 items (target: < 100ms)
    - Benchmark achievement log fetch with 1 year of data (target: < 100ms)
    - Benchmark daily points calculation (target: < 50ms)
    - Log performance metrics and warn if targets not met
    - Reference: Requirements lines 417-423 for performance targets
  - [ ] 7.5 Test auto-linking edge cases
    - Test auto-linking with identical text in different cases (uppercase/lowercase/mixed)
    - Test auto-linking with special characters and Unicode
    - Test canonical instance determination with millisecond-close timestamps
    - Test deletion of canonical instance (should make next earliest instance canonical)
    - Test maximum number of linked instances (performance degradation point)
  - [ ] 7.6 Test soft delete integrity
    - Test soft-deleted items don't appear in hierarchy queries
    - Test soft-deleted items remain in achievement log
    - Test foreign key cascades respect soft delete (don't hard delete children)
    - Test restoring soft-deleted items (un-delete functionality)
  - [ ] 7.7 Test data validation edge cases
    - Test item text at boundary lengths (1 char, 5000 chars, 5001 chars)
    - Test invalid enum values rejected by Zod
    - Test negative numbers rejected for points, position, baseline_points
    - Test invalid UUID formats rejected
    - Test invalid date formats rejected (not YYYY-MM-DD)
  - [ ] 7.8 Run feature-specific tests only
    - Run ONLY tests related to database schema feature (tests from 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, and 7.3)
    - Expected total: approximately 22-58 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass
    - Verify performance benchmarks meet targets

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 22-58 tests total)
- Performance benchmarks meet targets (< 50ms auto-linking, < 100ms outline load)
- No more than 10 additional tests added when filling in testing gaps
- Auto-linking works correctly with large datasets
- Soft delete preserves data integrity
- All validation constraints enforce correctly
- localStorage operations handle edge cases gracefully

## Execution Order

Recommended implementation sequence:

1. **Database Schema Design (Task Group 1)** - Foundation for all data structures
2. **TypeScript Type System (Task Group 2)** - Type safety built on schema
3. **Zod Validation Schemas (Task Group 3)** - Runtime validation matching types
4. **localStorage Implementation (Task Group 4)** - v1 data persistence layer
5. **Auto-Linking System (Task Group 5)** - Critical feature requiring types + storage
6. **Data Migration Planning (Task Group 6)** - Preparation for v3 Supabase transition
7. **Testing & Performance (Task Group 7)** - Verification and optimization

## Critical Success Factors

1. **Auto-linking performance**: Must handle 1000+ items efficiently (< 50ms detection)
2. **Type safety**: TypeScript types must match database schema exactly
3. **Migration readiness**: localStorage structure must align with future Supabase schema
4. **Soft delete integrity**: Achievement history must be preserved correctly
5. **Case-insensitive matching**: Auto-linking must work regardless of text casing

## Key Performance Targets

- Auto-link duplicate detection: < 50ms per item creation
- Outline view load: < 100ms for 1000 items
- Achievement log fetch: < 100ms for 1 year of data
- Daily points calculation: < 50ms

## Implementation Notes

**Auto-Linking is Critical**: This is the most complex and important feature. The text-based auto-linking system creates emergent graph relationships from natural text entry patterns. It must be fast, reliable, and case-insensitive.

**Design for Migration**: While v1 uses localStorage, all data structures, types, and validation logic must be designed to work identically with Supabase PostgreSQL in v3. Use UUIDs, maintain same field names, and keep validation logic database-agnostic.

**Soft Delete Everywhere**: Never hard delete items. Always use soft delete (deleted_at timestamp) to preserve achievement history and allow users to see their past accomplishments.

**Type Safety First**: All data operations must be validated with Zod schemas before storage and typed with TypeScript for compile-time safety. This prevents bugs and maintains data integrity.

**Test with Real Data Volumes**: Don't just test with 5-10 items. Test auto-linking and performance with 1000+ items to ensure the system scales correctly.
