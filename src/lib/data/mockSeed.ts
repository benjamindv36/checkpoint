import type { ItemRow } from '@/types/database';
import { getItems, setItems } from '@/lib/storage/localStorage';

/**
 * Returns a small set of mock items for the canvas demo.
 */
export function getMockItems(): ItemRow[] {
  const now = new Date().toISOString();

  const dirId = 'mock-dir-1';
  const wayId = 'mock-way-1';
  const stepId = 'mock-step-1';

  return [
    {
      id: dirId,
      user_id: null,
      text: 'Plan: Learn ReactFlow',
      type: 'direction',
      parent_id: null,
      position: 0,
      completed: false,
      completed_at: null,
      points: 100,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: wayId,
      user_id: null,
      text: 'Waypoint: Build canvas prototype',
      type: 'waypoint',
      parent_id: dirId,
      position: 0,
      completed: false,
      completed_at: null,
      points: 25,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: stepId,
      user_id: null,
      text: 'Step: Seed mock data',
      type: 'step',
      parent_id: wayId,
      position: 0,
      completed: false,
      completed_at: null,
      points: 5,
      deleted_at: null,
      created_at: now,
      updated_at: now,
    },
  ];
}

/**
 * Seed mock items into localStorage only if no items exist.
 * Returns true if seeding occurred.
 */
export function seedMockItemsIfEmpty(): boolean {
  const existing = getItems();
  if (existing && existing.length > 0) return false;

  const items = getMockItems();
  setItems(items);
  return true;
}
