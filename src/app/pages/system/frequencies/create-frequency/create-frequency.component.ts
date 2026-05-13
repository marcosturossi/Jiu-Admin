import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FrequencyService, StudentsService, ShowStudentDTO, ShowLessonDTO, LessonService } from '../../../../generated_services';
import { FormBuilder, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateFrequencyDTO } from '../../../../generated_services/model/createFrequencyDTO';
import { forkJoin, Observable } from 'rxjs';
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { RecognitionResponse } from '../../../../generated_services/api2/model/recognitionResponse';
import { PersonListResponse } from '../../../../generated_services/api2/model/personListResponse';
import { NotificationService } from '../../../../services/notification.service';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';

@Component({
  selector: 'app-create-frequency',
  imports: [ReactiveFormsModule, SearchSelectComponent],
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

  protected readonly students = signal<ShowStudentDTO[]>([]);
  protected readonly lessons = signal<ShowLessonDTO[]>([]);
  protected readonly lessonOptions = signal<SearchOption[]>([]);
  protected readonly selectedLesson = signal<SearchOption | null>(null);
  protected readonly isCreating = signal(false);
  protected readonly isRecognizing = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly previewUrl = signal<string | null>(null);
  protected readonly recognizedStudentIds = signal<string[]>([]);

  private api2Persons: PersonListResponse | null = null;

  protected readonly frequencyForm = this.fb.group({
    lessonId: ['', Validators.required],
    students: this.fb.array([])
  });

  constructor() {
    this.studentsService.apiStudentsActiveGet().subscribe({
      next: result => {
        this.students.set(result);
        this.initializeStudentFormArray(result);
      },
      error: () => this.ns.showError('Erro ao Carregar Alunos!', 'Não foi possível carregar a lista de alunos. Tente novamente.')
    });

    this.lessonService.apiLessonActiveGet().subscribe({
      next: result => {
        this.lessons.set(result);
        this.lessonOptions.set(result.map(l => ({ id: l.id ?? '', label: l.title ?? '' })));
      },
      error: () => this.ns.showError('Erro ao Carregar Aulas!', 'Não foi possível carregar a lista de aulas. Tente novamente.')
    });

    this.personsService.listPersonsApiV1PersonsGet().subscribe({
      next: result => { this.api2Persons = result; },
      error: () => this.ns.showError('Erro ao Carregar Dados de Reconhecimento!', 'Não foi possível carregar os dados para reconhecimento facial.')
    });
  }

  get studentsFormArray(): FormArray {
    return this.frequencyForm.get('students') as FormArray;
  }

  private initializeStudentFormArray(students: ShowStudentDTO[]): void {
    const arr = this.fb.array(students.map(() => new FormControl(false)));
    this.frequencyForm.setControl('students', arr as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  protected getSelectedStudents(): ShowStudentDTO[] {
    return this.students().filter((_, i) => this.studentsFormArray.at(i).value === true);
  }

  protected getSelectedStudentsCount(): number {
    return this.studentsFormArray.value.filter((v: boolean) => v).length;
  }

  protected isFormValid(): boolean {
    return this.studentsFormArray.value.some((v: boolean) => v) && !!this.frequencyForm.get('lessonId')?.value;
  }

  protected toggleSelectAll(): void {
    const allSelected = this.studentsFormArray.value.every((v: boolean) => v);
    this.studentsFormArray.controls.forEach(c => c.setValue(!allSelected));
  }

  protected isAllSelected(): boolean {
    return this.studentsFormArray.value.length > 0 && this.studentsFormArray.value.every((v: boolean) => v);
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
        .recognizeFacesApiV1RecognizePost(this.previewUrl()!, false)
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
    studentIds.forEach(id => {
      const idx = this.students().findIndex(s => s.id === id);
      if (idx >= 0) this.studentsFormArray.at(idx).setValue(true);
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

  protected create(): void {
    if (!this.isFormValid() || this.isCreating()) {
      if (!this.isFormValid()) this.ns.showError('Seleção Inválida!', 'Por favor, selecione uma aula e pelo menos um aluno.');
      return;
    }
    this.isCreating.set(true);
    const lessonId = this.frequencyForm.get('lessonId')?.value!;
    const requests: Observable<any>[] = this.getSelectedStudents().map(student =>
      this.frequencyService.apiFrequencyPost({ studentId: student.id!, lessonId } as CreateFrequencyDTO)
    );
    forkJoin(requests).subscribe({
      next: results => {
        this.ns.showSuccess('Frequências Registradas!', `${results.length} frequência(s) registrada(s) com sucesso.`);
        this.frequencyCreated.emit();
        this.close();
      },
      error: () => { this.ns.showError('Erro ao Registrar Frequências!', 'Não foi possível registrar algumas frequências. Tente novamente.'); this.isCreating.set(false); },
      complete: () => this.isCreating.set(false)
    });
  }
}
