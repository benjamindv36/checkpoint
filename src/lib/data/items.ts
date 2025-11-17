/**
 * Item Data Access Layer
 *
 * This module provides CRUD operations for items in localStorage.
 * All operations validate data with Zod schemas before storage and handle
 * soft deletion using deleted_at timestamps.
 *
 * Operations:
 * - createItem() - Create new item with UUID generation and validation
 * - updateItem() - Update existing item with partial validation
 * - deleteItem() - Soft delete item (sets deleted_at timestamp)
 * - getItemById() - Fetch single item by ID
 * - getItemsByParentId() - Fetch children for hierarchy queries
 * - getAllItems() - Fetch all items (including soft-deleted)
 * - getActiveItems() - Fetch only non-deleted items
 *
 * User ID Strategy (v1):
 * - Keep user_id null or use hardcoded 'local-user' value
 * - In v3, this will be populated with Supabase Auth user ID
 *
 * @module lib/data/items
 */

import { getItems, setItems } from '@/src/lib/storage/localStorage';
import { generateUUID } from '@/src/lib/utils/uuid';
import { itemCreateSchema, itemUpdateSchema } from '@/src/schemas/validation';
import { DEFAULT_POINTS } from '@/src/types/database';
import type { ItemRow } from '@/src/types/database';
import type { ItemCreateInput, ItemUpdateInput } from '@/src/schemas/validation';

/**
 * Create a new item in localStorage.
 *
 * Generates a UUID for the item, validates input with Zod schema,
 * sets default point values based on type, and saves to localStorage.
 *
 * Default point values:
 * - direction: 100 points
 * - waypoint: 25 points
 * - step: 5 points
 *
 * @param input - Item creation data (text, type, parent_id, position, points)
 * @returns Created ItemRow with generated ID and timestamps
 * @throws ZodError if validation fails
 *
 * @example
 * ```typescript
 * const newItem = createItem({
 *   text: 'Complete project documentation',
 *   type: 'waypoint',
 *   parent_id: null,
 *   position: 0,
 * });
 * console.log(newItem.id); // "123e4567-e89b-12d3-a456-426614174000"
 * console.log(newItem.points); // 25 (default for waypoint)
 * ```
 */
export function createItem(input: ItemCreateInput): ItemRow {
  // Validate input with Zod schema
  const validated = itemCreateSchema.parse(input);

  // Generate UUID and timestamps
  const now = new Date().toISOString();
  const id = generateUUID();

  // Create item with defaults
  const item: ItemRow = {
    id,
    user_id: null, // v1: no authentication, keep null
    text: validated.text,
    type: validated.type,
    parent_id: validated.parent_id ?? null,
    position: validated.position ?? 0,
    completed: false,
    completed_at: null,
    points: validated.points ?? DEFAULT_POINTS[validated.type],
    deleted_at: null,
    created_at: now,
    updated_at: now,
  };

  // Save to localStorage
  const items = getItems();
  items.push(item);
  setItems(items);

  return item;
}

/**
 * Update an existing item in localStorage.
 *
 * Validates partial updates with Zod schema, merges with existing item,
 * and updates the updated_at timestamp. If completed status changes to true,
 * sets completed_at timestamp.
 *
 * @param itemId - UUID of the item to update
 * @param updates - Partial item data to update
 * @returns Updated ItemRow, or null if item not found
 * @throws ZodError if validation fails
 *
 * @example
 * ```typescript
 * const updated = updateItem('123e4567-e89b-12d3-a456-426614174000', {
 *   text: 'Updated text',
 *   completed: true,
 * });
 * if (updated) {
 *   console.log(updated.completed_at); // timestamp when marked complete
 * }
 * ```
 */
export function updateItem(itemId: string, updates: ItemUpdateInput): ItemRow | null {
  // Validate updates with Zod schema
  const validated = itemUpdateSchema.parse(updates);

  // Get all items
  const items = getItems();
  const index = items.findIndex(item => item.id === itemId);

  if (index === -1) {
    return null;
  }

  // Get current item
  const currentItem = items[index];

  // Update timestamps
  const now = new Date().toISOString();
  const completed_at =
    validated.completed === true && !currentItem.completed
      ? now // Set completed_at when marking as complete
      : validated.completed === false
        ? null // Clear completed_at when unmarking
        : currentItem.completed_at; // Keep existing value

  // Merge updates with current item
  const updatedItem: ItemRow = {
    ...currentItem,
    ...validated,
    completed_at,
    updated_at: now,
  };

  // Save updated items
  items[index] = updatedItem;
  setItems(items);

  return updatedItem;
}

/**
 * Soft delete an item by setting deleted_at timestamp.
 *
 * Does not remove the item from storage. Instead, sets the deleted_at field
 * to preserve achievement history and allow potential restoration.
 *
 * Note: Soft-deleted items should be filtered out in queries unless specifically
 * needed (e.g., for achievement history or trash view).
 *
 * @param itemId - UUID of the item to delete
 * @returns Deleted ItemRow with deleted_at set, or null if item not found
 *
 * @example
 * ```typescript
 * const deleted = deleteItem('123e4567-e89b-12d3-a456-426614174000');
 * if (deleted) {
 *   console.log('Item soft-deleted at:', deleted.deleted_at);
 * }
 * ```
 */
export function deleteItem(itemId: string): ItemRow | null {
  const items = getItems();
  const index = items.findIndex(item => item.id === itemId);

  if (index === -1) {
    return null;
  }

  // Soft delete by setting deleted_at timestamp
  const now = new Date().toISOString();
  const deletedItem: ItemRow = {
    ...items[index],
    deleted_at: now,
    updated_at: now,
  };

  items[index] = deletedItem;
  setItems(items);

  return deletedItem;
}

/**
 * Get a single item by ID.
 *
 * Returns the item if found, regardless of deleted_at status.
 * Use getActiveItemById() if you want to exclude soft-deleted items.
 *
 * @param itemId - UUID of the item to retrieve
 * @returns ItemRow if found, null otherwise
 *
 * @example
 * ```typescript
 * const item = getItemById('123e4567-e89b-12d3-a456-426614174000');
 * if (item) {
 *   console.log(item.text);
 * }
 * ```
 */
export function getItemById(itemId: string): ItemRow | null {
  const items = getItems();
  return items.find(item => item.id === itemId) ?? null;
}

/**
 * Get a single active (non-deleted) item by ID.
 *
 * Filters out soft-deleted items (deleted_at !== null).
 *
 * @param itemId - UUID of the item to retrieve
 * @returns ItemRow if found and not deleted, null otherwise
 *
 * @example
 * ```typescript
 * const item = getActiveItemById('123e4567-e89b-12d3-a456-426614174000');
 * if (item) {
 *   console.log('Active item:', item.text);
 * }
 * ```
 */
export function getActiveItemById(itemId: string): ItemRow | null {
  const items = getItems();
  return items.find(item => item.id === itemId && item.deleted_at === null) ?? null;
}

/**
 * Get all child items for a given parent ID.
 *
 * Queries items by parent_id for building tree hierarchy.
 * Excludes soft-deleted items by default.
 * Results are ordered by position ASC for proper sibling ordering.
 *
 * @param parentId - UUID of the parent item, or null for root items
 * @param includeDeleted - Whether to include soft-deleted items (default: false)
 * @returns Array of ItemRow objects that are children of the parent
 *
 * @example
 * ```typescript
 * const children = getItemsByParentId('123e4567-e89b-12d3-a456-426614174000');
 * console.log(`Found ${children.length} children`);
 * children.forEach(child => console.log(`- ${child.text}`));
 * ```
 */
export function getItemsByParentId(
  parentId: string | null,
  includeDeleted: boolean = false
): ItemRow[] {
  const items = getItems();

  return items
    .filter(item => {
      const matchesParent = item.parent_id === parentId;
      const isNotDeleted = includeDeleted || item.deleted_at === null;
      return matchesParent && isNotDeleted;
    })
    .sort((a, b) => a.position - b.position); // Order by position ASC
}

/**
 * Get all items from localStorage.
 *
 * Returns all items including soft-deleted ones.
 * Useful for admin views, trash, or migration operations.
 *
 * @returns Array of all ItemRow objects
 *
 * @example
 * ```typescript
 * const allItems = getAllItems();
 * const deletedCount = allItems.filter(i => i.deleted_at !== null).length;
 * console.log(`Total: ${allItems.length}, Deleted: ${deletedCount}`);
 * ```
 */
export function getAllItems(): ItemRow[] {
  return getItems();
}

/**
 * Get all active (non-deleted) items from localStorage.
 *
 * Filters out soft-deleted items (deleted_at !== null).
 * This is the most common query for displaying items to users.
 *
 * @returns Array of active ItemRow objects
 *
 * @example
 * ```typescript
 * const activeItems = getActiveItems();
 * console.log(`${activeItems.length} active items`);
 * ```
 */
export function getActiveItems(): ItemRow[] {
  const items = getItems();
  return items.filter(item => item.deleted_at === null);
}

/**
 * Get all root items (items with no parent).
 *
 * Returns items where parent_id is null.
 * Excludes soft-deleted items by default.
 * Ordered by position ASC.
 *
 * @param includeDeleted - Whether to include soft-deleted items (default: false)
 * @returns Array of root ItemRow objects
 *
 * @example
 * ```typescript
 * const rootItems = getRootItems();
 * rootItems.forEach(item => {
 *   console.log(`Direction: ${item.text}`);
 * });
 * ```
 */
export function getRootItems(includeDeleted: boolean = false): ItemRow[] {
  return getItemsByParentId(null, includeDeleted);
}

/**
 * Get items matching a specific text (case-insensitive).
 *
 * Used for auto-linking duplicate detection.
 * Returns items with exact text match (case-insensitive).
 * Excludes soft-deleted items.
 * Ordered by created_at ASC to find canonical instance first.
 *
 * @param text - Text to search for
 * @returns Array of matching ItemRow objects, ordered by creation time
 *
 * @example
 * ```typescript
 * const matches = getItemsByText('Write documentation');
 * if (matches.length > 1) {
 *   console.log(`This text appears in ${matches.length} locations`);
 *   const canonical = matches[0]; // First by created_at
 * }
 * ```
 */
export function getItemsByText(text: string): ItemRow[] {
  const items = getItems();
  const lowerText = text.toLowerCase();

  return items
    .filter(item => {
      const matchesText = item.text.toLowerCase() === lowerText;
      const isNotDeleted = item.deleted_at === null;
      return matchesText && isNotDeleted;
    })
    .sort((a, b) => {
      // Sort by created_at ASC to find canonical instance first
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
}

/**
 * Restore a soft-deleted item by clearing deleted_at timestamp.
 *
 * Sets deleted_at to null to restore the item to active status.
 *
 * @param itemId - UUID of the item to restore
 * @returns Restored ItemRow, or null if item not found
 *
 * @example
 * ```typescript
 * const restored = restoreItem('123e4567-e89b-12d3-a456-426614174000');
 * if (restored) {
 *   console.log('Item restored:', restored.text);
 * }
 * ```
 */
export function restoreItem(itemId: string): ItemRow | null {
  const items = getItems();
  const index = items.findIndex(item => item.id === itemId);

  if (index === -1) {
    return null;
  }

  // Restore by clearing deleted_at
  const now = new Date().toISOString();
  const restoredItem: ItemRow = {
    ...items[index],
    deleted_at: null,
    updated_at: now,
  };

  items[index] = restoredItem;
  setItems(items);

  return restoredItem;
}
