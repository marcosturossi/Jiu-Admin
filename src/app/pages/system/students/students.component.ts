import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { StudentsService } from '../../../generated_services/api/students.service';
import { ShowStudentDTO } from '../../../generated_services/model/showStudentDTO';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterField, FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { PageResult } from '../../../utils/page-result';
import { CreateStudentComponent } from './create-student/create-student.component';
import { UpdateStudentComponent } from './update-student/update-student.component';
import { RouterOutlet } from '@angular/router';
import {Router, ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-students',
  imports: [
    FilterComponent,
    PaginationComponent,
    CreateStudentComponent,
    UpdateStudentComponent,
    RouterOutlet
],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentsComponent {
  private readonly studentsService = inject(StudentsService);
  private readonly http = inject(HttpClient);
  private readonly subnavService = inject(SubnavService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal(false);
  protected readonly items = signal<PageResult<ShowStudentDTO> | null>(null);
  protected readonly photoUrls = signal<Record<string, string>>({});
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowStudentDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterText = signal<string | undefined>(undefined);
  protected readonly filterFields: FilterField[] = [
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Ativo' },
        { value: 'false', label: 'Inativo' },
      ],
    },
  ];

  constructor() {
    this.subnavService.setTitle('Estudantes');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.studentsService.apiStudentsGet(
      this.filterText() || undefined,
      undefined,
      undefined,
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
        this.photoUrls.set({});
        for (const student of result?.items ?? []) {
          if (student.id && student.photoUrl) this.loadPhoto(student.id);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro de Carregamento', 'Não foi possível carregar a lista de alunos.');
      },
    });
  }

  private loadPhoto(studentId: string): void {
    const basePath = this.studentsService.configuration.basePath;
    this.http.get(`${basePath}/api/Students/${studentId}/photo`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const reader = new FileReader();
        reader.onload = e => this.photoUrls.update(urls => ({ ...urls, [studentId]: e.target?.result as string }));
        reader.readAsDataURL(blob);
      },
      error: () => {},
    });
  }

  protected navigateToDetail(id: string|undefined): void {
    console.log('Navigating to student details with ID:', id);
    this.router.navigate(['details', id], { relativeTo: this.route });
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterText.set(output.text || undefined); this.currentPage.set(1); this.load(); }
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
