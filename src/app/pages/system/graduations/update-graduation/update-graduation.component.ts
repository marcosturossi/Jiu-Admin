import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { BeltService } from '../../../../generated_services/api/belt.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowGraduationDTO, UpdateGraduationDTO, ShowBeltDTO, ShowStudentDTO } from '../../../../generated_services';

@Component({
  selector: 'app-update-graduation',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-graduation.component.html',
  styleUrl: './update-graduation.component.scss'
})
export class UpdateGraduationComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Input() graduation!: ShowGraduationDTO;
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
    this.populateForm();
  }

  loadBelts() {
    this.beltService.apiBeltGet().subscribe({
      next: (belts) => {
        this.belts = belts;
        this.populateForm();
      },
      error: (error) => console.log('Error loading belts:', error)
    });
  }

  loadStudents() {
    this.studentsService.apiStudentsGet().subscribe({
      next: (students) => {
        this.students = students;
        this.populateForm();
      },
      error: (error) => console.log('Error loading students:', error)
    });
  }

  populateForm() {
    if (this.graduation) {
      this.graduationForm.patchValue({
        studentId: this.graduation.studentId,
        beltId: this.graduation.beltId,
      });
    }
  }

  close() {
    this.closeEvent.emit();
  }

  update() {
    if (this.graduationForm.valid && this.graduation.id) {
      this.graduationService.apiGraduationIdPut(this.graduation.id, this.formToUpdateGraduation()).subscribe({
        next: result => {
          console.log(result);
          this.close();
        },
        error: error => console.log(error)
      });
    }
  }

  formToUpdateGraduation(): UpdateGraduationDTO {
    const formValue = this.graduationForm.value;
    return {
      studentId: formValue.studentId,
      beltId: formValue.beltId,
    } as UpdateGraduationDTO
  }
}
