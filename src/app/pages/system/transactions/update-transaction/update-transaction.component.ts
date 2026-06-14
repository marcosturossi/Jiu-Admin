import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ShowFinancialTransactionDTO, ShowTransactionCategoryDTO } from '../../../../generated_services';
import { TransactionType } from '../../../../generated_services/model/transactionType';
import { NotificationService } from '../../../../services/notification.service';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';

@Component({
  selector: 'app-update-transaction',
  standalone: true,
  imports: [ReactiveFormsModule, SearchSelectComponent],
  templateUrl: './update-transaction.component.html',
  styleUrl: './update-transaction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateTransactionComponent {
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly transaction = input.required<ShowFinancialTransactionDTO>();
  readonly categories = input.required<ShowTransactionCategoryDTO[]>();
  readonly closeEvent = output<void>();
  readonly transactionUpdated = output<void>();
  readonly categorySearch = output<string>();

  protected readonly isSaving = signal(false);

  protected readonly categoryOptions = computed(() =>
   this.categories().map(c => ({ id: c.id!, label: c.name! }))
  );
  protected readonly selectedCategory = signal<SearchOption | null>(null);

  protected readonly typeOptions = [
    { label: 'Débito', value: TransactionType.Debit },
    { label: 'Crédito', value: TransactionType.Credit },
    { label: 'Reembolso', value: TransactionType.Refund },
    { label: 'Ajuste', value: TransactionType.Adjustment },
    { label: 'Receita', value: TransactionType.Income },
    { label: 'Despesa', value: TransactionType.Expense },
  ];

  protected readonly form = this.fb.group({
    type: [null as string | null, Validators.required],
    transactionCategoryId: [null as string | null],
    description: [''],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    transactionDate: ['', Validators.required],
    reference: [''],
  });

  constructor() {
    effect(() => {
      const t = this.transaction();
      this.form.patchValue({
        type: t.transactionCategoryId ?? null,
        transactionCategoryId: t.transactionCategoryId ?? null,
        description: t.description ?? '',
        amount: (t.amount as unknown as number) ?? null,
        transactionDate: t.transactionDate ? t.transactionDate.substring(0, 10) : '',
        reference: t.reference ?? '',
      });
      this.selectedCategory.set(t.transactionCategoryId ? { id: t.transactionCategoryId, label: t.transactionCategoryName ?? t.transactionCategoryId } : null);
    });
  }

  protected save(): void {
    this.ns.showError('Edição Indisponível', 'A edição de transações não está disponível no momento.');
  }

  protected close(): void { this.closeEvent.emit(); }

  protected onCategorySelected(opt: SearchOption | null): void {
    this.selectedCategory.set(opt);
    this.form.patchValue({ transactionCategoryId: opt?.id ?? null });
  }

  protected onCategorySearch(term: string): void {
    this.categorySearch.emit(term);
  }
}
