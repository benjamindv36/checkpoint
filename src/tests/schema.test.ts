/**
 * Schema Validation Tests
 *
 * Tests critical database schema constraints including:
 * - Foreign key cascades
 * - Check constraints
 * - Unique constraints
 *
 * Note: These tests validate the SQL schema structure.
 * They are designed to be run against a test database instance.
 */

// Jest provides `describe`, `it`, and `expect` as globals; no import needed
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Database Schema Validation', () => {
  // Read the migration file to validate structure
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');
  let migrationSQL: string;

  try {
    migrationSQL = readFileSync(migrationPath, 'utf-8');
  } catch (error) {
    migrationSQL = '';
  }

  it('should include UUID extension enablement', () => {
    expect(migrationSQL).toContain('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  });

  it('should define all required tables', () => {
    expect(migrationSQL).toContain('CREATE TABLE users');
    expect(migrationSQL).toContain('CREATE TABLE items');
    expect(migrationSQL).toContain('CREATE TABLE achievements');
    expect(migrationSQL).toContain('CREATE TABLE daily_points');
  });

  it('should enforce type enum check constraint on items table', () => {
    expect(migrationSQL).toMatch(/CHECK\s*\(\s*type\s+IN\s*\(\s*'direction'\s*,\s*'waypoint'\s*,\s*'step'\s*\)\s*\)/);
  });

  it('should enforce foreign key cascades', () => {
    // Items table should have ON DELETE CASCADE for parent_id and user_id
    expect(migrationSQL).toMatch(/parent_id.*REFERENCES.*items.*ON DELETE CASCADE/s);
    expect(migrationSQL).toMatch(/user_id.*REFERENCES.*users.*ON DELETE CASCADE/s);

    // Achievements table should have ON DELETE CASCADE
    expect(migrationSQL).toMatch(/item_id.*REFERENCES.*items.*ON DELETE CASCADE/s);

    // Daily points should have ON DELETE CASCADE
    const dailyPointsSection = migrationSQL.match(/CREATE TABLE daily_points[\s\S]*?(?=CREATE|$)/)?.[0] || '';
    expect(dailyPointsSection).toMatch(/user_id.*REFERENCES.*users.*ON DELETE CASCADE/s);
  });

  it('should enforce non-negative check constraints', () => {
    // Items table
    expect(migrationSQL).toMatch(/points.*CHECK\s*\(\s*points\s*>=\s*0\s*\)/s);
    expect(migrationSQL).toMatch(/position.*CHECK\s*\(\s*position\s*>=\s*0\s*\)/s);

    // Achievements table
    expect(migrationSQL).toMatch(/points_earned.*CHECK\s*\(\s*points_earned\s*>=\s*0\s*\)/s);

    // Daily points table
    expect(migrationSQL).toMatch(/baseline_points.*CHECK\s*\(\s*baseline_points\s*>=\s*0\s*\)/s);
  });

  it('should define unique constraint on daily_points(user_id, date)', () => {
    const dailyPointsSection = migrationSQL.match(/CREATE TABLE daily_points[\s\S]*?(?=CREATE|--|$)/)?.[0] || '';
    expect(dailyPointsSection).toMatch(/UNIQUE\s*\(\s*user_id\s*,\s*date\s*\)/);
  });

  it('should create case-insensitive index on items.text', () => {
    expect(migrationSQL).toMatch(/CREATE INDEX.*items.*LOWER\s*\(\s*text\s*\)/);
  });

  it('should create update_updated_at_column trigger function', () => {
    expect(migrationSQL).toContain('CREATE OR REPLACE FUNCTION update_updated_at_column()');
    expect(migrationSQL).toContain('NEW.updated_at = NOW()');
    expect(migrationSQL).toMatch(/CREATE TRIGGER.*update_items_updated_at/);
    expect(migrationSQL).toMatch(/CREATE TRIGGER.*update_users_updated_at/);
  });
});
