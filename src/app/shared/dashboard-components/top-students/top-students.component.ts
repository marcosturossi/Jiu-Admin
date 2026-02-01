import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../generated_services';
import { TopStudentDTO } from '../../../generated_services';

@Component({
  selector: 'app-top-students',
  imports: [CommonModule],
  templateUrl: './top-students.component.html',
  styleUrl: './top-students.component.scss'
})
export class TopStudentsComponent implements OnInit {
  topStudents: TopStudentDTO[] = [];
  loading = true;
  error = '';

  constructor(private dashboardService: DashboardService) {
  }

  ngOnInit(): void {
    this.dashboardService.apiDashboardTopStudentsGet().subscribe({
      next: (data) => {
        this.topStudents = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load top students';
        this.loading = false;
        console.error(err);
      }
    });
  }

}
