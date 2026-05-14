/**
 * Standard date utilities for Jiu-Admin.
 *
 * Backend conventions (C# with UtcDateTimeConverter):
 *   DateOnly fields  → "YYYY-MM-DD" string
 *   DateTime fields  → "YYYY-MM-DDTHH:mm:ss.fffZ" UTC ISO string
 *
 * Angular form conventions:
 *   <input type="date">           → string "YYYY-MM-DD"       (for DateOnly fields)
 *   <input type="datetime-local"> → string "YYYY-MM-DDTHH:mm" (for DateTime fields, local time)
 *
 * Display conventions (DatePipe):
 *   DateOnly  → | date:'dd/MM/yyyy':'UTC'   ← 'UTC' is required to avoid off-by-one-day
 *   DateTime  → | date:'dd/MM/yyyy HH:mm'   ← local browser time (no 'UTC' arg)
 */

/** Today's date as a "YYYY-MM-DD" string (UTC). */
export function todayDateString(): string {
  return new Date().toISOString().substring(0, 10);
}

/**
 * Converts a <input type="datetime-local"> value ("YYYY-MM-DDTHH:mm", local time)
 * to a UTC ISO 8601 string for DateTime backend fields.
 * Returns null if input is falsy.
 */
export function datetimeLocalToIso(localStr: string | null | undefined): string | null {
  if (!localStr) return null;
  return new Date(localStr).toISOString();
}

/**
 * Converts a UTC ISO 8601 string to a <input type="datetime-local"> value
 * ("YYYY-MM-DDTHH:mm") in the browser's local timezone.
 * Returns null if input is falsy.
 */
export function isoToDatetimeLocal(isoStr: string | null | undefined): string | null {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Converts a <input type="date"> value ("YYYY-MM-DD") to a UTC ISO 8601 string
 * (midnight UTC) for DateTime? backend fields that semantically hold only a date.
 * Returns null if input is falsy.
 */
export function dateStringToIso(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00Z').toISOString();
}
