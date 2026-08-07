import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { BeltService } from '../../../../generated_services/api/belt.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { CreateGraduationDTO as CreateGraduationDTO, ShowBeltDTO as ShowBeltDTO, ShowStudentDTO as ShowStudentDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { todayDateString } from '../../../../utils/date.utils';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { CreateBeltComponent } from '../../belts/create-belt/create-belt.component';

@Component({
  selector: 'app-create-graduation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, SearchSelectComponent, FieldErrorComponent, CreateBeltComponent],
  templateUrl: './create-graduation.component.html',
  styleUrl: './create-graduation.component.scss',
})
export class CreateGraduationComponent implements OnInit {
  /** When set (e.g. opened from a student's own detail page), the student is pre-selected and the
   *  search field is hidden instead of making the admin re-search for the student they're already
   *  looking at. */
  readonly presetStudent = input<ShowStudentDTO | null>(null);

  readonly closeEvent = output<void>();
  readonly graduationCreated = output<void>();

  protected readonly openedCreateBelt = signal(false);

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

  protected readonly isSaving = signal(false);

  constructor() {
    this.studentSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadStudents(term));
    this.beltService.apiBeltGet(undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: r => this.belts.set(r?.items ?? []),
      error: () => this.ns.showError('Erro ao Carregar Faixas', 'Não foi possível carregar a lista de faixas.'),
    });
  }

  ngOnInit(): void {
    const preset = this.presetStudent();
    if (preset?.id) {
      this.students.set([preset]);
      this.selectedStudent.set({ id: preset.id, label: `${preset.firstName} ${preset.lastName} (${preset.email})` });
      this.form.patchValue({ studentId: preset.id });
    } else {
      this.loadStudents();
    }
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
    this.studentsService.apiStudentsGet(term || undefined, undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: r => this.students.set(r?.items ?? []),
      error: () => this.ns.showError('Erro ao Carregar Alunos', 'Não foi possível carregar a lista de alunos.'),
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, selecione um aluno e uma faixa.');
      return;
    }
    this.isSaving.set(true);
    this.graduationService.apiGraduationPost(this.toDTO()).subscribe({
      next: () => {
        this.isSaving.set(false);
        const s = this.students().find(x => x.id === this.form.value.studentId);
        const b = this.belts().find(x => x.id === this.form.value.beltId);
        this.ns.showSuccess('Graduação Criada!', `${s?.firstName} ${s?.lastName} foi graduado(a) para faixa ${b?.color}.`);
        this.graduationCreated.emit();
        this.close();
      },
      error: (err) => { this.isSaving.set(false); this.ns.showError('Erro ao Criar Graduação!', extractErrorMessage(err, 'Não foi possível criar a graduação. Tente novamente.')); },
    });
  }

  protected onBeltCreated(belt: ShowBeltDTO): void {
    this.openedCreateBelt.set(false);
    this.belts.update(belts => [belt, ...belts]);
    this.form.patchValue({ beltId: belt.id ?? '' });
  }

  private toDTO(): CreateGraduationDTO {
    const v = this.form.value;
    return { studentId: v.studentId, beltId: v.beltId, graduationDate: v.graduationDate } as CreateGraduationDTO;
  }
}
