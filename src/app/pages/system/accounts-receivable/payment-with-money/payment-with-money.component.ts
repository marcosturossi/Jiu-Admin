import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { AccountsReceivableService, ShowAccountsReceivableDTO, TransactionType } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';

@Component({
  selector: 'app-payment-with-money',
  imports: [],
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

  protected getTypeLabel(type?: number | string): string {
    switch (type) {
      case 0: case TransactionType.Income: return 'Receita';
      case 2: case TransactionType.Refund: return 'Reembolso';
      case 3: case TransactionType.Adjustment: return 'Ajuste';

      default: return '—';
    }
  }

  protected save(): void {
    this.isSaving.set(true);
    this.accountsReceivableService.apiAccountsReceivableIdConfirmPaymentMoneyPatch(this.item().id!).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.ns.showSuccess('Pagamento com dinheiro', 'Conta a receber paga com sucesso.')
        this.itemUpdated.emit();
      },
      error: (err) => { this.isSaving.set(false); this.ns.showError('Pagamento com dinheiro', extractErrorMessage(err, 'Ocorreu um erro ao processar o pagamento.')); }
    });
  }
}
