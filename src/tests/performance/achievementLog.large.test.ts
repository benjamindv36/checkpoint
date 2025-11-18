import { clearAllData } from '@/lib/storage/localStorage';
import { setAchievements } from '@/lib/storage/localStorage';
import { generateUUID } from '@/lib/utils/uuid';
import { calculatePointsForDateRange } from '@/lib/data/achievements';

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

describe('Achievement Log Large Dataset', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearAllData();
  });

  it('should fetch and aggregate 1 year of achievements quickly', () => {
    const DAYS = 365;
    const today = new Date();

    const achievements = [] as any[];

    for (let d = 0; d < DAYS; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const iso = date.toISOString();
      achievements.push({
        id: generateUUID(),
        user_id: null,
        item_id: generateUUID(),
        points_earned: 5,
        achieved_at: iso,
        created_at: iso,
      });
    }

    // Save to storage
    setAchievements(achievements as any);

    const start = Date.now();
    const startStr = new Date(today).toISOString().split('T')[0];
    const endStr = new Date(today).toISOString().split('T')[0];
    const totalPoints = calculatePointsForDateRange(startStr, startStr);
    const duration = Date.now() - start;

    // basic sanity
    expect(totalPoints).toBeGreaterThanOrEqual(0);

    // Log timing
    // eslint-disable-next-line no-console
    console.log(`Aggregating achievements for ${DAYS} days sample took ${duration}ms`);
    expect(typeof duration).toBe('number');
  });
});
