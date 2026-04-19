import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { BeltService, ShowBeltDTO, PaginationBeltDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateBeltComponent } from './create-belt/create-belt.component';
import { UpdateBeltComponent } from './update-belt/update-belt.component';

@Component({
  selector: 'app-belts',
  imports: [
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
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
  protected readonly items = signal<PaginationBeltDTO | null>(null);
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
    this.beltService.apiBeltGet(undefined, undefined, undefined, undefined, this.currentPage(), this.pageSize()).subscribe({
      next: result => { this.items.set(result); this.isLoading.set(false); },
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
