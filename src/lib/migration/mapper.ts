/**
 * Migration Data Mapper
 *
 * This module provides utilities for transforming localStorage data to Supabase format.
 * The primary transformation is replacing null or 'local-user' user_id with authenticated user_id.
 *
 * Key features:
 * - Maps local user data to authenticated user ID
 * - Preserves all UUIDs for items, achievements, daily_points
 * - Preserves all timestamps (created_at, updated_at, completed_at, achieved_at)
 * - Handles date format conversions if necessary
 *
 * @module lib/migration/mapper
 */

import type { ItemRow, AchievementRow, DailyPointsRow } from '@/types/database';
import type { ExportData, MappedData } from '@/types/migration';

/**
 * Map localStorage user data to authenticated Supabase user.
 *
 * Replaces all user_id references from null or 'local-user' to the authenticated Supabase user ID.
 * Preserves all other data including UUIDs, timestamps, and field values.
 *
 * This is the core transformation needed to migrate from v1 localStorage to v3 Supabase.
 *
 * @param localData - Export data from localStorage
 * @param supabaseUserId - Authenticated Supabase user ID (UUID)
 * @returns Mapped data with user_id populated for all records
 *
 * @example
 * ```typescript
 * const localData = exportLocalStorageToJSON();
 * const supabaseUserId = '987f6543-e21c-34d5-b678-123456789abc';
 * const mappedData = mapLocalUserToAuthUser(localData, supabaseUserId);
 * // All items, achievements, daily_points now have user_id = supabaseUserId
 * ```
 */
export function mapLocalUserToAuthUser(
  localData: ExportData,
  supabaseUserId: string
): MappedData {
  // Map items: replace user_id
  const items: ItemRow[] = localData.items.map(item => ({
    ...item,
    user_id: supabaseUserId, // Replace null or 'local-user' with authenticated user ID
  }));

  // Map achievements: replace user_id
  const achievements: AchievementRow[] = localData.achievements.map(achievement => ({
    ...achievement,
    user_id: supabaseUserId,
  }));

  // Map daily points: replace user_id
  const dailyPoints: DailyPointsRow[] = localData.dailyPoints.map(dp => ({
    ...dp,
    user_id: supabaseUserId,
  }));

  return {
    items,
    achievements,
    dailyPoints,
  };
}

/**
 * Validate that all UUIDs are preserved during mapping.
 *
 * Compares original and mapped data to ensure no UUIDs were changed.
 * This is critical for preserving data relationships and history.
 *
 * @param original - Original export data from localStorage
 * @param mapped - Mapped data ready for Supabase
 * @returns Validation result with list of any UUID mismatches
 *
 * @example
 * ```typescript
 * const validation = validateUUIDPreservation(localData, mappedData);
 * if (!validation.valid) {
 *   console.error('UUID preservation failed:', validation.errors);
 * }
 * ```
 */
export function validateUUIDPreservation(
  original: ExportData,
  mapped: MappedData
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check item UUIDs
  if (original.items.length !== mapped.items.length) {
    errors.push(`Items count mismatch: ${original.items.length} vs ${mapped.items.length}`);
  } else {
    for (let i = 0; i < original.items.length; i++) {
      if (original.items[i].id !== mapped.items[i].id) {
        errors.push(`Item UUID mismatch at index ${i}: ${original.items[i].id} vs ${mapped.items[i].id}`);
      }
    }
  }

  // Check achievement UUIDs
  if (original.achievements.length !== mapped.achievements.length) {
    errors.push(`Achievements count mismatch: ${original.achievements.length} vs ${mapped.achievements.length}`);
  } else {
    for (let i = 0; i < original.achievements.length; i++) {
      if (original.achievements[i].id !== mapped.achievements[i].id) {
        errors.push(
          `Achievement UUID mismatch at index ${i}: ${original.achievements[i].id} vs ${mapped.achievements[i].id}`
        );
      }
    }
  }

  // Check daily points UUIDs
  if (original.dailyPoints.length !== mapped.dailyPoints.length) {
    errors.push(`Daily points count mismatch: ${original.dailyPoints.length} vs ${mapped.dailyPoints.length}`);
  } else {
    for (let i = 0; i < original.dailyPoints.length; i++) {
      if (original.dailyPoints[i].id !== mapped.dailyPoints[i].id) {
        errors.push(
          `Daily points UUID mismatch at index ${i}: ${original.dailyPoints[i].id} vs ${mapped.dailyPoints[i].id}`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that all timestamps are preserved during mapping.
 *
 * Compares original and mapped data to ensure no timestamps were changed.
 * Preserving timestamps is critical for maintaining achievement history and data lineage.
 *
 * @param original - Original export data from localStorage
 * @param mapped - Mapped data ready for Supabase
 * @returns Validation result with list of any timestamp mismatches
 *
 * @example
 * ```typescript
 * const validation = validateTimestampPreservation(localData, mappedData);
 * if (!validation.valid) {
 *   console.error('Timestamp preservation failed:', validation.errors);
 * }
 * ```
 */
export function validateTimestampPreservation(
  original: ExportData,
  mapped: MappedData
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check item timestamps
  for (let i = 0; i < original.items.length; i++) {
    const origItem = original.items[i];
    const mappedItem = mapped.items[i];

    if (origItem.created_at !== mappedItem.created_at) {
      errors.push(`Item ${origItem.id} created_at mismatch`);
    }
    if (origItem.updated_at !== mappedItem.updated_at) {
      errors.push(`Item ${origItem.id} updated_at mismatch`);
    }
    if (origItem.completed_at !== mappedItem.completed_at) {
      errors.push(`Item ${origItem.id} completed_at mismatch`);
    }
  }

  // Check achievement timestamps
  for (let i = 0; i < original.achievements.length; i++) {
    const origAchievement = original.achievements[i];
    const mappedAchievement = mapped.achievements[i];

    if (origAchievement.achieved_at !== mappedAchievement.achieved_at) {
      errors.push(`Achievement ${origAchievement.id} achieved_at mismatch`);
    }
    if (origAchievement.created_at !== mappedAchievement.created_at) {
      errors.push(`Achievement ${origAchievement.id} created_at mismatch`);
    }
  }

  // Check daily points timestamps
  for (let i = 0; i < original.dailyPoints.length; i++) {
    const origDailyPoints = original.dailyPoints[i];
    const mappedDailyPoints = mapped.dailyPoints[i];

    if (origDailyPoints.date !== mappedDailyPoints.date) {
      errors.push(`Daily points ${origDailyPoints.id} date mismatch`);
    }
    if (origDailyPoints.created_at !== mappedDailyPoints.created_at) {
      errors.push(`Daily points ${origDailyPoints.id} created_at mismatch`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalize date format for consistency.
 *
 * Ensures dates are in YYYY-MM-DD format as expected by the database schema.
 * Handles various input formats and converts them to the standard format.
 * Uses UTC to avoid timezone conversion issues.
 *
 * @param dateString - Date string in any common format
 * @returns Normalized date string in YYYY-MM-DD format
 * @throws Error if date string is invalid
 *
 * @example
 * ```typescript
 * const normalized = normalizeDateFormat('2024-01-01T12:00:00Z');
 * // Returns: '2024-01-01'
 * ```
 */
export function normalizeDateFormat(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  // Format as YYYY-MM-DD using UTC to avoid timezone issues
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Convert all date fields to YYYY-MM-DD format in mapped data.
 *
 * Ensures all date fields in daily_points records are in the correct format.
 * This handles any potential format inconsistencies from localStorage.
 *
 * @param mapped - Mapped data to normalize
 * @returns Mapped data with normalized date formats
 *
 * @example
 * ```typescript
 * const mappedData = mapLocalUserToAuthUser(localData, userId);
 * const normalized = normalizeDateFormats(mappedData);
 * ```
 */
export function normalizeDateFormats(mapped: MappedData): MappedData {
  return {
    ...mapped,
    dailyPoints: mapped.dailyPoints.map(dp => ({
      ...dp,
      date: normalizeDateFormat(dp.date),
    })),
  };
}
