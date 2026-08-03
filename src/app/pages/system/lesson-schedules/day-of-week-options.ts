import { DayOfWeek } from '../../../generated_services/model/dayOfWeek';

export const DAY_OF_WEEK_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: DayOfWeek.Monday, label: 'Segunda-feira' },
  { value: DayOfWeek.Tuesday, label: 'Terça-feira' },
  { value: DayOfWeek.Wednesday, label: 'Quarta-feira' },
  { value: DayOfWeek.Thursday, label: 'Quinta-feira' },
  { value: DayOfWeek.Friday, label: 'Sexta-feira' },
  { value: DayOfWeek.Saturday, label: 'Sábado' },
  { value: DayOfWeek.Sunday, label: 'Domingo' },
];

export function dayOfWeekLabel(value: DayOfWeek | undefined): string {
  return DAY_OF_WEEK_OPTIONS.find(o => o.value === value)?.label ?? (value ?? '—');
}
