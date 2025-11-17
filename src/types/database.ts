/**
 * Database Type Definitions
 *
 * This file contains all TypeScript type definitions for the Waypoint App database schema.
 * Types are organized into two categories:
 * 1. Database Row Types - exact mirror of database schema (what comes from Supabase)
 * 2. Application Types - enriched types with computed properties for UI consumption
 *
 * All types use string for UUIDs and timestamps (as returned from database).
 * Nullable fields are marked with `| null` type union.
 *
 * @module types/database
 */

// =====================================================
// DATABASE ROW TYPES
// =====================================================
// These types exactly mirror the database schema structure
// and represent the raw data as returned from the database.

/**
 * ItemRow represents a row from the items table.
 *
 * Items are the core entities in Waypoint App - Directions, Waypoints, and Steps.
 * They support hierarchical relationships via parent_id and auto-linking via text matching.
 *
 * @property id - UUID primary key
 * @property user_id - Owner of the item (null in v1, populated in v3 with Supabase Auth)
 * @property text - Content of the item (used for auto-linking duplicate detection)
 * @property type - Item type: 'direction' (100pts), 'waypoint' (25pts), or 'step' (5pts)
 * @property parent_id - Parent item for tree hierarchy (null for root items)
 * @property position - Sort order among siblings (0-indexed)
 * @property completed - Whether the item has been completed
 * @property completed_at - Timestamp when completed (null if not completed)
 * @property points - Point value for this item (customizable per-item, defaults by type)
 * @property deleted_at - Soft delete timestamp (null if not deleted)
 * @property created_at - When the item was created
 * @property updated_at - When the item was last updated (auto-updated by trigger)
 *
 * @example
 * ```typescript
 * const item: ItemRow = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   user_id: null, // v1 - no auth yet
 *   text: 'Complete project documentation',
 *   type: 'waypoint',
 *   parent_id: '123e4567-e89b-12d3-a456-426614174001',
 *   position: 0,
 *   completed: false,
 *   completed_at: null,
 *   points: 25,
 *   deleted_at: null,
 *   created_at: '2024-01-01T00:00:00Z',
 *   updated_at: '2024-01-01T00:00:00Z',
 * };
 * ```
 */
export type ItemRow = {
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

/**
 * AchievementRow represents a row from the achievements table.
 *
 * Achievements record completion events for the achievement log.
 * Points are stored at achievement time to preserve history if point values change later.
 *
 * @property id - UUID primary key
 * @property user_id - User who earned the achievement (null in v1)
 * @property item_id - The item that was completed
 * @property points_earned - Points awarded (copied from item.points at completion time)
 * @property achieved_at - When the achievement was earned
 * @property created_at - Record creation timestamp
 *
 * @example
 * ```typescript
 * const achievement: AchievementRow = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   user_id: null,
 *   item_id: '123e4567-e89b-12d3-a456-426614174001',
 *   points_earned: 25,
 *   achieved_at: '2024-01-01T12:00:00Z',
 *   created_at: '2024-01-01T12:00:00Z',
 * };
 * ```
 */
export type AchievementRow = {
  id: string;
  user_id: string | null;
  item_id: string;
  points_earned: number;
  achieved_at: string;
  created_at: string;
};

/**
 * DailyPointsRow represents a row from the daily_points table.
 *
 * Daily points track the baseline points awarded for existing each day (+10 default).
 * Total daily points = baseline_points + SUM(achievements.points_earned for that date).
 * There is one record per user per date (enforced by unique constraint).
 *
 * @property id - UUID primary key
 * @property user_id - User receiving baseline points (null in v1)
 * @property date - The date for this baseline entry (YYYY-MM-DD format)
 * @property baseline_points - Baseline points for existing (default 10)
 * @property created_at - Record creation timestamp
 *
 * @example
 * ```typescript
 * const dailyPoints: DailyPointsRow = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   user_id: null,
 *   date: '2024-01-01',
 *   baseline_points: 10,
 *   created_at: '2024-01-01T00:00:00Z',
 * };
 * ```
 */
export type DailyPointsRow = {
  id: string;
  user_id: string | null;
  date: string;
  baseline_points: number;
  created_at: string;
};

/**
 * UserRow represents a row from the users table.
 *
 * Users store account information and preferences.
 * In v1: email is null (no auth), preferences store local settings.
 * In v3: populated with Supabase Auth user ID and email.
 *
 * @property id - UUID primary key (will match Supabase Auth user ID in v3)
 * @property email - User email (null in v1, unique when populated in v3)
 * @property display_name - User's display name (null in v1)
 * @property preferences - Flexible JSONB object for user settings (point values, theme, etc.)
 * @property created_at - Account creation timestamp
 * @property updated_at - Last update timestamp (auto-updated by trigger)
 *
 * @example
 * ```typescript
 * const user: UserRow = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   email: null, // v1 - no auth
 *   display_name: null,
 *   preferences: {
 *     defaultPointValues: { direction: 100, waypoint: 25, step: 5 },
 *     theme: 'dark',
 *     dailyBaseline: 10,
 *   },
 *   created_at: '2024-01-01T00:00:00Z',
 *   updated_at: '2024-01-01T00:00:00Z',
 * };
 * ```
 */
export type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
};

// =====================================================
// APPLICATION-LEVEL ENRICHED TYPES
// =====================================================
// These types extend the row types with computed properties
// populated by the application layer for UI consumption.

/**
 * Item extends ItemRow with optional computed properties for UI consumption.
 *
 * This type is used throughout the application when displaying items in the UI.
 * Computed properties are populated by the data layer based on relationships and auto-linking.
 *
 * @property children - Optional array of child items (populated for tree structure in outline view)
 * @property linkedInstances - Optional array of other instances with matching text (for auto-linking UI)
 * @property isCanonical - Optional flag indicating if this is the canonical instance (first by created_at)
 *
 * All other properties inherited from ItemRow.
 *
 * @example
 * ```typescript
 * const enrichedItem: Item = {
 *   // ...all ItemRow properties
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   text: 'Write documentation',
 *   type: 'waypoint',
 *   // ...other ItemRow fields
 *
 *   // Computed properties
 *   children: [
 *     { id: '...', text: 'Draft outline', type: 'step', ... },
 *     { id: '...', text: 'Write content', type: 'step', ... },
 *   ],
 *   linkedInstances: [
 *     { id: '...', parent_text: 'Project Alpha' },
 *     { id: '...', parent_text: 'Project Beta' },
 *   ],
 *   isCanonical: true,
 * };
 * ```
 */
export type Item = ItemRow & {
  /**
   * Child items in the tree hierarchy.
   * Populated by querying items WHERE parent_id = this.id AND deleted_at IS NULL.
   * Ordered by position ASC.
   */
  children?: Item[];

  /**
   * Other instances of items with identical text (auto-linking).
   * Each entry contains the item's ID and the text of its parent for context.
   * Populated by querying items WHERE LOWER(text) = LOWER(this.text) AND id != this.id.
   */
  linkedInstances?: Array<{
    id: string;
    parent_text: string;
  }>;

  /**
   * Flag indicating if this is the canonical instance.
   * The canonical instance is the first occurrence (earliest created_at) of items with matching text.
   * Used to determine which instance to navigate to when user clicks auto-link indicator.
   */
  isCanonical?: boolean;
};

/**
 * Achievement extends AchievementRow with item details for display in achievement log.
 *
 * This type includes the essential item information needed to display achievements
 * without requiring additional queries to join with the items table.
 *
 * @property item - Essential item details (text, type, points) for display
 *
 * All other properties inherited from AchievementRow.
 *
 * @example
 * ```typescript
 * const enrichedAchievement: Achievement = {
 *   // ...all AchievementRow properties
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   item_id: '123e4567-e89b-12d3-a456-426614174001',
 *   points_earned: 25,
 *   achieved_at: '2024-01-01T12:00:00Z',
 *
 *   // Enriched item details
 *   item: {
 *     text: 'Complete project documentation',
 *     type: 'waypoint',
 *     points: 25,
 *   },
 * };
 * ```
 */
export type Achievement = AchievementRow & {
  /**
   * Item details for display in achievement log.
   * Includes text, type, and points to show what was achieved without additional queries.
   * Note: points here is the original item.points, while points_earned is what was actually awarded.
   */
  item: Pick<ItemRow, 'text' | 'type' | 'points'>;
};

// =====================================================
// TYPE GUARDS AND UTILITIES
// =====================================================
// Helper functions for type checking and validation.

/**
 * Type guard to check if a value is a valid item type.
 *
 * @param value - Value to check
 * @returns True if value is 'direction', 'waypoint', or 'step'
 *
 * @example
 * ```typescript
 * if (isItemType(unknownValue)) {
 *   // TypeScript now knows unknownValue is 'direction' | 'waypoint' | 'step'
 *   const item: ItemRow = { ..., type: unknownValue };
 * }
 * ```
 */
export function isItemType(value: unknown): value is ItemRow['type'] {
  return value === 'direction' || value === 'waypoint' || value === 'step';
}

/**
 * Type guard to check if an item has children populated.
 *
 * @param item - Item to check
 * @returns True if item has children array (even if empty)
 *
 * @example
 * ```typescript
 * if (hasChildren(item)) {
 *   // TypeScript knows item.children is defined
 *   item.children.forEach(child => ...);
 * }
 * ```
 */
export function hasChildren(item: Item): item is Item & { children: Item[] } {
  return Array.isArray(item.children);
}

/**
 * Type guard to check if an item has linked instances populated.
 *
 * @param item - Item to check
 * @returns True if item has linkedInstances array (even if empty)
 *
 * @example
 * ```typescript
 * if (hasLinkedInstances(item)) {
 *   // TypeScript knows item.linkedInstances is defined
 *   const count = item.linkedInstances.length;
 * }
 * ```
 */
export function hasLinkedInstances(
  item: Item
): item is Item & { linkedInstances: Array<{ id: string; parent_text: string }> } {
  return Array.isArray(item.linkedInstances);
}

// =====================================================
// DEFAULT POINT VALUES
// =====================================================
// Constants for default point values by item type.

/**
 * Default point values for each item type.
 * These are used when creating new items if no custom point value is specified.
 *
 * - Direction: 100 points (major life direction/goal)
 * - Waypoint: 25 points (significant milestone)
 * - Step: 5 points (individual action)
 *
 * Users can customize these defaults in their preferences or override per-item.
 */
export const DEFAULT_POINTS: Record<ItemRow['type'], number> = {
  direction: 100,
  waypoint: 25,
  step: 5,
} as const;

/**
 * Default baseline points awarded for existing each day.
 * This value is stored in daily_points.baseline_points.
 */
export const DEFAULT_DAILY_BASELINE = 10;

// =====================================================
// EXPORTS
// =====================================================
// Re-export all types for convenient importing throughout the application.

export type {
  // Database row types
  ItemRow,
  AchievementRow,
  DailyPointsRow,
  UserRow,

  // Enriched application types
  Item,
  Achievement,
};
