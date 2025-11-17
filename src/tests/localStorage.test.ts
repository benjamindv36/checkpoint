/**
 * localStorage Data Layer Tests
 *
 * Tests critical localStorage operations including:
 * - CRUD operations for items, achievements, daily points
 * - JSON serialization/deserialization
 * - Key consistency and naming
 * - Error handling (quota, parse errors)
 * - UUID generation
 *
 * Note: Focuses on 2-8 highly focused tests covering critical localStorage functionality.
 * Does not exhaustively test all edge cases.
 */

// Jest provides `describe`, `it`, `beforeEach`, and `expect` as globals; no import needed
import {
  getItems,
  setItems,
  getAchievements,
  setAchievements,
  getDailyPoints,
  setDailyPoints,
  getUser,
  setUser,
} from '@/src/lib/storage/localStorage';
import {
  createItem,
  updateItem,
  deleteItem,
  getItemById,
  getItemsByParentId,
} from '@/src/lib/data/items';
import {
  createAchievement,
  deleteAchievement,
  getAchievementsByUserId,
  getAchievementsByDateRange,
} from '@/src/lib/data/achievements';
import {
  ensureDailyPointsRecord,
  getDailyPointsForDate,
} from '@/src/lib/data/dailyPoints';
import { generateUUID } from '@/src/lib/utils/uuid';
import type { ItemRow, AchievementRow, DailyPointsRow, UserRow } from '@/src/types/database';

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

describe('localStorage Utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Basic Read/Write Operations', () => {
    it('should store and retrieve items array with consistent key naming', () => {
      const items: ItemRow[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: null,
          text: 'Test item',
          type: 'waypoint',
          parent_id: null,
          position: 0,
          completed: false,
          completed_at: null,
          points: 25,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      setItems(items);
      const retrieved = getItems();

      expect(retrieved).toEqual(items);
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0].text).toBe('Test item');

      // Verify key naming consistency
      const rawData = localStorageMock.getItem('waypoint:items');
      expect(rawData).toBeTruthy();
      expect(JSON.parse(rawData!)).toEqual(items);
    });

    it('should handle missing keys gracefully with empty arrays or default objects', () => {
      // Before any data is set, should return empty arrays
      expect(getItems()).toEqual([]);
      expect(getAchievements()).toEqual([]);
      expect(getDailyPoints()).toEqual([]);

      // User should return default object structure
      const user = getUser();
      expect(user).toEqual({
        id: 'local-user',
        email: null,
        display_name: null,
        preferences: {},
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should properly serialize and deserialize JSON data', () => {
      const achievement: AchievementRow = {
        id: generateUUID(),
        user_id: null,
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        points_earned: 25,
        achieved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      setAchievements([achievement]);
      const retrieved = getAchievements();

      expect(retrieved).toEqual([achievement]);
      expect(retrieved[0].points_earned).toBe(25);
      expect(typeof retrieved[0].achieved_at).toBe('string');
    });

    it('should handle JSON parse errors gracefully', () => {
      // Manually set invalid JSON
      localStorageMock.setItem('waypoint:items', 'invalid-json{]');

      // Should return empty array instead of throwing
      const items = getItems();
      expect(items).toEqual([]);
    });
  });

  describe('UUID Generation', () => {
    it('should generate valid RFC 4122 compliant UUIDs', () => {
      const uuid = generateUUID();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs on each call', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      const uuid3 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);
    });
  });

  describe('Item CRUD Operations', () => {
    it('should create item with UUID generation and Zod validation', () => {
      const newItem = createItem({
        text: 'New waypoint',
        type: 'waypoint',
        parent_id: null,
        position: 0,
      });

      expect(newItem.id).toBeTruthy();
      expect(newItem.text).toBe('New waypoint');
      expect(newItem.type).toBe('waypoint');
      expect(newItem.points).toBe(25); // default for waypoint
      expect(newItem.user_id).toBeNull();
      expect(newItem.deleted_at).toBeNull();

      // Verify item is stored in localStorage
      const items = getItems();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(newItem.id);
    });

    it('should update item with partial updates and validation', () => {
      const item = createItem({
        text: 'Original text',
        type: 'step',
        parent_id: null,
        position: 0,
      });

      const updated = updateItem(item.id, {
        text: 'Updated text',
        completed: true,
      });

      expect(updated).toBeTruthy();
      expect(updated?.text).toBe('Updated text');
      expect(updated?.completed).toBe(true);
      expect(updated?.type).toBe('step'); // unchanged
      expect(updated?.completed_at).toBeTruthy(); // set automatically
    });

    it('should soft delete items using deleted_at timestamp', () => {
      const item = createItem({
        text: 'Item to delete',
        type: 'step',
        parent_id: null,
        position: 0,
      });

      const deleted = deleteItem(item.id);

      expect(deleted).toBeTruthy();
      expect(deleted?.deleted_at).toBeTruthy();
      expect(deleted?.id).toBe(item.id);

      // Verify soft delete - item still exists in storage
      const items = getItems();
      const found = items.find(i => i.id === item.id);
      expect(found).toBeTruthy();
      expect(found?.deleted_at).toBeTruthy();
    });

    it('should query items by parent_id for hierarchy', () => {
      const parent = createItem({
        text: 'Parent direction',
        type: 'direction',
        parent_id: null,
        position: 0,
      });

      createItem({
        text: 'Child 1',
        type: 'waypoint',
        parent_id: parent.id,
        position: 0,
      });

      createItem({
        text: 'Child 2',
        type: 'waypoint',
        parent_id: parent.id,
        position: 1,
      });

      const children = getItemsByParentId(parent.id);

      expect(children).toHaveLength(2);
      expect(children[0].parent_id).toBe(parent.id);
      expect(children[1].parent_id).toBe(parent.id);
      expect(children[0].position).toBe(0);
      expect(children[1].position).toBe(1);
    });
  });

  describe('Achievement Operations', () => {
    it('should create achievement when item marked complete', () => {
      const item = createItem({
        text: 'Complete this',
        type: 'waypoint',
        parent_id: null,
        position: 0,
      });

      const achievement = createAchievement({
        item_id: item.id,
        points_earned: item.points,
      });

      expect(achievement.item_id).toBe(item.id);
      expect(achievement.points_earned).toBe(25);
      expect(achievement.user_id).toBeNull();
      expect(achievement.achieved_at).toBeTruthy();

      // Verify stored in localStorage
      const achievements = getAchievements();
      expect(achievements).toHaveLength(1);
      expect(achievements[0].id).toBe(achievement.id);
    });

    it('should delete achievement when item unmarked', () => {
      const item = createItem({
        text: 'Test item',
        type: 'step',
        parent_id: null,
        position: 0,
      });

      const achievement = createAchievement({
        item_id: item.id,
        points_earned: item.points,
      });

      const deleted = deleteAchievement(achievement.id);

      expect(deleted).toBe(true);

      // Verify removed from localStorage
      const achievements = getAchievements();
      expect(achievements).toHaveLength(0);
    });

    it('should filter achievements by date range for daily totals', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const item1 = createItem({
        text: 'Today item',
        type: 'step',
        parent_id: null,
        position: 0,
      });

      const todayAchievement = createAchievement({
        item_id: item1.id,
        points_earned: 5,
      });

      // Manually create achievement for yesterday
      const yesterdayAchievement: AchievementRow = {
        id: generateUUID(),
        user_id: null,
        item_id: item1.id,
        points_earned: 10,
        achieved_at: yesterday.toISOString(),
        created_at: yesterday.toISOString(),
      };

      setAchievements([todayAchievement, yesterdayAchievement]);

      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const todayAchievements = getAchievementsByDateRange(todayStr, todayStr);
      const yesterdayAchievements = getAchievementsByDateRange(yesterdayStr, yesterdayStr);

      expect(todayAchievements).toHaveLength(1);
      expect(todayAchievements[0].points_earned).toBe(5);

      expect(yesterdayAchievements).toHaveLength(1);
      expect(yesterdayAchievements[0].points_earned).toBe(10);
    });
  });

  describe('Daily Points Operations', () => {
    it('should create daily points record with baseline if missing', () => {
      const today = new Date().toISOString().split('T')[0];

      const record = ensureDailyPointsRecord(today);

      expect(record.date).toBe(today);
      expect(record.baseline_points).toBe(10);
      expect(record.user_id).toBeNull();

      // Verify stored in localStorage
      const dailyPoints = getDailyPoints();
      expect(dailyPoints).toHaveLength(1);
      expect(dailyPoints[0].date).toBe(today);
    });

    it('should enforce unique constraint (user_id, date) at application level', () => {
      const today = new Date().toISOString().split('T')[0];

      const record1 = ensureDailyPointsRecord(today);
      const record2 = ensureDailyPointsRecord(today);

      // Should return same record, not create duplicate
      expect(record1.id).toBe(record2.id);

      // Verify only one record in storage
      const dailyPoints = getDailyPoints();
      expect(dailyPoints).toHaveLength(1);
    });

    it('should fetch daily points for specific date', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      ensureDailyPointsRecord(today);
      ensureDailyPointsRecord(yesterdayStr);

      const todayRecord = getDailyPointsForDate(today);
      const yesterdayRecord = getDailyPointsForDate(yesterdayStr);

      expect(todayRecord).toBeTruthy();
      expect(todayRecord?.date).toBe(today);

      expect(yesterdayRecord).toBeTruthy();
      expect(yesterdayRecord?.date).toBe(yesterdayStr);
    });
  });
});
