import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { BeltService } from '../../../../generated_services/api/belt.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { CarlonGracieBackendProgressionApplicationDTOsShowGraduationDTO as ShowGraduationDTO, CarlonGracieBackendProgressionApplicationDTOsShowBeltDTO as ShowBeltDTO, CarlonGracieBackendStudentsApplicationDTOsShowStudentDTO as ShowStudentDTO, CarlonGracieBackendProgressionApplicationDTOsUpdateGraduationDTO as UpdateGraduationDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { todayDateString } from '../../../../utils/date.utils';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';

@Component({
  selector: 'app-update-graduation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SearchSelectComponent],
  templateUrl: './update-graduation.component.html',
  styleUrl: './update-graduation.component.scss',
})
export class UpdateGraduationComponent {
  readonly closeEvent = output<void>();
  readonly graduationUpdated = output<void>();
  readonly graduation = input.required<ShowGraduationDTO>();

  private readonly graduationService = inject(GraduationService);
  private readonly beltService = inject(BeltService);
  private readonly studentsService = inject(StudentsService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly belts = signal<ShowBeltDTO[]>([]);
  protected readonly students = signal<ShowStudentDTO[]>([]);
  protected readonly selectedStudent = signal<SearchOption | null>(null);
  private readonly studentSearchSubject = new Subject<string>();

  protected readonly studentOptions = computed(() =>
    this.students().map(s => ({ id: s.id!, label: `${s.firstName} ${s.lastName} (${s.email})` }))
  );

  protected readonly form = this.fb.group({
    studentId: ['', Validators.required],
    beltId: ['', Validators.required],
    graduationDate: [todayDateString(), Validators.required],
  });

  constructor() {
    this.studentSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadStudents(term));
    this.beltService.apiBeltGet().subscribe({
      next: r => this.belts.set(r ?? []),
    });
    this.loadStudents();
    effect(() => {
      const g = this.graduation();
      this.form.patchValue({
        studentId: g.studentId,
        beltId: g.beltId,
        graduationDate: g.graduationDate,
      });
      this.selectedStudent.set(g.studentId ? { id: g.studentId, label: g.studentFullName ?? g.studentId } : null);
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected onStudentSelected(opt: SearchOption | null): void {
    this.selectedStudent.set(opt);
    this.form.patchValue({ studentId: opt?.id ?? '' });
  }

  protected onStudentSearch(term: string): void {
    this.studentSearchSubject.next(term);
  }

  private loadStudents(term = ''): void {
    this.studentsService.apiStudentsGet(term || undefined, undefined, '100').subscribe({
      error: () => this.ns.showError('Erro ao Carregar Alunos!', 'Não foi possível carregar a lista de alunos. Tente novamente.'),
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.graduationService.apiGraduationIdPut(this.graduation().id!, this.toDTO()).subscribe({
      next: () => {
        this.ns.showSuccess('Graduação Atualizada!', 'A graduação foi atualizada com sucesso.');
        this.graduationUpdated.emit();
        this.close();
      },
      error: () => this.ns.showError('Erro ao Atualizar Graduação!', 'Não foi possível atualizar a graduação. Tente novamente.'),
    });
  }

  private toDTO(): UpdateGraduationDTO {
    const v = this.form.value;
    return { studentId: v.studentId, beltId: v.beltId, graduationDate: v.graduationDate } as UpdateGraduationDTO;
  }
}
