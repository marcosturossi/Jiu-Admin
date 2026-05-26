import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GraduationRequirementsService, CarlonGracieBackendProgressionApplicationDTOsShowGraduationRequirementDTO as ShowGraduationRequirementsDTO } from '../../../generated_services';
import { CreateGraduationRequirementComponent } from './create-graduation-requirement/create-graduation-requirement.component';
import { UpdateGraduationRequirementComponent } from './update-graduation-requirement/update-graduation-requirement.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PageResult } from '../../../utils/page-result';

@Component({
  selector: 'app-graduation-requirements',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CreateGraduationRequirementComponent,
    UpdateGraduationRequirementComponent,
  ],
  templateUrl: './graduation-requirements.component.html',
  styleUrl: './graduation-requirements.component.scss',
})
export class GraduationRequirementsComponent {
  private readonly graduationRequirementsService = inject(GraduationRequirementsService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowGraduationRequirementsDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowGraduationRequirementsDTO | null>(null);

  constructor() {
    this.subnavService.setTitle('Requisitos de Graduação');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.graduationRequirementsService.apiGraduationRequirementsGet().subscribe({
      next: result => {
        this.items.set({
          items: result?.items ?? [],
          totalCount: result?.totalCount ?? 0,
          totalPages: result?.totalPages ?? 1,
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro ao Carregar Requisitos!', 'Não foi possível carregar a lista de requisitos de graduação. Tente novamente.');
      },
    });
  }

  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowGraduationRequirementsDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowGraduationRequirementsDTO): void {
    if (!confirm('Tem certeza que deseja excluir este requisito de graduação?')) return;
    this.graduationRequirementsService.apiGraduationRequirementsIdDelete(item.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Requisito Excluído!', 'O requisito de graduação foi excluído com sucesso.');
        this.load();
      },
      error: () => {
        this.notificationService.showError('Erro ao Excluir Requisito!', 'Não foi possível excluir o requisito de graduação. Tente novamente.');
      },
    });
  }
}
