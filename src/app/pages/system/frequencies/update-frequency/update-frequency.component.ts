import { ChangeDetectionStrategy, Component, inject, input, output, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FrequencyService, StudentsService, PaginationStudentDTO } from '../../../../generated_services';
import { ShowFrequencyDTO, UpdateFrequencyDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-update-frequency',
  imports: [ReactiveFormsModule],
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

  protected readonly studentOptions = signal<{ label: string; value: string }[]>([]);

  protected readonly frequencyForm = this.fb.group({
    studentId: ['', Validators.required]
  });

  constructor() {
    effect(() => {
      const freq = this.frequency();
      if (freq) {
        this.frequencyForm.patchValue({ studentId: freq.studentId });
      }
    });

    this.studentsService.apiStudentsGet().subscribe({
      next: (result: PaginationStudentDTO) => {
        this.studentOptions.set(
          (result.items ?? []).map(s => ({ label: `${s.firstName} ${s.lastName}`, value: s.id ?? '' }))
        );
      },
      error: () => this.ns.showError('Erro ao Carregar Alunos!', 'Não foi possível carregar a lista de alunos. Tente novamente.')
    });
  }

  protected close(): void { this.closeEvent.emit(); }

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
