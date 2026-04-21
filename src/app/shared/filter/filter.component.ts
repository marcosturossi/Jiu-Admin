import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterInterface, OperationEnum } from '../interface/filter.interface';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterComponent {
  readonly filterKeys = input.required<string[]>();
  readonly setFilterEvent = output<FilterInterface>();
  readonly closeFilterEvent = output<void>();

  protected readonly value = signal('');
  protected readonly selectedFilterKey = signal('');
  protected readonly selectedOperation = signal<OperationEnum>(OperationEnum.eq);

  protected readonly operations = Object.values(OperationEnum);

  close(): void {
    this.closeFilterEvent.emit();
  }

  save(): void {
    if (this.selectedFilterKey()) {
      this.setFilterEvent.emit({
        key: this.selectedFilterKey(),
        operation: this.selectedOperation(),
        value: this.value(),
      });
      this.closeFilterEvent.emit();
    }
  }
}
