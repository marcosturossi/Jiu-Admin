import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ScheduledJobService } from '../../../generated_services/api/scheduledJob.service';
import { ShowScheduledJobDto, ScheduledJobCadence } from '../../../generated_services';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';
import { extractErrorMessage } from '../../../utils/error.utils';

const DAY_OF_WEEK_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

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
  // Per-job in-flight flag so one update's request doesn't disable every control in the table.
  protected readonly savingJobKey = signal<string | null>(null);

  protected readonly Cadence = ScheduledJobCadence;
  protected readonly hourOptions = Array.from({ length: 24 }, (_, h) => h);
  protected readonly dayOfMonthOptions = Array.from({ length: 28 }, (_, d) => d + 1);
  protected readonly dayOfWeekOptions = DAY_OF_WEEK_LABELS.map((label, value) => ({ value, label }));

  constructor() {
    this.subnavService.setTitle('Rotinas Agendadas');
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
    this.update(job, { isEnabled: !job.isEnabled }, job.isEnabled ? 'desabilitado' : 'habilitado');
  }

  protected register(job: ShowScheduledJobDto): void {
    this.savingJobKey.set(job.jobKey);
    this.scheduledJobService.apiScheduledJobsJobKeyRegisterPost(job.jobKey).subscribe({
      next: () => {
        this.savingJobKey.set(null);
        this.ns.showSuccess('Rotina Registrada', `"${job.displayName}" foi re-registrada no agendador.`);
        // Re-fetch rather than patch isRegisteredInScheduler locally — the backend also recomputes
        // nextRunAtUtc from Hangfire, which we can't derive on the client.
        this.load();
      },
      error: (err) => {
        this.savingJobKey.set(null);
        this.ns.showError('Erro ao Registrar', extractErrorMessage(err, 'Não foi possível registrar o job no agendador.'));
      },
    });
  }

  protected onHourChange(job: ShowScheduledJobDto, value: string): void {
    this.update(job, { hourUtc: Number(value) }, 'atualizado');
  }

  protected onDayOfWeekChange(job: ShowScheduledJobDto, value: string): void {
    this.update(job, { dayOfWeek: Number(value) }, 'atualizado');
  }

  protected onDayOfMonthChange(job: ShowScheduledJobDto, value: string): void {
    this.update(job, { dayOfMonth: Number(value) }, 'atualizado');
  }

  private update(
    job: ShowScheduledJobDto,
    change: { isEnabled?: boolean; hourUtc?: number; dayOfWeek?: number; dayOfMonth?: number },
    verb: string,
  ): void {
    const isEnabled = change.isEnabled ?? job.isEnabled;
    const hourUtc = change.hourUtc ?? job.hourUtc;
    // Only send the day field that matches this job's cadence — the backend rejects a
    // dayOfWeek on a Monthly job (and vice versa), so never send the other one.
    const dayOfWeek = job.cadence === ScheduledJobCadence.Weekly ? (change.dayOfWeek ?? job.dayOfWeek ?? null) : null;
    const dayOfMonth = job.cadence === ScheduledJobCadence.Monthly ? (change.dayOfMonth ?? job.dayOfMonth ?? null) : null;

    this.savingJobKey.set(job.jobKey);
    this.scheduledJobService.apiScheduledJobsJobKeyPatch(job.jobKey, { isEnabled, hourUtc, dayOfWeek, dayOfMonth }).subscribe({
      next: () => {
        this.savingJobKey.set(null);
        this.jobs.update(list =>
          list.map(j => (j.jobKey === job.jobKey ? { ...j, isEnabled, hourUtc, dayOfWeek: dayOfWeek ?? j.dayOfWeek, dayOfMonth: dayOfMonth ?? j.dayOfMonth } : j)));
        this.ns.showSuccess('Rotina Atualizada', `"${job.displayName}" foi ${verb}.`);
      },
      error: (err) => {
        this.savingJobKey.set(null);
        this.ns.showError('Erro ao Atualizar', extractErrorMessage(err, 'Não foi possível atualizar o job agendado.'));
      },
    });
  }
}
