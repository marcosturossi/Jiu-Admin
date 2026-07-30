import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { AccountsPayableService } from '../../../../generated_services/api/accountsPayable.service';
import { SupplierService } from '../../../../generated_services/api/supplier.service';
import { ShowTransactionCategoryDTO, ShowSupplierDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { todayDateString } from '../../../../utils/date.utils';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { CreateTransactionCategoryComponent } from '../../transaction-categories/create-transaction-category/create-transaction-category.component';

@Component({
  selector: 'app-create-accounts-payable',
  standalone: true,
  imports: [ReactiveFormsModule, SearchSelectComponent, FieldErrorComponent, CreateTransactionCategoryComponent],
  templateUrl: './create-accounts-payable.component.html',
  styleUrl: './create-accounts-payable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAccountsPayableComponent {
  private readonly accountsPayableService = inject(AccountsPayableService);
  private readonly supplierService = inject(SupplierService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly categories = input.required<ShowTransactionCategoryDTO[]>();
  readonly closeEvent = output<void>();
  readonly itemCreated = output<void>();
  readonly categorySearch = output<string>();
  /** Bubbled up so the list page (owner of `categories`) can keep its copy in sync too. */
  readonly categoryCreated = output<ShowTransactionCategoryDTO>();

  protected readonly openedCreateCategory = signal(false);

  protected readonly isSaving = signal(false);

  protected readonly categoryOptions = computed(() =>
    this.categories().map(c => ({ id: c.id!, label: c.name! }))
  );

  protected readonly selectedCategory = signal<SearchOption | null>(null);

  protected readonly supplierOptions = signal<SearchOption[]>([]);
  protected readonly selectedSupplier = signal<SearchOption | null>(null);
  private readonly supplierSearchSubject = new Subject<string>();

  protected readonly form = this.fb.group({
    transactionCategoryId: [null as string | null],
    personId: [null as string | null, Validators.required],
    description: [''],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    transactionDate: [todayDateString(), Validators.required],
    dueDate: [todayDateString(), Validators.required],
    reference: [''],
  });

  constructor() {
    this.supplierSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadSuppliers(term));
    this.loadSuppliers();
  }

  protected onSupplierSelected(opt: SearchOption | null): void {
    this.selectedSupplier.set(opt);
    this.form.patchValue({ personId: opt?.id ?? null });
  }

  protected onSupplierSearch(term: string): void {
    this.supplierSearchSubject.next(term);
  }

  private loadSuppliers(term = ''): void {
    this.supplierService.apiSupplierGet(term || undefined, undefined, undefined, undefined, 1 as any, 100 as any).subscribe({
      next: result => {
        const suppliers: ShowSupplierDTO[] = result?.items ?? [];
        this.supplierOptions.set(
          suppliers
            .map(s => {
              // Despite the DTO field being named `personId`, the backend resolves it
              // against the Supplier record itself, not the nested Person id.
              const id = s.id;
              const label = s.individualPerson
                ? `${s.individualPerson.firstName ?? ''} ${s.individualPerson.lastName ?? ''}`.trim()
                : (s.companyPerson?.name ?? '');
              return id ? { id, label: label || id } : null;
            })
            .filter((o): o is SearchOption => o !== null),
        );
      },
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const v = this.form.value;
    this.accountsPayableService.apiAccountsPayablePost({
      transactionCategoryId: v.transactionCategoryId ?? undefined,
      personId: v.personId ?? undefined,
      description: v.description || undefined,
      amount: v.amount as any,
      transactionDate: v.transactionDate ?? undefined,
      dueDate: v.dueDate ?? undefined,
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

  protected onCategoryCreated(category: ShowTransactionCategoryDTO): void {
    this.openedCreateCategory.set(false);
    this.selectedCategory.set({ id: category.id!, label: category.name! });
    this.form.patchValue({ transactionCategoryId: category.id ?? null });
    this.categoryCreated.emit(category);
  }
}
