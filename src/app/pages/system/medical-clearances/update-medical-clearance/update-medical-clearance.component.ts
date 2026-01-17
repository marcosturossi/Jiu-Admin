import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MedicalClearanceService } from '../../../../generated_services/api/medicalClearance.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UpdateMedicalClearanceDTO } from '../../../../generated_services/model/updateMedicalClearanceDTO';
import { ShowMedicalClearanceDTO } from '../../../../generated_services/model/showMedicalClearanceDTO';
import { ShowStudentDTO } from '../../../../generated_services/model/showStudentDTO';
import { NotificationService } from '../../../../services/notification.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-update-medical-clearance',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-medical-clearance.component.html',
  styleUrl: './update-medical-clearance.component.scss'
})
export class UpdateMedicalClearanceComponent implements OnInit {
  @Input() medicalClearance!: ShowMedicalClearanceDTO;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() medicalClearanceUpdated = new EventEmitter<void>();
  medicalClearanceForm!: FormGroup;
  students: ShowStudentDTO[] = [];
  isLoadingStudents: boolean = false;

  constructor(
    private medicalClearanceService: MedicalClearanceService,
    private studentsService: StudentsService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.initializeForm();
  }

  loadStudents(): void {
    this.isLoadingStudents = true;
    this.studentsService.apiStudentsGet(1, 100).subscribe({
      next: (result) => {
        this.students = result.items || [];
        this.isLoadingStudents = false;
      },
      error: (error) => {
        console.log(error);
        this.isLoadingStudents = false;
        this.notificationService.showError(
          'Erro ao Carregar Alunos', 
          'Não foi possível carregar a lista de alunos.'
        );
      }
    });
  }

  initializeForm(): void {
    // Convert ISO date string to YYYY-MM-DD format for input[type="date"]
    const expiresAtDate = this.medicalClearance.expiresAt 
      ? new Date(this.medicalClearance.expiresAt).toISOString().split('T')[0]
      : '';

    this.medicalClearanceForm = this.formBuilder.group({
      expiresAt: [expiresAtDate, Validators.required],
      isApproved: [this.medicalClearance.isApproved || false],
      file: [null, Validators.required],
      isActive: [this.medicalClearance.isActive !== undefined ? this.medicalClearance.isActive : true],
    });
  }

  close() {
    this.closeEvent.emit();
  }

  update() {
    if (this.medicalClearanceForm.invalid) {
      this.notificationService.showError(
        'Formulário Inválido', 
        'Por favor, preencha todos os campos obrigatórios.'
      );
      return;
    }

    this.medicalClearanceService.apiMedicalClearanceIdPut(
      this.medicalClearance.id!,
      this.formToUpdateMedicalClearance()
    ).subscribe({
      next: result => {
        this.notificationService.showSuccess(
          'Atestado Atualizado!', 
          'O atestado médico foi atualizado com sucesso.'
        );
        this.medicalClearanceUpdated.emit();
        this.close();
      },
      error: error => {
        console.log(error);
        this.notificationService.showError(
          'Erro ao Atualizar Atestado!', 
          'Não foi possível atualizar o atestado médico. Tente novamente.'
        );
      }
    });
  }

  formToUpdateMedicalClearance(): UpdateMedicalClearanceDTO {
    const formValue = this.medicalClearanceForm.value;
    return {
      expiresAt: formValue.expiresAt,
      isApproved: formValue.isApproved,
      isActive: formValue.isActive,
    } as UpdateMedicalClearanceDTO
  }
}
