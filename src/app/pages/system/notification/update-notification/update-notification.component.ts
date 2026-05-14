import { ChangeDetectionStrategy, Component, inject, input, output, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService as ApiNotificationService } from '../../../../generated_services/api/notification.service';
import { ShowNotificationDTO } from '../../../../generated_services/model/showNotificationDTO';
import { UpdateNotificationDTO } from '../../../../generated_services/model/updateNotificationDTO';
import { NotificationType } from '../../../../generated_services/model/notificationType';
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
    type: [NotificationType.Info as NotificationType, Validators.required],
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
      isActive: v.isActive,
      expiresAt: v.expiresAt ? (v.expiresAt as Date).toISOString() : null,
      actionUrl: v.actionUrl || null,
      metadata: v.metadata || null
    } as UpdateNotificationDTO;
  }
}
