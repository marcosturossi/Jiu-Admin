import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GraduationRequirementsService, ShowGraduationRequirementDTO as ShowGraduationRequirementsDTO } from '../../../generated_services';
import { CreateGraduationRequirementComponent } from './create-graduation-requirement/create-graduation-requirement.component';
import { UpdateGraduationRequirementComponent } from './update-graduation-requirement/update-graduation-requirement.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PageResult } from '../../../utils/page-result';

@Component({
  selector: 'app-graduation-requirements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FilterComponent,
    CreateGraduationRequirementComponent,
    UpdateGraduationRequirementComponent,
    PaginationComponent,
  ],
  templateUrl: './graduation-requirements.component.html',
  styleUrl: './graduation-requirements.component.scss',
})
export class GraduationRequirementsComponent {
  private readonly graduationRequirementsService = inject(GraduationRequirementsService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowGraduationRequirementsDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowGraduationRequirementsDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal<string | undefined>(undefined);

  constructor() {
    this.subnavService.setTitle('Requisitos de Graduação');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.graduationRequirementsService.apiGraduationRequirementsGet(
      undefined,
      this.filterText(),
      undefined,
      undefined,
      this.currentPage(),
      this.pageSize(),
    ).subscribe({
      next: result => {
        this.items.set({
          items: result?.items ?? [],
          totalCount: (result?.totalCount as unknown as number) ?? 0,
          totalPages: (result?.totalPages as unknown as number) ?? 1,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro ao Carregar Requisitos!', 'Não foi possível carregar a lista de requisitos de graduação. Tente novamente.');
      },
    });
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text || undefined); this.currentPage.set(1); this.load(); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowGraduationRequirementsDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected async delete(item: ShowGraduationRequirementsDTO): Promise<void> {
    const ok = await this.confirmService.confirm('Tem certeza que deseja excluir este requisito de graduação?');
    if (!ok) return;
    this.graduationRequirementsService.apiGraduationRequirementsIdDelete(item.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Requisito Excluído!', 'O requisito de graduação foi excluído com sucesso.');
        this.load();
      },
      error: (err) => {
        this.notificationService.showError('Erro ao Excluir Requisito!', extractErrorMessage(err, 'Não foi possível excluir o requisito de graduação. Tente novamente.'));
      },
    });
  }
}
