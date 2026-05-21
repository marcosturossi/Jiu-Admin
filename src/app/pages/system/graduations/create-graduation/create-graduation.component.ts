import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { BeltService } from '../../../../generated_services/api/belt.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { CarlonGracieBackendProgressionApplicationDTOsCreateGraduationDTO as CreateGraduationDTO, CarlonGracieBackendProgressionApplicationDTOsShowBeltDTO as ShowBeltDTO, CarlonGracieBackendStudentsApplicationDTOsShowStudentDTO as ShowStudentDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { todayDateString } from '../../../../utils/date.utils';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';

@Component({
  selector: 'app-create-graduation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SearchSelectComponent],
  templateUrl: './create-graduation.component.html',
  styleUrl: './create-graduation.component.scss',
})
export class CreateGraduationComponent {
  readonly closeEvent = output<void>();
  readonly graduationCreated = output<void>();

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
      error: () => this.ns.showError('Erro ao Carregar Faixas', 'Não foi possível carregar a lista de faixas.'),
    });
    this.loadStudents();
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
      next: r => this.students.set(r ?? []),
      error: () => this.ns.showError('Erro ao Carregar Alunos', 'Não foi possível carregar a lista de alunos.'),
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, selecione um aluno e uma faixa.');
      return;
    }
    this.graduationService.apiGraduationPost(this.toDTO()).subscribe({
      next: () => {
        const s = this.students().find(x => x.id === this.form.value.studentId);
        const b = this.belts().find(x => x.id === this.form.value.beltId);
        this.ns.showSuccess('Graduação Criada!', `${s?.firstName} ${s?.lastName} foi graduado(a) para faixa ${b?.color}.`);
        this.graduationCreated.emit();
        this.close();
      },
      error: () => this.ns.showError('Erro ao Criar Graduação!', 'Não foi possível criar a graduação. Tente novamente.'),
    });
  }

  private toDTO(): CreateGraduationDTO {
    const v = this.form.value;
    return { studentId: v.studentId, beltId: v.beltId, graduationDate: v.graduationDate } as CreateGraduationDTO;
  }
}
