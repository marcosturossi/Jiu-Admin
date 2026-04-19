import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
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
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-notification',
  imports: [DatePipe, CreateNotificationComponent, UpdateNotificationComponent, PaginationComponent, TableModule, ButtonModule, TagModule, DialogModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationComponent {
  private readonly apiNotificationService = inject(ApiNotificationService);
  private readonly subnavService = inject(SubnavService);
  private readonly ns = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PaginationNotificationDTO | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowNotificationDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  constructor() {
    this.subnavService.setTitle('Notificações');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.apiNotificationService.apiNotificationGet(this.currentPage(), this.pageSize()).subscribe({
      next: r => { this.items.set(r); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.ns.showError('Erro ao Carregar Notificações!', 'Não foi possível carregar a lista de notificações. Tente novamente.'); }
    });
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.load(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowNotificationDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected deleteNotification(notification: ShowNotificationDTO): void {
    if (!confirm(`Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.`)) return;
    this.apiNotificationService.apiNotificationIdDelete(notification.id!).subscribe({
      next: () => { this.ns.showSuccess('Notificação Excluída!', `A notificação "${notification.title}" foi excluída com sucesso.`); this.load(); },
      error: () => this.ns.showError('Erro ao Excluir Notificação!', 'Não foi possível excluir a notificação. Tente novamente.')
    });
  }

  protected getNotificationTypeText(type: NotificationType): string {
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

  protected getNotificationPriorityText(priority?: NotificationPriority): string {
    if (priority === undefined) return 'Normal';
    switch (priority) {
      case NotificationPriority.NUMBER_0: return 'Baixa';
      case NotificationPriority.NUMBER_1: return 'Normal';
      case NotificationPriority.NUMBER_2: return 'Alta';
      case NotificationPriority.NUMBER_3: return 'Crítica';
      default: return 'Normal';
    }
  }

  protected getPrioritySeverity(priority?: NotificationPriority): 'success' | 'secondary' | 'warn' | 'danger' | undefined {
    switch (priority) {
      case NotificationPriority.NUMBER_0: return 'success';
      case NotificationPriority.NUMBER_1: return 'secondary';
      case NotificationPriority.NUMBER_2: return 'warn';
      case NotificationPriority.NUMBER_3: return 'danger';
      default: return 'secondary';
    }
  }

  protected getStatusSeverity(isActive?: boolean): 'success' | 'secondary' {
    return isActive ? 'success' : 'secondary';
  }

  protected getStatusText(isActive?: boolean): string {
    return isActive ? 'Ativa' : 'Inativa';
  }
}
