import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsReceivableService, ChargeResult, ShowAccountsReceivableDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';

@Component({
  selector: 'app-generate-charge',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './generate-charge.component.html',
  styleUrl: './generate-charge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerateChargeComponent {
  private readonly ns = inject(NotificationService);
  private readonly accountsReceivableService = inject(AccountsReceivableService);

  readonly item = input.required<ShowAccountsReceivableDTO>();
  readonly closeEvent = output<void>();
  readonly itemUpdated = output<void>();

  protected readonly billingType = signal('PIX');
  protected readonly isSaving = signal(false);
  protected readonly result = signal<ChargeResult | null>(null);

  protected generate(): void {
    this.isSaving.set(true);
    this.accountsReceivableService.apiAccountsReceivableChargePost({
      financialTransactionId: this.item().id,
      billingType: this.billingType(),
    }).subscribe({
      next: (chargeResult) => {
        this.isSaving.set(false);
        this.result.set(chargeResult);
        this.ns.showSuccess('Cobrança Gerada', 'A cobrança foi criada com sucesso.');
        this.itemUpdated.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.ns.showError('Erro ao Gerar Cobrança', extractErrorMessage(err, 'Não foi possível gerar a cobrança.'));
      },
    });
  }

  protected copyPixCode(): void {
    const code = this.result()?.pixCopyPaste;
    if (!code) return;
    navigator.clipboard.writeText(code).then(
      () => this.ns.showSuccess('Copiado!', 'Código PIX copiado para a área de transferência.'),
      () => this.ns.showError('Erro', 'Não foi possível copiar o código PIX.'),
    );
  }

  protected copyInvoiceLink(): void {
    const url = this.result()?.invoiceUrl;
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => this.ns.showSuccess('Copiado!', 'Link de pagamento copiado para a área de transferência.'),
      () => this.ns.showError('Erro', 'Não foi possível copiar o link de pagamento.'),
    );
  }
}
