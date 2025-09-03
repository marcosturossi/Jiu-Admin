import { Component, Output, EventEmitter } from '@angular/core';
import { NotificationService } from '../../../../generated_services/api/notification.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateNotificationDTO } from '../../../../generated_services/model/createNotificationDTO';
import { NotificationType } from '../../../../generated_services/model/notificationType';
import { NotificationPriority } from '../../../../generated_services/model/notificationPriority';
import { CommonModule } from '@angular/common';

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
    private notificationService: NotificationService,
    private formBuilder: FormBuilder,
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
    this.notificationService.apiNotificationPost(this.formToCreateNotification()).subscribe(
      {
        next: result => this.notificationCreated.emit(),
        error: error => console.log(error)
      })
  }

  formToCreateNotification(): CreateNotificationDTO {
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
    } as CreateNotificationDTO
  }
}
