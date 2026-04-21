import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FeePlanService, ShowFeePlanDTO, UpdateFeePlanDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-fee-plan',
  standalone: true,
  imports: [ReactiveFormsModule],
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

  constructor() {
    effect(() => {
      const p = this.feePlan();
      this.form.patchValue({
        name: p.name ?? '',
        description: p.description ?? '',
        monthDuration: p.monthDuration ?? 1,
        price: p.price ?? null,
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
    this.service.apiFeePlanIdPut(this.feePlan().id!, dto).subscribe({
      next: () => { this.ns.showSuccess('Atualizado!', 'Plano atualizado com sucesso.'); this.feePlanUpdated.emit(); },
      error: () => { this.ns.showError('Erro ao Atualizar!', 'Não foi possível atualizar o plano.'); }
    });
  }
}
