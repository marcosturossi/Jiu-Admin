import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NoticesService } from '../../../generated_services/api/notices.service';
import { ShowNoticesDTO } from '../../../generated_services/model/showNoticesDTO';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { CreateNoticeComponent } from './create-notice/create-notice.component';
import { UpdateNoticeComponent } from './update-notice/update-notice.component';

@Component({
  selector: 'app-notices',
  imports: [
    DatePipe,
    FilterComponent,
    CreateNoticeComponent,
    UpdateNoticeComponent,
  ],
  templateUrl: './notices.component.html',
  styleUrl: './notices.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticesComponent {
  private readonly noticesService = inject(NoticesService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);


  protected readonly isLoading = signal(false);
  protected readonly items = signal<ShowNoticesDTO[]>([]);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowNoticesDTO | null>(null);
  protected readonly filterText = signal('');

  constructor() {
    this.subnavService.setTitle('Avisos');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.noticesService.apiNoticesGet(this.filterText() || undefined).subscribe({
      next: result => { this.items.set(result); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.notificationService.showError('Erro ao Carregar Avisos!', 'Não foi possível carregar a lista de avisos. Tente novamente.'); }
    });
  }

  protected onSearch(term: string): void { this.filterText.set(term); this.load(); }
  protected onSearchReset(): void { this.filterText.set(''); this.load(); }

  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowNoticesDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowNoticesDTO): void {
    if (!confirm(`Tem certeza que deseja excluir o aviso "${item.description}"?`)) return;
    this.noticesService.apiNoticesIdDelete(item.id!).subscribe({
      next: () => { this.notificationService.showSuccess('Aviso Excluído!', 'O aviso foi excluído com sucesso.'); this.load(); },
      error: () => { this.notificationService.showError('Erro ao Excluir Aviso!', 'Não foi possível excluir o aviso. Tente novamente.'); }
    });
  }
}
