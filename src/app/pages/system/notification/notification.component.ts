import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService } from '../../../generated_services/api/notification.service';
import { ShowNotificationDTO } from '../../../generated_services/model/showNotificationDTO';
import { CreateNotificationComponent } from './create-notification/create-notification.component';
import { UpdateNotificationComponent } from './update-notification/update-notification.component';
import { NotificationType } from '../../../generated_services/model/notificationType';
import { NotificationPriority } from '../../../generated_services/model/notificationPriority';

@Component({
  selector: 'app-notification',
  imports: [CommonModule, DatePipe, CreateNotificationComponent, UpdateNotificationComponent],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent implements OnInit {
  notifications: ShowNotificationDTO[] = [];
  openedCreateNotification: boolean = false;
  selectedNotification!: ShowNotificationDTO;
  openedUpdateNotification: boolean = false;

  constructor(private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.apiNotificationGet().subscribe(
      {
        next: (result) => this.notifications = result
      }
    )
  }

  openCreateNotification() {
    this.openedCreateNotification = true
  }

  closeCreateNotification() {
    this.openedCreateNotification = false
  }

  openUpdateNotification(notification: ShowNotificationDTO) {
    this.selectedNotification = notification
    this.openedUpdateNotification = true
  }

  closeUpdateNotification() {
    this.openedUpdateNotification = false
  }

  onNotificationCreated() {
    this.loadNotifications();
    this.closeCreateNotification();
  }

  onNotificationUpdated() {
    this.loadNotifications();
    this.closeUpdateNotification();
  }

  deleteNotification(notification: ShowNotificationDTO) {
    if (confirm('Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.')) {
      this.notificationService.apiNotificationIdDelete(notification.id!).subscribe({
        next: () => {
          this.loadNotifications();
        },
        error: (error) => console.log(error)
      });
    }
  }

  getNotificationTypeText(type: NotificationType): string {
    switch (type) {
      case NotificationType.NUMBER_0: return 'Informação';
      case NotificationType.NUMBER_1: return 'Aviso';
      case NotificationType.NUMBER_2: return 'Erro';
      case NotificationType.NUMBER_3: return 'Sucesso';
      case NotificationType.NUMBER_4: return 'Sistema';
      case NotificationType.NUMBER_5: return 'Graduação';
      case NotificationType.NUMBER_6: return 'Frequência';
      case NotificationType.NUMBER_7: return 'Geral';
      default: return 'Desconhecido';
    }
  }

  getNotificationPriorityText(priority?: NotificationPriority): string {
    if (priority === undefined) return 'Normal';
    switch (priority) {
      case NotificationPriority.NUMBER_0: return 'Baixa';
      case NotificationPriority.NUMBER_1: return 'Normal';
      case NotificationPriority.NUMBER_2: return 'Alta';
      case NotificationPriority.NUMBER_3: return 'Crítica';
      default: return 'Normal';
    }
  }

  getPriorityClass(priority?: NotificationPriority): string {
    if (priority === undefined) return 'badge bg-secondary';
    switch (priority) {
      case NotificationPriority.NUMBER_0: return 'badge bg-success';
      case NotificationPriority.NUMBER_1: return 'badge bg-secondary';
      case NotificationPriority.NUMBER_2: return 'badge bg-warning';
      case NotificationPriority.NUMBER_3: return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }

  getStatusClass(isActive?: boolean): string {
    return isActive ? 'badge bg-success' : 'badge bg-secondary';
  }

  getStatusText(isActive?: boolean): string {
    return isActive ? 'Ativa' : 'Inativa';
  }
}
