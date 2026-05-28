import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService as ApiNotificationService } from '../../../../generated_services/api/notification.service';
import { CreateNotificationDto } from '../../../../generated_services/model/createNotificationDto';
import { NotificationType } from '../../../../generated_services/model/notificationType';
import { NotificationService } from '../../../../services/notification.service';
import { datetimeLocalToIso } from '../../../../utils/date.utils';

@Component({
  selector: 'app-create-notification',
  imports: [ReactiveFormsModule],
  templateUrl: './create-notification.component.html',
  styleUrl: './create-notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateNotificationComponent {
  readonly closeEvent = output<void>();
  readonly notificationCreated = output<void>();

  private readonly apiNotificationService = inject(ApiNotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly ns = inject(NotificationService);

  readonly notificationTypes = [
    { label: 'Informação', value: NotificationType.Info },
    { label: 'Sucesso', value: NotificationType.Success },
    { label: 'Aviso', value: NotificationType.Warning },
    { label: 'Erro', value: NotificationType.Error },
    { label: 'Graduação', value: NotificationType.Graduation },
    { label: 'Aula', value: NotificationType.Lesson },
    { label: 'Pagamento', value: NotificationType.Payment },
    { label: 'Sistema', value: NotificationType.System }
  ];

  protected readonly form = this.fb.group({
    title: ['', Validators.required],
    message: ['', Validators.required],
    type: ['', Validators.required],
    userId: [''],
    isActive: [true],
    expiresAt: [null as string | null],
  });

  protected close(): void { this.closeEvent.emit(); }

  protected create(): void {
    if (this.form.invalid) {
      console.log('Formulário inválido:', this.form.errors);
      console.log('Valores do formulário:', this.form.value);
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.apiNotificationService.apiNotificationPost(this.toDTO()).subscribe({
      next: () => {
        this.ns.showSuccess('Notificação Criada!', `A notificação "${this.form.value.title}" foi criada com sucesso.`);
        this.notificationCreated.emit();
      },
      error: () => this.ns.showError('Erro ao Criar Notificação!', 'Não foi possível criar a notificação. Tente novamente.')
    });
  }

  private toDTO(): CreateNotificationDto {
    const v = this.form.value;
    return {
      title: v.title,
      message: v.message,
      type: v.type,
      studentIds: v.userId ? [v.userId] : [],
      isActive: v.isActive,
      expiresAt: datetimeLocalToIso(v.expiresAt),
    } as CreateNotificationDto;
  }
}
