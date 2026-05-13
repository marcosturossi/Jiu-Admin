import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MonthlyFeeService } from '../../../generated_services/api/monthlyFee.service';
import { FeeStatus, PaginationMonthlyFeeDTO, ShowMonthlyFeeDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-monthly-fees',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    FormsModule,
    ReactiveFormsModule,
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
  protected readonly items = signal<PaginationMonthlyFeeDTO | null>(null);
  protected readonly openedPay = signal(false);
  protected readonly selected = signal<ShowMonthlyFeeDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterStatus = signal<FeeStatus | undefined>(undefined);
  protected readonly filterText = signal('');

  protected readonly payForm = this.fb.group({
    paidAmount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    paidAt: [new Date().toISOString().substring(0, 10), Validators.required],
    notes: [''],
  });

  protected readonly statusOptions = [
    { label: 'Todos', value: undefined },
    { label: 'Pendente', value: FeeStatus.NUMBER_0 },
    { label: 'Pago', value: FeeStatus.NUMBER_1 },
    { label: 'Atrasado', value: FeeStatus.NUMBER_2 },
    { label: 'Cancelado', value: FeeStatus.NUMBER_3 },
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
      case FeeStatus.NUMBER_0: return 'secondary';
      case FeeStatus.NUMBER_1: return 'success';
      case FeeStatus.NUMBER_2: return 'danger';
      case FeeStatus.NUMBER_3: return 'warn';
      default: return 'secondary';
    }
  }

  protected getStatusLabel(status?: FeeStatus): string {
    switch (status) {
      case FeeStatus.NUMBER_0: return 'Pendente';
      case FeeStatus.NUMBER_1: return 'Pago';
      case FeeStatus.NUMBER_2: return 'Atrasado';
      case FeeStatus.NUMBER_3: return 'Cancelado';
      default: return '—';
    }
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onSearch(term: string): void { this.filterText.set(term); this.currentPage.set(1); this.load(); }
  protected onFilterChange(): void { this.currentPage.set(1); this.load(); }

  protected openPay(fee: ShowMonthlyFeeDTO): void {
    this.selected.set(fee);
    this.payForm.reset({ paidAmount: fee.amount ?? null, paidAt: new Date().toISOString().substring(0, 10), notes: '' });
    this.openedPay.set(true);
  }

  protected confirmPay(): void {
    if (this.payForm.invalid || !this.selected()) return;
    this.isPaying.set(true);
    const { paidAmount, paidAt, notes } = this.payForm.value;
    this.feeService.apiMonthlyFeeIdPayPatch(this.selected()!.id!, {
      paidAmount: paidAmount ?? undefined,
      paidAt: paidAt ?? undefined,
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
}
