import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { AcademyService } from '../../../generated_services/api/academy.service';
import { ShowAcademyDTO } from '../../../generated_services/model/showAcademyDTO';
import { PaginationAcademyDTO } from '../../../generated_services/model/paginationAcademyDTO';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateAcademyComponent } from './create-academy/create-academy.component';
import { UpdateAcademyComponent } from './update-academy/update-academy.component';

@Component({
  selector: 'app-academies',
  standalone: true,
  imports: [
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    InputTextModule,
    TooltipModule,
    DatePipe,
    SlicePipe,
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
  protected readonly items = signal<PaginationAcademyDTO | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowAcademyDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly searchName = signal('');
  protected readonly copiedId = signal<string | null>(null);

  constructor() {
    this.subnavService.setTitle('Academias');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    const name = this.searchName().trim() || undefined;
    this.academyService
      .apiAdminAcademiesGet(name, undefined, undefined, undefined, this.currentPage(), this.pageSize())
      .subscribe({
        next: result => {
          this.items.set(result);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.notificationService.showError(
            'Erro de Carregamento',
            'Não foi possível carregar a lista de academias.',
          );
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

  protected copyTenantToken(item: ShowAcademyDTO): void {
    if (!item.tenantToken) return;
    navigator.clipboard.writeText(item.tenantToken).then(() => {
      this.copiedId.set(item.id ?? null);
      setTimeout(() => this.copiedId.set(null), 2000);
      this.notificationService.showSuccess('Token Copiado!', 'O token foi copiado para a área de transferência.');
    });
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
