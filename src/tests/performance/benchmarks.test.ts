import { clearAllData } from '@/src/lib/storage/localStorage';
import { createItem } from '@/src/lib/data/items';
import { findDuplicateItems } from '@/src/lib/autolink/detection';
import { getRootItems, getItemsByParentId } from '@/src/lib/data/items';
import { setAchievements } from '@/src/lib/storage/localStorage';
import { calculatePointsForDateRange } from '@/src/lib/data/achievements';
import { generateUUID } from '@/src/lib/utils/uuid';

// Simple localStorage mock
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

describe('Micro-benchmarks', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearAllData();
  });

  it('auto-link detection 1000 items (log only)', () => {
    const TOTAL = 1000;
    const TARGET = 'bench duplicate';

    for (let i = 0; i < TOTAL; i++) {
      const text = i % 5 === 0 ? TARGET : `unique ${i}`;
      createItem({ text, type: 'step' });
    }

    const t0 = Date.now();
    const dups = findDuplicateItems(TARGET);
    const t1 = Date.now();
    const ms = t1 - t0;
    // eslint-disable-next-line no-console
    console.log(`Auto-link detection (${TOTAL}) -> found ${dups.length} in ${ms}ms`);
    expect(typeof ms).toBe('number');
  });

  it('outline build 1000 items (data build only)', () => {
    const ROOTS = 10;
    const PER = 100;

    for (let r = 0; r < ROOTS; r++) {
      const root = createItem({ text: `Root ${r}`, type: 'direction' });
      for (let c = 0; c < PER; c++) {
        createItem({ text: `R${r}-C${c}`, type: 'step', parent_id: root.id });
      }
    }

    const t0 = Date.now();
    const roots = getRootItems();
    roots.forEach(r => getItemsByParentId(r.id));
    const t1 = Date.now();
    const ms = t1 - t0;
    // eslint-disable-next-line no-console
    console.log(`Outline build for ${ROOTS * PER} items took ${ms}ms`);
    expect(typeof ms).toBe('number');
  });

  it('achievement aggregation 1 year dataset', () => {
    const DAYS = 365;
    const today = new Date();
    const achievements = [] as any[];

    for (let d = 0; d < DAYS; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const iso = date.toISOString();
      achievements.push({ id: generateUUID(), user_id: null, item_id: generateUUID(), points_earned: 5, achieved_at: iso, created_at: iso });
    }

    setAchievements(achievements as any);

    const dayStr = today.toISOString().split('T')[0];
    const t0 = Date.now();
    const pts = calculatePointsForDateRange(dayStr, dayStr);
    const t1 = Date.now();
    const ms = t1 - t0;
    // eslint-disable-next-line no-console
    console.log(`Achievement aggregation for ${DAYS} days sample (single day) took ${ms}ms; points=${pts}`);
    expect(typeof ms).toBe('number');
  });
});
