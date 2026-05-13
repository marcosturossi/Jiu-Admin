import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FinancialTransactionService } from '../../../../generated_services/api/financialTransaction.service';
import { ShowTransactionCategoryDTO, ShowTransactionDTO, TransactionType } from '../../../../generated_services';
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
  private readonly transactionService = inject(FinancialTransactionService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly transaction = input.required<ShowTransactionDTO>();
  readonly categories = input.required<ShowTransactionCategoryDTO[]>();
  readonly closeEvent = output<void>();
  readonly transactionUpdated = output<void>();

  protected readonly isSaving = signal(false);

  protected readonly categoryOptions = computed(() =>
    this.categories().map(c => ({ id: c.id!, label: c.name! }))
  );

  protected readonly selectedCategoryId = signal<string | null>(null);

  protected readonly selectedCategory = computed(() =>
    this.categoryOptions().find(o => o.id === this.selectedCategoryId()) ?? null
  );

  protected readonly typeOptions = [
    { label: 'Receita', value: TransactionType.NUMBER_0 },
    { label: 'Despesa', value: TransactionType.NUMBER_1 },
  ];

  protected readonly form = this.fb.group({
    type: [null as TransactionType | null, Validators.required],
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
        type: t.type ?? null,
        transactionCategoryId: t.transactionCategoryId ?? null,
        description: t.description ?? '',
        amount: t.amount ?? null,
        transactionDate: t.transactionDate ? t.transactionDate.substring(0, 10) : '',
        reference: t.reference ?? '',
      });
      this.selectedCategoryId.set(t.transactionCategoryId ?? null);
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const v = this.form.value;
    this.transactionService.apiFinancialTransactionIdPut(this.transaction().id!, {
      type: v.type != null ? +v.type as TransactionType : null,
      transactionCategoryId: v.transactionCategoryId ?? null,
      description: v.description || null,
      amount: v.amount ?? null,
      transactionDate: v.transactionDate ?? null,
      reference: v.reference || null,
    }).subscribe({
      next: () => {
        this.ns.showSuccess('Transação Atualizada!', 'A transação foi atualizada com sucesso.');
        this.transactionUpdated.emit();
      },
      error: () => {
        this.ns.showError('Erro ao Atualizar', 'Não foi possível atualizar a transação.');
        this.isSaving.set(false);
      },
      complete: () => this.isSaving.set(false),
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected onCategorySelected(opt: SearchOption | null): void {
    this.selectedCategoryId.set(opt?.id ?? null);
    this.form.patchValue({ transactionCategoryId: opt?.id ?? null });
  }
}
