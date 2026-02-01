import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../generated_services';
import { StudentsBirthDay } from '../../../generated_services';

@Component({
  selector: 'app-birthday-this-month',
  imports: [CommonModule],
  templateUrl: './birthday-this-month.component.html',
  styleUrl: './birthday-this-month.component.scss'
})
export class BirthdayThisMonthComponent implements OnInit {
  birthdays: StudentsBirthDay[] = [];
  loading = true;
  error = '';

  constructor(private dashboardService: DashboardService){ }

  ngOnInit(): void {
    this.dashboardService.apiDashboardBirthdaysGet().subscribe({
      next: (data) => {
        this.birthdays = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load birthdays';
        this.loading = false;
        console.error(err);
      }
    });
  }

}
