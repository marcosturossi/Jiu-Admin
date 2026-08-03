import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateLessonScheduleComponent } from './update-lesson-schedule.component';
import { LessonScheduleService } from '../../../../generated_services/api/lessonSchedule.service';
import { ShowLessonScheduleDTO } from '../../../../generated_services/model/showLessonScheduleDTO';
import { DayOfWeek } from '../../../../generated_services/model/dayOfWeek';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_SCHEDULE: ShowLessonScheduleDTO = {
  id: 'ls1',
  title: 'Jiu-Jitsu Fundamentos',
  description: 'Turma iniciante',
  dayOfWeek: DayOfWeek.Monday,
  startTime: '19:00:00',
  duration: '01:00:00',
  isActive: true,
};

describe('UpdateLessonScheduleComponent', () => {
  let component: UpdateLessonScheduleComponent;
  let fixture: ComponentFixture<UpdateLessonScheduleComponent>;
  let componentRef: ComponentRef<UpdateLessonScheduleComponent>;
  let lessonScheduleService: jasmine.SpyObj<LessonScheduleService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('LessonScheduleService', ['apiLessonScheduleIdPut']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [UpdateLessonScheduleComponent],
      providers: [
        { provide: LessonScheduleService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateLessonScheduleComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    lessonScheduleService = TestBed.inject(LessonScheduleService) as jasmine.SpyObj<LessonScheduleService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('schedule', MOCK_SCHEDULE);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input schedule', () => {
    expect((component as any).form.get('title')?.value).toBe('Jiu-Jitsu Fundamentos');
    expect((component as any).form.get('dayOfWeek')?.value).toBe(DayOfWeek.Monday);
    expect((component as any).form.get('startTime')?.value).toBe('19:00:00');
  });

  it('should have valid form after input is set', () => {
    expect((component as any).form.valid).toBeTrue();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).form.get('title')?.setValue('');
    (component as any).save();
    expect(lessonScheduleService.apiLessonScheduleIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiLessonScheduleIdPut with correct id on valid save', () => {
    lessonScheduleService.apiLessonScheduleIdPut.and.returnValue(of({} as any));
    (component as any).save();
    expect(lessonScheduleService.apiLessonScheduleIdPut).toHaveBeenCalledWith('ls1', jasmine.any(Object));
  });

  it('should emit scheduleUpdated and show success on successful save', () => {
    lessonScheduleService.apiLessonScheduleIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.scheduleUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    lessonScheduleService.apiLessonScheduleIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar Horário!', jasmine.any(String));
  });
});
