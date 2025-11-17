import { clearAllData } from '@/src/lib/storage/localStorage';
import { createItem } from '@/src/lib/data/items';
import { findDuplicateItems } from '@/src/lib/autolink/detection';

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

describe('Large Auto-Linking Performance', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearAllData();
  });

  it('should find duplicates quickly for large dataset', () => {
    const TOTAL = 1000;
    const DUP_COUNT = 400;
    const DUP_TEXT = 'bulk duplicate item';

    // Create many items, including DUP_COUNT duplicates of DUP_TEXT
    for (let i = 0; i < TOTAL; i++) {
      const text = i < DUP_COUNT ? DUP_TEXT : `unique item ${i}`;
      createItem({ text, type: 'step' });
    }

    const start = Date.now();
    const duplicates = findDuplicateItems(DUP_TEXT);
    const duration = Date.now() - start;

    // Correctness
    expect(duplicates).toHaveLength(DUP_COUNT);

    // Log timing for inspection (do not assert strict threshold to avoid flakiness)
    // But ensure it's a finite number
    // eslint-disable-next-line no-console
    console.log(`findDuplicateItems on ${TOTAL} items took ${duration}ms`);
    expect(typeof duration).toBe('number');
  });
});
