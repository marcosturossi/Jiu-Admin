import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { BeltService } from '../../../../generated_services';
import { CreateBeltDTO } from '../../../../generated_services/model/createBeltDTO';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-belt',
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule],
  templateUrl: './create-belt.component.html',
  styleUrl: './create-belt.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBeltComponent {
  readonly closeEvent = output<void>();
  readonly beltCreated = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly beltService = inject(BeltService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form = this.fb.group({
    color: ['', Validators.required],
    orderIndex: [0, [Validators.required, Validators.min(0)]],
    isForKids: [false],
  });

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.beltService.apiBeltPost(this.toDTO()).subscribe({
      next: () => { this.notificationService.showSuccess('Faixa Criada!', 'A nova faixa foi criada com sucesso.'); this.beltCreated.emit(); },
      error: () => { this.notificationService.showError('Erro ao Criar Faixa!', 'Não foi possível criar a faixa. Tente novamente.'); }
    });
  }

  private toDTO(): CreateBeltDTO {
    const v = this.form.value;
    return {
      color: v.color!,
      orderIndex: v.orderIndex ?? 0,
      isForKids: v.isForKids ?? false,
    } as CreateBeltDTO;
  }
}
