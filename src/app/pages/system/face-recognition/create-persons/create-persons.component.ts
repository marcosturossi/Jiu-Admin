import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { RegisterMultipleResponse } from '../../../../generated_services/api2/model/registerMultipleResponse';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowStudentDTO } from '../../../../generated_services/model/showStudentDTO';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-create-persons',
  standalone: true,
  imports: [ReactiveFormsModule, SearchSelectComponent, FieldErrorComponent],
  templateUrl: './create-persons.component.html',
  styleUrl: './create-persons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatePersonsComponent {
  readonly closeEvent = output<void>();
  readonly personCreated = output<RegisterMultipleResponse>();

  private readonly fb = inject(FormBuilder);
  private readonly personsService = inject(PersonsService);
  private readonly studentsService = inject(StudentsService);
  private readonly ns = inject(NotificationService);

  protected readonly students = signal<ShowStudentDTO[]>([]);
  protected readonly studentOptions = signal<SearchOption[]>([]);
  protected readonly selectedStudent = signal<SearchOption | null>(null);
  // Captured synchronously at selection time — app-search-select always resets its
  // own search term right after a pick, which reloads `students` with the default
  // (unfiltered, first page) list and can silently drop whichever student was just
  // searched for and selected, breaking the name lookup `create()` used to do lazily.
  protected readonly selectedStudentName = signal<string>('');
  protected readonly isCreating = signal(false);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly previewUrls = signal<string[]>([]);

  protected readonly personForm = this.fb.group({
    studentId: ['', Validators.required],
    images: [null as File[] | null, Validators.required]
  });

  constructor() {
    this.loadStudents();
  }

  protected onFilesSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.files?.length) return;
    const files = Array.from(target.files);
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.ns.showError('Arquivo Inválido', 'Por favor, selecione apenas arquivos de imagem.');
        this.clearImages(); return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.ns.showError('Arquivo Muito Grande', 'O arquivo deve ter no máximo 5MB.');
        this.clearImages(); return;
      }
    }
    this.selectedFiles.set(files);
    const urls: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => { urls.push(e.target?.result as string); this.previewUrls.set([...urls]); };
      reader.readAsDataURL(file);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.personForm.get('images')?.setValue(files as any);
  }

  protected clearImages(): void {
    this.selectedFiles.set([]);
    this.previewUrls.set([]);
    this.personForm.get('images')?.setValue(null);
    const input = document.getElementById('imagesInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  protected create(): void {
    if (this.personForm.invalid || this.isCreating()) {
      if (this.personForm.invalid) {
        this.personForm.markAllAsTouched();
        this.ns.showError('Formulário Inválido', 'Preencha todos os campos obrigatórios e selecione pelo menos uma imagem.');
      }
      return;
    }
    const studentId = this.personForm.get('studentId')?.value;
    const images = this.selectedFiles();
    if (!studentId || !images.length) {
      this.ns.showError('Campos Obrigatórios', 'Preencha todos os campos obrigatórios.'); return;
    }
    const name = this.selectedStudentName();
    this.isCreating.set(true);
    this.personsService.registerMultiplePhotosApiV1RegisterMultiplePost(name, images, studentId).subscribe({
      next: result => {
        this.ns.showSuccess('Pessoa Criada!', `A pessoa ${name} foi registrada com sucesso no sistema de reconhecimento facial.`);
        this.personCreated.emit(result);
        this.close();
      },
      error: (err) => { this.ns.showError('Erro ao Criar Pessoa', extractErrorMessage(err, 'Não foi possível registrar a pessoa. Verifique as imagens e tente novamente.')); this.isCreating.set(false); },
      complete: () => this.isCreating.set(false)
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected onStudentSelected(opt: SearchOption | null): void {
    this.selectedStudent.set(opt);
    this.personForm.patchValue({ studentId: opt?.id ?? '' });
    const student = opt ? this.students().find(s => s.id === opt.id) : undefined;
    this.selectedStudentName.set(student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '');
  }

  protected onStudentSearch(term: string): void {
    this.loadStudents(term);
  }

  private loadStudents(term = ''): void {
    this.studentsService.apiStudentsGet(term || undefined, undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: result => {
        const students = result?.items ?? [];
        this.students.set(students);
        this.studentOptions.set(students.map(s => ({
          id: s.id ?? '',
          label: `${s.firstName} ${s.lastName}${s.userName ? ' (' + s.userName + ')' : ''}`,
        })));
      },
      error: () => this.ns.showError('Erro ao Carregar Alunos', 'Não foi possível carregar a lista de alunos ativos.')
    });
  }
}
