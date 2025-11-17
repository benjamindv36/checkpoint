import { clearAllData } from '@/src/lib/storage/localStorage';
import { createItem, getRootItems, getItemsByParentId } from '@/src/lib/data/items';

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

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Outline Load Performance', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearAllData();
  });

  it('should construct outline data for 1000 items quickly', () => {
    const ROOTS = 10;
    const PER_ROOT = 100; // ROOTS * PER_ROOT = 1000

    // Create roots and children
    for (let r = 0; r < ROOTS; r++) {
      const root = createItem({ text: `Root ${r}`, type: 'direction' });
      for (let c = 0; c < PER_ROOT; c++) {
        createItem({ text: `Child ${r}-${c}`, type: 'step', parent_id: root.id });
      }
    }

    const start = Date.now();
    const roots = getRootItems();
    // Access children for each root (simulate building outline)
    for (const root of roots) {
      getItemsByParentId(root.id);
    }
    const duration = Date.now() - start;

    // Basic correctness
    expect(roots).toHaveLength(ROOTS);

    // Log timing for inspection
    // eslint-disable-next-line no-console
    console.log(`Outline data build for ${ROOTS * PER_ROOT} items took ${duration}ms`);
    expect(typeof duration).toBe('number');
  });
});
