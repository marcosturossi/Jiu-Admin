import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FinancialTransactionService, ShowFinancialTransactionDTO, TransactionType} from '../../../../generated_services';
import { FormBuilder } from '@angular/forms';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-payment-with-money',
  imports: [],
  templateUrl: './payment-with-money.component.html',
  styleUrls: ['./payment-with-money.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentWithMoneyComponent {
  private readonly ns = inject(NotificationService);
  private readonly transactionService = inject(FinancialTransactionService);


  readonly transaction = input.required<ShowFinancialTransactionDTO>();
  readonly closeEvent = output<void>();
  readonly transactionUpdated = output<void>();

  protected getTypeLabel(type?: number | string): string {
      switch (type) {
        case 0: case TransactionType.Income: return 'Receita';
        case 1: case TransactionType.Expense: return 'Despesa';
        case 2: case TransactionType.Refund: return 'Reembolso';
        case 3: case TransactionType.Adjustment: return 'Ajuste';
  
        default: return '—';
      }
    }

  protected save(): void {
    this.transactionService.apiFinancialTransactionIdConfirmPaymentMoneyPatch(this.transaction().id!).subscribe({
      next: () => {
        this.ns.showSuccess('Pagamento com dinheiro', 'Transação paga com sucesso.')
        this.transactionUpdated.emit(); 
      },
      error: (err) => {this.ns.showError('Pagamento com dinheiro', 'Ocorreu um erro ao processar o pagamento.');}
    });
  }
}


