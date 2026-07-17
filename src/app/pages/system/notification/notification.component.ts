import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NotificationService as ApiNotificationService } from '../../../generated_services/api/notification.service';
import { ShowNotificationDto as ShowNotificationDTO } from '../../../generated_services/model/showNotificationDto';
import { CreateNotificationComponent } from './create-notification/create-notification.component';
import { UpdateNotificationComponent } from './update-notification/update-notification.component';
import { NotificationType as NotificationType } from '../../../generated_services/model/notificationType';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PageResult } from '../../../utils/page-result';

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
  private readonly confirmService = inject(ConfirmService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowNotificationDTO> | null>(null);
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
      this.currentPage(),
      this.pageSize(),
      this.filterText() || undefined,
    ).subscribe({
      next: data => {
        const arr = data ?? [];
        const hasMore = arr.length === this.pageSize();
        this.items.set({
          items: arr,
          totalCount: (this.currentPage() - 1) * this.pageSize() + arr.length + (hasMore ? 1 : 0),
          totalPages: hasMore ? this.currentPage() + 1 : this.currentPage(),
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.ns.showError('Erro ao Carregar Notificações!', 'Não foi possível carregar a lista de notificações. Tente novamente.');
      },
    });
  }

  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text); this.currentPage.set(1); this.load(); }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.load(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowNotificationDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected async deleteNotification(notification: ShowNotificationDTO): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Excluir Notificação',
      message: 'Tem certeza que deseja excluir esta notificação? Esta ação não pode ser desfeita.',
    });
    if (!ok) return;
    this.apiNotificationService.apiNotificationIdDelete(notification.id!).subscribe({
      next: () => { this.ns.showSuccess('Notificação Excluída!', `A notificação "${notification.title}" foi excluída com sucesso.`); this.load(); },
      error: (err) => this.ns.showError('Erro ao Excluir Notificação!', extractErrorMessage(err, 'Não foi possível excluir a notificação. Tente novamente.'))
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
