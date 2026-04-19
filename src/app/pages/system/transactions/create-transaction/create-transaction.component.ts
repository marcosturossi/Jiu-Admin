import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { FinancialTransactionService } from '../../../../generated_services/api/financialTransaction.service';
import { ShowTransactionCategoryDTO, TransactionType } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-transaction',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule],
  templateUrl: './create-transaction.component.html',
  styleUrl: './create-transaction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTransactionComponent {
  private readonly transactionService = inject(FinancialTransactionService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly categories = input.required<ShowTransactionCategoryDTO[]>();
  readonly closeEvent = output<void>();
  readonly transactionCreated = output<void>();

  protected readonly isSaving = signal(false);

  protected readonly typeOptions = [
    { label: 'Receita', value: TransactionType.NUMBER_0 },
    { label: 'Despesa', value: TransactionType.NUMBER_1 },
  ];

  protected readonly form = this.fb.group({
    type: [TransactionType.NUMBER_0 as TransactionType, Validators.required],
    transactionCategoryId: [null as string | null],
    description: [''],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    transactionDate: [new Date().toISOString().substring(0, 10), Validators.required],
    reference: [''],
  });

  protected save(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const v = this.form.value;
    this.transactionService.apiFinancialTransactionPost({
      type: v.type ?? undefined,
      transactionCategoryId: v.transactionCategoryId ?? undefined,
      description: v.description || null,
      amount: v.amount ?? undefined,
      transactionDate: v.transactionDate ?? undefined,
      reference: v.reference || null,
    }).subscribe({
      next: () => {
        this.ns.showSuccess('Transação Criada!', 'A transação foi criada com sucesso.');
        this.transactionCreated.emit();
      },
      error: () => {
        this.ns.showError('Erro ao Criar', 'Não foi possível criar a transação.');
        this.isSaving.set(false);
      },
      complete: () => this.isSaving.set(false),
    });
  }

  protected close(): void { this.closeEvent.emit(); }
}
