import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal } from '@angular/core';
import { FrequencyService, StudentsService, ShowStudentDTO as ShowStudentDTO, ShowLessonDTO as ShowLessonDTO, LessonService } from '../../../../generated_services';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateFrequencyDTO } from '../../../../generated_services/model/createFrequencyDTO';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, forkJoin, Observable } from 'rxjs';
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { RecognitionResponse } from '../../../../generated_services/api2/model/recognitionResponse';
import { PersonListResponse } from '../../../../generated_services/api2/model/personListResponse';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { CreateLessonComponent } from '../../lessons/create-lesson/create-lesson.component';

@Component({
  selector: 'app-create-frequency',
  imports: [ReactiveFormsModule, SearchSelectComponent, FieldErrorComponent, CreateLessonComponent],
  templateUrl: './create-frequency.component.html',
  styleUrl: './create-frequency.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateFrequencyComponent {
  readonly closeEvent = output<void>();
  readonly frequencyCreated = output<void>();

  private readonly frequencyService = inject(FrequencyService);
  private readonly studentsService = inject(StudentsService);
  private readonly lessonService = inject(LessonService);
  private readonly fb = inject(FormBuilder);
  private readonly personsService = inject(PersonsService);
  private readonly ns = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly students = signal<ShowStudentDTO[]>([]);
  protected readonly lessons = signal<ShowLessonDTO[]>([]);
  protected readonly lessonOptions = signal<SearchOption[]>([]);
  protected readonly selectedLesson = signal<SearchOption | null>(null);
  protected readonly openedCreateLesson = signal(false);
  protected readonly isCreating = signal(false);
  protected readonly isRecognizing = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly recognizedStudentIds = signal<string[]>([]);
  // ID-based (not FormArray-index-based) so a re-search for a student outside the
  // first page doesn't wipe out selections already made from the previous page —
  // the roster now regularly exceeds the 100-row default fetch.
  protected readonly selectedStudentIds = signal<Set<string>>(new Set());

  private api2Persons: PersonListResponse | null = null;
  private readonly lessonSearchSubject = new Subject<string>();
  private readonly studentSearchSubject = new Subject<string>();

  protected readonly frequencyForm = this.fb.group({
    lessonId: ['', Validators.required],
  });

  constructor() {
    this.lessonSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadLessons(term));
    this.studentSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadStudents(term));
    this.loadStudents();
    this.loadLessons();

    this.personsService.listPersonsApiV1PersonsGet().subscribe({
      next: result => { this.api2Persons = result; },
      error: () => this.ns.showError('Erro ao Carregar Dados de Reconhecimento!', 'Não foi possível carregar os dados para reconhecimento facial.')
    });
  }

  private loadStudents(term = ''): void {
    this.studentsService.apiStudentsGet(term || undefined, undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: result => this.students.set(result?.items ?? []),
      error: () => this.ns.showError('Erro ao Carregar Alunos!', 'Não foi possível carregar a lista de alunos. Tente novamente.')
    });
  }

  protected onStudentSearch(term: string): void {
    this.studentSearchSubject.next(term);
  }

  protected toggleStudent(studentId: string): void {
    this.selectedStudentIds.update(ids => {
      const next = new Set(ids);
      if (next.has(studentId)) next.delete(studentId); else next.add(studentId);
      return next;
    });
  }

  protected isStudentSelected(studentId: string): boolean {
    return this.selectedStudentIds().has(studentId);
  }

  protected getSelectedStudents(): ShowStudentDTO[] {
    const ids = this.selectedStudentIds();
    return this.students().filter(s => ids.has(s.id!));
  }

  protected getSelectedStudentsCount(): number {
    return this.selectedStudentIds().size;
  }

  protected isFormValid(): boolean {
    return this.selectedStudentIds().size > 0 && !!this.frequencyForm.get('lessonId')?.value;
  }

  protected toggleSelectAll(): void {
    const allSelected = this.isAllSelected();
    this.selectedStudentIds.set(allSelected ? new Set() : new Set(this.students().map(s => s.id!)));
  }

  protected isAllSelected(): boolean {
    const students = this.students();
    return students.length > 0 && students.every(s => this.selectedStudentIds().has(s.id!));
  }

  protected isStudentRecognized(studentId: string): boolean {
    return this.recognizedStudentIds().includes(studentId);
  }

  protected onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.files?.length) return;
    const file = target.files[0];
    if (!file.type.startsWith('image/')) {
      this.ns.showError('Tipo de Arquivo Inválido!', 'Por favor, selecione apenas arquivos de imagem.');
      this.clearImage();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.ns.showError('Arquivo Muito Grande!', 'O arquivo deve ter no máximo 5MB.');
      this.clearImage();
      return;
    }
    this.selectedFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  protected clearImage(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.recognizedStudentIds.set([]);
    const input = document.getElementById('imageInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  protected async recognizeStudents(): Promise<void> {
    if (!this.selectedFile() || !this.frequencyForm.get('lessonId')?.value) {
      this.ns.showWarning('Dados Incompletos!', 'Por favor, selecione uma aula e uma imagem primeiro.');
      return;
    }
    this.isRecognizing.set(true);
    try {
      const result = await this.personsService
        .recognizeFacesApiV1RecognizePost(this.selectedFile()!, false)
        .toPromise() as RecognitionResponse;

      const ids: string[] = [];
      if (result?.faces && this.api2Persons) {
        for (const face of result.faces) {
          if (face.person_id) {
            const direct = this.students().find(s => s.id === face.person_id);
            if (direct) { ids.push(direct.id!); }
            else {
              const person = this.api2Persons.persons.find(p => p.id === face.person_id);
              if (person) {
                const byName = this.students().find(s =>
                  `${s.firstName} ${s.lastName}`.trim().toLowerCase() === person.name.trim().toLowerCase()
                );
                if (byName) ids.push(byName.id!);
              }
            }
          }
        }
      }
      this.handleRecognitionResult(ids);
    } catch {
      this.ns.showError('Erro no Reconhecimento!', 'Erro ao reconhecer alunos. Tente novamente.');
    } finally {
      this.isRecognizing.set(false);
    }
  }

  private handleRecognitionResult(studentIds: string[]): void {
    this.recognizedStudentIds.set(studentIds);
    this.selectedStudentIds.update(ids => {
      const next = new Set(ids);
      studentIds.forEach(id => next.add(id));
      return next;
    });
    if (studentIds.length > 0) {
      this.ns.showSuccess('Reconhecimento Concluído!', `${studentIds.length} aluno(s) reconhecido(s) e selecionado(s) automaticamente!`);
    } else {
      this.ns.showInfo('Nenhum Aluno Reconhecido', 'Nenhum aluno foi reconhecido na imagem.');
    }
  }

  protected close(): void { this.closeEvent.emit(); }

  protected onLessonSelected(opt: SearchOption | null): void {
    this.selectedLesson.set(opt);
    this.frequencyForm.patchValue({ lessonId: opt?.id ?? '' });
  }

  protected onLessonSearch(term: string): void {
    this.lessonSearchSubject.next(term);
  }

  private loadLessons(term = ''): void {
    this.lessonService.apiLessonGet(term || undefined, 1, 100).subscribe({
      next: result => {
        this.lessons.set(result?.items ?? []);
        this.lessonOptions.set((result?.items ?? []).map(l => ({ id: l.id ?? '', label: l.title ?? '' })));
      },
      error: () => this.ns.showError('Erro ao Carregar Aulas!', 'Não foi possível carregar a lista de aulas. Tente novamente.')
    });
  }

  protected onLessonCreated(lesson: ShowLessonDTO): void {
    this.openedCreateLesson.set(false);
    this.lessons.update(lessons => [lesson, ...lessons]);
    const option: SearchOption = { id: lesson.id ?? '', label: lesson.title ?? '' };
    this.lessonOptions.update(options => [option, ...options]);
    this.selectedLesson.set(option);
    this.frequencyForm.patchValue({ lessonId: lesson.id ?? '' });
  }

  protected create(): void {
    if (!this.isFormValid() || this.isCreating()) {
      if (!this.isFormValid()) this.ns.showError('Seleção Inválida!', 'Por favor, selecione uma aula e pelo menos um aluno.');
      return;
    }
    this.isCreating.set(true);
    const lessonId = this.frequencyForm.get('lessonId')!.value;
    const requests: Observable<any>[] = this.getSelectedStudents().map(student =>
      this.frequencyService.apiFrequencyPost({ studentId: student.id!, lessonId } as CreateFrequencyDTO)
    );
    forkJoin(requests).subscribe({
      next: results => {
        this.ns.showSuccess('Frequências Registradas!', `${results.length} frequência(s) registrada(s) com sucesso.`);
        this.frequencyCreated.emit();
        this.close();
      },
      error: (err) => { this.ns.showError('Erro ao Registrar Frequências!', extractErrorMessage(err, 'Não foi possível registrar algumas frequências. Tente novamente.')); this.isCreating.set(false); },
      complete: () => this.isCreating.set(false)
    });
  }
}
