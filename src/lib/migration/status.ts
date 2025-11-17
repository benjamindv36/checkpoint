/**
 * Migration Status Tracking
 *
 * This module provides utilities for tracking migration state and preventing duplicate migrations.
 * Migration status is stored in localStorage to persist across sessions.
 *
 * Key features:
 * - Check if migration has already been completed
 * - Store migration status and results
 * - Track migration timestamp and data counts
 * - Prevent duplicate migrations from running multiple times
 *
 * @module lib/migration/status
 */

import type {
  MigrationState,
  MigrationResult,
  MigrationStatusRecord,
  MigrationOptions,
} from '@/src/types/migration';
import { generateUUID } from '@/src/lib/utils/uuid';

// localStorage key for migration status
const MIGRATION_STATUS_KEY = 'waypoint:migration_status';

/**
 * Get the current migration status.
 *
 * Retrieves the migration status record from localStorage.
 * Returns null if no migration has been attempted.
 *
 * @returns Migration status record or null if not found
 *
 * @example
 * ```typescript
 * const status = getMigrationStatus();
 * if (status?.state.status === 'completed') {
 *   console.log('Migration already completed');
 * }
 * ```
 */
export function getMigrationStatus(): MigrationStatusRecord | null {
  try {
    const data = localStorage.getItem(MIGRATION_STATUS_KEY);
    if (!data) return null;
    return JSON.parse(data) as MigrationStatusRecord;
  } catch (error) {
    console.error('Error reading migration status:', error);
    return null;
  }
}

/**
 * Check if migration has already been completed.
 *
 * Convenience function to quickly check if migration is done.
 *
 * @returns True if migration has completed successfully, false otherwise
 *
 * @example
 * ```typescript
 * if (isMigrationCompleted()) {
 *   console.log('Data has already been migrated to Supabase');
 * }
 * ```
 */
export function isMigrationCompleted(): boolean {
  const status = getMigrationStatus();
  return status?.state.status === 'completed';
}

/**
 * Initialize a new migration attempt.
 *
 * Creates a new migration status record with 'pending' status and saves it to localStorage.
 * This should be called before starting the migration process.
 *
 * @param userId - Supabase user ID for this migration
 * @param options - Migration options chosen by user
 * @returns The newly created migration status record
 * @throws Error if a migration is already in progress
 *
 * @example
 * ```typescript
 * const options = {
 *   deleteLocalAfterMigration: true,
 *   conflictStrategy: 'keep_newest',
 *   preserveTimestamps: true,
 *   createBackup: true,
 * };
 * const status = initializeMigration(userId, options);
 * ```
 */
export function initializeMigration(
  userId: string,
  options: MigrationOptions
): MigrationStatusRecord {
  // Check if migration is already in progress
  const existing = getMigrationStatus();
  if (existing?.state.status === 'in_progress') {
    throw new Error('Migration is already in progress');
  }

  // Create new migration record
  const record: MigrationStatusRecord = {
    migrationId: generateUUID(),
    userId,
    state: {
      status: 'pending',
      startedAt: null,
      completedAt: null,
      lastError: null,
    },
    result: null,
    options,
  };

  // Save to localStorage
  saveMigrationStatus(record);

  return record;
}

/**
 * Mark migration as started.
 *
 * Updates the migration status to 'in_progress' and records the start timestamp.
 *
 * @param migrationId - ID of the migration to start
 * @throws Error if migration record not found
 *
 * @example
 * ```typescript
 * startMigration(migrationRecord.migrationId);
 * ```
 */
export function startMigration(migrationId: string): void {
  const record = getMigrationStatus();
  if (!record || record.migrationId !== migrationId) {
    throw new Error('Migration record not found');
  }

  record.state.status = 'in_progress';
  record.state.startedAt = new Date().toISOString();

  saveMigrationStatus(record);
}

/**
 * Mark migration as completed successfully.
 *
 * Updates the migration status to 'completed', records the completion timestamp,
 * and saves the migration result with counts of migrated entities.
 *
 * @param migrationId - ID of the migration to complete
 * @param result - Migration result with counts and errors/warnings
 * @throws Error if migration record not found
 *
 * @example
 * ```typescript
 * const result = {
 *   itemsMigrated: 150,
 *   achievementsMigrated: 45,
 *   dailyPointsMigrated: 30,
 *   errors: [],
 *   warnings: [],
 * };
 * completeMigration(migrationId, result);
 * ```
 */
export function completeMigration(migrationId: string, result: MigrationResult): void {
  const record = getMigrationStatus();
  if (!record || record.migrationId !== migrationId) {
    throw new Error('Migration record not found');
  }

  record.state.status = 'completed';
  record.state.completedAt = new Date().toISOString();
  record.result = result;

  saveMigrationStatus(record);
}

/**
 * Mark migration as failed.
 *
 * Updates the migration status to 'failed' and records the error message.
 *
 * @param migrationId - ID of the migration that failed
 * @param errorMessage - Error message describing the failure
 * @throws Error if migration record not found
 *
 * @example
 * ```typescript
 * try {
 *   // ... migration process
 * } catch (error) {
 *   failMigration(migrationId, error.message);
 * }
 * ```
 */
export function failMigration(migrationId: string, errorMessage: string): void {
  const record = getMigrationStatus();
  if (!record || record.migrationId !== migrationId) {
    throw new Error('Migration record not found');
  }

  record.state.status = 'failed';
  record.state.lastError = errorMessage;

  saveMigrationStatus(record);
}

/**
 * Save migration status to localStorage.
 *
 * Internal helper function to persist migration status.
 *
 * @param record - Migration status record to save
 */
function saveMigrationStatus(record: MigrationStatusRecord): void {
  try {
    localStorage.setItem(MIGRATION_STATUS_KEY, JSON.stringify(record));
  } catch (error) {
    console.error('Error saving migration status:', error);
    throw new Error('Failed to save migration status');
  }
}

/**
 * Clear migration status from localStorage.
 *
 * Removes the migration status record. Use with caution - this allows
 * the migration to be run again.
 *
 * @example
 * ```typescript
 * clearMigrationStatus();
 * console.log('Migration status cleared');
 * ```
 */
export function clearMigrationStatus(): void {
  localStorage.removeItem(MIGRATION_STATUS_KEY);
}

/**
 * Get migration summary for display.
 *
 * Generates a human-readable summary of the migration status.
 *
 * @returns Summary object with status, timing, and counts
 *
 * @example
 * ```typescript
 * const summary = getMigrationSummary();
 * if (summary) {
 *   console.log(`Migration ${summary.status}`);
 *   console.log(`Migrated ${summary.totalItemsMigrated} items`);
 * }
 * ```
 */
export function getMigrationSummary(): {
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null; // in milliseconds
  totalItemsMigrated: number;
  totalAchievementsMigrated: number;
  totalDailyPointsMigrated: number;
  errorCount: number;
  warningCount: number;
} | null {
  const record = getMigrationStatus();
  if (!record) return null;

  const { state, result } = record;

  // Calculate duration if both start and completion times are available
  let duration: number | null = null;
  if (state.startedAt && state.completedAt) {
    duration = new Date(state.completedAt).getTime() - new Date(state.startedAt).getTime();
  }

  return {
    status: state.status,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    duration,
    totalItemsMigrated: result?.itemsMigrated || 0,
    totalAchievementsMigrated: result?.achievementsMigrated || 0,
    totalDailyPointsMigrated: result?.dailyPointsMigrated || 0,
    errorCount: result?.errors.length || 0,
    warningCount: result?.warnings.length || 0,
  };
}

/**
 * Reset migration to allow retry.
 *
 * Resets a failed migration to 'pending' status so it can be retried.
 * Only works on failed migrations, not completed ones.
 *
 * @param migrationId - ID of the migration to reset
 * @throws Error if migration is not in failed state
 *
 * @example
 * ```typescript
 * if (status.state.status === 'failed') {
 *   resetMigration(status.migrationId);
 *   // Migration can now be retried
 * }
 * ```
 */
export function resetMigration(migrationId: string): void {
  const record = getMigrationStatus();
  if (!record || record.migrationId !== migrationId) {
    throw new Error('Migration record not found');
  }

  if (record.state.status !== 'failed') {
    throw new Error('Can only reset failed migrations');
  }

  record.state.status = 'pending';
  record.state.startedAt = null;
  record.state.completedAt = null;
  record.state.lastError = null;
  record.result = null;

  saveMigrationStatus(record);
}
