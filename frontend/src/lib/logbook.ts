/** Same limit as the backend (1 MB). The backend still checks it too. */
export const MAX_LOGBOOK_BYTES = 1024 * 1024;

/** Returns an error message for a file the backend would reject, or null. */
export function validateLogbook(file: File): string | null {
  if (!/\.txt$/i.test(file.name)) return "Only .txt files are accepted";
  if (file.size > MAX_LOGBOOK_BYTES) return "The logbook must be 1 MB or smaller";
  return null;
}
