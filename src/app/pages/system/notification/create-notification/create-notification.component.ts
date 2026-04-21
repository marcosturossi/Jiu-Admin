import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService as ApiNotificationService } from '../../../../generated_services/api/notification.service';
import { CreateNotificationDTO } from '../../../../generated_services/model/createNotificationDTO';
import { NotificationType } from '../../../../generated_services/model/notificationType';
import { NotificationPriority } from '../../../../generated_services/model/notificationPriority';
import { NotificationService } from '../../../../services/notification.service';

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

  protected readonly notificationTypes = [
    { label: 'Informação', value: NotificationType.NUMBER_0 },
    { label: 'Aviso', value: NotificationType.NUMBER_1 },
    { label: 'Erro', value: NotificationType.NUMBER_2 },
    { label: 'Sucesso', value: NotificationType.NUMBER_3 },
    { label: 'Sistema', value: NotificationType.NUMBER_4 },
    { label: 'Graduação', value: NotificationType.NUMBER_5 },
    { label: 'Frequência', value: NotificationType.NUMBER_6 },
    { label: 'Geral', value: NotificationType.NUMBER_7 }
  ];

  protected readonly notificationPriorities = [
    { label: 'Baixa', value: NotificationPriority.NUMBER_0 },
    { label: 'Normal', value: NotificationPriority.NUMBER_1 },
    { label: 'Alta', value: NotificationPriority.NUMBER_2 },
    { label: 'Crítica', value: NotificationPriority.NUMBER_3 }
  ];

  protected readonly form = this.fb.group({
    title: ['', Validators.required],
    message: ['', Validators.required],
    type: [NotificationType.NUMBER_0, Validators.required],
    priority: [NotificationPriority.NUMBER_1],
    userId: [''],
    isActive: [true],
    expiresAt: [null as Date | null],
    actionUrl: [''],
    metadata: ['']
  });

  protected close(): void { this.closeEvent.emit(); }

  protected create(): void {
    if (this.form.invalid) {
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

  private toDTO(): CreateNotificationDTO {
    const v = this.form.value;
    return {
      title: v.title,
      message: v.message,
      type: v.type,
      studentIds: v.userId ? [v.userId] : [],
      isActive: v.isActive,
      expiresAt: v.expiresAt ? (v.expiresAt as Date).toISOString() : null,
      actionUrl: v.actionUrl || null,
      metadata: v.metadata || null
    } as CreateNotificationDTO;
  }
}
