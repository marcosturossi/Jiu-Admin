import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FinancialTransactionService } from '../../../../generated_services/api/financialTransaction.service';
import { ShowTransactionCategoryDTO } from '../../../../generated_services';
import { TransactionType } from '../../../../generated_services/model/transactionType';
import { NotificationService } from '../../../../services/notification.service';
import { todayDateString } from '../../../../utils/date.utils';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';

@Component({
  selector: 'app-create-transaction',
  standalone: true,
  imports: [ReactiveFormsModule, SearchSelectComponent],
  templateUrl: './create-transaction.component.html',
  styleUrl: './create-transaction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTransactionComponent {
  private readonly transactionService = inject(FinancialTransactionService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly categories = input.required<ShowTransactionCategoryDTO[]>();
  readonly closeEvent = output<void>();
  readonly transactionCreated = output<void>();
  readonly categorySearch = output<string>();

  protected readonly isSaving = signal(false);

  protected readonly categoryOptions = computed(() =>
    this.categories().map(c => ({ id: c.id!, label: c.name! }))
  );

  protected readonly selectedCategory = signal<SearchOption | null>(null);

  protected readonly typeOptions = [
    { label: 'Reembolso', value: TransactionType.Refund },
    { label: 'Ajuste', value: TransactionType.Adjustment },
    { label: 'Receita', value: TransactionType.Income },
    { label: 'Despesa', value: TransactionType.Expense },
  ];

  protected readonly form = this.fb.group({
    type: [TransactionType.Expense as TransactionType, Validators.required],
    transactionCategoryId: [null as string | null],
    description: [''],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    transactionDate: [todayDateString(), Validators.required],
    reference: [''],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const v = this.form.value;
    this.transactionService.apiFinancialTransactionPost({
      type: v.type as any,
      transactionCategoryId: v.transactionCategoryId ?? undefined,
      description: v.description || undefined,
      amount: v.amount as any,
      transactionDate: v.transactionDate ?? undefined,
      reference: v.reference || null,
    }).subscribe({
      next: () => {
        this.ns.showSuccess('Transação Criada!', 'A transação foi criada com sucesso.');
        this.transactionCreated.emit();
      },
      error: () => {
        this.ns.showError('Erro ao Criar', 'Não foi possível criar a transação.');
        this.isSaving.set(false);
      },
      complete: () => this.isSaving.set(false),
    });
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
