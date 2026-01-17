import { Component, Output, EventEmitter } from '@angular/core';
import { NotificationService as ApiNotificationService } from '../../../../generated_services/api/notification.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateNotificationDTO } from '../../../../generated_services/model/createNotificationDTO';
import { NotificationType } from '../../../../generated_services/model/notificationType';
import { NotificationPriority } from '../../../../generated_services/model/notificationPriority';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-notification',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-notification.component.html',
  styleUrl: './create-notification.component.scss'
})
export class CreateNotificationComponent {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() notificationCreated = new EventEmitter<void>();
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

  close() {
    this.closeEvent.emit();
  }

  create() {
    if (this.notificationForm.invalid) {
      this.notificationService.showError(
        'Formulário Inválido', 
        'Por favor, preencha todos os campos obrigatórios.'
      );
      return;
    }

    this.apiNotificationService.apiNotificationPost(this.formToCreateNotification()).subscribe({
      next: result => {
        this.notificationService.showSuccess(
          'Notificação Criada!', 
          `A notificação "${this.notificationForm.value.title}" foi criada com sucesso.`
        );
        this.notificationCreated.emit();
      },
      error: error => {
        console.log(error);
        this.notificationService.showError(
          'Erro ao Criar Notificação!', 
          'Não foi possível criar a notificação. Tente novamente.'
        );
      }
    });
  }

  formToCreateNotification(): CreateNotificationDTO {
    const formValue = this.notificationForm.value;
    return {
      title: formValue.title,
      message: formValue.message,
      type: formValue.type,
      studentIds: formValue.userId ? [formValue.userId] : [],
      isActive: formValue.isActive,
      expiresAt: formValue.expiresAt || null,
      actionUrl: formValue.actionUrl || null,
      metadata: formValue.metadata || null
    } as CreateNotificationDTO
  }
}
