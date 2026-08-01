import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { ScheduledJobsComponent } from './scheduled-jobs.component';
import { ScheduledJobService } from '../../../generated_services/api/scheduledJob.service';
import { ShowScheduledJobDto } from '../../../generated_services/model/showScheduledJobDto';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';

const MOCK_JOBS: ShowScheduledJobDto[] = [
  {
    jobKey: 'lesson-schedule-generation',
    displayName: 'Geração de aulas recorrentes',
    description: 'Gera as aulas da próxima semana.',
    cronDescription: 'Diariamente',
    isEnabled: true,
    lastRunAt: null,
    lastRunSummary: null,
  },
  {
    jobKey: 'birthday-greetings',
    displayName: 'E-mail de aniversário',
    description: 'Envia e-mail de parabéns.',
    cronDescription: 'Diariamente, 08:00 UTC',
    isEnabled: false,
    lastRunAt: '2026-08-01T08:00:00Z',
    lastRunSummary: '2 sent, 0 failed',
  },
];

describe('ScheduledJobsComponent', () => {
  let component: ScheduledJobsComponent;
  let fixture: ComponentFixture<ScheduledJobsComponent>;
  let scheduledJobService: jasmine.SpyObj<ScheduledJobService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const scheduledJobSpy = jasmine.createSpyObj('ScheduledJobService', ['apiScheduledJobsGet', 'apiScheduledJobsJobKeyPatch']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    scheduledJobSpy.apiScheduledJobsGet.and.returnValue(of(MOCK_JOBS));

    await TestBed.configureTestingModule({
      imports: [ScheduledJobsComponent],
      providers: [
        { provide: ScheduledJobService, useValue: scheduledJobSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduledJobsComponent);
    component = fixture.componentInstance;
    scheduledJobService = TestBed.inject(ScheduledJobService) as jasmine.SpyObj<ScheduledJobService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load jobs into the signal on init', () => {
    expect((component as any).jobs()).toEqual(MOCK_JOBS);
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show an error and stop loading when the initial load fails', () => {
    scheduledJobService.apiScheduledJobsGet.and.returnValue(throwError(() => new Error('network down')));
    const f2 = TestBed.createComponent(ScheduledJobsComponent);
    f2.detectChanges();

    expect((f2.componentInstance as any).isLoading()).toBeFalse();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should enable a disabled job and update only that row', () => {
    scheduledJobService.apiScheduledJobsJobKeyPatch.and.returnValue(of({} as any));
    const disabledJob = MOCK_JOBS[1];

    (component as any).toggle(disabledJob);

    expect(scheduledJobService.apiScheduledJobsJobKeyPatch).toHaveBeenCalledWith(
      disabledJob.jobKey, { isEnabled: true }
    );
    const updated = (component as any).jobs().find((j: ShowScheduledJobDto) => j.jobKey === disabledJob.jobKey);
    expect(updated.isEnabled).toBeTrue();
    const untouched = (component as any).jobs().find((j: ShowScheduledJobDto) => j.jobKey === MOCK_JOBS[0].jobKey);
    expect(untouched.isEnabled).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
    expect((component as any).togglingJobKey()).toBeNull();
  });

  it('should disable an enabled job', () => {
    scheduledJobService.apiScheduledJobsJobKeyPatch.and.returnValue(of({} as any));
    const enabledJob = MOCK_JOBS[0];

    (component as any).toggle(enabledJob);

    expect(scheduledJobService.apiScheduledJobsJobKeyPatch).toHaveBeenCalledWith(
      enabledJob.jobKey, { isEnabled: false }
    );
    const updated = (component as any).jobs().find((j: ShowScheduledJobDto) => j.jobKey === enabledJob.jobKey);
    expect(updated.isEnabled).toBeFalse();
  });

  it('should set togglingJobKey while the request is in flight', () => {
    let resolveRequest!: () => void;
    scheduledJobService.apiScheduledJobsJobKeyPatch.and.returnValue(
      new Observable<any>((subscriber) => {
        resolveRequest = () => { subscriber.next({}); subscriber.complete(); };
      })
    );

    (component as any).toggle(MOCK_JOBS[0]);
    expect((component as any).togglingJobKey()).toBe(MOCK_JOBS[0].jobKey);

    resolveRequest();
    expect((component as any).togglingJobKey()).toBeNull();
  });

  it('should show an error and reset togglingJobKey when the toggle request fails', () => {
    scheduledJobService.apiScheduledJobsJobKeyPatch.and.returnValue(throwError(() => new Error('server error')));

    (component as any).toggle(MOCK_JOBS[0]);

    expect(ns.showError).toHaveBeenCalled();
    expect((component as any).togglingJobKey()).toBeNull();
    // The optimistic-free approach: on failure the row must NOT have flipped.
    const untouched = (component as any).jobs().find((j: ShowScheduledJobDto) => j.jobKey === MOCK_JOBS[0].jobKey);
    expect(untouched.isEnabled).toBeTrue();
  });
});
