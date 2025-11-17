/**
 * Zod Validation Schemas
 *
 * This file contains all Zod validation schemas for runtime validation of user inputs
 * and API responses in the Waypoint App. Schemas validate data before database operations
 * to ensure data integrity and provide clear error messages.
 *
 * All schemas use .parse() method (not .safeParse()) to throw errors on invalid data.
 * TypeScript types can be inferred from schemas using z.infer<typeof schema>.
 *
 * @module schemas/validation
 */

import { z } from 'zod';

// =====================================================
// ITEM VALIDATION SCHEMAS
// =====================================================

/**
 * Schema for creating new items.
 *
 * Validates all fields required when creating a new item in the database.
 * Optional fields (parent_id, position, points) will use defaults if not provided.
 *
 * Validation rules:
 * - text: Required string, 1-5000 characters
 * - type: Required enum 'direction' | 'waypoint' | 'step'
 * - parent_id: Optional UUID string or null (for root items)
 * - position: Optional non-negative integer (defaults to 0)
 * - points: Optional non-negative integer (defaults based on type)
 *
 * @example
 * ```typescript
 * const newItem = itemCreateSchema.parse({
 *   text: 'Complete project documentation',
 *   type: 'waypoint',
 *   parent_id: '123e4567-e89b-12d3-a456-426614174000',
 *   position: 0,
 *   points: 25,
 * });
 * ```
 */
export const itemCreateSchema = z.object({
  text: z
    .string()
    .min(1, 'Item text must be at least 1 character')
    .max(5000, 'Item text cannot exceed 5000 characters'),
  type: z.enum(['direction', 'waypoint', 'step'], {
    message: "Item type must be 'direction', 'waypoint', or 'step'",
  }),
  parent_id: z
    .string()
    .uuid('Parent ID must be a valid UUID')
    .nullable()
    .optional(),
  position: z
    .number()
    .int('Position must be an integer')
    .min(0, 'Position must be non-negative')
    .optional(),
  points: z
    .number()
    .int('Points must be an integer')
    .min(0, 'Points must be non-negative')
    .optional(),
});

/**
 * Schema for updating existing items.
 *
 * All fields are optional to support partial updates.
 * Only provided fields will be validated and updated.
 *
 * Validation rules match itemCreateSchema but all fields are optional.
 *
 * @example
 * ```typescript
 * const updates = itemUpdateSchema.parse({
 *   text: 'Updated text',
 *   completed: true,
 * });
 * ```
 */
export const itemUpdateSchema = z.object({
  text: z
    .string()
    .min(1, 'Item text must be at least 1 character')
    .max(5000, 'Item text cannot exceed 5000 characters')
    .optional(),
  type: z
    .enum(['direction', 'waypoint', 'step'], {
      message: "Item type must be 'direction', 'waypoint', or 'step'",
    })
    .optional(),
  parent_id: z
    .string()
    .uuid('Parent ID must be a valid UUID')
    .nullable()
    .optional(),
  position: z
    .number()
    .int('Position must be an integer')
    .min(0, 'Position must be non-negative')
    .optional(),
  completed: z.boolean().optional(),
  points: z
    .number()
    .int('Points must be an integer')
    .min(0, 'Points must be non-negative')
    .optional(),
});

// =====================================================
// ACHIEVEMENT VALIDATION SCHEMAS
// =====================================================

/**
 * Schema for creating achievement records.
 *
 * Achievements are logged when items are marked complete.
 * Points are stored at achievement time to preserve history if point values change.
 *
 * Validation rules:
 * - item_id: Required UUID string referencing the completed item
 * - points_earned: Required non-negative integer (copied from item.points)
 *
 * @example
 * ```typescript
 * const achievement = achievementCreateSchema.parse({
 *   item_id: '123e4567-e89b-12d3-a456-426614174000',
 *   points_earned: 25,
 * });
 * ```
 */
export const achievementCreateSchema = z.object({
  item_id: z.string().uuid('Item ID must be a valid UUID'),
  points_earned: z
    .number()
    .int('Points earned must be an integer')
    .min(0, 'Points earned must be non-negative'),
});

// =====================================================
// DAILY POINTS VALIDATION SCHEMA
// =====================================================

/**
 * Schema for daily baseline points.
 *
 * Daily points track the baseline points awarded for existing each day (+10 default).
 * Total daily points = baseline_points + SUM(achievements.points_earned for that date).
 *
 * Validation rules:
 * - date: Required string in YYYY-MM-DD format
 * - baseline_points: Non-negative integer with default value 10
 *
 * @example
 * ```typescript
 * const dailyPoints = dailyPointsSchema.parse({
 *   date: '2024-01-01',
 *   baseline_points: 10,
 * });
 * ```
 */
export const dailyPointsSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  baseline_points: z
    .number()
    .int('Baseline points must be an integer')
    .min(0, 'Baseline points must be non-negative')
    .default(10),
});

// =====================================================
// USER PREFERENCES VALIDATION SCHEMA
// =====================================================

/**
 * Schema for user preferences stored in users.preferences JSONB field.
 *
 * Preferences are flexible and all fields are optional.
 * Provides defaults for common settings like point values, theme, and daily baseline.
 *
 * Validation rules:
 * - defaultPointValues.direction: Optional non-negative integer (default 100)
 * - defaultPointValues.waypoint: Optional non-negative integer (default 25)
 * - defaultPointValues.step: Optional non-negative integer (default 5)
 * - theme: Optional enum 'light' | 'dark' | 'auto' (default 'auto')
 * - dailyBaseline: Optional non-negative integer (default 10)
 *
 * @example
 * ```typescript
 * const preferences = userPreferencesSchema.parse({
 *   defaultPointValues: {
 *     direction: 150,
 *     waypoint: 30,
 *     step: 10,
 *   },
 *   theme: 'dark',
 *   dailyBaseline: 15,
 * });
 * ```
 */
export const userPreferencesSchema = z
  .object({
    defaultPointValues: z
      .object({
        direction: z
          .number()
          .int('Direction points must be an integer')
          .min(0, 'Direction points must be non-negative')
          .default(100)
          .optional(),
        waypoint: z
          .number()
          .int('Waypoint points must be an integer')
          .min(0, 'Waypoint points must be non-negative')
          .default(25)
          .optional(),
        step: z
          .number()
          .int('Step points must be an integer')
          .min(0, 'Step points must be non-negative')
          .default(5)
          .optional(),
      })
      .optional(),
    theme: z
      .enum(['light', 'dark', 'auto'], {
        message: "Theme must be 'light', 'dark', or 'auto'",
      })
      .default('auto')
      .optional(),
    dailyBaseline: z
      .number()
      .int('Daily baseline must be an integer')
      .min(0, 'Daily baseline must be non-negative')
      .default(10)
      .optional(),
  })
  .optional();

// =====================================================
// INFERRED TYPES FROM ZOD SCHEMAS
// =====================================================
// These types are generated from the Zod schemas using z.infer
// They ensure consistency between validation logic and TypeScript types

/**
 * TypeScript type inferred from itemCreateSchema.
 * Represents validated data for creating a new item.
 */
export type ItemCreateInput = z.infer<typeof itemCreateSchema>;

/**
 * TypeScript type inferred from itemUpdateSchema.
 * Represents validated data for updating an existing item.
 */
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;

/**
 * TypeScript type inferred from achievementCreateSchema.
 * Represents validated data for creating an achievement record.
 */
export type AchievementCreateInput = z.infer<typeof achievementCreateSchema>;

/**
 * TypeScript type inferred from dailyPointsSchema.
 * Represents validated data for daily baseline points.
 */
export type DailyPointsInput = z.infer<typeof dailyPointsSchema>;

/**
 * TypeScript type inferred from userPreferencesSchema.
 * Represents validated user preferences object.
 */
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
