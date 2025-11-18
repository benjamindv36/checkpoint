import { clearAllData } from '@/lib/storage/localStorage';
import { createItem, deleteItem, getItemById, restoreItem } from '@/lib/data/items';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

describe('Soft Delete Integrity', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearAllData();
  });

  it('soft-deleting a parent should not hard-delete children and restore works', () => {
    const parent = createItem({ text: 'Parent X', type: 'direction' });
    const child = createItem({ text: 'Child X', type: 'step', parent_id: parent.id });

    // Delete parent
    const deletedParent = deleteItem(parent.id);
    expect(deletedParent).toBeTruthy();
    expect(deletedParent?.deleted_at).toBeTruthy();

    // Child should still exist (soft-delete only applies to parent)
    const fetchedChild = getItemById(child.id);
    expect(fetchedChild).not.toBeNull();
    expect(fetchedChild?.parent_id).toBe(parent.id);

    // Restore parent
    const restored = restoreItem(parent.id);
    expect(restored).toBeTruthy();
    expect(restored?.deleted_at).toBeNull();

    const fetchedParent = getItemById(parent.id);
    expect(fetchedParent).not.toBeNull();
  });
});
