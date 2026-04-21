import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinancialTransactionService } from '../../../generated_services/api/financialTransaction.service';
import { TransactionCategoryService } from '../../../generated_services/api/transactionCategory.service';
import { PaginationTransactionDTO, ShowTransactionDTO, ShowTransactionCategoryDTO, TransactionType } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateTransactionComponent } from './create-transaction/create-transaction.component';
import { UpdateTransactionComponent } from './update-transaction/update-transaction.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FormsModule,
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

  protected readonly typeOptions = [
    { label: 'Todos', value: undefined },
    { label: 'Receita', value: TransactionType.NUMBER_0 },
    { label: 'Despesa', value: TransactionType.NUMBER_1 },
  ];

  constructor() {
    this.subnavService.setTitle('Transações');
    this.load();
    this.categoryService.apiTransactionCategoryGet(1, 200, true).subscribe({
      next: result => this.categories.set(result.items ?? []),
    });
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
      case TransactionType.NUMBER_0: return 'success';
      case TransactionType.NUMBER_1: return 'danger';
      default: return 'secondary';
    }
  }

  protected getTypeLabel(type?: TransactionType): string {
    switch (type) {
      case TransactionType.NUMBER_0: return 'Receita';
      case TransactionType.NUMBER_1: return 'Despesa';
      default: return '—';
    }
  }

  protected getCategoryName(id?: string | null): string {
    if (!id) return '—';
    return this.categories().find(c => c.id === id)?.name ?? id;
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(): void { this.currentPage.set(1); this.load(); }
  protected onSearch(term: string): void { this.searchTerm.set(term); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowTransactionDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowTransactionDTO): void {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    this.transactionService.apiFinancialTransactionIdDelete(item.id!).subscribe({
      next: () => { this.ns.showSuccess('Transação Excluída!', 'Excluída com sucesso.'); this.load(); },
      error: () => { this.ns.showError('Erro ao Excluir!', 'Não foi possível excluir a transação.'); },
    });
  }
}
