import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { AccountsPayableService } from '../../../generated_services/api/accountsPayable.service';
import { TransactionCategoryService } from '../../../generated_services/api/transactionCategory.service';
import { ShowAccountsPayableDTO, ShowTransactionCategoryDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateAccountsPayableComponent } from './create-accounts-payable/create-accounts-payable.component';
import { PayAccountsPayableComponent } from './pay-accounts-payable/pay-accounts-payable.component';
import { PageResult } from '../../../utils/page-result';
import { feeStatusBadge } from '../../../shared/status-badge';

@Component({
  selector: 'app-accounts-payable',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FilterComponent,
    PaginationComponent,
    CreateAccountsPayableComponent,
    PayAccountsPayableComponent,
],
  templateUrl: './accounts-payable.component.html',
  styleUrl: './accounts-payable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsPayableComponent {
  private readonly accountsPayableService = inject(AccountsPayableService);
  private readonly categoryService = inject(TransactionCategoryService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowAccountsPayableDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedPay = signal(false);
  protected readonly selectedItem = signal<ShowAccountsPayableDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly categories = signal<ShowTransactionCategoryDTO[]>([]);

  constructor() {
    this.subnavService.setTitle('Contas a Pagar');
    this.load();
    this.loadCategories();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.accountsPayableService.apiAccountsPayableGet(
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
        this.ns.showError('Erro', 'Não foi possível carregar as contas a pagar.');
      },
    });
  }

  protected pay(item: ShowAccountsPayableDTO): void {
    this.selectedItem.set(item);
    this.openedPay.set(true);
  }

  protected onPaid(): void {
    this.openedPay.set(false);
    this.selectedItem.set(null);
    this.load();
  }

  protected getAmount(item: ShowAccountsPayableDTO): number {
    return (item.amount as unknown as number) ?? 0;
  }

  protected readonly getFeeStatusBadge = feeStatusBadge;

  protected getCategoryName(id?: string | null): string {
    if (!id) return '—';
    return this.categories().find(c => c.id === id)?.name ?? id;
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void {
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

  protected async delete(item: ShowAccountsPayableDTO): Promise<void> {
    const ok = await this.confirmService.confirm('Tem certeza que deseja excluir esta conta a pagar?');
    if (!ok) return;
    this.accountsPayableService.apiAccountsPayableIdDelete(item.id!).subscribe({
      next: () => { this.ns.showSuccess('Excluída!', 'Excluída com sucesso.'); this.load(); },
      error: (err) => { this.ns.showError('Erro ao Excluir!', extractErrorMessage(err, 'Não foi possível excluir.')); },
    });
  }
}
