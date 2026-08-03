import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LessonScheduleService } from '../../../../generated_services/api/lessonSchedule.service';
import { ShowLessonScheduleDTO } from '../../../../generated_services/model/showLessonScheduleDTO';
import { UpdateLessonScheduleDTO } from '../../../../generated_services/model/updateLessonScheduleDTO';
import { DayOfWeek } from '../../../../generated_services/model/dayOfWeek';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { DAY_OF_WEEK_OPTIONS } from '../day-of-week-options';

@Component({
  selector: 'app-update-lesson-schedule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './update-lesson-schedule.component.html',
  styleUrl: './update-lesson-schedule.component.scss',
})
export class UpdateLessonScheduleComponent {
  readonly closeEvent = output<void>();
  readonly scheduleUpdated = output<void>();
  readonly schedule = input.required<ShowLessonScheduleDTO>();

  private readonly lessonScheduleService = inject(LessonScheduleService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly dayOfWeekOptions = DAY_OF_WEEK_OPTIONS;
  protected readonly isSaving = signal(false);

  protected readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    dayOfWeek: [DayOfWeek.Monday as DayOfWeek, Validators.required],
    startTime: ['', Validators.required],
    duration: ['', Validators.required],
    isActive: [true],
  });

  constructor() {
    effect(() => {
      const s = this.schedule();
      this.form.patchValue({
        title: s.title,
        description: s.description,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        duration: s.duration,
        isActive: s.isActive,
      });
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.isSaving.set(true);
    this.lessonScheduleService.apiLessonScheduleIdPut(this.schedule().id!, this.toDTO()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.ns.showSuccess('Horário Atualizado!', `O horário "${this.form.value.title}" foi atualizado com sucesso.`);
        this.scheduleUpdated.emit();
        this.close();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.ns.showError('Erro ao Atualizar Horário!', extractErrorMessage(err, 'Não foi possível atualizar o horário. Tente novamente.'));
      },
    });
  }

  private toDTO(): UpdateLessonScheduleDTO {
    const v = this.form.getRawValue();
    return {
      title: v.title!,
      description: v.description ?? undefined,
      dayOfWeek: v.dayOfWeek!,
      startTime: v.startTime!,
      duration: v.duration!,
      isActive: v.isActive,
    } as UpdateLessonScheduleDTO;
  }
}
