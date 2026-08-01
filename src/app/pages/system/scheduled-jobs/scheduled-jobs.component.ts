import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ScheduledJobService } from '../../../generated_services/api/scheduledJob.service';
import { ShowScheduledJobDto } from '../../../generated_services/model/showScheduledJobDto';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';
import { extractErrorMessage } from '../../../utils/error.utils';

@Component({
  selector: 'app-scheduled-jobs',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './scheduled-jobs.component.html',
  styleUrl: './scheduled-jobs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduledJobsComponent {
  private readonly scheduledJobService = inject(ScheduledJobService);
  private readonly ns = inject(NotificationService);
  private readonly subnavService = inject(SubnavService);

  protected readonly isLoading = signal(false);
  protected readonly jobs = signal<ShowScheduledJobDto[]>([]);
  // Per-job in-flight flag so one toggle's request doesn't disable every switch in the table.
  protected readonly togglingJobKey = signal<string | null>(null);

  constructor() {
    this.subnavService.setTitle('Jobs Agendados');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.scheduledJobService.apiScheduledJobsGet().subscribe({
      next: (jobs) => {
        this.jobs.set(jobs);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.ns.showError('Erro ao Carregar', extractErrorMessage(err, 'Não foi possível carregar os jobs agendados.'));
      },
    });
  }

  protected toggle(job: ShowScheduledJobDto): void {
    const nextEnabled = !job.isEnabled;
    this.togglingJobKey.set(job.jobKey);
    this.scheduledJobService.apiScheduledJobsJobKeyPatch(job.jobKey, { isEnabled: nextEnabled }).subscribe({
      next: () => {
        this.togglingJobKey.set(null);
        this.jobs.update(list =>
          list.map(j => (j.jobKey === job.jobKey ? { ...j, isEnabled: nextEnabled } : j)));
        this.ns.showSuccess(
          nextEnabled ? 'Job Habilitado' : 'Job Desabilitado',
          `"${job.displayName}" foi ${nextEnabled ? 'habilitado' : 'desabilitado'} para esta academia.`);
      },
      error: (err) => {
        this.togglingJobKey.set(null);
        this.ns.showError('Erro ao Atualizar', extractErrorMessage(err, 'Não foi possível atualizar o job agendado.'));
      },
    });
  }
}
