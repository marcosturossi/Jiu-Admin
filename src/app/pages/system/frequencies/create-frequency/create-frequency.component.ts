import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FrequencyService, StudentsService, ShowStudentDTO, ShowLessonDTO, LessonService } from '../../../../generated_services';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateFrequencyDTO } from '../../../../generated_services/model/createFrequencyDTO';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-frequency',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-frequency.component.html',
  styleUrl: './create-frequency.component.scss'
})
export class CreateFrequencyComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() frequencyCreated = new EventEmitter<void>();
  frequencyForm!: FormGroup;
  students: ShowStudentDTO[] = [];
  lessons: ShowLessonDTO[] = [];

  constructor(
    private frequencyService: FrequencyService,
    private studentsService: StudentsService,
    private lessonService: LessonService,
    private formBuilder: FormBuilder,
  ) {
    this.frequencyForm = this.formBuilder.group({
      studentId: ["", Validators.required],
      lessonId: ["", Validators.required],
    })
  }

  ngOnInit(): void {
    this.studentsService.apiStudentsGet().subscribe(
      {
        next: (result) => this.students = result
      }
    )

    this.lessonService.apiLessonGet().subscribe({
      next: (result) => this.lessons = result

    })

  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    this.frequencyService.apiFrequencyPost(this.formToCreateFrequency()).subscribe(
      {
        next: result => {
          this.frequencyCreated.emit();
          this.close();
        },
        error: error => console.log(error)
      })
  }

  formToCreateFrequency(): CreateFrequencyDTO {
    const formValue = this.frequencyForm.value;
    return {
      studentId: formValue.studentId,
      lessonId: formValue.lessonId,
    } as CreateFrequencyDTO
  }
}
