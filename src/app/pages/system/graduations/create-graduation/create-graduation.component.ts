import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { BeltService } from '../../../../generated_services/api/belt.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateGraduationDTO, PaginationBeltDTO, PaginationStudentDTO, ShowBeltDTO, ShowStudentDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-graduation',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-graduation.component.html',
  styleUrl: './create-graduation.component.scss'
})
export class CreateGraduationComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  graduationForm!: FormGroup;
  belts!: PaginationBeltDTO;
  students!: PaginationStudentDTO;

  constructor(
    private graduationService: GraduationService,
    private beltService: BeltService,
    private studentsService: StudentsService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.graduationForm = this.formBuilder.group({
      studentId: ["", Validators.required],
      beltId: ["", Validators.required],
      graduationDate: [new Date().toISOString().split('T')[0], Validators.required],
    })
  }

  ngOnInit(): void {
    this.loadBelts();
    this.loadStudents();
  }

  loadBelts() {
    this.beltService.apiBeltGet().subscribe({
      next: (belts) => this.belts = belts,
      error: (error) => {
        console.log('Error loading belts:', error);
        this.notificationService.showError(
          'Erro ao Carregar Faixas', 
          'Não foi possível carregar as faixas disponíveis.'
        );
      }
    });
  }

  loadStudents() {
    this.studentsService.apiStudentsGet().subscribe({
      next: (students) => this.students = students,
      error: (error) => {
        console.log('Error loading students:', error);
        this.notificationService.showError(
          'Erro ao Carregar Alunos', 
          'Não foi possível carregar a lista de alunos.'
        );
      }
    });
  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    if (this.graduationForm.invalid) {
      this.notificationService.showError(
        'Formulário Inválido', 
        'Por favor, selecione um aluno e uma faixa.'
      );
      return;
    }

    this.graduationService.apiGraduationPost(this.formToCreateGraduation()).subscribe({
      next: result => {
        const selectedStudent = this.students.items!.find(s => s.id === this.graduationForm.value.studentId);
        const selectedBelt = this.belts.items!.find(b => b.id === this.graduationForm.value.beltId);
        this.notificationService.showSuccess(
          'Graduação Criada!', 
          `${selectedStudent?.firstName} ${selectedStudent?.lastName} foi graduado(a) para faixa ${selectedBelt?.color}.`
        );
        this.close();
      },
      error: error => {
        console.log(error);
        this.notificationService.showError(
          'Erro ao Criar Graduação!', 
          'Não foi possível criar a graduação. Tente novamente.'
        );
      }
    });
  }

  formToCreateGraduation(): CreateGraduationDTO {
    const formValue = this.graduationForm.value;
    return {
      studentId: formValue.studentId,
      beltId: formValue.beltId,
      graduationDate: formValue.graduationDate
    } as CreateGraduationDTO
  }
}
