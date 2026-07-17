import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a user-facing message from a failed HTTP request against this
 * backend, which returns standard ASP.NET ProblemDetails / ValidationProblemDetails
 * bodies ({ title, detail, errors: { field: string[] } }). Falls back to the
 * caller-supplied generic message when the response has none of those.
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  const body = (err as HttpErrorResponse)?.error;
  if (!body || typeof body !== 'object') return fallback;

  if (body.errors && typeof body.errors === 'object') {
    const messages = Object.values(body.errors as Record<string, string[]>).flat();
    if (messages.length > 0) return messages.join(' ');
  }

  if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;
  if (typeof body.title === 'string' && body.title.trim()) return body.title;

  return fallback;
}
