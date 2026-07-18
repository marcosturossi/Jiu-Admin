import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { AcademyService } from '../../../generated_services/api/academy.service';
import { ShowAcademyDto } from '../../../generated_services/model/showAcademyDto';
import { PageResult } from '../../../utils/page-result';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateAcademyComponent } from './create-academy/create-academy.component';
import { UpdateAcademyComponent } from './update-academy/update-academy.component';
import { activeBadge } from '../../../shared/status-badge';

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
  private readonly confirmService = inject(ConfirmService);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowAcademyDto> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowAcademyDto | null>(null);
  protected readonly activeBadgeClass = (isActive: boolean | undefined) => activeBadge(isActive).cssClass;
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly searchName = signal('');

  constructor() {
    this.subnavService.setTitle('Academias');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.academyService.apiAdminAcademiesGet(
      this.searchName().trim() || undefined,
      undefined,
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
        this.notificationService.showError('Erro de Carregamento', 'Não foi possível carregar a lista de academias.');
      },
    });
  }

  protected onSearch(): void {
    this.currentPage.set(1);
    this.load();
  }

  protected onPageChange(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  protected onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.load();
  }

  protected openCreate(): void {
    this.openedCreate.set(true);
  }

  protected openEdit(item: ShowAcademyDto): void {
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

  protected async delete(item: ShowAcademyDto): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Excluir Academia',
      message: `Tem certeza que deseja excluir a academia "${item.name}"? Esta ação não pode ser desfeita.`,
    });
    if (!ok) return;
    this.academyService.apiAdminAcademiesIdDelete(item.id!).subscribe({
      next: () => {
        this.notificationService.showSuccess('Academia Excluída!', `A academia "${item.name}" foi excluída com sucesso.`);
        this.load();
      },
      error: (err) => {
        this.notificationService.showError('Erro ao Excluir', extractErrorMessage(err, 'Não foi possível excluir a academia. Tente novamente.'));
      },
    });
  }
}
