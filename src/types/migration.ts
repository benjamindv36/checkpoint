/**
 * Migration Type Definitions
 *
 * This file contains type definitions for the localStorage to Supabase migration system.
 * These types support the v3 transition from local-first storage to cloud-based Supabase.
 *
 * The migration system provides:
 * - Data export for backup safety
 * - ID and timestamp preservation during migration
 * - Conflict detection and resolution strategies
 * - Migration status tracking to prevent duplicate runs
 *
 * @module types/migration
 */

import type { ItemRow, AchievementRow, DailyPointsRow, UserRow } from './database';

// =====================================================
// MIGRATION STATE TYPES
// =====================================================

/**
 * Migration status enum representing the current state of migration.
 *
 * - pending: Migration has not started yet
 * - in_progress: Migration is currently running
 * - completed: Migration finished successfully
 * - failed: Migration encountered errors and stopped
 */
export type MigrationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * MigrationState tracks the overall state of the migration process.
 *
 * @property status - Current migration status
 * @property startedAt - ISO timestamp when migration started (null if not started)
 * @property completedAt - ISO timestamp when migration completed (null if not completed)
 * @property lastError - Last error message if migration failed (null if no errors)
 *
 * @example
 * ```typescript
 * const state: MigrationState = {
 *   status: 'in_progress',
 *   startedAt: '2024-01-01T12:00:00Z',
 *   completedAt: null,
 *   lastError: null,
 * };
 * ```
 */
export type MigrationState = {
  status: MigrationStatus;
  startedAt: string | null;
  completedAt: string | null;
  lastError: string | null;
};

// =====================================================
// MIGRATION RESULT TYPES
// =====================================================

/**
 * MigrationResult represents the outcome of a completed migration.
 *
 * Tracks counts of migrated entities and any errors encountered.
 *
 * @property itemsMigrated - Number of items successfully migrated
 * @property achievementsMigrated - Number of achievements successfully migrated
 * @property dailyPointsMigrated - Number of daily points records successfully migrated
 * @property errors - Array of error messages encountered during migration (empty if no errors)
 * @property warnings - Array of warning messages (e.g., conflicts detected)
 *
 * @example
 * ```typescript
 * const result: MigrationResult = {
 *   itemsMigrated: 150,
 *   achievementsMigrated: 45,
 *   dailyPointsMigrated: 30,
 *   errors: [],
 *   warnings: ['2 items had conflicts and were merged'],
 * };
 * ```
 */
export type MigrationResult = {
  itemsMigrated: number;
  achievementsMigrated: number;
  dailyPointsMigrated: number;
  errors: string[];
  warnings: string[];
};

// =====================================================
// MIGRATION OPTIONS TYPES
// =====================================================

/**
 * Conflict resolution strategy for handling items that exist in both localStorage and Supabase.
 *
 * - keep_local: Keep the localStorage version (overwrite cloud)
 * - keep_cloud: Keep the Supabase version (discard local)
 * - keep_both: Keep both versions as separate items
 * - keep_newest: Compare timestamps and keep the most recently updated version
 * - manual_review: Require user to manually review and resolve conflicts
 */
export type ConflictStrategy =
  | 'keep_local'
  | 'keep_cloud'
  | 'keep_both'
  | 'keep_newest'
  | 'manual_review';

/**
 * MigrationOptions configures user choices for the migration process.
 *
 * @property deleteLocalAfterMigration - If true, clear localStorage after successful migration
 * @property conflictStrategy - How to handle items that exist in both sources
 * @property preserveTimestamps - If true, preserve original created_at/updated_at timestamps
 * @property createBackup - If true, create a JSON backup file before migrating
 *
 * @example
 * ```typescript
 * const options: MigrationOptions = {
 *   deleteLocalAfterMigration: true,
 *   conflictStrategy: 'keep_newest',
 *   preserveTimestamps: true,
 *   createBackup: true,
 * };
 * ```
 */
export type MigrationOptions = {
  deleteLocalAfterMigration: boolean;
  conflictStrategy: ConflictStrategy;
  preserveTimestamps: boolean;
  createBackup: boolean;
};

// =====================================================
// EXPORT DATA TYPES
// =====================================================

/**
 * ExportData represents a complete export of localStorage data.
 *
 * Used for backup before migration and for debugging/data recovery.
 *
 * @property version - Export format version (for future compatibility)
 * @property exportedAt - ISO timestamp when export was created
 * @property items - All items from localStorage
 * @property achievements - All achievements from localStorage
 * @property dailyPoints - All daily points records from localStorage
 * @property user - User data from localStorage
 * @property counts - Counts of each entity type for validation
 *
 * @example
 * ```typescript
 * const exportData: ExportData = {
 *   version: 1,
 *   exportedAt: '2024-01-01T12:00:00Z',
 *   items: [...],
 *   achievements: [...],
 *   dailyPoints: [...],
 *   user: {...},
 *   counts: {
 *     items: 150,
 *     achievements: 45,
 *     dailyPoints: 30,
 *   },
 * };
 * ```
 */
export type ExportData = {
  version: number;
  exportedAt: string;
  items: ItemRow[];
  achievements: AchievementRow[];
  dailyPoints: DailyPointsRow[];
  user: UserRow;
  counts: {
    items: number;
    achievements: number;
    dailyPoints: number;
  };
};

// =====================================================
// CONFLICT DETECTION TYPES
// =====================================================

/**
 * ConflictItem represents an item that exists in both localStorage and Supabase.
 *
 * @property localItem - The version from localStorage
 * @property cloudItem - The version from Supabase
 * @property conflictReason - Description of why this is a conflict (e.g., 'text_match', 'id_match')
 *
 * @example
 * ```typescript
 * const conflict: ConflictItem = {
 *   localItem: {...},
 *   cloudItem: {...},
 *   conflictReason: 'text_match',
 * };
 * ```
 */
export type ConflictItem = {
  localItem: ItemRow;
  cloudItem: ItemRow;
  conflictReason: 'text_match' | 'id_match';
};

/**
 * ConflictDetectionResult represents all conflicts found during migration.
 *
 * @property conflicts - Array of conflicting items
 * @property totalConflicts - Number of conflicts detected
 * @property requiresResolution - Whether user intervention is needed
 *
 * @example
 * ```typescript
 * const result: ConflictDetectionResult = {
 *   conflicts: [...],
 *   totalConflicts: 2,
 *   requiresResolution: true,
 * };
 * ```
 */
export type ConflictDetectionResult = {
  conflicts: ConflictItem[];
  totalConflicts: number;
  requiresResolution: boolean;
};

// =====================================================
// MIGRATION TRACKING TYPES
// =====================================================

/**
 * MigrationStatusRecord stored in localStorage or database to track migration state.
 *
 * @property migrationId - Unique identifier for this migration attempt
 * @property userId - Supabase user ID for this migration
 * @property state - Current migration state
 * @property result - Migration result (null if not completed)
 * @property options - Migration options used
 *
 * @example
 * ```typescript
 * const record: MigrationStatusRecord = {
 *   migrationId: '123e4567-e89b-12d3-a456-426614174000',
 *   userId: '987f6543-e21c-34d5-b678-123456789abc',
 *   state: {
 *     status: 'completed',
 *     startedAt: '2024-01-01T12:00:00Z',
 *     completedAt: '2024-01-01T12:05:00Z',
 *     lastError: null,
 *   },
 *   result: {
 *     itemsMigrated: 150,
 *     achievementsMigrated: 45,
 *     dailyPointsMigrated: 30,
 *     errors: [],
 *     warnings: [],
 *   },
 *   options: {
 *     deleteLocalAfterMigration: true,
 *     conflictStrategy: 'keep_newest',
 *     preserveTimestamps: true,
 *     createBackup: true,
 *   },
 * };
 * ```
 */
export type MigrationStatusRecord = {
  migrationId: string;
  userId: string;
  state: MigrationState;
  result: MigrationResult | null;
  options: MigrationOptions;
};

// =====================================================
// MAPPED DATA TYPES
// =====================================================

/**
 * MappedData represents data that has been transformed from localStorage format to Supabase format.
 *
 * All user_id fields have been replaced from null/'local-user' to the authenticated Supabase user ID.
 * All UUIDs and timestamps are preserved from the original data.
 *
 * @property items - Items with user_id populated
 * @property achievements - Achievements with user_id populated
 * @property dailyPoints - Daily points with user_id populated
 *
 * @example
 * ```typescript
 * const mapped: MappedData = {
 *   items: [...], // all items now have user_id = authenticated user
 *   achievements: [...],
 *   dailyPoints: [...],
 * };
 * ```
 */
export type MappedData = {
  items: ItemRow[];
  achievements: AchievementRow[];
  dailyPoints: DailyPointsRow[];
};
