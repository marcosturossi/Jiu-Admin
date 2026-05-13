import { ChangeDetectionStrategy, Component, computed, input, OnDestroy, output, signal } from '@angular/core';
import { SearchOption } from './search-option';

@Component({
  selector: 'app-search-select',
  standalone: true,
  templateUrl: './search-select.component.html',
  styleUrl: './search-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchSelectComponent implements OnDestroy {
  readonly options = input.required<SearchOption[]>();
  readonly placeholder = input<string>('Selecione...');
  readonly selected = input<SearchOption | null>(null);
  readonly disabled = input<boolean>(false);
  readonly label = input<string>('Selecionar');

  readonly selectionChange = output<SearchOption | null>();
  readonly searchChange = output<string>();

  protected readonly isOpen = signal(false);
  protected readonly query = signal('');
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly filteredOptions = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.options();
    return this.options().filter(o => o.label.toLowerCase().includes(q));
  });

  protected open(): void {
    if (!this.disabled()) {
      this.isOpen.set(true);
    }
  }

  protected close(): void {
    this.clearSearchTimer();
    this.searchChange.emit('');
    this.query.set('');
    this.isOpen.set(false);
  }

  protected onQueryInput(value: string): void {
    this.clearSearchTimer();
    this.query.set(value);
    this.searchTimer = setTimeout(() => {
      this.searchChange.emit(value);
      this.searchTimer = null;
    }, 300);
  }

  protected select(opt: SearchOption): void {
    this.selectionChange.emit(opt);
    this.close();
  }

  protected clear(): void {
    this.selectionChange.emit(null);
  }

  ngOnDestroy(): void {
    this.clearSearchTimer();
  }

  private clearSearchTimer(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }
}
