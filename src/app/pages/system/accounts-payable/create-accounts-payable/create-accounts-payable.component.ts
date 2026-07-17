import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AccountsPayableService } from '../../../../generated_services/api/accountsPayable.service';
import { ShowTransactionCategoryDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { todayDateString } from '../../../../utils/date.utils';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-create-accounts-payable',
  standalone: true,
  imports: [ReactiveFormsModule, SearchSelectComponent, FieldErrorComponent],
  templateUrl: './create-accounts-payable.component.html',
  styleUrl: './create-accounts-payable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAccountsPayableComponent {
  private readonly accountsPayableService = inject(AccountsPayableService);
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

  protected readonly form = this.fb.group({
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
    this.accountsPayableService.apiAccountsPayablePost({
      transactionCategoryId: v.transactionCategoryId ?? undefined,
      description: v.description || undefined,
      amount: v.amount as any,
      transactionDate: v.transactionDate ?? undefined,
      reference: v.reference || null,
    }).subscribe({
      next: () => {
        this.ns.showSuccess('Conta a Pagar Criada!', 'A conta a pagar foi criada com sucesso.');
        this.itemCreated.emit();
      },
      error: (err) => {
        this.ns.showError('Erro ao Criar', extractErrorMessage(err, 'Não foi possível criar a conta a pagar.'));
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
