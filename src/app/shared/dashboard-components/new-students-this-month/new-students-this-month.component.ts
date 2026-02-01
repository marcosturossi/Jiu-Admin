import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../generated_services';
import { MonthlyNewStudentsDTO } from '../../../generated_services';

@Component({
  selector: 'app-new-students-this-month',
  imports: [CommonModule],
  templateUrl: './new-students-this-month.component.html',
  styleUrl: './new-students-this-month.component.scss'
})
export class NewStudentsThisMonthComponent implements OnInit {
  newStudentsThisMonth: number | null = null;
  loading = true;
  error = '';

  constructor(private dashboardService: DashboardService) { }
  
  ngOnInit(): void {
    this.dashboardService.apiDashboardNewStudentsGet(1).subscribe({
      next: (data) => {
        if (data && data.newStudentsCount !== undefined) {
          this.newStudentsThisMonth = data.newStudentsCount;
        } else {
          this.newStudentsThisMonth = 0;
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load new students';
        this.loading = false;
        console.error(err);
      }
    });
  }

}
