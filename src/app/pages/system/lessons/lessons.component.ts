import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LessonService } from '../../../generated_services/api/lesson.service';
import { ShowLessonDTO } from '../../../generated_services/model/showLessonDTO';
import { CreateLessonComponent } from './create-lesson/create-lesson.component';
import { UpdateLessonComponent } from './update-lesson/update-lesson.component';
import { DatePipe } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationLessonDTO } from '../../../generated_services';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';

@Component({
  selector: 'app-lessons',
  imports: [CommonModule, CreateLessonComponent, UpdateLessonComponent, DatePipe, PaginationComponent],
  templateUrl: './lessons.component.html',
  styleUrl: './lessons.component.scss'
})
export class LessonsComponent implements OnInit {
  lessons: PaginationLessonDTO = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
  isLoading: boolean = false;
  openedCreateLesson: boolean = false;
  selectedLesson!: ShowLessonDTO;
  openedUpdateLesson: boolean = false;
  currentPage: number = 1;
  pageSize: number = 10;

  constructor(
    private lessonService: LessonService,
    private subnavService: SubnavService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Aulas");
    this.loadLessons();
  }

  loadLessons(): void {
    this.isLoading = true;
    this.lessonService.apiLessonGet(this.currentPage, this.pageSize).subscribe(
      {
        next: (result) => {
          this.lessons = result;
          this.isLoading = false;
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
          this.notificationService.showError(
            'Erro ao Carregar Aulas!', 
            'Não foi possível carregar a lista de aulas. Tente novamente.'
          );
        }
      }
    )
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLessons();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadLessons();
  }

  openCreateLesson() {
    this.openedCreateLesson = true
  }

  closeCreateLesson() {
    this.openedCreateLesson = false
  }

  openUpdateLesson(lesson: ShowLessonDTO) {
    this.selectedLesson = lesson
    this.openedUpdateLesson = true
  }

  closeUpdateLesson() {
    this.openedUpdateLesson = false
  }

  onLessonCreated() {
    this.loadLessons();
    this.closeCreateLesson();
  }

  onLessonUpdated() {
    this.loadLessons();
    this.closeUpdateLesson();
  }

  deleteLesson(lesson: ShowLessonDTO) {
    // You can implement a proper confirmation dialog here if needed
    if (confirm(`Tem certeza que deseja excluir a aula "${lesson.title}"?`)) {
      this.lessonService.apiLessonIdDelete(lesson.id!).subscribe({
        next: () => {
          this.notificationService.showSuccess(
            'Aula Excluída!', 
            `A aula "${lesson.title}" foi excluída com sucesso.`
          );
          this.loadLessons();
        },
        error: (error) => {
          console.log(error);
          this.notificationService.showError(
            'Erro ao Excluir Aula!', 
            'Não foi possível excluir a aula. Tente novamente.'
          );
        }
      });
    }
  }
}
