/**
 * localStorage Storage Utilities
 *
 * This module provides low-level storage operations for localStorage.
 * All data is stored using consistent key naming with 'waypoint:' prefix.
 *
 * Key structure:
 * - 'waypoint:items' - Array of ItemRow
 * - 'waypoint:achievements' - Array of AchievementRow
 * - 'waypoint:daily_points' - Array of DailyPointsRow
 * - 'waypoint:user' - UserRow object
 *
 * All operations handle JSON serialization/deserialization and parse errors gracefully.
 *
 * @module lib/storage/localStorage
 */

import type { ItemRow, AchievementRow, DailyPointsRow, UserRow } from '@/src/types/database';

// localStorage key constants
const STORAGE_KEYS = {
  ITEMS: 'waypoint:items',
  ACHIEVEMENTS: 'waypoint:achievements',
  DAILY_POINTS: 'waypoint:daily_points',
  USER: 'waypoint:user',
} as const;

/**
 * Get items array from localStorage.
 *
 * Retrieves all items stored in localStorage under the 'waypoint:items' key.
 * Handles missing keys and JSON parse errors gracefully by returning empty array.
 *
 * @returns Array of ItemRow objects, or empty array if key missing or parse error
 *
 * @example
 * ```typescript
 * const items = getItems();
 * console.log(`Found ${items.length} items`);
 * ```
 */
export function getItems(): ItemRow[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!data) return [];
    return JSON.parse(data) as ItemRow[];
  } catch (error) {
    console.error('Error parsing items from localStorage:', error);
    return [];
  }
}

/**
 * Save items array to localStorage.
 *
 * Stores items array in localStorage using JSON serialization.
 * Uses consistent key naming with 'waypoint:items' key.
 *
 * @param items - Array of ItemRow objects to save
 * @throws Error if localStorage quota exceeded or other write error
 *
 * @example
 * ```typescript
 * const items = [...];
 * setItems(items);
 * ```
 */
export function setItems(items: ItemRow[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('localStorage quota exceeded. Please clear some data.');
    }
    throw error;
  }
}

/**
 * Get achievements array from localStorage.
 *
 * Retrieves all achievements stored in localStorage under the 'waypoint:achievements' key.
 * Handles missing keys and JSON parse errors gracefully by returning empty array.
 *
 * @returns Array of AchievementRow objects, or empty array if key missing or parse error
 *
 * @example
 * ```typescript
 * const achievements = getAchievements();
 * const totalPoints = achievements.reduce((sum, a) => sum + a.points_earned, 0);
 * ```
 */
export function getAchievements(): AchievementRow[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    if (!data) return [];
    return JSON.parse(data) as AchievementRow[];
  } catch (error) {
    console.error('Error parsing achievements from localStorage:', error);
    return [];
  }
}

/**
 * Save achievements array to localStorage.
 *
 * Stores achievements array in localStorage using JSON serialization.
 * Uses consistent key naming with 'waypoint:achievements' key.
 *
 * @param achievements - Array of AchievementRow objects to save
 * @throws Error if localStorage quota exceeded or other write error
 *
 * @example
 * ```typescript
 * const achievements = [...];
 * setAchievements(achievements);
 * ```
 */
export function setAchievements(achievements: AchievementRow[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('localStorage quota exceeded. Please clear some data.');
    }
    throw error;
  }
}

/**
 * Get daily points array from localStorage.
 *
 * Retrieves all daily points records stored in localStorage under the 'waypoint:daily_points' key.
 * Handles missing keys and JSON parse errors gracefully by returning empty array.
 *
 * @returns Array of DailyPointsRow objects, or empty array if key missing or parse error
 *
 * @example
 * ```typescript
 * const dailyPoints = getDailyPoints();
 * const todayRecord = dailyPoints.find(dp => dp.date === '2024-01-01');
 * ```
 */
export function getDailyPoints(): DailyPointsRow[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_POINTS);
    if (!data) return [];
    return JSON.parse(data) as DailyPointsRow[];
  } catch (error) {
    console.error('Error parsing daily points from localStorage:', error);
    return [];
  }
}

/**
 * Save daily points array to localStorage.
 *
 * Stores daily points array in localStorage using JSON serialization.
 * Uses consistent key naming with 'waypoint:daily_points' key.
 *
 * @param dailyPoints - Array of DailyPointsRow objects to save
 * @throws Error if localStorage quota exceeded or other write error
 *
 * @example
 * ```typescript
 * const dailyPoints = [...];
 * setDailyPoints(dailyPoints);
 * ```
 */
export function setDailyPoints(dailyPoints: DailyPointsRow[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_POINTS, JSON.stringify(dailyPoints));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('localStorage quota exceeded. Please clear some data.');
    }
    throw error;
  }
}

/**
 * Get user object from localStorage.
 *
 * Retrieves user data stored in localStorage under the 'waypoint:user' key.
 * If no user exists, returns a default local user object.
 *
 * In v1, user_id is 'local-user' and email is null (no authentication).
 * In v3, this will be populated with Supabase Auth user data.
 *
 * @returns UserRow object, or default local user if key missing or parse error
 *
 * @example
 * ```typescript
 * const user = getUser();
 * console.log(`User preferences:`, user.preferences);
 * ```
 */
export function getUser(): UserRow {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    if (!data) {
      // Return default local user for v1
      return createDefaultUser();
    }
    return JSON.parse(data) as UserRow;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return createDefaultUser();
  }
}

/**
 * Save user object to localStorage.
 *
 * Stores user data in localStorage using JSON serialization.
 * Uses consistent key naming with 'waypoint:user' key.
 *
 * @param user - UserRow object to save
 * @throws Error if localStorage quota exceeded or other write error
 *
 * @example
 * ```typescript
 * const user = getUser();
 * user.preferences.theme = 'dark';
 * setUser(user);
 * ```
 */
export function setUser(user: UserRow): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('localStorage quota exceeded. Please clear some data.');
    }
    throw error;
  }
}

/**
 * Create default user object for v1 (no authentication).
 *
 * Returns a default local user with:
 * - id: 'local-user' (hardcoded for v1)
 * - email: null (no auth in v1)
 * - display_name: null
 * - preferences: empty object
 * - timestamps: current time
 *
 * @returns Default UserRow object for local storage
 */
function createDefaultUser(): UserRow {
  const now = new Date().toISOString();
  return {
    id: 'local-user',
    email: null,
    display_name: null,
    preferences: {},
    created_at: now,
    updated_at: now,
  };
}

/**
 * Clear all Waypoint data from localStorage.
 *
 * Removes all data stored under Waypoint keys.
 * Useful for testing, debugging, or user-initiated data reset.
 *
 * @example
 * ```typescript
 * clearAllData();
 * console.log('All Waypoint data cleared');
 * ```
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
