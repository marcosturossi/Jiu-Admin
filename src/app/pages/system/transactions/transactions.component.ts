import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FinancialTransactionService } from '../../../generated_services/api/financialTransaction.service';
import { TransactionCategoryService } from '../../../generated_services/api/transactionCategory.service';
import { ShowFinancialTransactionDTO, ShowTransactionCategoryDTO } from '../../../generated_services';
import { TransactionType } from '../../../generated_services/model/transactionType';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { environment } from '../../../enviroments/environment';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterField, FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateTransactionComponent } from './create-transaction/create-transaction.component';
import { PageResult } from '../../../utils/page-result';
import { UpdateTransactionComponent } from './update-transaction/update-transaction.component';
import { PaymentWithMoneyComponent } from './payment-with-money/payment-with-money.component';

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
    PaymentWithMoneyComponent,
],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsComponent {
  private readonly http = inject(HttpClient);
  private readonly transactionService = inject(FinancialTransactionService);
  private readonly categoryService = inject(TransactionCategoryService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly isDownloading = signal(false);
  protected readonly items = signal<PageResult<ShowFinancialTransactionDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedEdit = signal(false);
  protected readonly openPaymentWithMoney = signal(false);
  protected readonly selectedTransaction = signal<ShowFinancialTransactionDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterType = signal<string | undefined>(undefined);
  protected readonly categories = signal<ShowTransactionCategoryDTO[]>([]);

  protected readonly filterFields: FilterField[] = [
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: TransactionType.Refund, label: 'Reembolso' },
        { value: TransactionType.Adjustment, label: 'Ajuste' },
        { value: TransactionType.Income, label: 'Receita' },
        { value: TransactionType.Expense, label: 'Despesa' },
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
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      this.currentPage() as any,
      this.pageSize() as any,
    ).subscribe({
      next: result => {
        this.items.set({
          items: result?.items ?? [],
          totalCount: (result?.totalCount as unknown as number) ?? 0,
          totalPages: (result?.totalPages as unknown as number) ?? 1,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.ns.showError('Erro', 'Não foi possível carregar as transações.');
      },
    });
  }

  protected getPdfReceipt(fee: ShowFinancialTransactionDTO): void {
    if (!fee.id) {
      this.ns.showWarning('Atenção', 'Transação sem identificação para gerar recibo.');
      return;
    }
    this.isDownloading.set(true);

    const url = `${environment.server}/api/FinancialTransaction/${fee.id}/receipt/pdf`;
    this.http.get(url, {
      responseType: 'blob',
      headers: new HttpHeaders({ Accept: 'application/pdf' }),
    }).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo-${fee.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.ns.showError('Erro', 'Não foi possível baixar o recibo.');
      },
      complete: () => {
        this.isDownloading.set(false);
      }
    });
  }

  protected getTypeSeverity(type?: number | string): 'success' | 'danger' | 'secondary' {
    switch (type) {
      case 0: case TransactionType.Income: return 'success';
      case 1: case TransactionType.Expense: return 'danger';
      case 2: case TransactionType.Refund:
      case 3: case TransactionType.Adjustment:
      default: return 'secondary';
    }
  }

  protected openEdit(transaction: ShowFinancialTransactionDTO): void {
    this.selectedTransaction.set(transaction);
    this.openedEdit.set(true);
  }

  protected onUpdated(): void {
    this.openedEdit.set(false);
    this.selectedTransaction.set(null);
    this.load();
  }

  protected paymentWithMoney(transaction: ShowFinancialTransactionDTO): void {
    this.selectedTransaction.set(transaction);
    this.openPaymentWithMoney.set(true);
  }

  protected onPaymentWithMoney(): void {
    this.openPaymentWithMoney.set(false);
    this.selectedTransaction.set(null);
    this.load();
  }

  protected getTypeLabel(type?: number | string): string {
    switch (type) {
      case 0: case TransactionType.Income: return 'Receita';
      case 1: case TransactionType.Expense: return 'Despesa';
      case 2: case TransactionType.Refund: return 'Reembolso';
      case 3: case TransactionType.Adjustment: return 'Ajuste';

      default: return '—';
    }
  }

  protected isPositiveType(type?: number | string): boolean {
    return type === TransactionType.Income;
  }

  protected isNegativeType(type?: number | string): boolean {
    return  type === TransactionType.Expense;
  }

  protected getAmount(item: ShowFinancialTransactionDTO): number {
    return (item.amount as unknown as number) ?? 0;
  }

  protected getCategoryName(id?: string | null): string {
    if (!id) return '—';
    return this.categories().find(c => c.id === id)?.name ?? id;
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void {
    this.filterType.set(output.conditions.find(c => c.field.key === 'type')?.value as string | undefined);
    this.currentPage.set(1);
    this.load();
  }
  protected onCategorySearch(term: string): void { this.loadCategories(term); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }

  private loadCategories(term = ''): void {
    this.categoryService.apiTransactionCategoryGet(term || undefined, undefined, 1, 100).subscribe({
      next: result => {
        this.categories.set(result?.items ?? []);
      },
    });
  }

  protected delete(item: ShowFinancialTransactionDTO): void {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    this.transactionService.apiFinancialTransactionChargeIdDelete(item.id!).subscribe({
      next: () => { this.ns.showSuccess('Transação Excluída!', 'Excluída com sucesso.'); this.load(); },
      error: () => { this.ns.showError('Erro ao Excluir!', 'Não foi possível excluir a transação.'); },
    });
  }
}
