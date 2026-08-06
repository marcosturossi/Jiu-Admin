import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { AccountsReceivableService } from '../../../generated_services/api/accountsReceivable.service';
import { TransactionCategoryService } from '../../../generated_services/api/transactionCategory.service';
import { StudentsService } from '../../../generated_services/api/students.service';
import { ShowAccountsReceivableDTO, ShowTransactionCategoryDTO, ShowStudentDTO } from '../../../generated_services';
import { TransactionType } from '../../../generated_services/model/transactionType';
import { FeeStatus } from '../../../generated_services/model/feeStatus';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { environment } from '../../../enviroments/environment';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterField, FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { SearchOption } from '../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../shared/search-select/search-select.component';
import { CreateAccountsReceivableComponent } from './create-accounts-receivable/create-accounts-receivable.component';
import { PageResult } from '../../../utils/page-result';
import { PaymentWithMoneyComponent } from './payment-with-money/payment-with-money.component';
import { RefundAccountsReceivableComponent } from './refund-accounts-receivable/refund-accounts-receivable.component';
import { GenerateChargeComponent } from './generate-charge/generate-charge.component';
import { ViewChargeComponent } from './view-charge/view-charge.component';
import { transactionTypeBadge, feeStatusBadge } from '../../../shared/status-badge';

@Component({
  selector: 'app-accounts-receivable',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    RouterLink,
    FormsModule,
    FilterComponent,
    PaginationComponent,
    SearchSelectComponent,
    CreateAccountsReceivableComponent,
    PaymentWithMoneyComponent,
    RefundAccountsReceivableComponent,
    GenerateChargeComponent,
    ViewChargeComponent,
],
  templateUrl: './accounts-receivable.component.html',
  styleUrl: './accounts-receivable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsReceivableComponent {
  private readonly http = inject(HttpClient);
  private readonly accountsReceivableService = inject(AccountsReceivableService);
  private readonly categoryService = inject(TransactionCategoryService);
  private readonly studentsService = inject(StudentsService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoading = signal(false);
  protected readonly isDownloading = signal(false);
  protected readonly items = signal<PageResult<ShowAccountsReceivableDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedRefund = signal(false);
  protected readonly openedPaymentWithMoney = signal(false);
  protected readonly openedGenerateCharge = signal(false);
  protected readonly openedViewCharge = signal(false);
  protected readonly selectedItem = signal<ShowAccountsReceivableDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterType = signal<string | undefined>(undefined);
  protected readonly filterStatus = signal<string | undefined>(undefined);
  protected readonly filterText = signal<string | undefined>(undefined);
  protected readonly overdueOnly = signal(false);
  protected readonly categories = signal<ShowTransactionCategoryDTO[]>([]);

  // Not selectable as a Status filter value on purpose: the backend never persists a transition
  // into FeeStatus.Overdue (it's always computed live as Pending + DueDate < today), so filtering
  // by Status == "Overdue" would silently always return zero rows. "Somente vencidos" below uses
  // the backend's actual overdueOnly flag instead, which does that live computation correctly.
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
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: FeeStatus.Pending, label: 'Pendente' },
        { value: FeeStatus.Paid, label: 'Pago' },
        { value: FeeStatus.Cancelled, label: 'Cancelado' },
        { value: FeeStatus.Refunded, label: 'Reembolsado' },
      ],
    },
  ];

  protected readonly studentOptions = signal<SearchOption[]>([]);
  protected readonly selectedStudent = signal<SearchOption | null>(null);
  private readonly studentSearchSubject = new Subject<string>();

  constructor() {
    this.subnavService.setTitle('Contas a Receber');
    this.load();
    this.loadCategories();
    this.studentSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadStudents(term));
    this.loadStudents();
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
      this.filterText(),
      undefined,
      this.currentPage() as any,
      this.pageSize() as any,
      undefined,
      undefined,
      this.selectedStudent()?.id,
      undefined,
      this.filterStatus(),
      this.overdueOnly() || undefined,
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

  protected readonly getTypeBadge = transactionTypeBadge;
  protected readonly getFeeStatusBadge = feeStatusBadge;

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

  protected openGenerateCharge(item: ShowAccountsReceivableDTO): void {
    this.selectedItem.set(item);
    this.openedGenerateCharge.set(true);
  }

  protected onChargeGenerated(): void {
    this.load();
  }

  protected closeGenerateCharge(): void {
    this.openedGenerateCharge.set(false);
    this.selectedItem.set(null);
  }

  protected openViewCharge(item: ShowAccountsReceivableDTO): void {
    this.selectedItem.set(item);
    this.openedViewCharge.set(true);
  }

  protected closeViewCharge(): void {
    this.openedViewCharge.set(false);
    this.selectedItem.set(null);
  }

  protected isChargeable(item: ShowAccountsReceivableDTO): boolean {
    // Mirrors the backend's FinancialTransaction.IsChargeble() gate (Pending + Income/Adjustment)
    // plus a client-side guard against re-charging: the backend endpoint doesn't reject an already
    // charged transaction, it would just overwrite PaymentInformation with a second gateway charge.
    return item.status === 'Pending'
      && (item.type === TransactionType.Income || item.type === TransactionType.Adjustment)
      && item.externalChargeId == null;
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
    // The refund endpoint only reverses gateway-processed charges (backend:
    // "FinancialTransaction ... is not refundable" for anything else) —
    // manual cash payments (payment-with-money) never get an externalChargeId,
    // so the button must stay hidden for those or every click would 400.
    return item.type === TransactionType.Income && item.status === 'Paid' && item.externalChargeId != null;
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
    this.filterStatus.set(output.conditions.find(c => c.field.key === 'status')?.value as string | undefined);
    this.filterText.set(output.text || undefined);
    this.currentPage.set(1);
    this.load();
  }
  protected onOverdueOnlyChange(): void {
    this.currentPage.set(1);
    this.load();
  }
  protected onStudentSelected(opt: SearchOption | null): void {
    this.selectedStudent.set(opt);
    this.currentPage.set(1);
    this.load();
  }
  protected onStudentSearch(term: string): void {
    this.studentSearchSubject.next(term);
  }
  private loadStudents(term = ''): void {
    this.studentsService.apiStudentsGet(term || undefined, undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: result => {
        const students: ShowStudentDTO[] = result?.items ?? [];
        this.studentOptions.set(
          students.map(s => ({
            id: s.id!,
            label: `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.userName || s.id!,
          })),
        );
      },
    });
  }
  protected onCategorySearch(term: string): void { this.loadCategories(term); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onCategoryCreated(category: ShowTransactionCategoryDTO): void {
    this.categories.update(list => [category, ...list]);
  }

  private loadCategories(term = ''): void {
    this.categoryService.apiTransactionCategoryGet(term || undefined, undefined, 1, 100).subscribe({
      next: result => {
        this.categories.set(result?.items ?? []);
      },
    });
  }

  protected async delete(item: ShowAccountsReceivableDTO): Promise<void> {
    const ok = await this.confirmService.confirm('Tem certeza que deseja excluir esta conta a receber?');
    if (!ok) return;
    // Contract-generated installments (charges) and standalone entries live under
    // different delete endpoints — `contractId` is only set for the former.
    const delete$ = item.contractId
      ? this.accountsReceivableService.apiAccountsReceivableChargeIdDelete(item.id!)
      : this.accountsReceivableService.apiAccountsReceivableIdDelete(item.id!);
    delete$.subscribe({
      next: () => { this.ns.showSuccess('Excluída!', 'Excluída com sucesso.'); this.load(); },
      error: (err) => { this.ns.showError('Erro ao Excluir!', extractErrorMessage(err, 'Não foi possível excluir.')); },
    });
  }
}
