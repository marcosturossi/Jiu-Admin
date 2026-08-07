import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsReceivableService, ShowAccountsReceivableDTO, TransactionType } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';

function toDateInputValue(date: Date): string {
  return date.toISOString().substring(0, 10);
}

@Component({
  selector: 'app-payment-with-money',
  imports: [FormsModule, DatePipe, DecimalPipe],
  templateUrl: './payment-with-money.component.html',
  styleUrls: ['./payment-with-money.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentWithMoneyComponent {
  private readonly ns = inject(NotificationService);
  private readonly accountsReceivableService = inject(AccountsReceivableService);

  readonly item = input.required<ShowAccountsReceivableDTO>();
  readonly closeEvent = output<void>();
  readonly itemUpdated = output<void>();

  protected readonly isSaving = signal(false);
  protected readonly fullAmount = computed(() => (this.item().amount as unknown as number) ?? 0);

  protected readonly paidAmount = signal(0);
  protected readonly paidAt = signal(toDateInputValue(new Date()));
  protected readonly notes = signal('');
  protected readonly discount = signal(0);
  protected readonly remainderDueOption = signal<'same' | 'custom'>('same');
  protected readonly remainderDueDate = signal('');

  // A remainder transaction is only created when Paid + Discount leaves a positive balance —
  // matches the backend's own condition, so the remainder-due-date picker only shows up when it's
  // actually relevant.
  protected readonly hasRemainder = computed(() => this.paidAmount() + this.discount() < this.fullAmount());

  constructor() {
    effect(() => {
      const item = this.item();
      this.paidAmount.set((item.amount as unknown as number) ?? 0);
      this.remainderDueDate.set(item.dueDate ? item.dueDate.substring(0, 10) : toDateInputValue(new Date()));
    });
  }

  protected getTypeLabel(type?: number | string): string {
    switch (type) {
      case 0: case TransactionType.Income: return 'Receita';
      case 2: case TransactionType.Refund: return 'Reembolso';
      case 3: case TransactionType.Adjustment: return 'Ajuste';

      default: return '—';
    }
  }

  protected isValid(): boolean {
    const paid = this.paidAmount();
    const discount = this.discount();
    return paid > 0 && paid <= this.fullAmount() && discount >= 0 && paid + discount <= this.fullAmount();
  }

  protected save(): void {
    if (!this.isValid()) {
      this.ns.showWarning('Valores Inválidos', 'Confira o valor pago e o desconto — juntos não podem ultrapassar o valor total.');
      return;
    }

    this.isSaving.set(true);
    this.accountsReceivableService.apiAccountsReceivableIdConfirmPaymentMoneyPatch(this.item().id!, {
      paidAmount: this.paidAmount() as any,
      paidAt: new Date(this.paidAt()).toISOString(),
      notes: this.notes() || null,
      discount: this.discount() > 0 ? (this.discount() as any) : null,
      remainderDueDate: this.hasRemainder() && this.remainderDueOption() === 'custom' ? this.remainderDueDate() : null,
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.ns.showSuccess('Pagamento com dinheiro', 'Conta a receber paga com sucesso.')
        this.itemUpdated.emit();
      },
      error: (err) => { this.isSaving.set(false); this.ns.showError('Pagamento com dinheiro', extractErrorMessage(err, 'Ocorreu um erro ao processar o pagamento.')); }
    });
  }
}
