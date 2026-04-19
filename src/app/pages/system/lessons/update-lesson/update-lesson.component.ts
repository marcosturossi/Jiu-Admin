import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { LessonService } from '../../../../generated_services/api/lesson.service';
import { ShowLessonDTO } from '../../../../generated_services/model/showLessonDTO';
import { UpdateLessonDTO } from '../../../../generated_services/model/updateLessonDTO';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-lesson',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, CheckboxModule, TextareaModule],
  templateUrl: './update-lesson.component.html',
  styleUrl: './update-lesson.component.scss',
})
export class UpdateLessonComponent {
  readonly closeEvent = output<void>();
  readonly lessonUpdated = output<void>();
  readonly lesson = input.required<ShowLessonDTO>();

  private readonly lessonService = inject(LessonService);
  private readonly ns = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    scheduledDate: ['', Validators.required],
    duration: ['', Validators.required],
    isActive: [true],
  });

  constructor() {
    effect(() => {
      const l = this.lesson();
      let formattedDate = l.scheduledDate ?? '';
      if (formattedDate) {
        const d = new Date(formattedDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        formattedDate = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
      }
      this.form.patchValue({
        title: l.title,
        description: l.description,
        scheduledDate: formattedDate,
        duration: l.duration,
        isActive: l.isActive,
      });
    });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.lessonService.apiLessonIdPut(this.lesson().id!, this.toDTO()).subscribe({
      next: () => {
        this.ns.showSuccess('Aula Atualizada!', `A aula "${this.form.value.title}" foi atualizada com sucesso.`);
        this.lessonUpdated.emit();
        this.close();
      },
      error: () => {
        this.ns.showError('Erro ao Atualizar Aula!', 'Não foi possível atualizar a aula. Tente novamente.');
      },
    });
  }

  private toDTO(): UpdateLessonDTO {
    const v = this.form.value;
    return {
      title: v.title,
      description: v.description,
      scheduledDate: v.scheduledDate,
      duration: v.duration,
      isActive: v.isActive,
    } as UpdateLessonDTO;
  }
}
