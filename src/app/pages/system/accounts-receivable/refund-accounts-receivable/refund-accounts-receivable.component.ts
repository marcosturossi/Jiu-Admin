import { Component, inject, input, output, signal } from '@angular/core';
import { AccountsReceivableService, ShowAccountsReceivableDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-refund-accounts-receivable',
  imports: [FormsModule],
  templateUrl: './refund-accounts-receivable.component.html',
  styleUrl: './refund-accounts-receivable.component.scss',
})
export class RefundAccountsReceivableComponent {
  protected readonly confirmationText = 'reembolso';
  confirmationInput = signal('');
  private readonly ns = inject(NotificationService);

  protected readonly closeEvent = output<void>();
  protected readonly itemUpdated = output<void>();

  protected readonly accountsReceivableService = inject(AccountsReceivableService);
  readonly item = input.required<ShowAccountsReceivableDTO>();

  protected refund(): void {
    this.accountsReceivableService.apiAccountsReceivableIdRefundPatch(this.item().id!).subscribe({
      next: () => {
        this.ns.showSuccess('Sucesso', 'Reembolso realizado com sucesso');
        this.itemUpdated.emit();
      },
      error: (err) => {
        this.ns.showError('Erro', 'Erro ao realizar reembolso: ' + err.message);
      }
    });
  }

  protected close(): void {
    this.closeEvent.emit();
  }
}
