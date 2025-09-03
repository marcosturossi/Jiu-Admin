import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LessonService } from '../../../generated_services/api/lesson.service';
import { ShowLessonDTO } from '../../../generated_services/model/showLessonDTO';
import { CreateLessonComponent } from './create-lesson/create-lesson.component';
import { UpdateLessonComponent } from './update-lesson/update-lesson.component';
import { DatePipe } from '@angular/common';
import { SubnavService } from '../../../services/subnav.service';

@Component({
  selector: 'app-lessons',
  imports: [CommonModule, CreateLessonComponent, UpdateLessonComponent, DatePipe],
  templateUrl: './lessons.component.html',
  styleUrl: './lessons.component.scss'
})
export class LessonsComponent implements OnInit {
  lessons: ShowLessonDTO[] = [];
  openedCreateLesson: boolean = false;
  selectedLesson!: ShowLessonDTO;
  openedUpdateLesson: boolean = false;

  constructor(
    private lessonService: LessonService,
    private subnavService: SubnavService
  ) { }

  ngOnInit(): void {
    this.subnavService.setTitle("Aulas");
    this.loadLessons();
  }

  loadLessons(): void {
    this.lessonService.apiLessonGet().subscribe(
      {
        next: (result) => this.lessons = result
      }
    )
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
    if (confirm('Tem certeza que deseja excluir esta aula?')) {
      this.lessonService.apiLessonIdDelete(lesson.id!).subscribe({
        next: () => {
          this.loadLessons();
        },
        error: (error) => console.log(error)
      });
    }
  }
}
