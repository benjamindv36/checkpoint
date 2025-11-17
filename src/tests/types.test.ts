/**
 * Type Definition Tests
 *
 * Tests critical TypeScript type operations including:
 * - Type inference for database row types
 * - Nullable field handling
 * - Computed properties in enriched types
 * - Type compatibility between row and enriched types
 *
 * Note: These are compile-time type checks that verify the type system
 * is correctly structured. Runtime tests verify type guards and validation.
 */

// Jest provides `describe`, `it`, and `expect` as globals; no import needed
import type {
  ItemRow,
  AchievementRow,
  DailyPointsRow,
  UserRow,
  Item,
  Achievement,
} from '@/types/database';

describe('TypeScript Type Definitions', () => {
  describe('Database Row Types', () => {
    it('should enforce required fields on ItemRow', () => {
      const validItem: ItemRow = {
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
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(validItem.type).toBe('waypoint');
      expect(validItem.user_id).toBeNull();
    });

    it('should allow all three item types with strict type checking', () => {
      const direction: ItemRow['type'] = 'direction';
      const waypoint: ItemRow['type'] = 'waypoint';
      const step: ItemRow['type'] = 'step';

      expect(['direction', 'waypoint', 'step']).toContain(direction);
      expect(['direction', 'waypoint', 'step']).toContain(waypoint);
      expect(['direction', 'waypoint', 'step']).toContain(step);

      // TypeScript compile-time check - this would fail at compile time if wrong type
      const checkType = (type: 'direction' | 'waypoint' | 'step'): boolean => {
        return ['direction', 'waypoint', 'step'].includes(type);
      };

      expect(checkType(direction)).toBe(true);
    });

    it('should correctly handle nullable fields in all row types', () => {
      const itemRow: ItemRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: null, // nullable in v1
        text: 'Test',
        type: 'step',
        parent_id: null, // nullable - root items
        position: 0,
        completed: false,
        completed_at: null, // nullable - not completed
        points: 5,
        deleted_at: null, // nullable - not deleted
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const achievementRow: AchievementRow = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        user_id: null, // nullable in v1
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        points_earned: 5,
        achieved_at: '2024-01-01T12:00:00Z',
        created_at: '2024-01-01T12:00:00Z',
      };

      const userRow: UserRow = {
        id: '123e4567-e89b-12d3-a456-426614174002',
        email: null, // nullable in v1
        display_name: null, // nullable
        preferences: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(itemRow.user_id).toBeNull();
      expect(achievementRow.user_id).toBeNull();
      expect(userRow.email).toBeNull();
    });
  });

  describe('Enriched Application Types', () => {
    it('should extend ItemRow with optional computed properties', () => {
      const enrichedItem: Item = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        text: 'Parent Item',
        type: 'direction',
        parent_id: null,
        position: 0,
        completed: false,
        completed_at: null,
        points: 100,
        deleted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        // Computed properties
        children: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            user_id: null,
            text: 'Child Item',
            type: 'waypoint',
            parent_id: '123e4567-e89b-12d3-a456-426614174000',
            position: 0,
            completed: false,
            completed_at: null,
            points: 25,
            deleted_at: null,
            created_at: '2024-01-01T01:00:00Z',
            updated_at: '2024-01-01T01:00:00Z',
          },
        ],
        linkedInstances: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            parent_text: 'Another Parent',
          },
        ],
        isCanonical: true,
      };

      expect(enrichedItem.children).toHaveLength(1);
      expect(enrichedItem.linkedInstances).toHaveLength(1);
      expect(enrichedItem.isCanonical).toBe(true);
    });

    it('should allow Item type without computed properties (backward compatible)', () => {
      const basicItem: Item = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        text: 'Basic Item',
        type: 'step',
        parent_id: null,
        position: 0,
        completed: false,
        completed_at: null,
        points: 5,
        deleted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        // No computed properties - all optional
      };

      expect(basicItem.children).toBeUndefined();
      expect(basicItem.linkedInstances).toBeUndefined();
      expect(basicItem.isCanonical).toBeUndefined();
    });

    it('should extend AchievementRow with item details for display', () => {
      const enrichedAchievement: Achievement = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        item_id: '123e4567-e89b-12d3-a456-426614174001',
        points_earned: 25,
        achieved_at: '2024-01-01T12:00:00Z',
        created_at: '2024-01-01T12:00:00Z',
        // Enriched item details
        item: {
          text: 'Completed Waypoint',
          type: 'waypoint',
          points: 25,
        },
      };

      expect(enrichedAchievement.item.text).toBe('Completed Waypoint');
      expect(enrichedAchievement.item.type).toBe('waypoint');
      expect(enrichedAchievement.item.points).toBe(25);
    });
  });

  describe('Type Inference and Compatibility', () => {
    it('should infer correct types for nested structures', () => {
      const item: Item = {
        id: '1',
        user_id: null,
        text: 'Test',
        type: 'direction',
        parent_id: null,
        position: 0,
        completed: false,
        completed_at: null,
        points: 100,
        deleted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        children: [],
      };

      // Type inference should work correctly
      const hasChildren = (item.children?.length ?? 0) > 0;
      expect(hasChildren).toBe(false);

      // Optional chaining should work with nullable types
      const completedTime = item.completed_at ?? 'not completed';
      expect(completedTime).toBe('not completed');
    });

    it('should maintain type compatibility between ItemRow and Item', () => {
      const itemRow: ItemRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        text: 'Test',
        type: 'waypoint',
        parent_id: null,
        position: 0,
        completed: false,
        completed_at: null,
        points: 25,
        deleted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // ItemRow should be assignable to Item (Item extends ItemRow)
      const item: Item = itemRow;

      expect(item.id).toBe(itemRow.id);
      expect(item.text).toBe(itemRow.text);
    });

    it('should properly type UserRow preferences as flexible JSONB', () => {
      const userWithPreferences: UserRow = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        display_name: 'Test User',
        preferences: {
          defaultPointValues: {
            direction: 100,
            waypoint: 25,
            step: 5,
          },
          theme: 'dark',
          dailyBaseline: 10,
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(userWithPreferences.preferences).toHaveProperty('theme');
      expect(userWithPreferences.preferences.theme).toBe('dark');
    });
  });
});
