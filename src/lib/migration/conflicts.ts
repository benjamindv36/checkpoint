/**
 * Conflict Resolution Strategy
 *
 * This module provides utilities for detecting and resolving conflicts when migrating
 * from localStorage to Supabase. Conflicts occur when items exist in both sources.
 *
 * Key features:
 * - Detect items that exist in both localStorage and Supabase
 * - Compare timestamps to determine which version is newer
 * - Provide multiple merge strategies (keep local, keep cloud, keep both, keep newest)
 * - Support manual review workflow for complex conflicts
 *
 * @module lib/migration/conflicts
 */

import type { ItemRow } from '@/src/types/database';
import type {
  ConflictItem,
  ConflictDetectionResult,
  ConflictStrategy,
} from '@/src/types/migration';

/**
 * Detect conflicts between localStorage items and Supabase items.
 *
 * Identifies items that exist in both sources by comparing:
 * - Exact ID matches (same UUID in both sources)
 * - Text matches (same text content, indicating duplicate entries)
 *
 * @param localItems - Items from localStorage
 * @param supabaseItems - Items already in Supabase
 * @returns Detection result with all conflicts found
 *
 * @example
 * ```typescript
 * const result = detectConflicts(localItems, cloudItems);
 * if (result.requiresResolution) {
 *   console.log(`Found ${result.totalConflicts} conflicts`);
 * }
 * ```
 */
export function detectConflicts(
  localItems: ItemRow[],
  supabaseItems: ItemRow[]
): ConflictDetectionResult {
  const conflicts: ConflictItem[] = [];

  // Create lookup maps for efficient searching
  const supabaseById = new Map<string, ItemRow>();
  const supabaseByText = new Map<string, ItemRow[]>();

  // Index Supabase items
  for (const item of supabaseItems) {
    supabaseById.set(item.id, item);

    const normalizedText = item.text.toLowerCase().trim();
    const existing = supabaseByText.get(normalizedText) || [];
    existing.push(item);
    supabaseByText.set(normalizedText, existing);
  }

  // Check each local item for conflicts
  for (const localItem of localItems) {
    // Check for ID match (exact same UUID)
    const cloudItemById = supabaseById.get(localItem.id);
    if (cloudItemById) {
      conflicts.push({
        localItem,
        cloudItem: cloudItemById,
        conflictReason: 'id_match',
      });
      continue; // Don't double-count if both ID and text match
    }

    // Check for text match (duplicate content)
    const normalizedText = localItem.text.toLowerCase().trim();
    const cloudItemsByText = supabaseByText.get(normalizedText);
    if (cloudItemsByText && cloudItemsByText.length > 0) {
      // Use the first match (canonical instance by created_at)
      const canonicalCloudItem = cloudItemsByText.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];

      conflicts.push({
        localItem,
        cloudItem: canonicalCloudItem,
        conflictReason: 'text_match',
      });
    }
  }

  return {
    conflicts,
    totalConflicts: conflicts.length,
    requiresResolution: conflicts.length > 0,
  };
}

/**
 * Resolve a single conflict using the specified strategy.
 *
 * Applies the chosen conflict resolution strategy to determine which version to keep.
 * Returns the resolved item(s) that should be saved to Supabase.
 *
 * @param conflict - The conflict to resolve
 * @param strategy - The resolution strategy to apply
 * @returns Array of items to save (0, 1, or 2 items depending on strategy)
 *
 * @example
 * ```typescript
 * const resolved = resolveConflict(conflict, 'keep_newest');
 * // Returns the item with the most recent updated_at timestamp
 * ```
 */
export function resolveConflict(
  conflict: ConflictItem,
  strategy: ConflictStrategy
): ItemRow[] {
  switch (strategy) {
    case 'keep_local':
      // Keep the localStorage version, overwrite cloud
      return [conflict.localItem];

    case 'keep_cloud':
      // Keep the Supabase version, discard local
      return [];

    case 'keep_both':
      // Keep both versions as separate items
      // Note: If conflict is 'id_match', we need to generate a new UUID for the local item
      if (conflict.conflictReason === 'id_match') {
        // Keep cloud version with original ID, create new item for local version
        // (Actual UUID generation would happen in the migration execution layer)
        return [conflict.cloudItem, conflict.localItem];
      }
      // For text_match, both already have different IDs, so just keep both
      return [conflict.localItem];

    case 'keep_newest':
      // Compare timestamps and keep the most recently updated version
      const localUpdated = new Date(conflict.localItem.updated_at).getTime();
      const cloudUpdated = new Date(conflict.cloudItem.updated_at).getTime();

      if (localUpdated > cloudUpdated) {
        return [conflict.localItem];
      } else if (cloudUpdated > localUpdated) {
        return [];
      } else {
        // Timestamps are identical, default to keeping cloud
        return [];
      }

    case 'manual_review':
      // Return empty array - conflict requires user intervention
      // The migration system should pause and present this conflict to the user
      return [];

    default:
      // Unknown strategy, throw error
      throw new Error(`Unknown conflict strategy: ${strategy}`);
  }
}

/**
 * Resolve all conflicts using the specified strategy.
 *
 * Applies the resolution strategy to all detected conflicts and returns
 * the final set of items to migrate to Supabase.
 *
 * @param conflicts - Array of conflicts to resolve
 * @param strategy - The resolution strategy to apply
 * @returns Object with resolved items and unresolved conflicts (if strategy is manual_review)
 *
 * @example
 * ```typescript
 * const result = resolveAllConflicts(detectionResult.conflicts, 'keep_newest');
 * console.log(`Resolved ${result.resolvedItems.length} items`);
 * console.log(`${result.unresolvedConflicts.length} require manual review`);
 * ```
 */
export function resolveAllConflicts(
  conflicts: ConflictItem[],
  strategy: ConflictStrategy
): {
  resolvedItems: ItemRow[];
  unresolvedConflicts: ConflictItem[];
} {
  const resolvedItems: ItemRow[] = [];
  const unresolvedConflicts: ConflictItem[] = [];

  for (const conflict of conflicts) {
    if (strategy === 'manual_review') {
      // Add to unresolved list for user review
      unresolvedConflicts.push(conflict);
    } else {
      // Resolve using strategy
      const resolved = resolveConflict(conflict, strategy);
      resolvedItems.push(...resolved);
    }
  }

  return {
    resolvedItems,
    unresolvedConflicts,
  };
}

/**
 * Merge two item versions by taking the newest value for each field.
 *
 * Compares local and cloud versions field by field and takes the newest value
 * based on updated_at timestamp. This is an alternative to keep_newest that
 * merges fields rather than taking one version entirely.
 *
 * @param localItem - Item from localStorage
 * @param cloudItem - Item from Supabase
 * @returns Merged item with newest values for each field
 *
 * @example
 * ```typescript
 * const merged = mergeItemVersions(localItem, cloudItem);
 * // merged.text comes from whichever version was updated most recently
 * ```
 */
export function mergeItemVersions(localItem: ItemRow, cloudItem: ItemRow): ItemRow {
  const localUpdated = new Date(localItem.updated_at).getTime();
  const cloudUpdated = new Date(cloudItem.updated_at).getTime();

  // If local is newer, start with local and overlay cloud's older fields
  if (localUpdated > cloudUpdated) {
    return {
      ...cloudItem, // Start with cloud (older)
      ...localItem, // Overlay with local (newer)
      // Always preserve the newer updated_at timestamp
      updated_at: localItem.updated_at,
    };
  } else {
    // Cloud is newer or equal, start with local and overlay cloud's newer fields
    return {
      ...localItem, // Start with local (older)
      ...cloudItem, // Overlay with cloud (newer or equal)
      // Always preserve the newer updated_at timestamp
      updated_at: cloudItem.updated_at,
    };
  }
}

/**
 * Get a human-readable description of a conflict.
 *
 * Generates a user-friendly message describing the conflict for display in UI.
 *
 * @param conflict - The conflict to describe
 * @returns Human-readable conflict description
 *
 * @example
 * ```typescript
 * const description = describeConflict(conflict);
 * // Returns: "Item 'Write documentation' exists in both local and cloud storage (created 2 days apart)"
 * ```
 */
export function describeConflict(conflict: ConflictItem): string {
  const { localItem, cloudItem, conflictReason } = conflict;

  if (conflictReason === 'id_match') {
    const localUpdated = new Date(localItem.updated_at);
    const cloudUpdated = new Date(cloudItem.updated_at);
    const timeDiff = Math.abs(localUpdated.getTime() - cloudUpdated.getTime());
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    return `Item "${localItem.text}" exists in both local and cloud storage with the same ID (updated ${daysDiff} day${daysDiff !== 1 ? 's' : ''} apart)`;
  } else {
    // text_match
    const localCreated = new Date(localItem.created_at);
    const cloudCreated = new Date(cloudItem.created_at);
    const timeDiff = Math.abs(localCreated.getTime() - cloudCreated.getTime());
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    return `Item "${localItem.text}" exists in both local and cloud storage (created ${daysDiff} day${daysDiff !== 1 ? 's' : ''} apart)`;
  }
}

/**
 * Filter items to exclude those that are in conflict.
 *
 * Returns items from localItems that don't have conflicts with supabaseItems.
 * Useful for getting the "clean" items that can be migrated without conflict resolution.
 *
 * @param localItems - Items from localStorage
 * @param conflicts - Detected conflicts
 * @returns Items that can be migrated without conflict
 *
 * @example
 * ```typescript
 * const cleanItems = filterNonConflictingItems(localItems, detectionResult.conflicts);
 * console.log(`${cleanItems.length} items can be migrated without conflicts`);
 * ```
 */
export function filterNonConflictingItems(
  localItems: ItemRow[],
  conflicts: ConflictItem[]
): ItemRow[] {
  // Create set of local item IDs that have conflicts
  const conflictedIds = new Set(conflicts.map(c => c.localItem.id));

  // Return items that are not in the conflicted set
  return localItems.filter(item => !conflictedIds.has(item.id));
}
