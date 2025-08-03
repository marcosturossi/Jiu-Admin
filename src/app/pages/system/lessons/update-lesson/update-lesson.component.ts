import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LessonService } from '../../../../generated_services/api/lesson.service';
import { ShowLessonDTO } from '../../../../generated_services/model/showLessonDTO';
import { UpdateLessonDTO } from '../../../../generated_services/model/updateLessonDTO';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-lesson',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-lesson.component.html',
  styleUrl: './update-lesson.component.scss'
})
export class UpdateLessonComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() lessonUpdated = new EventEmitter<void>();
  @Input() lesson!: ShowLessonDTO;
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

  ngOnInit(): void {
    // Format scheduledDate to yyyy-MM-ddTHH:mm for input type="datetime-local"
    let formattedDate = this.lesson.scheduledDate;
    if (formattedDate) {
      const dateObj = new Date(formattedDate);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const hh = String(dateObj.getHours()).padStart(2, '0');
      const min = String(dateObj.getMinutes()).padStart(2, '0');
      formattedDate = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    }

    this.lessonForm.patchValue({
      title: this.lesson.title,
      description: this.lesson.description,
      scheduledDate: formattedDate,
      duration: this.lesson.duration,
      isActive: this.lesson.isActive
    });
  }

  close() {
    this.closeEvent.emit();
  }

  update() {
    this.lessonService.apiLessonIdPut(this.lesson.id!, this.formToUpdateLesson()).subscribe(
      {
        next: result => {
          this.lessonUpdated.emit();
          this.close();
        },
        error: error => console.log(error)
      })
  }

  formToUpdateLesson(): UpdateLessonDTO {
    const formValue = this.lessonForm.value;
    return {
      title: formValue.title,
      description: formValue.description,
      scheduledDate: formValue.scheduledDate,
      duration: formValue.duration,
      isActive: formValue.isActive
    } as UpdateLessonDTO
  }
}
