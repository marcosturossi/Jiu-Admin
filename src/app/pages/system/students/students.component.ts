import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StudentsService } from '../../../generated_services/api/students.service';
import { ShowStudentDTO } from '../../../generated_services/model/showStudentDTO';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { FilterComponent } from '../../../shared/filter/filter.component';
import { FilterField, FilterOutput } from '../../../shared/filter/filter.types';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { ODataPage, parseODataPage } from '../../../utils/odata.utils';
import { CreateStudentComponent } from './create-student/create-student.component';
import { UpdateStudentComponent } from './update-student/update-student.component';

@Component({
  selector: 'app-students',
  imports: [
    DatePipe,
    FilterComponent,
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

  protected readonly isLoading = signal(false);
  protected readonly items = signal<ODataPage<ShowStudentDTO> | null>(null);
  protected readonly openedCreate = signal(false);
  protected readonly openedUpdate = signal(false);
  protected readonly selected = signal<ShowStudentDTO | null>(null);
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly filterQuery = signal<string | undefined>(undefined);
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
    const skip = (this.currentPage() - 1) * this.pageSize();
    const filter = this.filterQuery();
    this.studentsService.apiStudentsGet(filter, undefined, String(this.pageSize()), String(skip), 'true', undefined, 'response').subscribe({
      next: (response: any) => { this.items.set(parseODataPage<ShowStudentDTO>(response, this.pageSize())); this.isLoading.set(false); },
      error: () => { this.isLoading.set(false); this.notificationService.showError('Erro de Carregamento', 'Não foi possível carregar a lista de alunos.'); }
    });
  }

  protected onPageChange(page: number): void { this.currentPage.set(page); this.load(); }
  protected onPageSizeChange(size: number): void { this.pageSize.set(size); this.currentPage.set(1); this.load(); }
  protected onFilterChange(output: FilterOutput): void { this.filterQuery.set(output.odataFilter); this.currentPage.set(1); this.load(); }
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
