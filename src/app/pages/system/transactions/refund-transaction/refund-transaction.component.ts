import { Component, inject, input, output, signal } from '@angular/core';
import { FinancialTransactionService, ShowFinancialTransactionDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-refund-transaction',
  imports: [FormsModule],
  templateUrl: './refund-transaction.component.html',
  styleUrl: './refund-transaction.component.scss',
})
export class RefundTransactionComponent {
  protected readonly confirmationText = 'reembolso';
  confirmationInput = signal('');
  private readonly ns = inject(NotificationService);

  protected readonly closeEvent = output<void>();
  

  protected readonly transactionService = inject(FinancialTransactionService);
  readonly transaction = input.required<ShowFinancialTransactionDTO>();

  protected refundTransaction(): void {
    this.transactionService.apiFinancialTransactionIdRefundPatch(this.transaction().id!).subscribe({
      next: () => {
        this.ns.showSuccess('Sucesso', 'Reembolso realizado com sucesso');
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

