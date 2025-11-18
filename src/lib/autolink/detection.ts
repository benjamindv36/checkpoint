/**
 * Auto-Linking Detection & Logic
 *
 * This module implements the auto-linking system for detecting and managing
 * duplicate items based on text matching. Items with identical text (case-insensitive)
 * are treated as linked instances of the same logical entity.
 *
 * Core Concepts:
 * - Canonical Instance: The first occurrence by created_at is the primary reference
 * - Linked Instances: All other items with matching text
 * - Case-Insensitive Matching: "Write Docs" = "write docs" = "WRITE DOCS"
 * - No Auto-Sync: Updates require explicit user confirmation to sync across instances
 *
 * Functions:
 * - findDuplicateItems() - Find all items with matching text
 * - determineCanonicalInstance() - Identify canonical instance and linked instances
 * - enrichItemsWithAutoLinks() - Add auto-link metadata for UI consumption
 * - handleItemDeletion() - Delete single or all instances based on user choice
 * - syncLinkedItemUpdates() - Update single or all instances based on user choice
 *
 * Performance Target: < 50ms per detection operation
 *
 * @module lib/autolink/detection
 */

import { getItemsByText, deleteItem, updateItem, getItemById } from '@/lib/data/items';
import type { ItemRow, Item } from '@/types/database';

/**
 * Find all duplicate items with matching text (case-insensitive).
 *
 * Queries items where LOWER(text) equals LOWER(input text).
 * Filters out soft-deleted items (deleted_at IS NULL).
 * Orders results by created_at ASC to find canonical instance first.
 *
 * This function is the foundation of the auto-linking system and must be
 * performant (target < 50ms per detection).
 *
 * @param text - Text to search for (case-insensitive matching)
 * @returns Array of matching ItemRow objects, ordered by created_at ASC (canonical first)
 *
 * @example
 * ```typescript
 * const duplicates = findDuplicateItems('Write Documentation');
 * if (duplicates.length > 1) {
 *   console.log(`Found ${duplicates.length} instances`);
 *   console.log('Canonical:', duplicates[0]); // First by created_at
 * }
 * ```
 */
export function findDuplicateItems(text: string): ItemRow[] {
  // Use existing getItemsByText which already implements:
  // - Case-insensitive matching (LOWER(text) comparison)
  // - Filtering of soft-deleted items (deleted_at IS NULL)
  // - Ordering by created_at ASC
  return getItemsByText(text);
}

/**
 * Determine canonical instance from an array of duplicate items.
 *
 * The canonical instance is the first occurrence by created_at (earliest timestamp).
 * This instance is marked with isCanonical: true and serves as the primary reference
 * when users navigate via auto-link indicators.
 *
 * All other items are returned as linked instances.
 *
 * @param items - Array of ItemRow objects with matching text (should be ordered by created_at ASC)
 * @returns Object with canonical item (with isCanonical flag) and array of linked instances
 *
 * @example
 * ```typescript
 * const duplicates = findDuplicateItems('Deploy app');
 * const { canonical, linkedInstances } = determineCanonicalInstance(duplicates);
 *
 * console.log('Canonical ID:', canonical.id);
 * console.log('Canonical flag:', canonical.isCanonical); // true
 * console.log('Linked instances:', linkedInstances.length);
 * ```
 */
export function determineCanonicalInstance(items: ItemRow[]): {
  canonical: Item;
  linkedInstances: ItemRow[];
} {
  if (items.length === 0) {
    throw new Error('Cannot determine canonical instance from empty array');
  }

  // First item by created_at is canonical (items should already be sorted)
  const [first, ...rest] = items;

  // Mark canonical item with isCanonical flag
  const canonical: Item = {
    ...first,
    isCanonical: true,
  };

  return {
    canonical,
    linkedInstances: rest,
  };
}

/**
 * Enrich items with auto-link metadata for UI consumption.
 *
 * For each item, detects duplicates and adds:
 * - linkedInstances: Array of other instances with matching text (id + parent context)
 * - isCanonical: Boolean flag indicating if this is the canonical instance
 *
 * This enriched data enables UI to display auto-link indicators, show "appears in N locations"
 * tooltips, and provide navigation to canonical instances.
 *
 * @param items - Array of ItemRow objects to enrich
 * @returns Array of Item objects with linkedInstances and isCanonical properties populated
 *
 * @example
 * ```typescript
 * const items = [item1, item2, item3];
 * const enriched = enrichItemsWithAutoLinks(items);
 *
 * enriched.forEach(item => {
 *   if (item.linkedInstances && item.linkedInstances.length > 0) {
 *     console.log(`"${item.text}" appears in ${item.linkedInstances.length + 1} locations`);
 *     console.log('Is canonical:', item.isCanonical);
 *   }
 * });
 * ```
 */
export function enrichItemsWithAutoLinks(items: ItemRow[]): Item[] {
  // Create a map to store all duplicates for efficient lookup
  const duplicatesMap = new Map<string, ItemRow[]>();

  // Find duplicates for each unique text (case-insensitive)
  const processedTexts = new Set<string>();

  items.forEach(item => {
    const lowerText = item.text.toLowerCase();
    if (!processedTexts.has(lowerText)) {
      processedTexts.add(lowerText);
      const duplicates = findDuplicateItems(item.text);
      if (duplicates.length > 1) {
        // Store duplicates for this text
        duplicates.forEach(dup => {
          duplicatesMap.set(dup.id, duplicates);
        });
      }
    }
  });

  // Enrich each item with auto-link metadata
  return items.map(item => {
    const duplicates = duplicatesMap.get(item.id);

    if (!duplicates || duplicates.length <= 1) {
      // No duplicates, return as-is
      return { ...item };
    }

    // Determine canonical instance
    const { canonical } = determineCanonicalInstance(duplicates);

    // Get other instances (excluding this item)
    const otherInstances = duplicates.filter(dup => dup.id !== item.id);

    // Build linkedInstances with parent context
    const linkedInstances = otherInstances.map(linkedItem => {
      // Get parent item to provide context
      let parent_text = '(root)';
      if (linkedItem.parent_id) {
        const parent = getItemById(linkedItem.parent_id);
        if (parent) {
          parent_text = parent.text;
        }
      }

      return {
        id: linkedItem.id,
        parent_text,
      };
    });

    // Return enriched item
    const enrichedItem: Item = {
      ...item,
      linkedInstances,
      isCanonical: item.id === canonical.id,
    };

    return enrichedItem;
  });
}

/**
 * Handle item deletion with auto-link awareness.
 *
 * If deleteAll is false, soft deletes only the specified item.
 * If deleteAll is true, finds all items with matching text and soft deletes all of them.
 *
 * Returns count of items deleted and their IDs for user feedback.
 * UI should show warning before deletion: "Also appears in N locations. Delete all or just this one?"
 *
 * @param itemId - UUID of the item to delete
 * @param deleteAll - If true, delete all instances with matching text; if false, delete only this item
 * @returns Object with deletedCount and array of deleted itemIds
 *
 * @example
 * ```typescript
 * // Delete only this instance
 * const result1 = handleItemDeletion(itemId, false);
 * console.log(`Deleted ${result1.deletedCount} item(s)`);
 *
 * // Delete all instances with matching text
 * const result2 = handleItemDeletion(itemId, true);
 * console.log(`Deleted all ${result2.deletedCount} instances`);
 * ```
 */
export function handleItemDeletion(
  itemId: string,
  deleteAll: boolean
): {
  deletedCount: number;
  itemIds: string[];
} {
  const item = getItemById(itemId);

  if (!item) {
    return {
      deletedCount: 0,
      itemIds: [],
    };
  }

  if (!deleteAll) {
    // Delete only this item
    const deleted = deleteItem(itemId);
    return {
      deletedCount: deleted ? 1 : 0,
      itemIds: deleted ? [itemId] : [],
    };
  }

  // Delete all instances with matching text
  const duplicates = findDuplicateItems(item.text);
  const deletedIds: string[] = [];

  duplicates.forEach(dup => {
    const deleted = deleteItem(dup.id);
    if (deleted) {
      deletedIds.push(dup.id);
    }
  });

  return {
    deletedCount: deletedIds.length,
    itemIds: deletedIds,
  };
}

/**
 * Sync updates across linked items with user control.
 *
 * By default (syncAll = false), updates only the specified item.
 * If syncAll = true, finds all items with matching text and updates all of them.
 *
 * This respects user intent - sometimes the same text has different meanings in different contexts,
 * so we don't automatically sync updates. The UI should offer "Update all instances" as an option.
 *
 * @param itemId - UUID of the item to update
 * @param updates - Partial item updates to apply
 * @param syncAll - If true, update all instances with matching text; if false, update only this item
 * @returns Object with updatedCount and array of updated itemIds
 *
 * @example
 * ```typescript
 * // Update only this instance (default behavior)
 * const result1 = syncLinkedItemUpdates(itemId, { completed: true }, false);
 * console.log(`Updated ${result1.updatedCount} item(s)`);
 *
 * // Update all instances (user explicitly chose to sync)
 * const result2 = syncLinkedItemUpdates(itemId, { points: 50 }, true);
 * console.log(`Synced update to all ${result2.updatedCount} instances`);
 * ```
 */
export function syncLinkedItemUpdates(
  itemId: string,
  updates: Partial<ItemRow>,
  syncAll: boolean = false
): {
  updatedCount: number;
  itemIds: string[];
} {
  const item = getItemById(itemId);

  if (!item) {
    return {
      updatedCount: 0,
      itemIds: [],
    };
  }

  if (!syncAll) {
    // Update only this item
    const updated = updateItem(itemId, updates);
    return {
      updatedCount: updated ? 1 : 0,
      itemIds: updated ? [itemId] : [],
    };
  }

  // Update all instances with matching text
  const duplicates = findDuplicateItems(item.text);
  const updatedIds: string[] = [];

  duplicates.forEach(dup => {
    const updated = updateItem(dup.id, updates);
    if (updated) {
      updatedIds.push(dup.id);
    }
  });

  return {
    updatedCount: updatedIds.length,
    itemIds: updatedIds,
  };
}
