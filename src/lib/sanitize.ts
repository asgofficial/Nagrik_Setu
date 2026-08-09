/**
 * Sanitization utilities for preventing XSS and protecting user privacy.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

const HTML_ESCAPE_REGEX = /[&<>"'/]/g;

/**
 * Escapes HTML special characters to prevent XSS in raw HTML contexts
 * (e.g., Leaflet tooltips, L.divIcon).
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Strips control characters (except newlines/tabs), trims whitespace,
 * and normalizes the string for safe storage.
 */
export function sanitizeText(str: string): string {
  if (!str) return '';
  // Remove control chars except \n, \r, \t
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Rounds GPS coordinates to the specified number of decimal places.
 * Default: 3 decimals ≈ ~100m precision (privacy protection).
 */
export function roundCoordinates(
  lat: number,
  lng: number,
  decimals: number = 3
): { latitude: number; longitude: number } {
  const factor = Math.pow(10, decimals);
  return {
    latitude: Math.round(lat * factor) / factor,
    longitude: Math.round(lng * factor) / factor,
  };
}

/**
 * Removes potential prompt injection patterns from user input
 * before sending to LLM APIs.
 */
export function sanitizeForLLM(str: string): string {
  if (!str) return '';
  // Remove sequences that might try to override system prompts
  return str
    .replace(/\b(system|assistant|user)\s*:/gi, '')
    .replace(/```/g, '')
    .replace(/\[INST\]/gi, '')
    .replace(/<\/?s>/gi, '')
    .trim();
}

/**
 * Validates that a MIME type is an allowed image type.
 */
export function isAllowedImageType(mimeType: string): boolean {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return allowed.includes(mimeType.toLowerCase());
}

/**
 * Validates file size is within limit.
 * @param sizeBytes - File size in bytes
 * @param maxMB - Maximum allowed size in megabytes (default: 5)
 */
export function isWithinSizeLimit(sizeBytes: number, maxMB: number = 5): boolean {
  return sizeBytes <= maxMB * 1024 * 1024;
}
