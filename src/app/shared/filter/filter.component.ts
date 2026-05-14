import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

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
  readonly value = input<string>('');

  readonly searchChange = output<string>();
  readonly searchReset = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  protected readonly inputValue = signal('');

  constructor() {
    toObservable(this.value)
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.inputValue.set(v));

    this.searchSubject
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.searchChange.emit(v));
  }

  protected onInput(v: string): void {
    this.inputValue.set(v);
    this.searchSubject.next(v);
  }

  protected onClear(): void {
    this.inputValue.set('');
    this.searchReset.emit();
  }
}
