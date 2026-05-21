import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BeltService, CarlonGracieBackendProgressionApplicationDTOsShowBeltDTO as ShowBeltDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateBeltComponent } from './create-belt/create-belt.component';
import { UpdateBeltComponent } from './update-belt/update-belt.component';
import { ODataPage, buildClientPage, parseODataPage } from '../../../utils/odata.utils';

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
  protected readonly allItems = signal<ShowBeltDTO[]>([]);
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
    this.beltService.apiBeltGet(undefined, undefined, '200', '0', 'true').subscribe({
      next: (body: any) => {
        const page = parseODataPage<ShowBeltDTO>(body, 200);
        this.allItems.set(page.items);
        this.refreshPage();
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); this.notificationService.showError('Erro de Carregamento', 'Não foi possível carregar a lista de faixas.'); }
    });
  }

  private refreshPage(): void {
    const page = buildClientPage(this.allItems(), this.currentPage(), this.pageSize());
    this.currentPage.set(page.currentPage);
    this.items.set(page);
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.refreshPage(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.refreshPage(); }
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
