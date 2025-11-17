/**
 * UUID Generation Utilities
 *
 * This module provides client-side UUID generation for creating unique identifiers.
 * UUIDs are RFC 4122 compliant (version 4) and use the same structure as future
 * Supabase implementation to ensure seamless migration.
 *
 * Uses crypto.randomUUID() when available (modern browsers), with a fallback
 * implementation for older environments.
 *
 * @module lib/utils/uuid
 */

/**
 * Generate a RFC 4122 compliant UUID (version 4).
 *
 * Uses crypto.randomUUID() when available for cryptographically secure random UUIDs.
 * Falls back to a manual implementation using crypto.getRandomValues() for older browsers.
 *
 * UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * where x is any hexadecimal digit and y is one of 8, 9, a, or b.
 *
 * @returns A UUID string in the format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @example
 * ```typescript
 * const itemId = generateUUID();
 * console.log(itemId); // "123e4567-e89b-12d3-a456-426614174000"
 *
 * const item = {
 *   id: generateUUID(),
 *   text: 'New waypoint',
 *   type: 'waypoint',
 *   // ...
 * };
 * ```
 */
export function generateUUID(): string {
  // Use native crypto.randomUUID() if available (most modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback implementation using crypto.getRandomValues()
  // This ensures compatibility with older browsers while maintaining cryptographic security
  return fallbackUUID();
}

/**
 * Fallback UUID v4 generation using crypto.getRandomValues().
 *
 * This implementation creates a RFC 4122 compliant UUID v4 by:
 * 1. Generating 16 random bytes using crypto.getRandomValues()
 * 2. Setting version bits (4xxx) and variant bits (yxxx where y is 8, 9, a, or b)
 * 3. Formatting as standard UUID string with hyphens
 *
 * @returns A UUID v4 string
 */
function fallbackUUID(): string {
  // Generate 16 random bytes
  const bytes = new Uint8Array(16);

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    // Final fallback for environments without crypto (should be rare)
    // Note: This is NOT cryptographically secure and should only be used as a last resort
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Set version bits (4xxx) - set bits 4-7 of byte 6 to 0100
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  // Set variant bits (yxxx where y is 8, 9, a, or b) - set bits 6-7 of byte 8 to 10
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // Convert bytes to hex string with proper formatting
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Format as UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

/**
 * Validate that a string is a valid UUID format.
 *
 * Checks if the input matches the standard UUID format:
 * xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (where x is a hexadecimal digit)
 *
 * Note: This checks format only, not RFC 4122 version/variant bits.
 *
 * @param uuid - String to validate
 * @returns True if the string is a valid UUID format, false otherwise
 *
 * @example
 * ```typescript
 * const valid = isValidUUID('123e4567-e89b-12d3-a456-426614174000');
 * console.log(valid); // true
 *
 * const invalid = isValidUUID('not-a-uuid');
 * console.log(invalid); // false
 * ```
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate multiple UUIDs at once.
 *
 * Useful for batch operations or pre-generating IDs.
 *
 * @param count - Number of UUIDs to generate
 * @returns Array of UUID strings
 *
 * @example
 * ```typescript
 * const ids = generateUUIDs(5);
 * console.log(ids.length); // 5
 * console.log(ids.every(id => isValidUUID(id))); // true
 * ```
 */
export function generateUUIDs(count: number): string[] {
  return Array.from({ length: count }, () => generateUUID());
}
