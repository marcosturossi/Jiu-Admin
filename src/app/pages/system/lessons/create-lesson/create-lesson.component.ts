import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { LessonService } from '../../../../generated_services/api/lesson.service';
import { CreateLessonDTO } from '../../../../generated_services/model/createLessonDTO';
import { ShowLessonDTO } from '../../../../generated_services/model/showLessonDTO';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-create-lesson',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule, FieldErrorComponent],
  templateUrl: './create-lesson.component.html',
  styleUrl: './create-lesson.component.scss',
})
export class CreateLessonComponent {
  readonly closeEvent = output<void>();
  readonly lessonCreated = output<ShowLessonDTO>();

  private readonly lessonService = inject(LessonService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected autoTitle = signal(true);
  protected readonly isSaving = signal(false);

  protected readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    scheduledDate: ['', Validators.required],
    duration: ['01:00', Validators.required],
    isActive: [true],
  });

  constructor() {
    this.disableTitleInput();
    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        this.createAutoTitle();
      }
    });
  }

  protected createAutoTitle(): void {
    if (this.autoTitle()) {
      const date = new Date(this.form.value.scheduledDate!);
      const formatted = date.toLocaleString('pt-BR');
      if (formatted !== 'Invalid Date') {
        this.form.patchValue({ title: `Aula ${formatted}` }, { emitEvent: false });
      }
    }
  }

  protected disableTitleInput(): void {
    if (this.autoTitle()) {
      this.form.get('title')?.disable();
      this.createAutoTitle();
    } else {
      this.form.get('title')?.enable();
      this.form.get('title')?.setValue('');
    }
  }

  protected onAutoTitleChange(val: boolean): void {
    this.autoTitle.set(val);
    this.disableTitleInput();
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.createAutoTitle();
    this.isSaving.set(true);
    this.lessonService.apiLessonPost(this.toDTO()).subscribe({
      next: (lesson) => {
        this.isSaving.set(false);
        const title = this.form.getRawValue().title;
        this.ns.showSuccess('Aula Criada!', `A aula "${title}" foi criada com sucesso.`);
        this.lessonCreated.emit(lesson);
        this.close();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.ns.showError('Erro ao Criar Aula!', extractErrorMessage(err, 'Não foi possível criar a aula. Tente novamente.'));
      },
    });
  }

  private toDTO(): CreateLessonDTO {
    const v = this.form.getRawValue();
    return {
      title: v.title,
      description: v.description,
      scheduledDate: new Date(v.scheduledDate!).toISOString(),
      duration: v.duration,
      isActive: v.isActive,
    } as CreateLessonDTO;
  }
}
