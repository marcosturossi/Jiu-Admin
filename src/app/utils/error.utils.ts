import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a user-facing message from a failed HTTP request against this
 * backend. Most endpoints return standard ASP.NET ProblemDetails /
 * ValidationProblemDetails bodies ({ title, detail, errors: { field: string[] } }),
 * but some (business-rule rejections like "X is not refundable") return a bare
 * { error: string } instead — both are checked. Falls back to the
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
  if (typeof body.error === 'string' && body.error.trim()) return body.error;

  return fallback;
}
