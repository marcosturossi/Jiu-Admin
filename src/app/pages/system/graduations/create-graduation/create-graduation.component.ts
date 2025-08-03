import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { BeltService } from '../../../../generated_services/api/belt.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateGraduationDTO, ShowBeltDTO, ShowStudentDTO } from '../../../../generated_services';

@Component({
  selector: 'app-create-graduation',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-graduation.component.html',
  styleUrl: './create-graduation.component.scss'
})
export class CreateGraduationComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  graduationForm!: FormGroup;
  belts: ShowBeltDTO[] = [];
  students: ShowStudentDTO[] = [];

  constructor(
    private graduationService: GraduationService,
    private beltService: BeltService,
    private studentsService: StudentsService,
    private formBuilder: FormBuilder,
  ) {
    this.graduationForm = this.formBuilder.group({
      studentId: ["", Validators.required],
      beltId: ["", Validators.required],
    })
  }

  ngOnInit(): void {
    this.loadBelts();
    this.loadStudents();
  }

  loadBelts() {
    this.beltService.apiBeltGet().subscribe({
      next: (belts) => this.belts = belts,
      error: (error) => console.log('Error loading belts:', error)
    });
  }

  loadStudents() {
    this.studentsService.apiStudentsGet().subscribe({
      next: (students) => this.students = students,
      error: (error) => console.log('Error loading students:', error)
    });
  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    if (this.graduationForm.valid) {
      this.graduationService.apiGraduationPost(this.formToCreateGraduation()).subscribe({
        next: result => {
          console.log(result);
          this.close();
        },
        error: error => console.log(error)
      });
    }
  }

  formToCreateGraduation(): CreateGraduationDTO {
    const formValue = this.graduationForm.value;
    return {
      studentId: formValue.studentId,
      beltId: formValue.beltId,
    } as CreateGraduationDTO
  }
}
