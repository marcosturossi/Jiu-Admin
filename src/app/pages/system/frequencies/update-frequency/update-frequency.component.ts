import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FrequencyService, StudentsService, ShowStudentDTO } from '../../../../generated_services';
import { ShowFrequencyDTO, UpdateFrequencyDTO } from '../../../../generated_services';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-frequency',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-frequency.component.html',
  styleUrl: './update-frequency.component.scss'
})
export class UpdateFrequencyComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() frequencyUpdated = new EventEmitter<void>();
  @Input() frequency!: ShowFrequencyDTO;
  frequencyForm!: FormGroup;
  students: ShowStudentDTO[] = [];

  constructor(
    private frequencyService: FrequencyService,
    private studentsService: StudentsService,
    private formBuilder: FormBuilder,
  ) {
    this.frequencyForm = this.formBuilder.group({
      studentId: ["", Validators.required],
    })
  }

  ngOnInit(): void {
    this.studentsService.apiStudentsGet().subscribe(
      {
        next: (result) => this.students = result
      }
    );
    
    this.frequencyForm.patchValue({
      studentId: this.frequency.studentId,
    });
  }

  close() {
    this.closeEvent.emit();
  }

  update() {
    this.frequencyService.apiFrequencyIdPut(this.frequency.id!, this.formToUpdateFrequency()).subscribe(
      {
        next: result => {
          this.frequencyUpdated.emit();
          this.close();
        },
        error: error => console.log(error)
      })
  }

  formToUpdateFrequency(): UpdateFrequencyDTO {
    const formValue = this.frequencyForm.value;
    return {
      studentId: formValue.studentId,
    } as UpdateFrequencyDTO
  }
}
