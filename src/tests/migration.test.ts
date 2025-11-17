/**
 * Migration Utilities Tests
 *
 * Focused test suite for migration utilities (Task Group 6).
 * Tests critical migration scenarios: data export, ID preservation, conflict handling.
 *
 * Test count: 8 focused tests (within 2-8 guideline)
 */

// Jest provides `describe`, `it`, `beforeEach`, and `expect` as globals; no import needed
import {
  exportLocalStorageToJSON,
  validateExportData,
  importBackupFile,
} from '@/src/lib/migration/export';
import {
  mapLocalUserToAuthUser,
  validateUUIDPreservation,
  validateTimestampPreservation,
  normalizeDateFormat,
} from '@/src/lib/migration/mapper';
import {
  detectConflicts,
  resolveConflict,
  filterNonConflictingItems,
} from '@/src/lib/migration/conflicts';
import {
  getMigrationStatus,
  isMigrationCompleted,
  initializeMigration,
  startMigration,
  completeMigration,
  clearMigrationStatus,
} from '@/src/lib/migration/status';
import { setItems, setAchievements, setDailyPoints, setUser } from '@/src/lib/storage/localStorage';
import type { ItemRow, AchievementRow, DailyPointsRow, UserRow } from '@/src/types/database';
import type { MigrationOptions } from '@/src/types/migration';

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

describe('Migration Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
  });

  // =====================================================
  // TEST 1: Export creates valid JSON with metadata
  // =====================================================
  it('should export localStorage data to valid JSON with version metadata', () => {
    // Setup test data
    const testItems: ItemRow[] = [
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
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const testAchievements: AchievementRow[] = [
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        item_id: '123e4567-e89b-12d3-a456-426614174000',
        points_earned: 25,
        achieved_at: '2024-01-01T12:00:00Z',
        created_at: '2024-01-01T12:00:00Z',
      },
    ];

    setItems(testItems);
    setAchievements(testAchievements);

    // Export data
    const exportData = exportLocalStorageToJSON();

    // Verify structure
    expect(exportData.version).toBe(1);
    expect(exportData.exportedAt).toBeDefined();
    expect(exportData.items).toEqual(testItems);
    expect(exportData.achievements).toEqual(testAchievements);
    expect(exportData.counts.items).toBe(1);
    expect(exportData.counts.achievements).toBe(1);

    // Validate export
    const validation = validateExportData(exportData);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  // =====================================================
  // TEST 2: Mapper preserves all IDs and timestamps
  // =====================================================
  it('should preserve all UUIDs and timestamps when mapping to authenticated user', () => {
    // Setup test data
    const testItems: ItemRow[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: null, // v1 - no auth
        text: 'Test item',
        type: 'step',
        parent_id: null,
        position: 0,
        completed: true,
        completed_at: '2024-01-01T10:00:00Z',
        points: 5,
        deleted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T09:00:00Z',
      },
    ];
    setItems(testItems);

    const exportData = exportLocalStorageToJSON();
    const supabaseUserId = '987f6543-e21c-34d5-b678-123456789abc';

    // Map data
    const mappedData = mapLocalUserToAuthUser(exportData, supabaseUserId);

    // Verify user_id was updated
    expect(mappedData.items[0].user_id).toBe(supabaseUserId);

    // Verify UUIDs preserved
    const uuidValidation = validateUUIDPreservation(exportData, mappedData);
    expect(uuidValidation.valid).toBe(true);
    expect(uuidValidation.errors).toEqual([]);

    // Verify timestamps preserved
    const timestampValidation = validateTimestampPreservation(exportData, mappedData);
    expect(timestampValidation.valid).toBe(true);
    expect(timestampValidation.errors).toEqual([]);

    // Verify specific timestamps
    expect(mappedData.items[0].created_at).toBe('2024-01-01T00:00:00Z');
    expect(mappedData.items[0].updated_at).toBe('2024-01-01T09:00:00Z');
    expect(mappedData.items[0].completed_at).toBe('2024-01-01T10:00:00Z');
  });

  // =====================================================
  // TEST 3: Conflict detection identifies duplicates
  // =====================================================
  it('should detect conflicts by ID match and text match', () => {
    const localItems: ItemRow[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        text: 'Duplicate by ID',
        type: 'waypoint',
        parent_id: null,
        position: 0,
        completed: false,
        completed_at: null,
        points: 25,
        deleted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '223e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        text: 'Duplicate by text',
        type: 'step',
        parent_id: null,
        position: 1,
        completed: false,
        completed_at: null,
        points: 5,
        deleted_at: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
    ];

    const supabaseItems: ItemRow[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000', // Same ID
        user_id: 'user-123',
        text: 'Different text but same ID',
        type: 'waypoint',
        parent_id: null,
        position: 0,
        completed: true,
        completed_at: '2024-01-05T00:00:00Z',
        points: 25,
        deleted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174000',
        user_id: 'user-123',
        text: 'Duplicate by text', // Same text, different ID
        type: 'step',
        parent_id: null,
        position: 0,
        completed: false,
        completed_at: null,
        points: 5,
        deleted_at: null,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      },
    ];

    const result = detectConflicts(localItems, supabaseItems);

    expect(result.totalConflicts).toBe(2);
    expect(result.requiresResolution).toBe(true);
    expect(result.conflicts).toHaveLength(2);

    // Check first conflict (ID match)
    const idConflict = result.conflicts.find(c => c.conflictReason === 'id_match');
    expect(idConflict).toBeDefined();
    expect(idConflict?.localItem.id).toBe('123e4567-e89b-12d3-a456-426614174000');

    // Check second conflict (text match)
    const textConflict = result.conflicts.find(c => c.conflictReason === 'text_match');
    expect(textConflict).toBeDefined();
    expect(textConflict?.localItem.text).toBe('Duplicate by text');
  });

  // =====================================================
  // TEST 4: Conflict resolution strategies work correctly
  // =====================================================
  it('should resolve conflicts using different strategies', () => {
    const localItem: ItemRow = {
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
      updated_at: '2024-01-05T00:00:00Z', // More recent
    };

    const cloudItem: ItemRow = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: 'user-123',
      text: 'Test item',
      type: 'waypoint',
      parent_id: null,
      position: 0,
      completed: true,
      completed_at: '2024-01-03T00:00:00Z',
      points: 25,
      deleted_at: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z', // Older
    };

    const conflict = { localItem, cloudItem, conflictReason: 'id_match' as const };

    // Test keep_local strategy
    const keepLocal = resolveConflict(conflict, 'keep_local');
    expect(keepLocal).toHaveLength(1);
    expect(keepLocal[0]).toEqual(localItem);

    // Test keep_cloud strategy
    const keepCloud = resolveConflict(conflict, 'keep_cloud');
    expect(keepCloud).toHaveLength(0);

    // Test keep_newest strategy (local is newer)
    const keepNewest = resolveConflict(conflict, 'keep_newest');
    expect(keepNewest).toHaveLength(1);
    expect(keepNewest[0]).toEqual(localItem);

    // Test manual_review strategy
    const manualReview = resolveConflict(conflict, 'manual_review');
    expect(manualReview).toHaveLength(0);
  });

  // =====================================================
  // TEST 5: Migration status prevents duplicate runs
  // =====================================================
  it('should track migration status and prevent duplicate runs', () => {
    const userId = '987f6543-e21c-34d5-b678-123456789abc';
    const options: MigrationOptions = {
      deleteLocalAfterMigration: false,
      conflictStrategy: 'keep_newest',
      preserveTimestamps: true,
      createBackup: true,
    };

    // Initially no migration
    expect(getMigrationStatus()).toBeNull();
    expect(isMigrationCompleted()).toBe(false);

    // Initialize migration
    const record = initializeMigration(userId, options);
    expect(record.state.status).toBe('pending');
    expect(record.userId).toBe(userId);

    // Start migration
    startMigration(record.migrationId);
    const inProgress = getMigrationStatus();
    expect(inProgress?.state.status).toBe('in_progress');
    expect(inProgress?.state.startedAt).toBeDefined();

    // Complete migration
    const result = {
      itemsMigrated: 10,
      achievementsMigrated: 5,
      dailyPointsMigrated: 3,
      errors: [],
      warnings: [],
    };
    completeMigration(record.migrationId, result);

    // Verify completed
    expect(isMigrationCompleted()).toBe(true);
    const completed = getMigrationStatus();
    expect(completed?.state.status).toBe('completed');
    expect(completed?.state.completedAt).toBeDefined();
    expect(completed?.result).toEqual(result);

    // Cleanup
    clearMigrationStatus();
    expect(getMigrationStatus()).toBeNull();
  });

  // =====================================================
  // TEST 6: Date format normalization
  // =====================================================
  it('should normalize various date formats to YYYY-MM-DD', () => {
    // ISO timestamp with time
    expect(normalizeDateFormat('2024-01-15T12:30:45Z')).toBe('2024-01-15');

    // Already normalized
    expect(normalizeDateFormat('2024-01-15')).toBe('2024-01-15');

    // Different month/day
    expect(normalizeDateFormat('2024-12-31T23:59:59Z')).toBe('2024-12-31');

    // Single digit month/day should be padded
    expect(normalizeDateFormat('2024-01-05T00:00:00Z')).toBe('2024-01-05');

    // Invalid date should throw
    expect(() => normalizeDateFormat('invalid-date')).toThrow('Invalid date string');
  });

  // =====================================================
  // TEST 7: Export validation catches invalid data
  // =====================================================
  it('should validate export data and catch structural issues', () => {
    // Valid export
    const validExport = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00Z',
      items: [],
      achievements: [],
      dailyPoints: [],
      user: { id: 'local-user', email: null, display_name: null, preferences: {}, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
      counts: { items: 0, achievements: 0, dailyPoints: 0 },
    };

    const validResult = validateExportData(validExport);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toEqual([]);

    // Missing version
    const noVersion = { ...validExport, version: undefined };
    const noVersionResult = validateExportData(noVersion);
    expect(noVersionResult.valid).toBe(false);
    expect(noVersionResult.errors).toContain('Missing version field');

    // Count mismatch
    const countMismatch = {
      ...validExport,
      items: [{ id: '123' }],
      counts: { items: 0, achievements: 0, dailyPoints: 0 },
    };
    const countResult = validateExportData(countMismatch);
    expect(countResult.valid).toBe(false);
    expect(countResult.errors.some(e => e.includes('count mismatch'))).toBe(true);
  });

  // =====================================================
  // TEST 8: Filter non-conflicting items
  // =====================================================
  it('should filter out conflicting items from migration set', () => {
    const localItems: ItemRow[] = [
      {
        id: '111e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        text: 'Clean item 1',
        type: 'waypoint',
        parent_id: null,
        position: 0,
        completed: false,
        completed_at: null,
        points: 25,
        deleted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '222e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        text: 'Conflicting item',
        type: 'step',
        parent_id: null,
        position: 1,
        completed: false,
        completed_at: null,
        points: 5,
        deleted_at: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      },
      {
        id: '333e4567-e89b-12d3-a456-426614174000',
        user_id: null,
        text: 'Clean item 2',
        type: 'waypoint',
        parent_id: null,
        position: 2,
        completed: false,
        completed_at: null,
        points: 25,
        deleted_at: null,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      },
    ];

    const conflicts = [
      {
        localItem: localItems[1], // Conflicting item
        cloudItem: localItems[1],
        conflictReason: 'id_match' as const,
      },
    ];

    const cleanItems = filterNonConflictingItems(localItems, conflicts);

    expect(cleanItems).toHaveLength(2);
    expect(cleanItems[0].id).toBe('111e4567-e89b-12d3-a456-426614174000');
    expect(cleanItems[1].id).toBe('333e4567-e89b-12d3-a456-426614174000');
    expect(cleanItems.find(item => item.id === '222e4567-e89b-12d3-a456-426614174000')).toBeUndefined();
  });
});
