export type FilterFieldType = 'text' | 'number' | 'date' | 'select';

export type FilterOperator = 'contains' | 'not_contains' | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: { value: string; label: string }[];
}

export interface FilterCondition {
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export interface FilterOutput {
  text: string;
  conditions: FilterCondition[];
}

export interface FilterOperatorOption {
  value: FilterOperator;
  label: string;
}

const TEXT_OPERATORS: FilterOperatorOption[] = [
  { value: 'contains', label: 'Contém' },
  { value: 'not_contains', label: 'Não contém' },
  { value: 'eq', label: 'Igual a' },
  { value: 'neq', label: 'Diferente de' },
];

const NUMBER_OPERATORS: FilterOperatorOption[] = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
];

const DATE_OPERATORS: FilterOperatorOption[] = [
  { value: 'eq', label: 'Em' },
  { value: 'gt', label: 'Após' },
  { value: 'gte', label: 'A partir de' },
  { value: 'lt', label: 'Antes de' },
  { value: 'lte', label: 'Até' },
];

const SELECT_OPERATORS: FilterOperatorOption[] = [
  { value: 'eq', label: 'Igual a' },
  { value: 'neq', label: 'Diferente de' },
];

export function getOperatorsForType(type: FilterFieldType): FilterOperatorOption[] {
  switch (type) {
    case 'text':   return TEXT_OPERATORS;
    case 'number': return NUMBER_OPERATORS;
    case 'date':   return DATE_OPERATORS;
    case 'select': return SELECT_OPERATORS;
  }
}

export function getDefaultOperator(type: FilterFieldType): FilterOperator {
  switch (type) {
    case 'text':   return 'contains';
    case 'number': return 'eq';
    case 'date':   return 'gte';
    case 'select': return 'eq';
  }
}

export function operatorLabel(op: FilterOperator): string {
  const all = [...TEXT_OPERATORS, ...NUMBER_OPERATORS, ...DATE_OPERATORS, ...SELECT_OPERATORS];
  return all.find(o => o.value === op)?.label ?? op;
}
