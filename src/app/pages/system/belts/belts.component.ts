import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BeltService, CarlonGracieBackendProgressionApplicationDTOsShowBeltDTO as ShowBeltDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateBeltComponent } from './create-belt/create-belt.component';
import { UpdateBeltComponent } from './update-belt/update-belt.component';
import { ODataPage, parseODataPage } from '../../../utils/odata.utils';

@Component({
  selector: 'app-belts',
  imports: [
    PaginationComponent,
    CreateBeltComponent,
    UpdateBeltComponent,
  ],
  templateUrl: './belts.component.html',
  styleUrl: './belts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeltsComponent {
  private readonly beltService = inject(BeltService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<ODataPage<ShowBeltDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowBeltDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);

  constructor() {
    this.subnavService.setTitle('Faixas');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    const skip = (this.currentPage() - 1) * this.pageSize();
    this.beltService.apiBeltGet(undefined, undefined, String(this.pageSize()), String(skip), 'true').subscribe({
      next: (body: any) => { this.items.set(parseODataPage<ShowBeltDTO>(body, this.pageSize())); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.notificationService.showError('Erro de Carregamento', 'Não foi possível carregar a lista de faixas.'); }
    });
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowBeltDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowBeltDTO): void {
    if (!confirm('Tem certeza que deseja excluir esta faixa?')) return;
    this.beltService.apiBeltIdDelete(item.id!).subscribe({
      next: () => { this.notificationService.showSuccess('Faixa Excluída!', `A faixa ${item.color} foi excluída com sucesso.`); this.load(); },
      error: () => { this.notificationService.showError('Erro ao Excluir!', 'Não foi possível excluir a faixa. Tente novamente.'); }
    });
  }
}
