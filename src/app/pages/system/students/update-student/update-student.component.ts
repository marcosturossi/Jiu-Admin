import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowStudentDTO, UpdateStudentDTO } from '../../../../generated_services';

@Component({
  selector: 'app-update-student',
  imports: [ReactiveFormsModule],
  templateUrl: './update-student.component.html',
  styleUrl: './update-student.component.scss'
})
export class UpdateStudentComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() studentUpdated = new EventEmitter<void>();
  @Input() student!: ShowStudentDTO;
  studentForm!: FormGroup

  constructor(
    private studentService: StudentsService,
    private formBuilder: FormBuilder,
  ) {
    this.studentForm = this.formBuilder.group({
      userName: ["", Validators.required],
      email: ["", Validators.required],
      phoneNumber: [""],
      firstName: [""],
      lastName: [""],
      birthDay: [""],
      isActive: [true],
      preferredUsername: [""],
    })
  }
    ngOnInit(): void {
      this.studentForm.patchValue(
      {
          userName: this.student.userName,
          email: this.student.email,
          phoneNumber: this.student.phoneNumber,
          firstName: this.student.firstName,
          lastName: this.student.lastName,
          birthDay: this.student.birthDay,
          isActive: this.student.isActive,
          preferredUsername: this.student.preferredUsername,
      });
    }

  close() {
    this.closeEvent.emit();
  }

  update() {
    this.studentService.apiStudentsIdPut(this.student.id!, this.formToUpdateStudent()).subscribe(
      {
        next: result => this.studentUpdated.emit(),
        error: error => console.log(error)
      })
  }


  formToUpdateStudent(): UpdateStudentDTO {
    const formValue = this.studentForm.value;
    return {
      userName: formValue.userName,
      email: formValue.email,
      phoneNumber: formValue.phoneNumber,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      birthDay: formValue.birthDay,
      isActive: formValue.isActive,
      preferredUsername: formValue.preferredUsername,
    } as UpdateStudentDTO
  }
}
