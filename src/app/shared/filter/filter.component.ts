import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime } from 'rxjs';
import {
  FilterCondition,
  FilterField,
  FilterFieldType,
  FilterOperator,
  FilterOperatorOption,
  FilterOutput,
  getDefaultOperator,
  getOperatorsForType,
  operatorLabel,
} from './filter.types';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent {
  readonly placeholder = input<string>('Buscar...');
  readonly fields = input<FilterField[]>([]);

  readonly filterChange = output<FilterOutput>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  protected readonly inputValue = signal('');
  protected readonly modalOpen = signal(false);
  protected readonly conditions = signal<FilterCondition[]>([]);
  protected readonly draftConditions = signal<FilterCondition[]>([]);

  protected readonly activeCount = computed(() => this.conditions().length);

  constructor() {
    this.searchSubject
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.emit());
  }

  // ── Search input ──────────────────────────────────────────────────────────

  protected onInput(v: string): void {
    this.inputValue.set(v);
    this.searchSubject.next(v);
  }

  protected onClear(): void {
    this.inputValue.set('');
    this.emit();
  }

  // ── Modal ─────────────────────────────────────────────────────────────────

  protected openModal(): void {
    this.draftConditions.set(this.conditions().map(c => ({ ...c })));
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    this.modalOpen.set(false);
  }

  protected applyFilters(): void {
    this.conditions.set(this.draftConditions().filter(c => c.value !== ''));
    this.modalOpen.set(false);
    this.emit();
  }

  protected clearDraft(): void {
    this.draftConditions.set([]);
  }

  // ── Condition builder (draft) ─────────────────────────────────────────────

  protected addCondition(): void {
    const first = this.fields()[0];
    if (!first) return;
    this.draftConditions.update(list => [
      ...list,
      { field: first, operator: getDefaultOperator(first.type), value: '' },
    ]);
  }

  protected removeDraftCondition(i: number): void {
    this.draftConditions.update(list => list.filter((_, idx) => idx !== i));
  }

  protected onFieldChange(i: number, key: string): void {
    const field = this.fields().find(f => f.key === key);
    if (!field) return;
    this.draftConditions.update(list =>
      list.map((c, idx) =>
        idx === i
          ? { field, operator: getDefaultOperator(field.type), value: '' }
          : c
      )
    );
  }

  protected onOperatorChange(i: number, op: FilterOperator): void {
    this.draftConditions.update(list =>
      list.map((c, idx) => (idx === i ? { ...c, operator: op } : c))
    );
  }

  protected onValueChange(i: number, value: string): void {
    this.draftConditions.update(list =>
      list.map((c, idx) => (idx === i ? { ...c, value } : c))
    );
  }

  // ── Active chips ──────────────────────────────────────────────────────────

  protected removeActiveCondition(i: number): void {
    this.conditions.update(list => list.filter((_, idx) => idx !== i));
    this.emit();
  }

  // ── Helpers (used in template) ────────────────────────────────────────────

  protected getOperators(type: FilterFieldType): FilterOperatorOption[] {
    return getOperatorsForType(type);
  }

  protected operatorLabel(op: FilterOperator): string {
    return operatorLabel(op);
  }

  protected conditionValueLabel(cond: FilterCondition): string {
    if (cond.field.type === 'select' && cond.field.options) {
      return cond.field.options.find(o => o.value === cond.value)?.label ?? cond.value;
    }
    return cond.value;
  }

  // ─────────────────────────────────────────────────────────────────────────

  private emit(): void {
    this.filterChange.emit({ text: this.inputValue(), conditions: this.conditions() });
  }
}
