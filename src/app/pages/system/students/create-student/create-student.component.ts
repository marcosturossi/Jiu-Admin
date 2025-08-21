import { Component, Output, EventEmitter } from '@angular/core';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateStudentDTO} from '../../../../generated_services/model/createStudentDTO'

@Component({
  selector: 'app-create-student',
  imports: [ReactiveFormsModule],
  templateUrl: './create-student.component.html',
  styleUrl: './create-student.component.scss'
})
export class CreateStudentComponent {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() studentCreated = new EventEmitter<void>();
  studentForm!:FormGroup

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

  close() {
    this.closeEvent.emit();
  }

  create() {
    this.studentService.apiStudentsPost(this.formToCreateStudent()).subscribe(
      {
        next: result => this.studentCreated.emit(),
        error: error => console.log(error)
      })
  }


  formToCreateStudent(): CreateStudentDTO
  {
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
    } as CreateStudentDTO
  }
}

