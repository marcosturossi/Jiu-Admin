import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { GraduationService, CarlonGracieBackendProgressionApplicationDTOsShowGraduationDTO as ShowGraduationDTO } from '../../../generated_services';
import { CreateGraduationComponent } from './create-graduation/create-graduation.component';
import { UpdateGraduationComponent } from './update-graduation/update-graduation.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { ODataPage, parseODataPage } from '../../../utils/odata.utils';

@Component({
  selector: 'app-graduations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FilterComponent,
    PaginationComponent,
    CreateGraduationComponent,
    UpdateGraduationComponent,
    DatePipe,
  ],
  templateUrl: './graduations.component.html',
  styleUrl: './graduations.component.scss',
})
export class GraduationsComponent {
  private readonly graduationService = inject(GraduationService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<ODataPage<ShowGraduationDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowGraduationDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterQuery = signal<string | undefined>(undefined);

  constructor() {
    this.subnavService.setTitle('Graduações');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    const skip = (this.currentPage() - 1) * this.pageSize();
    const filter = this.filterQuery();
    this.graduationService.apiGraduationGet(filter, undefined, String(this.pageSize()), String(skip), 'true').subscribe({
      next: (body: any) => { this.items.set(parseODataPage<ShowGraduationDTO>(body, this.pageSize())); this.isLoading.set(false); },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro ao Carregar Graduações!', 'Não foi possível carregar a lista de graduações. Tente novamente.');
      },
    });
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.load(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterQuery.set(output.odataFilter); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowGraduationDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowGraduationDTO): void {
    if (!confirm('Tem certeza que deseja excluir esta graduação?')) return;
    this.graduationService.apiGraduationIdDelete(item.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Graduação Excluída!', 'A graduação foi excluída com sucesso.');
        this.load();
      },
      error: () => {
        this.notificationService.showError('Erro ao Excluir Graduação!', 'Não foi possível excluir a graduação. Tente novamente.');
      },
    });
  }
}
