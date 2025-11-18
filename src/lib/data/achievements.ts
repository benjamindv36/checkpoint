/**
 * Achievement Data Access Layer
 *
 * This module provides operations for achievement logging in localStorage.
 * Achievements are created when items are marked complete and deleted when unmarked.
 *
 * Operations:
 * - createAchievement() - Log achievement when item completed
 * - deleteAchievement() - Remove achievement when item unmarked
 * - getAchievementById() - Fetch single achievement by ID
 * - getAchievementsByUserId() - Fetch achievement log for user
 * - getAchievementsByDateRange() - Fetch achievements for date range (daily totals)
 * - getAchievementsForItem() - Fetch all achievements for a specific item
 *
 * Key Behaviors:
 * - Points are stored at achievement time (points_earned from item.points)
 * - This preserves history if point values change later
 * - Soft-deleted items remain in achievement log if completed before deletion
 *
 * @module lib/data/achievements
 */

import { getAchievements, setAchievements } from '@/lib/storage/localStorage';
import { generateUUID } from '@/lib/utils/uuid';
import { achievementCreateSchema } from '@/schemas/validation';
import type { AchievementRow } from '@/types/database';
import type { AchievementCreateInput } from '@/schemas/validation';

/**
 * Create a new achievement record.
 *
 * Called when an item is marked complete. Generates UUID, validates input,
 * and stores the achievement with timestamp.
 *
 * Points are stored at achievement time (not referenced from item.points) to
 * preserve history if point values change later.
 *
 * @param input - Achievement data (item_id, points_earned)
 * @returns Created AchievementRow with generated ID and timestamps
 * @throws ZodError if validation fails
 *
 * @example
 * ```typescript
 * const achievement = createAchievement({
 *   item_id: '123e4567-e89b-12d3-a456-426614174000',
 *   points_earned: 25,
 * });
 * console.log('Achievement earned at:', achievement.achieved_at);
 * ```
 */
export function createAchievement(input: AchievementCreateInput): AchievementRow {
  // Validate input with Zod schema
  const validated = achievementCreateSchema.parse(input);

  // Generate UUID and timestamps
  const now = new Date().toISOString();
  const id = generateUUID();

  // Create achievement record
  const achievement: AchievementRow = {
    id,
    user_id: null, // v1: no authentication, keep null
    item_id: validated.item_id,
    points_earned: validated.points_earned,
    achieved_at: now,
    created_at: now,
  };

  // Save to localStorage
  const achievements = getAchievements();
  achievements.push(achievement);
  setAchievements(achievements);

  return achievement;
}

/**
 * Delete an achievement record.
 *
 * Called when an item is unmarked (completion toggled off).
 * Removes the achievement from the log.
 *
 * @param achievementId - UUID of the achievement to delete
 * @returns True if achievement was deleted, false if not found
 *
 * @example
 * ```typescript
 * const deleted = deleteAchievement('123e4567-e89b-12d3-a456-426614174000');
 * if (deleted) {
 *   console.log('Achievement removed');
 * }
 * ```
 */
export function deleteAchievement(achievementId: string): boolean {
  const achievements = getAchievements();
  const index = achievements.findIndex(a => a.id === achievementId);

  if (index === -1) {
    return false;
  }

  // Remove achievement from array
  achievements.splice(index, 1);
  setAchievements(achievements);

  return true;
}

/**
 * Get a single achievement by ID.
 *
 * @param achievementId - UUID of the achievement to retrieve
 * @returns AchievementRow if found, null otherwise
 *
 * @example
 * ```typescript
 * const achievement = getAchievementById('123e4567-e89b-12d3-a456-426614174000');
 * if (achievement) {
 *   console.log('Points earned:', achievement.points_earned);
 * }
 * ```
 */
export function getAchievementById(achievementId: string): AchievementRow | null {
  const achievements = getAchievements();
  return achievements.find(a => a.id === achievementId) ?? null;
}

/**
 * Get all achievements for a user.
 *
 * Returns achievements ordered by achieved_at DESC (most recent first).
 * In v1, user_id is null for all achievements (no authentication).
 *
 * @param userId - User ID to filter by (null for v1 local user)
 * @returns Array of AchievementRow objects, ordered by date descending
 *
 * @example
 * ```typescript
 * const achievements = getAchievementsByUserId(null);
 * const totalPoints = achievements.reduce((sum, a) => sum + a.points_earned, 0);
 * console.log(`Total points earned: ${totalPoints}`);
 * ```
 */
export function getAchievementsByUserId(userId: string | null): AchievementRow[] {
  const achievements = getAchievements();

  return achievements
    .filter(a => a.user_id === userId)
    .sort((a, b) => {
      // Sort by achieved_at DESC (most recent first)
      return new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime();
    });
}

/**
 * Get achievements within a date range.
 *
 * Used for calculating daily totals and filtering achievement log by date.
 * Dates are compared using YYYY-MM-DD format (date portion only, ignoring time).
 *
 * @param startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param endDate - End date in YYYY-MM-DD format (inclusive)
 * @param userId - Optional user ID to filter by (null for v1 local user)
 * @returns Array of AchievementRow objects in the date range
 *
 * @example
 * ```typescript
 * // Get today's achievements
 * const today = new Date().toISOString().split('T')[0];
 * const todayAchievements = getAchievementsByDateRange(today, today);
 * const todayPoints = todayAchievements.reduce((sum, a) => sum + a.points_earned, 0);
 * console.log(`Points earned today: ${todayPoints}`);
 *
 * // Get this week's achievements
 * const weekAgo = new Date();
 * weekAgo.setDate(weekAgo.getDate() - 7);
 * const weekAchievements = getAchievementsByDateRange(
 *   weekAgo.toISOString().split('T')[0],
 *   today
 * );
 * ```
 */
export function getAchievementsByDateRange(
  startDate: string,
  endDate: string,
  userId: string | null = null
): AchievementRow[] {
  const achievements = getAchievements();

  return achievements.filter(a => {
    // Extract date portion (YYYY-MM-DD) from achieved_at timestamp
    const achievedDate = a.achieved_at.split('T')[0];

    // Check if within date range
    const isInRange = achievedDate >= startDate && achievedDate <= endDate;

    // Filter by user_id if provided
    const matchesUser = userId === null || a.user_id === userId;

    return isInRange && matchesUser;
  });
}

/**
 * Get all achievements for a specific item.
 *
 * Returns achievements for a given item, ordered by achieved_at DESC.
 * An item can have multiple achievements if it was completed multiple times
 * (marked complete, unmarked, then completed again).
 *
 * @param itemId - UUID of the item
 * @returns Array of AchievementRow objects for the item
 *
 * @example
 * ```typescript
 * const itemAchievements = getAchievementsForItem('123e4567-e89b-12d3-a456-426614174000');
 * console.log(`This item has been completed ${itemAchievements.length} times`);
 * ```
 */
export function getAchievementsForItem(itemId: string): AchievementRow[] {
  const achievements = getAchievements();

  return achievements
    .filter(a => a.item_id === itemId)
    .sort((a, b) => {
      // Sort by achieved_at DESC (most recent first)
      return new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime();
    });
}

/**
 * Get all achievements.
 *
 * Returns all achievements in the system.
 * Useful for admin views or statistics.
 *
 * @returns Array of all AchievementRow objects
 *
 * @example
 * ```typescript
 * const allAchievements = getAllAchievements();
 * console.log(`Total achievements: ${allAchievements.length}`);
 * ```
 */
export function getAllAchievements(): AchievementRow[] {
  return getAchievements();
}

/**
 * Calculate total points earned within a date range.
 *
 * Sums up points_earned for all achievements in the specified date range.
 * Does not include baseline points (those are in daily_points table).
 *
 * @param startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param endDate - End date in YYYY-MM-DD format (inclusive)
 * @param userId - Optional user ID to filter by (null for v1 local user)
 * @returns Total points earned in the date range
 *
 * @example
 * ```typescript
 * const today = new Date().toISOString().split('T')[0];
 * const todayPoints = calculatePointsForDateRange(today, today);
 * console.log(`Points earned today: ${todayPoints}`);
 * ```
 */
export function calculatePointsForDateRange(
  startDate: string,
  endDate: string,
  userId: string | null = null
): number {
  const achievements = getAchievementsByDateRange(startDate, endDate, userId);
  return achievements.reduce((sum, a) => sum + a.points_earned, 0);
}

/**
 * Delete all achievements for a specific item.
 *
 * Useful when permanently deleting an item (hard delete).
 * In normal soft delete scenarios, achievements should be preserved.
 *
 * @param itemId - UUID of the item
 * @returns Number of achievements deleted
 *
 * @example
 * ```typescript
 * const deletedCount = deleteAchievementsForItem('123e4567-e89b-12d3-a456-426614174000');
 * console.log(`Deleted ${deletedCount} achievements`);
 * ```
 */
export function deleteAchievementsForItem(itemId: string): number {
  const achievements = getAchievements();
  const filtered = achievements.filter(a => a.item_id !== itemId);
  const deletedCount = achievements.length - filtered.length;

  if (deletedCount > 0) {
    setAchievements(filtered);
  }

  return deletedCount;
}
