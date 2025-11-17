import { clearAllData } from '@/src/lib/storage/localStorage';
import { ensureDailyPointsRecord, calculateTotalDailyPoints } from '@/src/lib/data/dailyPoints';
import { createItem } from '@/src/lib/data/items';
import { createAchievement } from '@/src/lib/data/achievements';

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

describe('Daily Points Aggregation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearAllData();
  });

  it('should calculate total daily points = baseline + achievements', () => {
    const today = new Date().toISOString().split('T')[0];

    // Ensure baseline
    const baseline = ensureDailyPointsRecord(today);
    expect(baseline).toBeTruthy();

    // Create two achievements for today
    const item1 = createItem({ text: 'A', type: 'step' });
    const item2 = createItem({ text: 'B', type: 'waypoint' });

    createAchievement({ item_id: item1.id, points_earned: item1.points });
    createAchievement({ item_id: item2.id, points_earned: item2.points });

    const total = calculateTotalDailyPoints(today);

    // baseline (10) + item1.points + item2.points
    expect(total).toBe(baseline.baseline_points + item1.points + item2.points);
  });
});
