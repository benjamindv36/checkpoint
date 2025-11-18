/**
 * Auto-Linking Detection Tests
 *
 * Tests for auto-linking duplicate detection, canonical instance determination,
 * and auto-linking enrichment for UI.
 *
 * Test Focus Areas:
 * - Case-insensitive duplicate detection
 * - Canonical instance identification (first by created_at)
 * - Auto-linking enrichment for UI consumption
 * - Deletion handling (single vs all instances)
 * - Update behavior (no automatic syncing)
 *
 * @module tests/autolink
 */

// Jest provides `describe`, `it`, `beforeEach`, and `expect` as globals; no import needed
import { clearAllData } from '@/lib/storage/localStorage';
import { createItem, deleteItem, getItemById, getActiveItemById } from '@/lib/data/items';
import {
  findDuplicateItems,
  determineCanonicalInstance,
  enrichItemsWithAutoLinks,
  handleItemDeletion,
  syncLinkedItemUpdates,
} from '@/lib/autolink/detection';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Replace global localStorage with mock
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Auto-Linking Detection', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    clearAllData();
  });

  it('should detect duplicate items case-insensitively', () => {
    // Create items with identical text in different cases
    const item1 = createItem({
      text: 'Write Documentation',
      type: 'waypoint',
    });

    // Wait a tiny bit to ensure different created_at
    const item2 = createItem({
      text: 'write documentation',
      type: 'step',
    });

    const item3 = createItem({
      text: 'WRITE DOCUMENTATION',
      type: 'waypoint',
    });

    // Find duplicates for the text
    const duplicates = findDuplicateItems('Write Documentation');

    // Should find all 3 items
    expect(duplicates).toHaveLength(3);
    expect(duplicates.map(i => i.id)).toContain(item1.id);
    expect(duplicates.map(i => i.id)).toContain(item2.id);
    expect(duplicates.map(i => i.id)).toContain(item3.id);

    // Should be ordered by created_at ASC (item1 first)
    expect(duplicates[0].id).toBe(item1.id);
  });

  it('should filter out soft-deleted items from duplicates', () => {
    // Create items
    const item1 = createItem({
      text: 'Complete task',
      type: 'step',
    });

    const item2 = createItem({
      text: 'Complete task',
      type: 'step',
    });

    // Delete item2
    deleteItem(item2.id);

    // Find duplicates
    const duplicates = findDuplicateItems('Complete task');

    // Should only find item1 (item2 is soft-deleted)
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].id).toBe(item1.id);
  });

  it('should determine canonical instance correctly', () => {
    // Create items with same text at different times
    const item1 = createItem({
      text: 'Build feature',
      type: 'waypoint',
    });

    // Ensure different timestamp
    const item2 = createItem({
      text: 'Build feature',
      type: 'step',
    });

    const item3 = createItem({
      text: 'Build feature',
      type: 'waypoint',
    });

    const duplicates = findDuplicateItems('Build feature');

    // Determine canonical instance
    const result = determineCanonicalInstance(duplicates);

    // Canonical should be the first item (earliest created_at)
    expect(result.canonical.id).toBe(item1.id);
    expect(result.canonical.isCanonical).toBe(true);

    // Linked instances should be the other items
    expect(result.linkedInstances).toHaveLength(2);
    expect(result.linkedInstances.map(i => i.id)).toContain(item2.id);
    expect(result.linkedInstances.map(i => i.id)).toContain(item3.id);
  });

  it('should enrich items with auto-link metadata for UI', () => {
    // Create a parent item
    const parent = createItem({
      text: 'Project Alpha',
      type: 'direction',
    });

    // Create items with same text under different parents
    const item1 = createItem({
      text: 'Design UI',
      type: 'waypoint',
      parent_id: parent.id,
    });

    const parent2 = createItem({
      text: 'Project Beta',
      type: 'direction',
    });

    const item2 = createItem({
      text: 'Design UI',
      type: 'waypoint',
      parent_id: parent2.id,
    });

    // Enrich items
    const enriched = enrichItemsWithAutoLinks([item1, item2]);

    // Both items should have linkedInstances
    expect(enriched[0].linkedInstances).toBeDefined();
    expect(enriched[0].linkedInstances).toHaveLength(1);
    expect(enriched[0].linkedInstances![0].id).toBe(item2.id);
    expect(enriched[0].linkedInstances![0].parent_text).toBe('Project Beta');

    // First item should be canonical
    expect(enriched[0].isCanonical).toBe(true);
    expect(enriched[1].isCanonical).toBe(false);
  });

  it('should delete only specified item when deleteAll is false', () => {
    // Create duplicate items
    const item1 = createItem({
      text: 'Review code',
      type: 'step',
    });

    const item2 = createItem({
      text: 'Review code',
      type: 'step',
    });

    const item3 = createItem({
      text: 'Review code',
      type: 'step',
    });

    // Delete only item2
    const result = handleItemDeletion(item2.id, false);

    // Should delete only 1 item
    expect(result.deletedCount).toBe(1);
    expect(result.itemIds).toContain(item2.id);

    // Verify other items still active
    expect(getActiveItemById(item1.id)).not.toBeNull();
    expect(getActiveItemById(item2.id)).toBeNull(); // soft-deleted
    expect(getActiveItemById(item3.id)).not.toBeNull();
  });

  it('should delete all instances when deleteAll is true', () => {
    // Create duplicate items
    const item1 = createItem({
      text: 'Test feature',
      type: 'step',
    });

    const item2 = createItem({
      text: 'Test feature',
      type: 'step',
    });

    const item3 = createItem({
      text: 'Test feature',
      type: 'step',
    });

    // Delete all instances
    const result = handleItemDeletion(item2.id, true);

    // Should delete all 3 items
    expect(result.deletedCount).toBe(3);
    expect(result.itemIds).toContain(item1.id);
    expect(result.itemIds).toContain(item2.id);
    expect(result.itemIds).toContain(item3.id);

    // Verify all items soft-deleted
    expect(getActiveItemById(item1.id)).toBeNull();
    expect(getActiveItemById(item2.id)).toBeNull();
    expect(getActiveItemById(item3.id)).toBeNull();
  });

  it('should update only single instance by default', () => {
    // Create duplicate items
    const item1 = createItem({
      text: 'Deploy app',
      type: 'waypoint',
    });

    const item2 = createItem({
      text: 'Deploy app',
      type: 'waypoint',
    });

    // Update only item1 (syncAll = false)
    const result = syncLinkedItemUpdates(item1.id, { completed: true }, false);

    // Should update only 1 item
    expect(result.updatedCount).toBe(1);
    expect(result.itemIds).toContain(item1.id);
    expect(result.itemIds).not.toContain(item2.id);

    // Verify update applied only to item1
    const updated1 = getItemById(item1.id);
    const updated2 = getItemById(item2.id);

    expect(updated1?.completed).toBe(true);
    expect(updated2?.completed).toBe(false); // unchanged
  });

  it('should sync all instances when user confirms', () => {
    // Create duplicate items
    const item1 = createItem({
      text: 'Refactor code',
      type: 'step',
      points: 5,
    });

    const item2 = createItem({
      text: 'Refactor code',
      type: 'step',
      points: 5,
    });

    const item3 = createItem({
      text: 'Refactor code',
      type: 'step',
      points: 5,
    });

    // Update all instances (syncAll = true)
    const result = syncLinkedItemUpdates(item1.id, { points: 10 }, true);

    // Should update all 3 items
    expect(result.updatedCount).toBe(3);
    expect(result.itemIds).toContain(item1.id);
    expect(result.itemIds).toContain(item2.id);
    expect(result.itemIds).toContain(item3.id);

    // Verify all items updated
    expect(getItemById(item1.id)?.points).toBe(10);
    expect(getItemById(item2.id)?.points).toBe(10);
    expect(getItemById(item3.id)?.points).toBe(10);
  });
});
