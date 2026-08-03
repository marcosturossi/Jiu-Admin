import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateLessonScheduleComponent } from './create-lesson-schedule.component';
import { LessonScheduleService } from '../../../../generated_services/api/lessonSchedule.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateLessonScheduleComponent', () => {
  let component: CreateLessonScheduleComponent;
  let fixture: ComponentFixture<CreateLessonScheduleComponent>;
  let lessonScheduleService: jasmine.SpyObj<LessonScheduleService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('LessonScheduleService', ['apiLessonSchedulePost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [CreateLessonScheduleComponent],
      providers: [
        { provide: LessonScheduleService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateLessonScheduleComponent);
    component = fixture.componentInstance;
    lessonScheduleService = TestBed.inject(LessonScheduleService) as jasmine.SpyObj<LessonScheduleService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should have invalid form on init (title required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should be valid when required fields are filled', () => {
    (component as any).form.patchValue({ title: 'Jiu-Jitsu Fundamentos' });
    expect((component as any).form.valid).toBeTrue();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).form.patchValue({ title: '' });
    (component as any).save();
    expect(lessonScheduleService.apiLessonSchedulePost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiLessonSchedulePost on valid save', () => {
    lessonScheduleService.apiLessonSchedulePost.and.returnValue(of({} as any));
    (component as any).form.patchValue({ title: 'Jiu-Jitsu Fundamentos' });
    (component as any).save();
    expect(lessonScheduleService.apiLessonSchedulePost).toHaveBeenCalled();
  });

  it('should emit scheduleCreated and show success on successful save', () => {
    lessonScheduleService.apiLessonSchedulePost.and.returnValue(of({} as any));
    let emitted = false;
    component.scheduleCreated.subscribe(() => (emitted = true));
    (component as any).form.patchValue({ title: 'Jiu-Jitsu Fundamentos' });
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    lessonScheduleService.apiLessonSchedulePost.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ title: 'Jiu-Jitsu Fundamentos' });
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Criar Horário!', jasmine.any(String));
  });
});
