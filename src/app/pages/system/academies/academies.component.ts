import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { AcademyService } from '../../../generated_services/api/academy.service';
import { ShowAcademyDTO } from '../../../generated_services/model/showAcademyDTO';
import { ODataPage, buildClientPage, parseODataPage } from '../../../utils/odata.utils';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateAcademyComponent } from './create-academy/create-academy.component';
import { UpdateAcademyComponent } from './update-academy/update-academy.component';

@Component({
  selector: 'app-academies',
  standalone: true,
  imports: [
    DatePipe,
    PaginationComponent,
    CreateAcademyComponent,
    UpdateAcademyComponent,
  ],
  templateUrl: './academies.component.html',
  styleUrl: './academies.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademiesComponent {
  private readonly academyService = inject(AcademyService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<ODataPage<ShowAcademyDTO> | null>(null);
  protected readonly allItems = signal<ShowAcademyDTO[]>([]);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowAcademyDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly searchName = signal('');

  constructor() {
    this.subnavService.setTitle('Academias');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    const name = this.searchName().trim() || undefined;
    const filter = name ? `contains(name,'${name.replace(/'/g, "''")}')` : undefined;
    this.academyService.apiAdminAcademiesGet(filter, undefined, '200', '0', 'true').subscribe({
      next: (body: any) => {
        const page = parseODataPage<ShowAcademyDTO>(body, 200);
        this.allItems.set(page.items);
        this.refreshPage();
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); this.notificationService.showError('Erro de Carregamento', 'Não foi possível carregar a lista de academias.'); }
    });
  }

  protected onSearch(): void {
    this.currentPage.set(1);
    this.load();
  }

  private refreshPage(): void {
    const page = buildClientPage(this.allItems(), this.currentPage(), this.pageSize());
    this.currentPage.set(page.currentPage);
    this.items.set(page);
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.refreshPage();
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.refreshPage();
  }

  protected openCreate(): void {
    this.openedCreate.set(true);
  }

  protected openEdit(item: ShowAcademyDTO): void {
    this.selected.set(item);
    this.openedUpdate.set(true);
  }

  protected onCreated(): void {
    this.openedCreate.set(false);
    this.load();
  }

  protected onUpdated(): void {
    this.openedUpdate.set(false);
    this.load();
  }

  protected delete(item: ShowAcademyDTO): void {
    if (!confirm(`Tem certeza que deseja excluir a academia "${item.name}"? Esta ação não pode ser desfeita.`)) return;
    this.academyService.apiAdminAcademiesIdDelete(item.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Academia Excluída!', `A academia "${item.name}" foi excluída com sucesso.`);
        this.load();
      },
      error: () => {
        this.notificationService.showError('Erro ao Excluir', 'Não foi possível excluir a academia. Tente novamente.');
      },
    });
  }
}
