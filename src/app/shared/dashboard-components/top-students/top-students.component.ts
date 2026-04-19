import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DashboardService, TopStudentDTO } from '../../../generated_services';

@Component({
  selector: 'app-top-students',
  imports: [],
  templateUrl: './top-students.component.html',
  styleUrl: './top-students.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopStudentsComponent {
  private readonly dashboardService = inject(DashboardService);

  protected readonly topStudents = signal<TopStudentDTO[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.dashboardService.apiDashboardTopStudentsGet().subscribe({
      next: (data) => {
        this.topStudents.set(data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Falha ao carregar ranking');
        this.loading.set(false);
      },
    });
  }
}
