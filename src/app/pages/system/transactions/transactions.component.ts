import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FinancialTransactionService } from '../../../generated_services/api/financialTransaction.service';
import { TransactionCategoryService } from '../../../generated_services/api/transactionCategory.service';
import { PaginationTransactionDTO, ShowTransactionDTO, ShowTransactionCategoryDTO, TransactionType } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterField, FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateTransactionComponent } from './create-transaction/create-transaction.component';
import { UpdateTransactionComponent } from './update-transaction/update-transaction.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FilterComponent,
    PaginationComponent,
    CreateTransactionComponent,
    UpdateTransactionComponent,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsComponent {
  private readonly transactionService = inject(FinancialTransactionService);
  private readonly categoryService = inject(TransactionCategoryService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PaginationTransactionDTO | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowTransactionDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterType = signal<TransactionType | undefined>(undefined);
  protected readonly searchTerm = signal('');
  protected readonly categories = signal<ShowTransactionCategoryDTO[]>([]);

  protected readonly filterFields: FilterField[] = [
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: String(TransactionType.Debit), label: 'Débito' },
        { value: String(TransactionType.Credit), label: 'Crédito' },
        { value: String(TransactionType.Refund), label: 'Reembolso' },
        { value: String(TransactionType.Adjustment), label: 'Ajuste' },
        { value: String(TransactionType.Income), label: 'Receita' },
        { value: String(TransactionType.Expense), label: 'Despesa' },
      ],
    },
  ];

  constructor() {
    this.subnavService.setTitle('Transações');
    this.load();
    this.loadCategories();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.transactionService.apiFinancialTransactionGet(
      this.filterType(),
      undefined, undefined, undefined,
      this.searchTerm() || undefined,
      this.currentPage(), this.pageSize(),
    ).subscribe({
      next: result => { this.items.set(result); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.ns.showError('Erro', 'Não foi possível carregar as transações.'); },
    });
  }

  protected getTypeSeverity(type?: TransactionType): 'success' | 'danger' | 'secondary' {
    switch (type) {
      case TransactionType.Credit:
      case TransactionType.Income: return 'success';
      case TransactionType.Debit:
      case TransactionType.Expense: return 'danger';
      default: return 'secondary';
    }
  }

  protected getTypeLabel(type?: TransactionType): string {
    switch (type) {
      case TransactionType.Debit: return 'Débito';
      case TransactionType.Credit: return 'Crédito';
      case TransactionType.Refund: return 'Reembolso';
      case TransactionType.Adjustment: return 'Ajuste';
      case TransactionType.Income: return 'Receita';
      case TransactionType.Expense: return 'Despesa';
      default: return '—';
    }
  }

  protected isPositiveType(type?: TransactionType): boolean {
    return type === TransactionType.Credit || type === TransactionType.Income;
  }

  protected isNegativeType(type?: TransactionType): boolean {
    return type === TransactionType.Debit || type === TransactionType.Expense;
  }

  protected getCategoryName(id?: string | null): string {
    if (!id) return '—';
    return this.categories().find(c => c.id === id)?.name ?? id;
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void {
    this.searchTerm.set(output.text);
    const typeCond = output.conditions.find(c => c.field.key === 'type');
    this.filterType.set(typeCond ? Number(typeCond.value) as unknown as TransactionType : undefined);
    this.currentPage.set(1);
    this.load();
  }
  protected onCategorySearch(term: string): void { this.loadCategories(term); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowTransactionDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  private loadCategories(term = ''): void {
    this.categoryService.apiTransactionCategoryGet(term || undefined, true, 1, 200).subscribe({
      next: result => this.categories.set(result.items ?? []),
    });
  }

  protected delete(item: ShowTransactionDTO): void {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    this.transactionService.apiFinancialTransactionIdDelete(item.id!).subscribe({
      next: () => { this.ns.showSuccess('Transação Excluída!', 'Excluída com sucesso.'); this.load(); },
      error: () => { this.ns.showError('Erro ao Excluir!', 'Não foi possível excluir a transação.'); },
    });
  }
}
