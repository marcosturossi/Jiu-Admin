import { Component, Output, EventEmitter } from '@angular/core';
import { LessonService } from '../../../../generated_services/api/lesson.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateLessonDTO } from '../../../../generated_services/model/createLessonDTO';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-lesson',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-lesson.component.html',
  styleUrl: './create-lesson.component.scss'
})
export class CreateLessonComponent {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() lessonCreated = new EventEmitter<void>();
  lessonForm!: FormGroup;

  constructor(
    private lessonService: LessonService,
    private formBuilder: FormBuilder,
  ) {
    this.lessonForm = this.formBuilder.group({
      title: ["", Validators.required],
      description: [""],
      scheduledDate: ["", Validators.required],
      duration: ["", Validators.required],
      isActive: [true]
    })
  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    this.lessonService.apiLessonPost(this.formToCreateLesson()).subscribe(
      {
        next: result => {
          this.lessonCreated.emit();
          this.close();
        },
        error: error => console.log(error)
      })
  }

  formToCreateLesson(): CreateLessonDTO {
    const formValue = this.lessonForm.value;
    return {
      title: formValue.title,
      description: formValue.description,
      scheduledDate: formValue.scheduledDate,
      duration: formValue.duration,
      isActive: formValue.isActive
    } as CreateLessonDTO
  }
}
