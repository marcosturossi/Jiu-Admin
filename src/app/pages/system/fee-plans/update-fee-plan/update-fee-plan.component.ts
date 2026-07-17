import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FeePlanService, ShowFeePlanDTO as ShowFeePlanDTO, UpdateFeePlanDTO as UpdateFeePlanDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-update-fee-plan',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './update-fee-plan.component.html',
  styleUrl: './update-fee-plan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateFeePlanComponent {
  readonly closeEvent = output<void>();
  readonly feePlanUpdated = output<void>();
  readonly feePlan = input.required<ShowFeePlanDTO>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FeePlanService);
  private readonly ns = inject(NotificationService);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    monthDuration: [1, [Validators.required, Validators.min(1)]],
    price: [null as number | null, Validators.required],
    isActive: [true],
  });

  protected readonly isSaving = signal(false);

  constructor() {
    effect(() => {
      const p = this.feePlan();
      this.form.patchValue({
        name: p.name ?? '',
        description: p.description ?? '',
        monthDuration: (p.monthDuration as unknown as number) ?? 1,
        price: (p.price as unknown as number) ?? null,
        isActive: p.isActive ?? true,
      });
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Preencha todos os campos obrigatórios.');
      return;
    }
    const v = this.form.value;
    const dto: UpdateFeePlanDTO = {
      name: v.name!,
      description: v.description ?? undefined,
      monthDuration: v.monthDuration!,
      price: v.price!,
      isActive: v.isActive ?? true,
    };
    this.isSaving.set(true);
    this.service.apiFeePlanIdPut(this.feePlan().id!, dto).subscribe({
      next: () => { this.isSaving.set(false); this.ns.showSuccess('Atualizado!', 'Plano atualizado com sucesso.'); this.feePlanUpdated.emit(); },
      error: (err) => { this.isSaving.set(false); this.ns.showError('Erro ao Atualizar!', extractErrorMessage(err, 'Não foi possível atualizar o plano.')); }
    });
  }
}
