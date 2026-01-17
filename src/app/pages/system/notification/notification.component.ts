import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService as ApiNotificationService } from '../../../generated_services/api/notification.service';
import { ShowNotificationDTO } from '../../../generated_services/model/showNotificationDTO';
import { CreateNotificationComponent } from './create-notification/create-notification.component';
import { UpdateNotificationComponent } from './update-notification/update-notification.component';
import { NotificationType } from '../../../generated_services/model/notificationType';
import { NotificationPriority } from '../../../generated_services/model/notificationPriority';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationNotificationDTO } from '../../../generated_services';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-notification',
  imports: [CommonModule, DatePipe, CreateNotificationComponent, UpdateNotificationComponent, PaginationComponent],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent implements OnInit {
  notifications: PaginationNotificationDTO = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
  isLoading: boolean = false;
  openedCreateNotification: boolean = false;
  selectedNotification!: ShowNotificationDTO;
  openedUpdateNotification: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private apiNotificationService: ApiNotificationService,
    private subnavService: SubnavService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Notificações");
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.apiNotificationService.apiNotificationGet(this.currentPage, this.pageSize).subscribe(
      {
        next: (result) => {
          this.notifications = result;
          this.isLoading = false;
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
          this.notificationService.showError(
            'Erro ao Carregar Notificações!', 
            'Não foi possível carregar a lista de notificações. Tente novamente.'
          );
        }
      }
    )
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadNotifications();
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
      this.apiNotificationService.apiNotificationIdDelete(notification.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess(
            'Notificação Excluída!', 
            `A notificação "${notification.title}" foi excluída com sucesso.`
          );
          this.loadNotifications();
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Excluir Notificação!', 
            'Não foi possível excluir a notificação. Tente novamente.'
          );
        }
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
