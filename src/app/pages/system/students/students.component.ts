import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Subject, debounceTime } from 'rxjs';
import { StudentsService } from '../../../generated_services/api/students.service';
import { ShowStudentDTO } from '../../../generated_services/model/showStudentDTO';
import { PaginationStudentDTO } from '../../../generated_services/model/paginationStudentDTO';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { CreateStudentComponent } from './create-student/create-student.component';
import { UpdateStudentComponent } from './update-student/update-student.component';

@Component({
  selector: 'app-students',
  imports: [
    DatePipe,
    PaginationComponent,
    CreateStudentComponent,
    UpdateStudentComponent,
  ],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsComponent {
  private readonly studentsService = inject(StudentsService);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PaginationStudentDTO | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowStudentDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal('');

  constructor() {
    this.subnavService.setTitle('Estudantes');
    this.searchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef)).subscribe(term => {
      this.filterText.set(term);
      this.currentPage.set(1);
      this.load();
    });
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.studentsService.apiStudentsGet(this.filterText() || undefined, undefined, undefined, undefined, undefined, this.currentPage(), this.pageSize()).subscribe({
      next: result => { this.items.set(result); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.notificationService.showError('Erro de Carregamento', 'Não foi possível carregar a lista de alunos.'); }
    });
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onSearch(term: string): void { this.searchSubject.next(term); }
  protected openCreate(): void { this.openedCreate.set(true); }
  protected openEdit(item: ShowStudentDTO): void { this.selected.set(item); this.openedUpdate.set(true); }
  protected onCreated(): void { this.openedCreate.set(false); this.load(); }
  protected onUpdated(): void { this.openedUpdate.set(false); this.load(); }

  protected delete(item: ShowStudentDTO): void {
    if (!confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) return;
    this.studentsService.apiStudentsIdDelete(item.id!).subscribe({
      next: () => { this.notificationService.showSuccess('Aluno Excluído', `O aluno ${item.firstName} ${item.lastName} foi excluído com sucesso.`); this.load(); },
      error: () => { this.notificationService.showError('Erro ao Excluir', 'Não foi possível excluir o aluno. Tente novamente.'); }
    });
  }
}
