import { clearAllData } from '@/lib/storage/localStorage';
import { createItem, updateItem, getItemById } from '@/lib/data/items';
import { createAchievement, getAchievementsByUserId, getAchievementsForItem } from '@/lib/data/achievements';

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

describe('Achievement Logging Integrity', () => {
  beforeEach(() => {
    localStorageMock.clear();
    clearAllData();
  });

  it('should preserve points at achievement creation time even if item points change later', () => {
    const item = createItem({ text: 'Pointy Task', type: 'waypoint', points: 25 });

    // Create achievement capturing current points
    const achievement = createAchievement({ item_id: item.id, points_earned: item.points });

    // Now change item points
    const updated = updateItem(item.id, { points: 100 });
    expect(updated?.points).toBe(100);

    // Achievement should still reflect original points
    const achievements = getAchievementsByUserId(null);
    expect(achievements.some(a => a.id === achievement.id)).toBe(true);

    const itemAchievements = getAchievementsForItem(item.id);
    expect(itemAchievements[0].points_earned).toBe(25);
  });
});
