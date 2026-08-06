import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { ShowContractDTO as ShowContractDTO, ContractStatus } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-update-contract',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './update-contract.component.html',
  styleUrl: './update-contract.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateContractComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);
  private readonly ns = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  readonly contract = input.required<ShowContractDTO>();
  readonly closeEvent = output<void>();
  readonly contractUpdated = output<void>();

  protected readonly isSaving = signal(false);

  protected readonly statusOptions = [
    { label: 'Ativo', value: ContractStatus.Active },
    { label: 'Inativo', value: ContractStatus.Inactive },
    { label: 'Suspenso', value: ContractStatus.Suspended },
    { label: 'Encerrado', value: ContractStatus.Terminated },
    { label: 'Cancelado', value: ContractStatus.Cancelled },
    { label: 'Expirado', value: ContractStatus.Expired },
  ];

  protected readonly form = this.fb.group({
    status: [ContractStatus.Active as ContractStatus, Validators.required],
    notes: [''],
  });

  constructor() {
    effect(() => {
      const c = this.contract();
      this.form.patchValue({ status: (c.status as any) ?? ContractStatus.Active, notes: c.notes ?? '' });
    });
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    // Cancelling cascades to cancel this contract's own pending fees too (backend:
    // UpdateContractStatusUseCase) — worth a confirmation since it's not obvious from a plain
    // status dropdown that picking this option also touches the student's billing.
    const isNewlyCancelled = raw.status === ContractStatus.Cancelled && this.contract().status !== ContractStatus.Cancelled;
    if (isNewlyCancelled) {
      const ok = await this.confirmService.confirm(
        'Cancelar este contrato também cancelará todas as mensalidades pendentes dele. Deseja continuar?');
      if (!ok) return;
    }

    this.isSaving.set(true);
    this.contractService
      .apiContractIdStatusPatch(this.contract().id!, { status: raw.status as any })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.ns.showSuccess('Contrato Atualizado!', 'Atualizado com sucesso.');
          this.contractUpdated.emit();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.ns.showError('Erro ao Atualizar!', extractErrorMessage(err, 'Não foi possível atualizar o contrato.'));
        },
      });
  }

  protected close(): void { this.closeEvent.emit(); }
}
