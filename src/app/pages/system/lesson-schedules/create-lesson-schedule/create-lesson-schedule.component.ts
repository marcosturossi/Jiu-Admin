import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LessonScheduleService } from '../../../../generated_services/api/lessonSchedule.service';
import { CreateLessonScheduleDTO } from '../../../../generated_services/model/createLessonScheduleDTO';
import { ShowLessonScheduleDTO } from '../../../../generated_services/model/showLessonScheduleDTO';
import { DayOfWeek } from '../../../../generated_services/model/dayOfWeek';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';
import { DAY_OF_WEEK_OPTIONS } from '../day-of-week-options';

@Component({
  selector: 'app-create-lesson-schedule',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './create-lesson-schedule.component.html',
  styleUrl: './create-lesson-schedule.component.scss',
})
export class CreateLessonScheduleComponent {
  readonly closeEvent = output<void>();
  readonly scheduleCreated = output<ShowLessonScheduleDTO>();

  private readonly lessonScheduleService = inject(LessonScheduleService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly dayOfWeekOptions = DAY_OF_WEEK_OPTIONS;
  protected readonly isSaving = signal(false);

  protected readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    dayOfWeek: [DayOfWeek.Monday as DayOfWeek, Validators.required],
    startTime: ['19:00', Validators.required],
    duration: ['01:00', Validators.required],
    isActive: [true],
  });

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.isSaving.set(true);
    this.lessonScheduleService.apiLessonSchedulePost(this.toDTO()).subscribe({
      next: (schedule) => {
        this.isSaving.set(false);
        this.ns.showSuccess('Horário Criado!', `O horário "${this.form.value.title}" foi criado com sucesso.`);
        this.scheduleCreated.emit(schedule);
        this.close();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.ns.showError('Erro ao Criar Horário!', extractErrorMessage(err, 'Não foi possível criar o horário. Tente novamente.'));
      },
    });
  }

  private toDTO(): CreateLessonScheduleDTO {
    const v = this.form.getRawValue();
    return {
      title: v.title!,
      description: v.description ?? undefined,
      dayOfWeek: v.dayOfWeek!,
      startTime: v.startTime!,
      duration: v.duration!,
      isActive: v.isActive,
    } as CreateLessonScheduleDTO;
  }
}
