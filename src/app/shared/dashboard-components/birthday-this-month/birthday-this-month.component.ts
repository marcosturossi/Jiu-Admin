import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DashboardService, CarlonGracieBackendReportingApplicationDTOsStudentsBirthDay as StudentsBirthDay } from '../../../generated_services';

@Component({
  selector: 'app-birthday-this-month',
  imports: [DatePipe],
  templateUrl: './birthday-this-month.component.html',
  styleUrl: './birthday-this-month.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BirthdayThisMonthComponent {
  private readonly dashboardService = inject(DashboardService);

  protected readonly birthdays = signal<StudentsBirthDay[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.dashboardService.apiDashboardBirthdaysGet().subscribe({
      next: (data) => {
        this.birthdays.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Falha ao carregar aniversários');
        this.loading.set(false);
      },
    });
  }
}
