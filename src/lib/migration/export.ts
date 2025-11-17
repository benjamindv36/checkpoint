/**
 * localStorage Export Utility
 *
 * This module provides utilities for exporting localStorage data to JSON format.
 * Used for creating backups before migration and for data recovery.
 *
 * Key features:
 * - Exports all localStorage data (items, achievements, daily_points, user)
 * - Includes version metadata for future compatibility
 * - Provides counts for validation
 * - Creates downloadable JSON backup file
 *
 * @module lib/migration/export
 */

import { getItems, getAchievements, getDailyPoints, getUser } from '@/src/lib/storage/localStorage';
import type { ExportData } from '@/src/types/migration';

/**
 * Export all localStorage data to JSON format.
 *
 * Reads all data from localStorage and packages it into a structured export object
 * with version metadata and counts. This provides a complete snapshot of user data
 * that can be used for backup, migration, or debugging.
 *
 * @returns ExportData object containing all localStorage data with metadata
 *
 * @example
 * ```typescript
 * const exportData = exportLocalStorageToJSON();
 * console.log(`Exported ${exportData.counts.items} items`);
 * ```
 */
export function exportLocalStorageToJSON(): ExportData {
  // Read all data from localStorage
  const items = getItems();
  const achievements = getAchievements();
  const dailyPoints = getDailyPoints();
  const user = getUser();

  // Create export data with version metadata
  const exportData: ExportData = {
    version: 1, // Export format version for future compatibility
    exportedAt: new Date().toISOString(),
    items,
    achievements,
    dailyPoints,
    user,
    counts: {
      items: items.length,
      achievements: achievements.length,
      dailyPoints: dailyPoints.length,
    },
  };

  return exportData;
}

/**
 * Create a downloadable JSON backup file from localStorage data.
 *
 * Exports all localStorage data and creates a downloadable JSON file.
 * The file is automatically named with a timestamp for easy identification.
 *
 * @returns ExportData object that was saved to file
 *
 * @example
 * ```typescript
 * const exportData = createBackupFile();
 * // User's browser will download: waypoint-backup-2024-01-01T12-00-00Z.json
 * ```
 */
export function createBackupFile(): ExportData {
  // Export all data
  const exportData = exportLocalStorageToJSON();

  // Create JSON blob
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Generate filename with timestamp (replace colons with hyphens for Windows compatibility)
  const timestamp = exportData.exportedAt.replace(/:/g, '-').replace(/\..+/, '');
  link.download = `waypoint-backup-${timestamp}.json`;

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return exportData;
}

/**
 * Validate an export data object to ensure it's complete and well-formed.
 *
 * Checks that the export has all required fields and that counts match array lengths.
 * Useful for verifying backups or exports before using them for migration.
 *
 * @param exportData - Export data to validate
 * @returns Object with validation result and any error messages
 *
 * @example
 * ```typescript
 * const exportData = exportLocalStorageToJSON();
 * const validation = validateExportData(exportData);
 * if (!validation.valid) {
 *   console.error('Export validation failed:', validation.errors);
 * }
 * ```
 */
export function validateExportData(exportData: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Type guard: check if exportData is an object
  if (!exportData || typeof exportData !== 'object') {
    return { valid: false, errors: ['Export data must be an object'] };
  }

  const data = exportData as Partial<ExportData>;

  // Check required fields
  if (!data.version) {
    errors.push('Missing version field');
  }

  if (!data.exportedAt) {
    errors.push('Missing exportedAt field');
  }

  if (!Array.isArray(data.items)) {
    errors.push('Missing or invalid items array');
  }

  if (!Array.isArray(data.achievements)) {
    errors.push('Missing or invalid achievements array');
  }

  if (!Array.isArray(data.dailyPoints)) {
    errors.push('Missing or invalid dailyPoints array');
  }

  if (!data.user || typeof data.user !== 'object') {
    errors.push('Missing or invalid user object');
  }

  if (!data.counts || typeof data.counts !== 'object') {
    errors.push('Missing or invalid counts object');
  }

  // Validate counts match array lengths
  if (data.items && data.counts?.items !== data.items.length) {
    errors.push(`Items count mismatch: expected ${data.counts?.items}, got ${data.items.length}`);
  }

  if (data.achievements && data.counts?.achievements !== data.achievements.length) {
    errors.push(
      `Achievements count mismatch: expected ${data.counts?.achievements}, got ${data.achievements.length}`
    );
  }

  if (data.dailyPoints && data.counts?.dailyPoints !== data.dailyPoints.length) {
    errors.push(
      `Daily points count mismatch: expected ${data.counts?.dailyPoints}, got ${data.dailyPoints.length}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Import data from a backup file.
 *
 * Reads a JSON backup file and validates its structure.
 * Does NOT write to localStorage - returns validated data for inspection.
 *
 * @param fileContent - JSON string from backup file
 * @returns Validated ExportData object
 * @throws Error if file content is invalid or validation fails
 *
 * @example
 * ```typescript
 * const fileContent = await file.text();
 * try {
 *   const importedData = importBackupFile(fileContent);
 *   console.log(`Loaded ${importedData.counts.items} items`);
 * } catch (error) {
 *   console.error('Import failed:', error);
 * }
 * ```
 */
export function importBackupFile(fileContent: string): ExportData {
  // Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Validate structure
  const validation = validateExportData(data);
  if (!validation.valid) {
    throw new Error(`Invalid backup file: ${validation.errors.join(', ')}`);
  }

  return data as ExportData;
}
