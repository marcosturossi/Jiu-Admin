import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationService as ApiNotificationService } from '../../../generated_services/api/notification.service';
import { CarlonGracieBackendCommunicationsApplicationDTOsShowNotificationDto as ShowNotificationDTO } from '../../../generated_services/model/carlonGracieBackendCommunicationsApplicationDTOsShowNotificationDto';
import { CreateNotificationComponent } from './create-notification/create-notification.component';
import { UpdateNotificationComponent } from './update-notification/update-notification.component';
import { CarlonGracieBackendCommunicationsDomainNotificationType as NotificationType } from '../../../generated_services/model/carlonGracieBackendCommunicationsDomainNotificationType';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { CarlonGracieBackendCommunicationsApplicationDTOsPaginationNotificationDto as PaginationNotificationDTO } from '../../../generated_services';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-notification',
  imports: [DatePipe, FilterComponent, CreateNotificationComponent, UpdateNotificationComponent, PaginationComponent],
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
  protected readonly filterText = signal('');

  constructor() {
    this.subnavService.setTitle('Notificações');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.apiNotificationService.apiNotificationGet(
      this.currentPage(), this.pageSize(),
      this.filterText() || undefined,
    ).subscribe({
      next: r => { this.items.set(r); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.ns.showError('Erro ao Carregar Notificações!', 'Não foi possível carregar a lista de notificações. Tente novamente.'); }
    });
  }

  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text); this.currentPage.set(1); this.load(); }

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

  protected getNotificationTypeText(type: NotificationType | undefined): string {
    switch (type) {
      case NotificationType.Info: return 'Informação';
      case NotificationType.Success: return 'Sucesso';
      case NotificationType.Warning: return 'Aviso';
      case NotificationType.Error: return 'Erro';
      case NotificationType.Graduation: return 'Graduação';
      case NotificationType.Lesson: return 'Aula';
      case NotificationType.Payment: return 'Pagamento';
      case NotificationType.System: return 'Sistema';
      default: return 'Desconhecido';
    }
  }

  protected getStatusSeverity(isActive?: boolean): 'success' | 'secondary' {
    return isActive ? 'success' : 'secondary';
  }

  protected getStatusText(isActive?: boolean): string {
    return isActive ? 'Ativa' : 'Inativa';
  }
}
