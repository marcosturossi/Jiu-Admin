import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FeePlanService, CreateFeePlanDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-fee-plan',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './create-fee-plan.component.html',
  styleUrl: './create-fee-plan.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateFeePlanComponent {
  readonly closeEvent = output<void>();
  readonly feePlanCreated = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(FeePlanService);
  private readonly ns = inject(NotificationService);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    monthDuration: [1, [Validators.required, Validators.min(1)]],
    price: [null as number | null, Validators.required],
  });

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
    this.service.apiFeePlanPost(dto).subscribe({
      next: () => { this.ns.showSuccess('Criado!', 'Plano criado com sucesso.'); this.feePlanCreated.emit(); },
      error: () => { this.ns.showError('Erro ao Criar!', 'Não foi possível criar o plano.'); }
    });
  }
}
