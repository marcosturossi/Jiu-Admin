import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BeltService } from '../../../../generated_services';
import { CreateBeltDTO } from '../../../../generated_services/model/createBeltDTO';
import { ShowBeltDTO } from '../../../../generated_services/model/showBeltDTO';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-create-belt',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './create-belt.component.html',
  styleUrl: './create-belt.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBeltComponent {
  readonly closeEvent = output<void>();
  readonly beltCreated = output<ShowBeltDTO>();

  private readonly fb = inject(FormBuilder);
  private readonly beltService = inject(BeltService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form = this.fb.group({
    color: ['', Validators.required],
    orderIndex: [0, [Validators.required, Validators.min(0)]],
    isForKids: [false],
  });

  protected readonly isSaving = signal(false);

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.isSaving.set(true);
    this.beltService.apiBeltPost(this.toDTO()).subscribe({
      next: (belt) => { this.isSaving.set(false); this.notificationService.showSuccess('Faixa Criada!', 'A nova faixa foi criada com sucesso.'); this.beltCreated.emit(belt); },
      error: (err) => { this.isSaving.set(false); this.notificationService.showError('Erro ao Criar Faixa!', extractErrorMessage(err, 'Não foi possível criar a faixa. Tente novamente.')); }
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
