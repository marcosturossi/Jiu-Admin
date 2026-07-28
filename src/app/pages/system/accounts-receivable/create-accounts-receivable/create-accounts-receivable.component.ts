import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AccountsReceivableService } from '../../../../generated_services/api/accountsReceivable.service';
import { ShowTransactionCategoryDTO } from '../../../../generated_services';
import { TransactionType } from '../../../../generated_services/model/transactionType';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { todayDateString } from '../../../../utils/date.utils';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-create-accounts-receivable',
  standalone: true,
  imports: [ReactiveFormsModule, SearchSelectComponent, FieldErrorComponent],
  templateUrl: './create-accounts-receivable.component.html',
  styleUrl: './create-accounts-receivable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAccountsReceivableComponent {
  private readonly accountsReceivableService = inject(AccountsReceivableService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly categories = input.required<ShowTransactionCategoryDTO[]>();
  readonly closeEvent = output<void>();
  readonly itemCreated = output<void>();
  readonly categorySearch = output<string>();

  protected readonly isSaving = signal(false);

  protected readonly categoryOptions = computed(() =>
    this.categories().map(c => ({ id: c.id!, label: c.name! }))
  );

  protected readonly selectedCategory = signal<SearchOption | null>(null);

  protected readonly typeOptions = [
    { label: 'Receita', value: TransactionType.Income },
    { label: 'Reembolso', value: TransactionType.Refund },
    { label: 'Ajuste', value: TransactionType.Adjustment },
  ];

  protected readonly form = this.fb.group({
    type: [TransactionType.Income as TransactionType, Validators.required],
    transactionCategoryId: [null as string | null],
    description: [''],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    transactionDate: [todayDateString(), Validators.required],
    dueDate: [todayDateString(), Validators.required],
    reference: [''],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const v = this.form.value;
    this.accountsReceivableService.apiAccountsReceivablePost({
      type: v.type as any,
      transactionCategoryId: v.transactionCategoryId ?? undefined,
      description: v.description || undefined,
      amount: v.amount as any,
      transactionDate: v.transactionDate ?? undefined,
      dueDate: v.dueDate ?? undefined,
      reference: v.reference || null,
    }).subscribe({
      next: () => {
        this.ns.showSuccess('Conta a Receber Criada!', 'A conta a receber foi criada com sucesso.');
        this.itemCreated.emit();
      },
      error: (err) => {
        this.ns.showError('Erro ao Criar', extractErrorMessage(err, 'Não foi possível criar a conta a receber.'));
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
