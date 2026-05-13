import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { SearchOption } from './search-option';

@Component({
  selector: 'app-search-select',
  standalone: true,
  templateUrl: './search-select.component.html',
  styleUrl: './search-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchSelectComponent {
  readonly options = input.required<SearchOption[]>();
  readonly placeholder = input<string>('Selecione...');
  readonly selected = input<SearchOption | null>(null);
  readonly disabled = input<boolean>(false);
  readonly label = input<string>('Selecionar');

  readonly selectionChange = output<SearchOption | null>();

  protected readonly isOpen = signal(false);
  protected readonly query = signal('');

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
    this.isOpen.set(false);
    this.query.set('');
  }

  protected select(opt: SearchOption): void {
    this.selectionChange.emit(opt);
    this.close();
  }

  protected clear(): void {
    this.selectionChange.emit(null);
  }
}
