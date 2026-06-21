import { Component, inject, input } from '@angular/core';
import { FinancialTransactionService, ShowFinancialTransactionDTO } from '../../../../generated_services';

@Component({
  selector: 'app-refund-transaction',
  imports: [],
  templateUrl: './refund-transaction.component.html',
  styleUrl: './refund-transaction.component.scss',
})
export class RefundTransactionComponent {


  protected readonly transactionService = inject(FinancialTransactionService);
  protected readonly transaction = input.required<ShowFinancialTransactionDTO>();

}
