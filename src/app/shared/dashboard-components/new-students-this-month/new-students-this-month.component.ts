import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DashboardService, MonthlyNewStudentsDTO } from '../../../generated_services';

@Component({
  selector: 'app-new-students-this-month',
  imports: [],
  templateUrl: './new-students-this-month.component.html',
  styleUrl: './new-students-this-month.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewStudentsThisMonthComponent {
  private readonly dashboardService = inject(DashboardService);

  protected readonly count = signal<number | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  constructor() {
    this.dashboardService.apiDashboardNewStudentsGet(1).subscribe({
      next: (data) => {
        this.count.set(data?.newStudentsCount ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Falha ao carregar novos alunos');
        this.loading.set(false);
      },
    });
  }
}
