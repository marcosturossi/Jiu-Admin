import { Observable, map, of, switchMap } from 'rxjs';
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

export function parseODataPage<T>(body: any, pageSize: number, skip = 0): ODataPage<T> {
  const responseBody = body?.body ?? body;
  const items: T[] = Array.isArray(responseBody) ? responseBody : (responseBody?.value ?? []);
  const headerCount = readCountFromHeaders(body?.headers);
  const bodyCountRaw = responseBody?.['@odata.count'] ?? responseBody?.['odata.count'];
  const bodyCount = Number(bodyCountRaw);
  const totalCount: number = headerCount ?? (Number.isFinite(bodyCount) ? bodyCount : undefined) ?? (skip + items.length);
  const totalPages = pageSize > 0 ? (totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1) : 1;
  return { items, totalCount, totalPages };
}

export function fetchODataPage<T>(
  request: (top: string, skip: string) => Observable<any>,
  pageSize: number,
  skip: number,
): Observable<ODataPage<T>> {
  return request(String(pageSize), String(skip)).pipe(
    switchMap(response => {
      const page = parseODataPage<T>(response, pageSize, skip);
      if (page.totalCount > page.items.length || page.items.length < pageSize) {
        return of(page);
      }

      return request('1', '0').pipe(
        map(countResponse => {
          const count = parseODataPage<T>(countResponse, 1, 0).totalCount;
          return {
            ...page,
            totalCount: count,
            totalPages: pageSize > 0 ? (count > 0 ? Math.ceil(count / pageSize) : 1) : 1,
          };
        }),
      );
    }),
  );
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
