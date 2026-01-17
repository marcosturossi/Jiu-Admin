import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentsService } from '../../../generated_services/api/students.service';
import { ShowStudentDTO } from '../../../generated_services/model/showStudentDTO';
import { PaginationStudentDTO } from '../../../generated_services/model/paginationStudentDTO';
import { CreateStudentComponent } from './create-student/create-student.component';
import { UpdateStudentComponent } from './update-student/update-student.component';
import { DatePipe } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-students',
  imports: [CommonModule, CreateStudentComponent, UpdateStudentComponent, DatePipe, PaginationComponent],
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss'
})
export class StudentsComponent implements OnInit {
  students: PaginationStudentDTO = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
  isLoading: boolean = false;
  openedCreateStudent: boolean = false;
  selectedStudent!: ShowStudentDTO;
  openedUpdateStudent: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

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
    this.isLoading = true;
    this.studentsService.apiStudentsGet(this.currentPage, this.pageSize).subscribe({
      next: (result) => {
        this.students = result;
        this.isLoading = false;
      },
      error: (error) => {
        console.log(error);
        this.isLoading = false;
        this.notificationService.showError(
          'Erro de Carregamento', 
          'Não foi possível carregar a lista de alunos.'
        );
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadStudents();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadStudents();
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
