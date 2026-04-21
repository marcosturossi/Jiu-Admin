import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateLessonComponent } from './update-lesson.component';
import { LessonService } from '../../../../generated_services/api/lesson.service';
import { ShowLessonDTO } from '../../../../generated_services/model/showLessonDTO';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_LESSON: ShowLessonDTO = { id: 'l1', title: 'Aula 1', description: 'desc', scheduledDate: '2024-03-01T08:00:00Z', duration: '01:00', isActive: true };

describe('UpdateLessonComponent', () => {
  let component: UpdateLessonComponent;
  let fixture: ComponentFixture<UpdateLessonComponent>;
  let componentRef: ComponentRef<UpdateLessonComponent>;
  let lessonService: jasmine.SpyObj<LessonService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const lessonSpy = jasmine.createSpyObj('LessonService', ['apiLessonIdPut']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [UpdateLessonComponent],
      providers: [
        { provide: LessonService, useValue: lessonSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateLessonComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    lessonService = TestBed.inject(LessonService) as jasmine.SpyObj<LessonService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('lesson', MOCK_LESSON);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input lesson', () => {
    expect((component as any).form.get('title')?.value).toBe('Aula 1');
    expect((component as any).form.get('duration')?.value).toBe('01:00');
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
    expect(lessonService.apiLessonIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiLessonIdPut with correct id on valid save', () => {
    lessonService.apiLessonIdPut.and.returnValue(of({} as any));
    (component as any).save();
    expect(lessonService.apiLessonIdPut).toHaveBeenCalledWith('l1', jasmine.any(Object));
  });

  it('should emit lessonUpdated and show success on successful save', () => {
    lessonService.apiLessonIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.lessonUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    lessonService.apiLessonIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar Aula!', jasmine.any(String));
  });
});
