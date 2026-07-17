import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AccountsPayableService, ShowAccountsPayableDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { todayDateString } from '../../../../utils/date.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-pay-accounts-payable',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './pay-accounts-payable.component.html',
  styleUrl: './pay-accounts-payable.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayAccountsPayableComponent {
  private readonly accountsPayableService = inject(AccountsPayableService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly item = input.required<ShowAccountsPayableDTO>();
  readonly closeEvent = output<void>();
  readonly itemPaid = output<void>();

  protected readonly isSaving = signal(false);

  protected readonly form = this.fb.group({
    paidAmount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    paidAt: [todayDateString(), Validators.required],
    notes: [''],
  });

  constructor() {
    effect(() => {
      this.form.patchValue({ paidAmount: (this.item().amount as unknown as number) ?? null });
    });
  }

  protected save(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const v = this.form.value;
    this.accountsPayableService.apiAccountsPayableIdPayPatch(this.item().id!, {
      paidAmount: v.paidAmount as any,
      paidAt: v.paidAt ?? undefined,
      notes: v.notes || null,
    }).subscribe({
      next: () => {
        this.ns.showSuccess('Pagamento Registrado!', 'A conta a pagar foi paga com sucesso.');
        this.itemPaid.emit();
      },
      error: (err) => {
        this.ns.showError('Erro ao Pagar', extractErrorMessage(err, 'Não foi possível registrar o pagamento.'));
        this.isSaving.set(false);
      },
      complete: () => this.isSaving.set(false),
    });
  }

  protected close(): void { this.closeEvent.emit(); }
}
