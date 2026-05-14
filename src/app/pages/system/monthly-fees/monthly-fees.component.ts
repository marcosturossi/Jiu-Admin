import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MonthlyFeeService } from '../../../generated_services/api/monthlyFee.service';
import { ChargeResult, FeeStatus, PaginationMonthlyFeeDTO, ShowMonthlyFeeDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterField, FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { dateStringToIso, todayDateString } from '../../../utils/date.utils';

@Component({
  selector: 'app-monthly-fees',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
    FilterComponent,
    PaginationComponent,
  ],
  templateUrl: './monthly-fees.component.html',
  styleUrl: './monthly-fees.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyFeesComponent {
  private readonly feeService = inject(MonthlyFeeService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);


  protected readonly isLoading = signal(false);
  protected readonly isPaying = signal(false);
  protected readonly isCharging = signal(false);
  protected readonly isDownloading = signal(false);
  protected readonly items = signal<PaginationMonthlyFeeDTO | null>(null);
  protected readonly openedPay = signal(false);
  protected readonly openedPix = signal(false);
  protected readonly selected = signal<ShowMonthlyFeeDTO | null>(null);
  protected readonly pixResult = signal<ChargeResult | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterStatus = signal<FeeStatus | undefined>(undefined);
  protected readonly filterText = signal('');

  protected readonly FeeStatus = FeeStatus;

  protected readonly payForm = this.fb.group({
    paidAmount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    paidAt: [todayDateString(), Validators.required],
    notes: [''],
  });

  protected readonly statusOptions = [
    { label: 'Todos', value: undefined },
    { label: 'Pendente', value: FeeStatus.Pending },
    { label: 'Pago', value: FeeStatus.Paid },
    { label: 'Atrasado', value: FeeStatus.Overdue },
    { label: 'Cancelado', value: FeeStatus.Cancelled },
  ];

  protected readonly filterFields: FilterField[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: String(FeeStatus.Pending), label: 'Pendente' },
        { value: String(FeeStatus.Paid), label: 'Pago' },
        { value: String(FeeStatus.Overdue), label: 'Atrasado' },
        { value: String(FeeStatus.Cancelled), label: 'Cancelado' },
      ],
    },
  ];

  constructor() {
    this.subnavService.setTitle('Mensalidades');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.feeService.apiMonthlyFeeGet(
      this.filterText() || undefined,
      undefined,
      undefined,
      this.filterStatus(),
      undefined, undefined,
      this.currentPage(), this.pageSize(),
    ).subscribe({
      next: result => { this.items.set(result); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.ns.showError('Erro', 'Não foi possível carregar as mensalidades.'); },
    });
  }

  protected getStatusSeverity(status?: FeeStatus): 'secondary' | 'success' | 'danger' | 'warn' {
    switch (status) {
      case FeeStatus.Pending: return 'secondary';
      case FeeStatus.Paid: return 'success';
      case FeeStatus.Overdue: return 'danger';
      case FeeStatus.Cancelled: return 'warn';
      default: return 'secondary';
    }
  }

  protected getStatusLabel(status?: FeeStatus): string {
    switch (status) {
      case FeeStatus.Pending: return 'Pendente';
      case FeeStatus.Paid: return 'Pago';
      case FeeStatus.Overdue: return 'Atrasado';
      case FeeStatus.Cancelled: return 'Cancelado';
      default: return '—';
    }
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void {
    this.filterText.set(output.text);
    const statusCond = output.conditions.find(c => c.field.key === 'status');
    this.filterStatus.set(statusCond ? Number(statusCond.value) as unknown as FeeStatus : undefined);
    this.currentPage.set(1);
    this.load();
  }

  protected openPay(fee: ShowMonthlyFeeDTO): void {
    this.selected.set(fee);
    this.payForm.reset({ paidAmount: fee.amount ?? null, paidAt: todayDateString(), notes: '' });
    this.openedPay.set(true);
  }

  protected confirmPay(): void {
    if (this.payForm.invalid || !this.selected()) return;
    this.isPaying.set(true);
    const { paidAmount, paidAt, notes } = this.payForm.value;
    this.feeService.apiMonthlyFeeIdPayPatch(this.selected()!.id!, {
      paidAmount: paidAmount ?? undefined,
      paidAt: dateStringToIso(paidAt) ?? undefined,
      notes: notes ?? undefined,
    }).subscribe({
      next: () => {
        this.ns.showSuccess('Pagamento Registrado!', 'A mensalidade foi registrada com sucesso.');
        this.openedPay.set(false);
        this.load();
      },
      error: () => {
        this.ns.showError('Erro ao Registrar', 'Não foi possível registrar o pagamento.');
        this.isPaying.set(false);
      },
      complete: () => this.isPaying.set(false),
    });
  }

  protected openPix(fee: ShowMonthlyFeeDTO): void {
    this.selected.set(fee);
    if (fee.pixQrCodeBase64 || fee.pixCopyPaste) {
      this.pixResult.set({ chargeId: fee.externalChargeId, pixQrCodeBase64: fee.pixQrCodeBase64, pixCopyPaste: fee.pixCopyPaste, invoiceUrl: fee.invoiceUrl });
      this.openedPix.set(true);
    } else {
      this.generatePix(fee);
    }
  }

  private generatePix(fee: ShowMonthlyFeeDTO): void {
    this.isCharging.set(true);
    this.feeService.apiMonthlyFeeIdChargePost(fee.id!).subscribe({
      next: result => {
        this.pixResult.set(result);
        this.openedPix.set(true);
        this.load();
      },
      error: () => this.ns.showError('Erro', 'Não foi possível gerar a cobrança PIX.'),
      complete: () => this.isCharging.set(false),
    });
  }

  protected copyPixCode(): void {
    const code = this.pixResult()?.pixCopyPaste;
    if (code) {
      navigator.clipboard.writeText(code).then(() => this.ns.showSuccess('Copiado!', 'Código PIX copiado para a área de transferência.'));
    }
  }

  protected downloadReceipt(fee: ShowMonthlyFeeDTO): void {
    this.selected.set(fee);
    this.isDownloading.set(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.feeService.apiMonthlyFeeIdReceiptPdfGet(
      fee.id!,
      undefined,
      undefined,
      { httpHeaderAccept: 'application/pdf' } as any,
    ).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo-${fee.dueDate ?? 'mensalidade'}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.ns.showError('Erro', 'Não foi possível baixar o recibo.'),
      complete: () => this.isDownloading.set(false),
    });
  }
}
