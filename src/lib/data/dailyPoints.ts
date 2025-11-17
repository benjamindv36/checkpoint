/**
 * Daily Points Data Access Layer
 *
 * This module provides operations for daily baseline points tracking in localStorage.
 * Daily points track the baseline points awarded for existing each day (+10 default).
 *
 * Operations:
 * - ensureDailyPointsRecord() - Create baseline entry if missing (idempotent)
 * - getDailyPointsForDate() - Fetch baseline for specific date
 * - calculateTotalDailyPoints() - Calculate total (baseline + achievements)
 * - updateBaselinePoints() - Update baseline for a date
 *
 * Key Behaviors:
 * - One record per user per date (enforced at application level)
 * - Only stores baseline (+10) - item completion points calculated from achievements
 * - Total daily points = baseline_points + SUM(achievements.points_earned for that date)
 * - Record created automatically when user accesses app on new day
 *
 * @module lib/data/dailyPoints
 */

import { getDailyPoints, setDailyPoints } from '@/src/lib/storage/localStorage';
import { generateUUID } from '@/src/lib/utils/uuid';
import { dailyPointsSchema } from '@/src/schemas/validation';
import { DEFAULT_DAILY_BASELINE } from '@/src/types/database';
import { calculatePointsForDateRange } from './achievements';
import type { DailyPointsRow } from '@/src/types/database';

/**
 * Ensure a daily points record exists for a given date.
 *
 * Creates a new record if one doesn't exist. If record already exists,
 * returns the existing record (idempotent operation).
 *
 * Enforces unique constraint (user_id, date) at application level.
 *
 * @param date - Date in YYYY-MM-DD format
 * @param userId - User ID (null for v1 local user)
 * @param baselinePoints - Baseline points (default: 10)
 * @returns Existing or newly created DailyPointsRow
 * @throws ZodError if date format is invalid
 *
 * @example
 * ```typescript
 * const today = new Date().toISOString().split('T')[0];
 * const record = ensureDailyPointsRecord(today);
 * console.log('Baseline points:', record.baseline_points); // 10
 * ```
 */
export function ensureDailyPointsRecord(
  date: string,
  userId: string | null = null,
  baselinePoints: number = DEFAULT_DAILY_BASELINE
): DailyPointsRow {
  // Validate date format with Zod schema
  dailyPointsSchema.parse({ date, baseline_points: baselinePoints });

  // Check if record already exists
  const existing = getDailyPointsForDate(date, userId);
  if (existing) {
    return existing;
  }

  // Create new record
  const now = new Date().toISOString();
  const id = generateUUID();

  const record: DailyPointsRow = {
    id,
    user_id: userId,
    date,
    baseline_points: baselinePoints,
    created_at: now,
  };

  // Save to localStorage
  const dailyPoints = getDailyPoints();
  dailyPoints.push(record);
  setDailyPoints(dailyPoints);

  return record;
}

/**
 * Get daily points record for a specific date.
 *
 * Fetches the baseline points record for the given date and user.
 * Returns null if no record exists for that date.
 *
 * @param date - Date in YYYY-MM-DD format
 * @param userId - User ID (null for v1 local user)
 * @returns DailyPointsRow if found, null otherwise
 *
 * @example
 * ```typescript
 * const today = new Date().toISOString().split('T')[0];
 * const record = getDailyPointsForDate(today);
 * if (record) {
 *   console.log('Baseline points:', record.baseline_points);
 * }
 * ```
 */
export function getDailyPointsForDate(
  date: string,
  userId: string | null = null
): DailyPointsRow | null {
  const dailyPoints = getDailyPoints();
  return dailyPoints.find(dp => dp.date === date && dp.user_id === userId) ?? null;
}

/**
 * Calculate total points for a specific date.
 *
 * Total daily points = baseline_points + SUM(achievements.points_earned for that date)
 *
 * If no baseline record exists for the date, returns only achievement points.
 * If no achievements exist for the date, returns only baseline points.
 *
 * @param date - Date in YYYY-MM-DD format
 * @param userId - User ID (null for v1 local user)
 * @returns Total points for the date (baseline + achievements)
 *
 * @example
 * ```typescript
 * const today = new Date().toISOString().split('T')[0];
 * const totalPoints = calculateTotalDailyPoints(today);
 * console.log(`Total points today: ${totalPoints}`);
 * // If baseline is 10 and achievements are 50, returns 60
 * ```
 */
export function calculateTotalDailyPoints(
  date: string,
  userId: string | null = null
): number {
  // Get baseline points for the date
  const baseline = getDailyPointsForDate(date, userId);
  const baselinePoints = baseline?.baseline_points ?? 0;

  // Calculate achievement points for the date
  const achievementPoints = calculatePointsForDateRange(date, date, userId);

  // Return total
  return baselinePoints + achievementPoints;
}

/**
 * Update baseline points for a specific date.
 *
 * Updates the baseline_points value for an existing daily points record.
 * Creates a new record if one doesn't exist for the date.
 *
 * @param date - Date in YYYY-MM-DD format
 * @param baselinePoints - New baseline points value
 * @param userId - User ID (null for v1 local user)
 * @returns Updated DailyPointsRow
 * @throws ZodError if validation fails
 *
 * @example
 * ```typescript
 * const today = new Date().toISOString().split('T')[0];
 * const updated = updateBaselinePoints(today, 15);
 * console.log('New baseline:', updated.baseline_points); // 15
 * ```
 */
export function updateBaselinePoints(
  date: string,
  baselinePoints: number,
  userId: string | null = null
): DailyPointsRow {
  // Validate input
  dailyPointsSchema.parse({ date, baseline_points: baselinePoints });

  const dailyPoints = getDailyPoints();
  const index = dailyPoints.findIndex(dp => dp.date === date && dp.user_id === userId);

  if (index === -1) {
    // Record doesn't exist, create new one
    return ensureDailyPointsRecord(date, userId, baselinePoints);
  }

  // Update existing record
  dailyPoints[index] = {
    ...dailyPoints[index],
    baseline_points: baselinePoints,
  };

  setDailyPoints(dailyPoints);
  return dailyPoints[index];
}

/**
 * Get all daily points records for a user.
 *
 * Returns all baseline records, ordered by date DESC (most recent first).
 * In v1, user_id is null for all records (no authentication).
 *
 * @param userId - User ID (null for v1 local user)
 * @returns Array of DailyPointsRow objects, ordered by date descending
 *
 * @example
 * ```typescript
 * const records = getAllDailyPoints();
 * records.forEach(record => {
 *   const total = calculateTotalDailyPoints(record.date);
 *   console.log(`${record.date}: ${total} points`);
 * });
 * ```
 */
export function getAllDailyPoints(userId: string | null = null): DailyPointsRow[] {
  const dailyPoints = getDailyPoints();

  return dailyPoints
    .filter(dp => dp.user_id === userId)
    .sort((a, b) => {
      // Sort by date DESC (most recent first)
      return b.date.localeCompare(a.date);
    });
}

/**
 * Get daily points records within a date range.
 *
 * Returns baseline records for dates in the specified range.
 * Useful for calculating weekly or monthly totals.
 *
 * @param startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param endDate - End date in YYYY-MM-DD format (inclusive)
 * @param userId - User ID (null for v1 local user)
 * @returns Array of DailyPointsRow objects in the date range
 *
 * @example
 * ```typescript
 * const today = new Date().toISOString().split('T')[0];
 * const weekAgo = new Date();
 * weekAgo.setDate(weekAgo.getDate() - 7);
 * const weekRecords = getDailyPointsForDateRange(
 *   weekAgo.toISOString().split('T')[0],
 *   today
 * );
 * const weeklyTotal = weekRecords.reduce(
 *   (sum, r) => sum + calculateTotalDailyPoints(r.date),
 *   0
 * );
 * console.log(`Weekly total: ${weeklyTotal} points`);
 * ```
 */
export function getDailyPointsForDateRange(
  startDate: string,
  endDate: string,
  userId: string | null = null
): DailyPointsRow[] {
  const dailyPoints = getDailyPoints();

  return dailyPoints.filter(dp => {
    const isInRange = dp.date >= startDate && dp.date <= endDate;
    const matchesUser = dp.user_id === userId;
    return isInRange && matchesUser;
  });
}

/**
 * Calculate total points for a date range.
 *
 * Sums up total daily points (baseline + achievements) for all dates in range.
 * Useful for weekly, monthly, or all-time statistics.
 *
 * @param startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param endDate - End date in YYYY-MM-DD format (inclusive)
 * @param userId - User ID (null for v1 local user)
 * @returns Total points earned in the date range
 *
 * @example
 * ```typescript
 * const today = new Date().toISOString().split('T')[0];
 * const weekAgo = new Date();
 * weekAgo.setDate(weekAgo.getDate() - 7);
 * const weeklyTotal = calculateTotalPointsForDateRange(
 *   weekAgo.toISOString().split('T')[0],
 *   today
 * );
 * console.log(`Points this week: ${weeklyTotal}`);
 * ```
 */
export function calculateTotalPointsForDateRange(
  startDate: string,
  endDate: string,
  userId: string | null = null
): number {
  // Get all dates with baseline records in range
  const dailyPointsRecords = getDailyPointsForDateRange(startDate, endDate, userId);

  // Calculate total for each date
  const totalFromRecords = dailyPointsRecords.reduce((sum, record) => {
    return sum + calculateTotalDailyPoints(record.date, userId);
  }, 0);

  // Also need to account for dates with achievements but no baseline record
  // Get achievement points for the entire range
  const achievementPoints = calculatePointsForDateRange(startDate, endDate, userId);

  // Subtract achievement points already counted in records
  const achievementPointsInRecords = dailyPointsRecords.reduce((sum, record) => {
    return sum + calculatePointsForDateRange(record.date, record.date, userId);
  }, 0);

  const achievementPointsWithoutBaseline = achievementPoints - achievementPointsInRecords;

  return totalFromRecords + achievementPointsWithoutBaseline;
}

/**
 * Delete a daily points record.
 *
 * Removes the baseline record for a specific date.
 * This does not affect achievements for that date.
 *
 * @param date - Date in YYYY-MM-DD format
 * @param userId - User ID (null for v1 local user)
 * @returns True if record was deleted, false if not found
 *
 * @example
 * ```typescript
 * const deleted = deleteDailyPointsRecord('2024-01-01');
 * if (deleted) {
 *   console.log('Baseline record deleted');
 * }
 * ```
 */
export function deleteDailyPointsRecord(
  date: string,
  userId: string | null = null
): boolean {
  const dailyPoints = getDailyPoints();
  const index = dailyPoints.findIndex(dp => dp.date === date && dp.user_id === userId);

  if (index === -1) {
    return false;
  }

  dailyPoints.splice(index, 1);
  setDailyPoints(dailyPoints);

  return true;
}
