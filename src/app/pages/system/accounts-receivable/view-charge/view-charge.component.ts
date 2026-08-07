import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AccountsReceivableService, ChargeStatus, ShowAccountsReceivableDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';

@Component({
  selector: 'app-view-charge',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './view-charge.component.html',
  styleUrl: './view-charge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewChargeComponent {
  private readonly ns = inject(NotificationService);
  private readonly accountsReceivableService = inject(AccountsReceivableService);

  readonly item = input.required<ShowAccountsReceivableDTO>();
  readonly closeEvent = output<void>();

  protected readonly isChecking = signal(false);
  protected readonly chargeStatus = signal<ChargeStatus | null>(null);

  protected getBillingTypeLabel(): string {
    switch (this.item().paymentInformation?.billingType) {
      case 'PIX': return 'PIX';
      case 'BOLETO': return 'Boleto';
      case 'CREDIT_CARD': return 'Cartão de Crédito';
      case 'MONEY': return 'Dinheiro';
      default: return '—';
    }
  }

  protected checkStatus(): void {
    this.isChecking.set(true);
    this.accountsReceivableService.apiAccountsReceivableIdChargeStatusGet(this.item().id!).subscribe({
      next: (status) => {
        this.isChecking.set(false);
        this.chargeStatus.set(status);
      },
      error: (err) => {
        this.isChecking.set(false);
        this.ns.showError('Erro', extractErrorMessage(err, 'Não foi possível consultar o status da cobrança.'));
      },
    });
  }

  protected copyPixCode(): void {
    const code = this.item().pixCopyPaste;
    if (!code) return;
    navigator.clipboard.writeText(code).then(
      () => this.ns.showSuccess('Copiado!', 'Código PIX copiado para a área de transferência.'),
      () => this.ns.showError('Erro', 'Não foi possível copiar o código PIX.'),
    );
  }

  protected copyInvoiceLink(): void {
    const url = this.item().invoiceUrl;
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => this.ns.showSuccess('Copiado!', 'Link de pagamento copiado para a área de transferência.'),
      () => this.ns.showError('Erro', 'Não foi possível copiar o link de pagamento.'),
    );
  }
}
