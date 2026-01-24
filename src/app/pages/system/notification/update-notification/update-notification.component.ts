import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService as ApiNotificationService } from '../../../../generated_services/api/notification.service';
import { ShowNotificationDTO } from '../../../../generated_services/model/showNotificationDTO';
import { UpdateNotificationDTO } from '../../../../generated_services/model/updateNotificationDTO';
import { NotificationType } from '../../../../generated_services/model/notificationType';
import { NotificationPriority } from '../../../../generated_services/model/notificationPriority';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-notification',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-notification.component.html',
  styleUrl: './update-notification.component.scss'
})
export class UpdateNotificationComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() notificationUpdated = new EventEmitter<void>();
  @Input() notification!: ShowNotificationDTO;
  notificationForm!: FormGroup;

  notificationTypes = [
    { value: NotificationType.NUMBER_0, label: 'Informação' },
    { value: NotificationType.NUMBER_1, label: 'Aviso' },
    { value: NotificationType.NUMBER_2, label: 'Erro' },
    { value: NotificationType.NUMBER_3, label: 'Sucesso' },
    { value: NotificationType.NUMBER_4, label: 'Sistema' },
    { value: NotificationType.NUMBER_5, label: 'Graduação' },
    { value: NotificationType.NUMBER_6, label: 'Frequência' },
    { value: NotificationType.NUMBER_7, label: 'Geral' }
  ];

  notificationPriorities = [
    { value: NotificationPriority.NUMBER_0, label: 'Baixa' },
    { value: NotificationPriority.NUMBER_1, label: 'Normal' },
    { value: NotificationPriority.NUMBER_2, label: 'Alta' },
    { value: NotificationPriority.NUMBER_3, label: 'Crítica' }
  ];

  constructor(
    private apiNotificationService: ApiNotificationService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.notificationForm = this.formBuilder.group({
      title: ["", Validators.required],
      message: ["", Validators.required],
      type: [NotificationType.NUMBER_0, Validators.required],
      priority: [NotificationPriority.NUMBER_1],
      userId: [""],
      isActive: [true],
      expiresAt: [""],
      actionUrl: [""],
      metadata: [""]
    })
  }

  ngOnInit(): void {
    // Convert dates for datetime-local input
    const expiresAt = this.notification.expiresAt ? 
      new Date(this.notification.expiresAt).toISOString().slice(0, 16) : '';

    this.notificationForm.patchValue({
      title: this.notification.title,
      message: this.notification.message,
      type: this.notification.type,
      isActive: this.notification.isActive,
      expiresAt: expiresAt,
      actionUrl: this.notification.actionUrl,
      metadata: this.notification.metadata
    });
  }

  close() {
    this.closeEvent.emit();
  }

  update() {
    if (this.notificationForm.invalid) {
      this.notificationService.showError(
        'Formulário Inválido', 
        'Por favor, preencha todos os campos obrigatórios.'
      );
      return;
    }

    this.apiNotificationService.apiNotificationIdPut(this.notification.id!, this.formToUpdateNotification()).subscribe(
      {
        next: result => {
          this.notificationService.showSuccess(
            'Notificação Atualizada!', 
            `A notificação "${this.notificationForm.value.title}" foi atualizada com sucesso.`
          );
          this.notificationUpdated.emit();
          this.close();
        },
        error: error => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Atualizar Notificação!', 
            'Não foi possível atualizar a notificação. Tente novamente.'
          );
        }
      })
  }

  formToUpdateNotification(): UpdateNotificationDTO {
    const formValue = this.notificationForm.value;
    return {
      title: formValue.title,
      message: formValue.message,
      type: formValue.type,
      priority: formValue.priority,
      userId: formValue.userId || null,
      isActive: formValue.isActive,
      expiresAt: formValue.expiresAt || null,
      actionUrl: formValue.actionUrl || null,
      metadata: formValue.metadata || null
    } as UpdateNotificationDTO
  }
}
