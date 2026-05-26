import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { FrequencyService, StudentsService, CarlonGracieBackendStudentsApplicationDTOsShowStudentDTO as ShowStudentDTO } from '../../../../generated_services';
import { CarlonGracieBackendAttendanceApplicationDTOsShowFrequencyDTO as ShowFrequencyDTO, CarlonGracieBackendAttendanceApplicationDTOsUpdateFrequencyDTO as UpdateFrequencyDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';

@Component({
  selector: 'app-update-frequency',
  imports: [ReactiveFormsModule, SearchSelectComponent],
  templateUrl: './update-frequency.component.html',
  styleUrl: './update-frequency.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateFrequencyComponent {
  readonly closeEvent = output<void>();
  readonly frequencyUpdated = output<void>();
  readonly frequency = input.required<ShowFrequencyDTO>();

  private readonly frequencyService = inject(FrequencyService);
  private readonly studentsService = inject(StudentsService);
  private readonly fb = inject(FormBuilder);
  private readonly ns = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly studentOptions = signal<SearchOption[]>([]);
  protected readonly selectedStudent = signal<SearchOption | null>(null);
  private readonly studentSearchSubject = new Subject<string>();

  protected readonly frequencyForm = this.fb.group({
    studentId: ['', Validators.required]
  });

  constructor() {
    this.studentSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadStudents(term));
    effect(() => {
      const freq = this.frequency();
      if (freq) {
        this.frequencyForm.patchValue({ studentId: freq.studentId });
        this.selectedStudent.set(freq.studentId ? { id: freq.studentId, label: freq.studentName ?? freq.studentId } : null);
      }
    });

    this.loadStudents();
  }

  protected close(): void { this.closeEvent.emit(); }

  protected onStudentSelected(opt: SearchOption | null): void {
    this.selectedStudent.set(opt);
    this.frequencyForm.patchValue({ studentId: opt?.id ?? '' });
  }

  protected onStudentSearch(term: string): void {
    this.studentSearchSubject.next(term);
  }

  private loadStudents(term = ''): void {
    this.studentsService.apiStudentsGet(term || undefined, undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: r => {
        const students: ShowStudentDTO[] = r?.items ?? [];
        this.studentOptions.set(
          students.map(s => ({ id: s.id ?? '', label: `${s.firstName} ${s.lastName}` }))
        );
      },
      error: () => this.ns.showError('Erro ao Carregar Alunos!', 'Não foi possível carregar a lista de alunos. Tente novamente.')
    });
  }

  protected update(): void {
    if (this.frequencyForm.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, selecione um aluno.');
      return;
    }
    this.frequencyService.apiFrequencyIdPut(this.frequency().id!, {
      studentId: this.frequencyForm.value.studentId
    } as UpdateFrequencyDTO).subscribe({
      next: () => {
        this.ns.showSuccess('Frequência Atualizada!', 'A frequência foi atualizada com sucesso.');
        this.frequencyUpdated.emit();
        this.close();
      },
      error: () => this.ns.showError('Erro ao Atualizar Frequência!', 'Não foi possível atualizar a frequência. Tente novamente.')
    });
  }
}
