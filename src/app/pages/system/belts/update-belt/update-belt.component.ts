import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { BeltService, ShowBeltDTO, UpdateBeltDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-belt',
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './update-belt.component.html',
  styleUrl: './update-belt.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateBeltComponent {
  readonly closeEvent = output<void>();
  readonly beltUpdated = output<void>();
  readonly belt = input.required<ShowBeltDTO>();

  private readonly fb = inject(FormBuilder);
  private readonly beltService = inject(BeltService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form = this.fb.group({
    color: ['', Validators.required],
    orderIndex: [0, [Validators.required, Validators.min(0)]],
    isForKids: [false],
  });

  constructor() {
    effect(() => {
      const b = this.belt();
      this.form.patchValue({
        color: b.color,
        orderIndex: b.orderIndex ?? 0,
        isForKids: b.isForKids ?? false,
      });
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    const b = this.belt();
    this.beltService.apiBeltIdPut(b.id!, this.toDTO()).subscribe({
      next: () => { this.notificationService.showSuccess('Faixa Atualizada!', `A faixa ${b.color} foi atualizada com sucesso.`); this.beltUpdated.emit(); },
      error: () => { this.notificationService.showError('Erro ao Atualizar Faixa!', 'Não foi possível atualizar a faixa. Tente novamente.'); }
    });
  }

  private toDTO(): UpdateBeltDTO {
    const v = this.form.value;
    return {
      color: v.color!,
      orderIndex: v.orderIndex ?? 0,
      isForKids: v.isForKids ?? false,
    } as UpdateBeltDTO;
  }
}
