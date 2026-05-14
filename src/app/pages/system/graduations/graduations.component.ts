import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime } from 'rxjs';
import { GraduationService, PaginationGraduationDTO, ShowGraduationDTO } from '../../../generated_services';
import { CreateGraduationComponent } from './create-graduation/create-graduation.component';
import { UpdateGraduationComponent } from './update-graduation/update-graduation.component';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-graduations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PaginationGraduationDTO | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowGraduationDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal('');

  constructor() {
    this.subnavService.setTitle('Graduações');
    this.searchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef)).subscribe(term => {
      this.filterText.set(term);
      this.currentPage.set(1);
      this.load();
    });
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.graduationService.apiGraduationGet(this.filterText() || undefined, undefined, undefined, undefined, undefined, this.currentPage(), this.pageSize()).subscribe({
      next: r => { this.items.set(r); this.isLoading.set(false); },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro ao Carregar Graduações!', 'Não foi possível carregar a lista de graduações. Tente novamente.');
      },
    });
  }

  protected onPageChange(p: number): void { this.currentPage.set(p); this.load(); }
  protected onPageSizeChange(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.load(); }
  protected onSearch(term: string): void { this.searchSubject.next(term); }
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
