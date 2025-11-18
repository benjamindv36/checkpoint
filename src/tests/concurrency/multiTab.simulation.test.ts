import { clearAllData } from '@/lib/storage/localStorage';
import { createItem, getItemById, updateItem } from '@/lib/data/items';

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

describe('Multi-tab Concurrent Update Simulation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearAllData();
  });

  it('simulates two tabs updating the same item and expects last-write-wins', () => {
    const item = createItem({ text: 'Concurrent', type: 'step', points: 5 });

    // Tab A reads item
    const tabA_item = getItemById(item.id);

    // Tab B reads and updates
    const tabB_item = getItemById(item.id);
    updateItem(tabB_item!.id, { points: 50 });

    // Tab A now updates based on stale read
    const updatedA = updateItem(tabA_item!.id, { text: 'Concurrent updated by A' });

    // Final state should reflect last update (A)
    const final = getItemById(item.id);
    expect(final?.text).toBe('Concurrent updated by A');
    // Points should still be 50 because tabA didn't change points
    expect(final?.points).toBe(50);
  });
});
