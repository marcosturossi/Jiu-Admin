import { ChangeDetectionStrategy, Component, inject, input, output, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService as ApiNotificationService } from '../../../../generated_services/api/notification.service';
import { ShowNotificationDTO } from '../../../../generated_services/model/showNotificationDTO';
import { UpdateNotificationDTO } from '../../../../generated_services/model/updateNotificationDTO';
import { NotificationType } from '../../../../generated_services/model/notificationType';
import { NotificationPriority } from '../../../../generated_services/model/notificationPriority';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-notification',
  imports: [ReactiveFormsModule],
  templateUrl: './update-notification.component.html',
  styleUrl: './update-notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateNotificationComponent {
  readonly closeEvent = output<void>();
  readonly notificationUpdated = output<void>();
  readonly notification = input.required<ShowNotificationDTO>();

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
    type: [NotificationType.NUMBER_0 as NotificationType, Validators.required],
    priority: [NotificationPriority.NUMBER_1 as NotificationPriority],
    userId: [''],
    isActive: [true],
    expiresAt: [null as Date | null],
    actionUrl: [''],
    metadata: ['']
  });

  constructor() {
    effect(() => {
      const n = this.notification();
      if (n) {
        this.form.patchValue({
          title: n.title,
          message: n.message,
          type: n.type,
          isActive: n.isActive,
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : null,
          actionUrl: n.actionUrl ?? '',
          metadata: n.metadata ?? ''
        });
      }
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected update(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.apiNotificationService.apiNotificationIdPut(this.notification().id!, this.toDTO()).subscribe({
      next: () => {
        this.ns.showSuccess('Notificação Atualizada!', `A notificação "${this.form.value.title}" foi atualizada com sucesso.`);
        this.notificationUpdated.emit();
        this.close();
      },
      error: () => this.ns.showError('Erro ao Atualizar Notificação!', 'Não foi possível atualizar a notificação. Tente novamente.')
    });
  }

  private toDTO(): UpdateNotificationDTO {
    const v = this.form.value;
    return {
      title: v.title,
      message: v.message,
      type: v.type,
      priority: v.priority,
      userId: v.userId || null,
      isActive: v.isActive,
      expiresAt: v.expiresAt ? (v.expiresAt as Date).toISOString() : null,
      actionUrl: v.actionUrl || null,
      metadata: v.metadata || null
    } as UpdateNotificationDTO;
  }
}
