import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AccountsReceivableService } from '../../../generated_services/api/accountsReceivable.service';
import { TransactionCategoryService } from '../../../generated_services/api/transactionCategory.service';
import { ShowAccountsReceivableDTO, ShowTransactionCategoryDTO } from '../../../generated_services';
import { TransactionType } from '../../../generated_services/model/transactionType';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { environment } from '../../../enviroments/environment';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterField, FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateAccountsReceivableComponent } from './create-accounts-receivable/create-accounts-receivable.component';
import { PageResult } from '../../../utils/page-result';
import { PaymentWithMoneyComponent } from './payment-with-money/payment-with-money.component';
import { RefundAccountsReceivableComponent } from './refund-accounts-receivable/refund-accounts-receivable.component';

@Component({
  selector: 'app-accounts-receivable',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FilterComponent,
    PaginationComponent,
    CreateAccountsReceivableComponent,
    PaymentWithMoneyComponent,
    RefundAccountsReceivableComponent,
],
  templateUrl: './accounts-receivable.component.html',
  styleUrl: './accounts-receivable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsReceivableComponent {
  private readonly http = inject(HttpClient);
  private readonly accountsReceivableService = inject(AccountsReceivableService);
  private readonly categoryService = inject(TransactionCategoryService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly isDownloading = signal(false);
  protected readonly items = signal<PageResult<ShowAccountsReceivableDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedRefund = signal(false);
  protected readonly openedPaymentWithMoney = signal(false);
  protected readonly selectedItem = signal<ShowAccountsReceivableDTO | null>(null);
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
        { value: TransactionType.Income, label: 'Receita' },
        { value: TransactionType.Refund, label: 'Reembolso' },
        { value: TransactionType.Adjustment, label: 'Ajuste' },
      ],
    },
  ];

  constructor() {
    this.subnavService.setTitle('Contas a Receber');
    this.load();
    this.loadCategories();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.accountsReceivableService.apiAccountsReceivableGet(
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
        this.ns.showError('Erro', 'Não foi possível carregar as contas a receber.');
      },
    });
  }

  protected getPdfReceipt(item: ShowAccountsReceivableDTO): void {
    if (!item.id) {
      this.ns.showWarning('Atenção', 'Conta sem identificação para gerar recibo.');
      return;
    }
    this.isDownloading.set(true);

    const url = `${environment.server}/api/AccountsReceivable/${item.id}/receipt/pdf`;
    this.http.get(url, {
      responseType: 'blob',
      headers: new HttpHeaders({ Accept: 'application/pdf' }),
    }).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo-${item.id}.pdf`;
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
      case 2: case TransactionType.Refund:
      case 3: case TransactionType.Adjustment:
      default: return 'secondary';
    }
  }

  protected openRefund(item: ShowAccountsReceivableDTO): void {
    this.selectedItem.set(item);
    this.openedRefund.set(true);
  }

  protected onRefund(): void {
    this.openedRefund.set(false);
    this.selectedItem.set(null);
    this.load();
  }

  protected paymentWithMoney(item: ShowAccountsReceivableDTO): void {
    this.selectedItem.set(item);
    this.openedPaymentWithMoney.set(true);
  }

  protected onPaymentWithMoney(): void {
    this.openedPaymentWithMoney.set(false);
    this.selectedItem.set(null);
    this.load();
  }

  protected getTypeLabel(type?: number | string): string {
    switch (type) {
      case 0: case TransactionType.Income: return 'Receita';
      case 2: case TransactionType.Refund: return 'Reembolso';
      case 3: case TransactionType.Adjustment: return 'Ajuste';

      default: return '—';
    }
  }

  protected isRefundable(item: ShowAccountsReceivableDTO): boolean {
    return item.type === TransactionType.Income && item.status === 'Paid';
  }

  protected isPositiveType(type?: number | string): boolean {
    return type === TransactionType.Income;
  }

  protected getAmount(item: ShowAccountsReceivableDTO): number {
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

  protected delete(item: ShowAccountsReceivableDTO): void {
    if (!confirm('Tem certeza que deseja excluir esta conta a receber?')) return;
    this.accountsReceivableService.apiAccountsReceivableChargeIdDelete(item.id!).subscribe({
      next: () => { this.ns.showSuccess('Excluída!', 'Excluída com sucesso.'); this.load(); },
      error: () => { this.ns.showError('Erro ao Excluir!', 'Não foi possível excluir.'); },
    });
  }
}
