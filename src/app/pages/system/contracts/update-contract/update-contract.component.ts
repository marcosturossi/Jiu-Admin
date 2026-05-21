import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { CarlonGracieBackendFinancesApplicationDTOsShowContractDTO as ShowContractDTO, CarlonGracieBackendSharedDomainEnumsContractStatus as ContractStatus } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-contract',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './update-contract.component.html',
  styleUrl: './update-contract.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateContractComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contractService = inject(ContractService);
  private readonly ns = inject(NotificationService);

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
      this.form.patchValue({ status: c.status ?? ContractStatus.Active, notes: c.notes ?? '' });
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.isSaving.set(true);
    this.contractService
      .apiContractIdStatusPatch(this.contract().id!, { status: raw.status!, notes: raw.notes || null })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.ns.showSuccess('Contrato Atualizado!', 'Atualizado com sucesso.');
          this.contractUpdated.emit();
        },
        error: () => {
          this.isSaving.set(false);
          this.ns.showError('Erro ao Atualizar!', 'Não foi possível atualizar o contrato.');
        },
      });
  }

  protected close(): void { this.closeEvent.emit(); }
}
