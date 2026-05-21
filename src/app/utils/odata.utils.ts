import { FilterCondition } from '../shared/filter/filter.types';

export interface ODataPage<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
}

function readCountFromHeaders(headers: any): number | undefined {
  if (!headers) return undefined;
  const raw =
    headers.get?.('@odata.count') ??
    headers.get?.('odata.count') ??
    headers.get?.('x-total-count') ??
    headers.get?.('X-Total-Count');
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseODataPage<T>(body: any, pageSize: number): ODataPage<T> {
  const responseBody = body?.body ?? body;
  const items: T[] = Array.isArray(responseBody) ? responseBody : (responseBody?.value ?? []);
  const headerCount = readCountFromHeaders(body?.headers);
  const bodyCount = responseBody?.['@odata.count'] ?? responseBody?.['odata.count'];
  const totalCount: number = headerCount ?? bodyCount ?? items.length;
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;
  return { items, totalCount, totalPages };
}

export function buildODataFilter(
  text: string,
  textFields: string[],
  conditions: FilterCondition[] = [],
): string | undefined {
  const parts: string[] = [];

  if (text && textFields.length > 0) {
    const escaped = text.replace(/'/g, "''");
    const textParts = textFields.map(f => `contains(${f},'${escaped}')`);
    parts.push(textParts.length === 1 ? textParts[0] : `(${textParts.join(' or ')})`);
  }

  for (const c of conditions) {
    const field = c.field.key;
    const isNumeric = c.field.type === 'number';
    const isDate = c.field.type === 'date';
    const isBooleanString = c.value === 'true' || c.value === 'false';
    const val = c.value.replace(/'/g, "''");
    const escapedVal = isNumeric || isDate || isBooleanString ? val : `'${val}'`;

    switch (c.operator) {
      case 'contains':     parts.push(`contains(${field},${escapedVal})`);     break;
      case 'not_contains': parts.push(`not contains(${field},${escapedVal})`); break;
      case 'eq':  parts.push(`${field} eq ${escapedVal}`);  break;
      case 'neq': parts.push(`${field} ne ${escapedVal}`);  break;
      case 'gt':  parts.push(`${field} gt ${escapedVal}`);  break;
      case 'gte': parts.push(`${field} ge ${escapedVal}`);  break;
      case 'lt':  parts.push(`${field} lt ${escapedVal}`);  break;
      case 'lte': parts.push(`${field} le ${escapedVal}`);  break;
    }
  }

  return parts.length ? parts.join(' and ') : undefined;
}
