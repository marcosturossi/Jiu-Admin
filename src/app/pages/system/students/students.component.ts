import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentsService } from '../../../generated_services/api/students.service';
import { ShowStudentDTO } from '../../../generated_services/model/showStudentDTO';
import { CreateStudentComponent } from './create-student/create-student.component';
import { UpdateStudentComponent } from './update-student/update-student.component';
import { DatePipe } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-students',
  imports: [CommonModule, CreateStudentComponent, UpdateStudentComponent, DatePipe],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss'
})
export class StudentsComponent implements OnInit {
  students: ShowStudentDTO[] = [];
  openedCreateStudent: boolean = false;
  selectedStudent!: ShowStudentDTO;
  openedUpdateStudent: boolean = false;

  constructor(
    private studentsService: StudentsService,
    private subnavService: SubnavService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Estudantes");
    this.loadStudents();
  }

  loadStudents(): void {
    this.studentsService.apiStudentsGet().subscribe({
      next: (result) => {
        this.students = result;
        this.notificationService.showInfo(
          'Dados Atualizados', 
          `${result.length} aluno(s) carregado(s).`
        );
      },
      error: (error) => {
        console.log(error);
        this.notificationService.showError(
          'Erro de Carregamento', 
          'Não foi possível carregar a lista de alunos.'
        );
      }
    });
  }

  openCreateStudent() {
    this.openedCreateStudent = true
  }

  closeCreateStudent() {
    this.openedCreateStudent = false
  }

  openUpdateStudent(student: ShowStudentDTO) {
    this.selectedStudent = student
    this.openedUpdateStudent = true
  }

  closeUpdateStudent() {
    this.openedUpdateStudent = false
  }

  onStudentCreated() {
    this.loadStudents();
    this.closeCreateStudent();
  }

  onStudentUpdated() {
    this.loadStudents();
    this.closeUpdateStudent();
  }

  deleteStudent(student: ShowStudentDTO) {
    // Show warning toast for confirmation
    this.notificationService.showWarning(
      'Confirmação Necessária', 
      'Use o botão de confirmação no navegador para excluir o aluno.',
      6000
    );

    if (confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
      this.studentsService.apiStudentsIdDelete(student.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess(
            'Aluno Excluído', 
            `O aluno ${student.firstName} ${student.lastName} foi excluído com sucesso.`
          );
          this.loadStudents();
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Excluir', 
            'Não foi possível excluir o aluno. Tente novamente.'
          );
        }
      });
    }
  }
}
