import { Component, Output, EventEmitter } from '@angular/core';
import { LessonService } from '../../../../generated_services/api/lesson.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateLessonDTO } from '../../../../generated_services/model/createLessonDTO';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-lesson',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './create-lesson.component.html',
  styleUrl: './create-lesson.component.scss'
})
export class CreateLessonComponent {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() lessonCreated = new EventEmitter<void>();
  lessonForm!: FormGroup;
  autoTitle = true

  constructor(
    private lessonService: LessonService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.lessonForm = this.formBuilder.group({
      title: ["", Validators.required],
      description: [""],
      scheduledDate: ["", Validators.required],
      duration: ["01:00", Validators.required],
      isActive: [true]
    })
    this.disableTitleInput();

    this.lessonForm.valueChanges.subscribe(() => {
      if (this.lessonForm.valid){
        this.createAutoTitle();
      }
    });
  }

  createAutoTitle() 
  {
    if (this.autoTitle) {
      const date = new Date(this.lessonForm.value.scheduledDate);
      const formattedDate = date.toLocaleString('pt-BR');
      this.lessonForm.patchValue(
        { title: `Aula ${formattedDate}` },
        { emitEvent: false }
      );
    }
  }

  disableTitleInput(){
    if (this.autoTitle) {
      this.lessonForm.get('title')?.disable();
      this.createAutoTitle();
    } else {
      this.lessonForm.get('title')?.enable();
    }
  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    if (this.lessonForm.invalid) {
      this.notificationService.showError(
        'Formulário Inválido', 
        'Por favor, preencha todos os campos obrigatórios.'
      );
      return;
    }

    // If title is auto-generated (and disabled), ensure it is up-to-date before submit.
    this.createAutoTitle();

    this.lessonService.apiLessonPost(this.formToCreateLesson()).subscribe({
      next: result => {
        const title = this.lessonForm.getRawValue().title;
        this.notificationService.showSuccess(
          'Aula Criada!', 
          `A aula "${title}" foi criada com sucesso.`
        );
        this.lessonCreated.emit();
        this.close();
      },
      error: error => {
        console.log(error);
        this.notificationService.showError(
          'Erro ao Criar Aula!', 
          'Não foi possível criar a aula. Tente novamente.'
        );
      }
    });
  }

  formToCreateLesson(): CreateLessonDTO {
    // getRawValue() includes disabled controls (like title when autoTitle is true)
    const formValue = this.lessonForm.getRawValue();
    return {
      title: formValue.title,
      description: formValue.description,
      scheduledDate: formValue.scheduledDate,
      duration: formValue.duration,
      isActive: formValue.isActive
    } as CreateLessonDTO
  }
}
