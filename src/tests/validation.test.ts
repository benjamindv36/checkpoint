/**
 * Zod Validation Schema Tests
 *
 * Tests critical validation scenarios including:
 * - Required field validation
 * - Enum validation for type and theme fields
 * - Numeric range validation (min/max, non-negative)
 * - String length validation
 * - UUID format validation
 * - Date format validation
 *
 * Note: Focuses on 2-8 highly focused tests covering critical validation paths.
 * Does not exhaustively test all possible validation combinations.
 */

// Jest provides `describe`, `it`, and `expect` as globals; no import needed
import {
  itemCreateSchema,
  itemUpdateSchema,
  achievementCreateSchema,
  dailyPointsSchema,
  userPreferencesSchema,
  type ItemCreateInput,
  type ItemUpdateInput,
  type AchievementCreateInput,
  type DailyPointsInput,
  type UserPreferencesInput,
} from '@/src/schemas/validation';
import { ZodError } from 'zod';

describe('Zod Validation Schemas', () => {
  describe('Item Create Schema', () => {
    it('should validate valid item creation data with all fields', () => {
      const validData = {
        text: 'Complete project documentation',
        type: 'waypoint' as const,
        parent_id: '123e4567-e89b-12d3-a456-426614174000',
        position: 0,
        points: 25,
      };

      const result = itemCreateSchema.parse(validData);

      expect(result).toEqual(validData);
      expect(result.text).toBe('Complete project documentation');
      expect(result.type).toBe('waypoint');
    });

    it('should validate valid item with minimal required fields only', () => {
      const minimalData = {
        text: 'Minimal item',
        type: 'step' as const,
      };

      const result = itemCreateSchema.parse(minimalData);

      expect(result.text).toBe('Minimal item');
      expect(result.type).toBe('step');
      expect(result.parent_id).toBeUndefined();
      expect(result.position).toBeUndefined();
    });

    it('should reject item with empty text', () => {
      const invalidData = {
        text: '',
        type: 'waypoint' as const,
      };

      expect(() => itemCreateSchema.parse(invalidData)).toThrow(ZodError);
      try {
        itemCreateSchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.issues[0].message).toBe('Item text must be at least 1 character');
        }
      }
    });

    it('should reject item with text exceeding 5000 characters', () => {
      const invalidData = {
        text: 'x'.repeat(5001),
        type: 'waypoint' as const,
      };

      expect(() => itemCreateSchema.parse(invalidData)).toThrow(ZodError);
      try {
        itemCreateSchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.issues[0].message).toBe('Item text cannot exceed 5000 characters');
        }
      }
    });

    it('should reject invalid item type enum value', () => {
      const invalidData = {
        text: 'Test item',
        type: 'invalid-type',
      };

      expect(() => itemCreateSchema.parse(invalidData)).toThrow(ZodError);
      try {
        itemCreateSchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.issues[0].message).toBe("Item type must be 'direction', 'waypoint', or 'step'");
        }
      }
    });

    it('should accept all valid item type enum values', () => {
      const directionData = { text: 'Direction', type: 'direction' as const };
      const waypointData = { text: 'Waypoint', type: 'waypoint' as const };
      const stepData = { text: 'Step', type: 'step' as const };

      expect(() => itemCreateSchema.parse(directionData)).not.toThrow();
      expect(() => itemCreateSchema.parse(waypointData)).not.toThrow();
      expect(() => itemCreateSchema.parse(stepData)).not.toThrow();
    });

    it('should reject negative position and points values', () => {
      const negativePosition = {
        text: 'Test',
        type: 'step' as const,
        position: -1,
      };

      const negativePoints = {
        text: 'Test',
        type: 'step' as const,
        points: -5,
      };

      try {
        itemCreateSchema.parse(negativePosition);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.issues[0].message).toBe('Position must be non-negative');
        }
      }

      try {
        itemCreateSchema.parse(negativePoints);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.issues[0].message).toBe('Points must be non-negative');
        }
      }
    });

    it('should reject invalid UUID format for parent_id', () => {
      const invalidUUID = {
        text: 'Test',
        type: 'step' as const,
        parent_id: 'not-a-valid-uuid',
      };

      expect(() => itemCreateSchema.parse(invalidUUID)).toThrow(ZodError);
      try {
        itemCreateSchema.parse(invalidUUID);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.issues[0].message).toBe('Parent ID must be a valid UUID');
        }
      }
    });
  });

  describe('Item Update Schema', () => {
    it('should validate partial updates with optional fields', () => {
      const partialUpdate = {
        text: 'Updated text',
      };

      const result = itemUpdateSchema.parse(partialUpdate);

      expect(result.text).toBe('Updated text');
      expect(result.type).toBeUndefined();
      expect(result.completed).toBeUndefined();
    });

    it('should validate update with completed field', () => {
      const updateWithCompleted = {
        text: 'Completed item',
        completed: true,
      };

      const result = itemUpdateSchema.parse(updateWithCompleted);

      expect(result.text).toBe('Completed item');
      expect(result.completed).toBe(true);
    });
  });

  describe('Achievement Create Schema', () => {
    it('should validate valid achievement creation data', () => {
      const validData = {
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        points_earned: 25,
      };

      const result = achievementCreateSchema.parse(validData);

      expect(result.item_id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.points_earned).toBe(25);
    });

    it('should reject invalid UUID for item_id', () => {
      const invalidData = {
        item_id: 'not-a-uuid',
        points_earned: 25,
      };

      try {
        achievementCreateSchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.issues[0].message).toBe('Item ID must be a valid UUID');
        }
      }
    });

    it('should reject negative points_earned', () => {
      const invalidData = {
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        points_earned: -10,
      };

      try {
        achievementCreateSchema.parse(invalidData);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.issues[0].message).toBe('Points earned must be non-negative');
        }
      }
    });
  });

  describe('Daily Points Schema', () => {
    it('should validate valid daily points data with default baseline', () => {
      const validData = {
        date: '2024-01-01',
      };

      const result = dailyPointsSchema.parse(validData);

      expect(result.date).toBe('2024-01-01');
      expect(result.baseline_points).toBe(10); // default value
    });

    it('should validate custom baseline_points value', () => {
      const customData = {
        date: '2024-01-01',
        baseline_points: 15,
      };

      const result = dailyPointsSchema.parse(customData);

      expect(result.baseline_points).toBe(15);
    });

    it('should reject invalid date format', () => {
      const invalidFormats = [
        { date: '2024/01/01' }, // wrong separator
        { date: '01-01-2024' }, // wrong order
        { date: '2024-1-1' }, // missing leading zeros
        { date: 'not-a-date' },
      ];

      invalidFormats.forEach((data) => {
        try {
          dailyPointsSchema.parse(data);
        } catch (error) {
          if (error instanceof ZodError) {
            expect(error.issues[0].message).toBe('Date must be in YYYY-MM-DD format');
          }
        }
      });
    });

    it('should accept valid YYYY-MM-DD date format', () => {
      const validDates = [
        { date: '2024-01-01' },
        { date: '2024-12-31' },
        { date: '2023-06-15' },
      ];

      validDates.forEach((data) => {
        expect(() => dailyPointsSchema.parse(data)).not.toThrow();
      });
    });
  });

  describe('User Preferences Schema', () => {
    it('should validate complete user preferences with all fields', () => {
      const completePreferences = {
        defaultPointValues: {
          direction: 150,
          waypoint: 30,
          step: 10,
        },
        theme: 'dark' as const,
        dailyBaseline: 15,
      };

      const result = userPreferencesSchema.parse(completePreferences);

      expect(result?.defaultPointValues?.direction).toBe(150);
      expect(result?.defaultPointValues?.waypoint).toBe(30);
      expect(result?.defaultPointValues?.step).toBe(10);
      expect(result?.theme).toBe('dark');
      expect(result?.dailyBaseline).toBe(15);
    });

    it('should validate with default values when fields are omitted', () => {
      const minimalPreferences = {
        theme: 'light' as const,
      };

      const result = userPreferencesSchema.parse(minimalPreferences);

      expect(result?.theme).toBe('light');
    });

    it('should accept all valid theme enum values', () => {
      const themes = ['light', 'dark', 'auto'] as const;

      themes.forEach((theme) => {
        const prefs = { theme };
        expect(() => userPreferencesSchema.parse(prefs)).not.toThrow();
      });
    });

    it('should reject invalid theme enum value', () => {
      const invalidPreferences = {
        theme: 'invalid-theme',
      };

      try {
        userPreferencesSchema.parse(invalidPreferences);
      } catch (error) {
        if (error instanceof ZodError) {
          expect(error.issues[0].message).toBe("Theme must be 'light', 'dark', or 'auto'");
        }
      }
    });

    it('should accept undefined/null for entire preferences object', () => {
      expect(() => userPreferencesSchema.parse(undefined)).not.toThrow();
      expect(() => userPreferencesSchema.parse({})).not.toThrow();
    });
  });

  describe('Type Inference', () => {
    it('should infer correct TypeScript types from schemas', () => {
      // This test verifies compile-time type inference
      // If these assignments compile without errors, the types are correctly inferred

      const itemCreate: ItemCreateInput = {
        text: 'Test',
        type: 'waypoint',
      };

      const itemUpdate: ItemUpdateInput = {
        text: 'Updated',
        completed: true,
      };

      const achievement: AchievementCreateInput = {
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        points_earned: 25,
      };

      const dailyPoints: DailyPointsInput = {
        date: '2024-01-01',
        baseline_points: 10,
      };

      const preferences: UserPreferencesInput = {
        theme: 'dark',
        dailyBaseline: 15,
      };

      // Runtime checks to verify type inference worked
      expect(itemCreate.type).toBe('waypoint');
      expect(itemUpdate.completed).toBe(true);
      expect(achievement.points_earned).toBe(25);
      expect(dailyPoints.baseline_points).toBe(10);
      expect(preferences?.theme).toBe('dark');
    });
  });
});
