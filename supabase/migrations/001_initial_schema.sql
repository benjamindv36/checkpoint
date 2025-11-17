-- =====================================================
-- Waypoint App Initial Schema
-- =====================================================
-- This migration creates the foundational database schema for the
-- Waypoint App achievement tracking system, including:
-- - Users table for authentication (prepared for v3)
-- - Items table for Directions, Waypoints, and Steps with auto-linking support
-- - Achievements table for completion logging
-- - Daily points table for baseline tracking
--
-- Key Features:
-- - Auto-linking by text match (case-insensitive)
-- - Soft deletion via deleted_at timestamps
-- - Parent-child hierarchy via parent_id
-- - Foreign key cascades for data integrity
-- - Performance indexes for common query patterns
-- =====================================================

-- Enable UUID extension for ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
-- Stores user accounts and preferences
-- In v1: nullable user_id or hardcoded 'local-user'
-- In v3: populated with Supabase Auth user IDs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  display_name TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ITEMS TABLE
-- =====================================================
-- Central table for all waypoint items (Directions, Waypoints, Steps)
-- Supports auto-linking via text matching and hierarchical relationships
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('direction', 'waypoint', 'step')),
  parent_id UUID REFERENCES items(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  points INTEGER NOT NULL CHECK (points >= 0),
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ACHIEVEMENTS TABLE
-- =====================================================
-- Records completion events for the achievement log
-- Stores points at achievement time to preserve history
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL CHECK (points_earned >= 0),
  achieved_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DAILY POINTS TABLE
-- =====================================================
-- Tracks baseline points awarded for existing each day
-- Total daily points = baseline + SUM(achievements on that date)
CREATE TABLE daily_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  baseline_points INTEGER DEFAULT 10 CHECK (baseline_points >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- =====================================================
-- INDEXES FOR ITEMS TABLE
-- =====================================================
-- Performance indexes for common query patterns

-- User-specific queries
CREATE INDEX idx_items_user_id ON items(user_id);

-- Hierarchy queries (parent-child relationships)
CREATE INDEX idx_items_parent_id ON items(parent_id);

-- Auto-linking detection (case-insensitive text matching)
CREATE INDEX idx_items_text_lower ON items(LOWER(text));

-- Filtering completed/active items by user
CREATE INDEX idx_items_user_completed_deleted ON items(user_id, completed, deleted_at);

-- Ordered child fetching (siblings by position)
CREATE INDEX idx_items_user_parent_position ON items(user_id, parent_id, position);

-- Finding canonical instances (earliest created)
CREATE INDEX idx_items_created_at ON items(created_at);

-- Filtering soft-deleted items (partial index for efficiency)
CREATE INDEX idx_items_deleted_at ON items(deleted_at) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- INDEXES FOR ACHIEVEMENTS TABLE
-- =====================================================

-- User-specific achievement queries
CREATE INDEX idx_achievements_user_id ON achievements(user_id);

-- Item-specific achievement lookups
CREATE INDEX idx_achievements_item_id ON achievements(item_id);

-- Chronological sorting and date range queries
CREATE INDEX idx_achievements_achieved_at ON achievements(achieved_at);

-- User's achievement log (most recent first)
CREATE INDEX idx_achievements_user_achieved_desc ON achievements(user_id, achieved_at DESC);

-- =====================================================
-- INDEXES FOR DAILY POINTS TABLE
-- =====================================================

-- Daily lookups by user and date
CREATE INDEX idx_daily_points_user_date ON daily_points(user_id, date);

-- Date range queries
CREATE INDEX idx_daily_points_date ON daily_points(date);

-- =====================================================
-- INDEXES FOR USERS TABLE
-- =====================================================

-- Email lookup (partial index when email is not null)
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;

-- =====================================================
-- TRIGGERS
-- =====================================================
-- Automatic timestamp updates for updated_at columns

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to items table
CREATE TRIGGER update_items_updated_at
BEFORE UPDATE ON items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF MIGRATION
-- =====================================================
