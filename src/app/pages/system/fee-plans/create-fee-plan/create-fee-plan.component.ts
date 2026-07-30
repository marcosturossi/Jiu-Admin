import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FeePlanService, CreateFeePlanDTO as CreateFeePlanDTO, ShowFeePlanDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-create-fee-plan',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './create-fee-plan.component.html',
  styleUrl: './create-fee-plan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateFeePlanComponent {
  readonly closeEvent = output<void>();
  readonly feePlanCreated = output<ShowFeePlanDTO>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FeePlanService);
  private readonly ns = inject(NotificationService);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    monthDuration: [1, [Validators.required, Validators.min(1)]],
    price: [null as number | null, Validators.required],
  });

  protected readonly isSaving = signal(false);

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Preencha todos os campos obrigatórios.');
      return;
    }
    const v = this.form.value;
    const dto: CreateFeePlanDTO = {
      name: v.name!,
      description: v.description ?? undefined,
      monthDuration: v.monthDuration!,
      price: v.price!,
    };
    this.isSaving.set(true);
    this.service.apiFeePlanPost(dto).subscribe({
      next: (plan) => { this.isSaving.set(false); this.ns.showSuccess('Criado!', 'Plano criado com sucesso.'); this.feePlanCreated.emit(plan); },
      error: (err) => { this.isSaving.set(false); this.ns.showError('Erro ao Criar!', extractErrorMessage(err, 'Não foi possível criar o plano.')); }
    });
  }
}
