import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateLessonComponent } from './create-lesson.component';
import { LessonService } from '../../../../generated_services/api/lesson.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateLessonComponent', () => {
  let component: CreateLessonComponent;
  let fixture: ComponentFixture<CreateLessonComponent>;
  let lessonService: jasmine.SpyObj<LessonService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const lessonSpy = jasmine.createSpyObj('LessonService', ['apiLessonPost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [CreateLessonComponent],
      providers: [
        { provide: LessonService, useValue: lessonSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateLessonComponent);
    component = fixture.componentInstance;
    lessonService = TestBed.inject(LessonService) as jasmine.SpyObj<LessonService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should have invalid form on init (scheduledDate required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should be valid when required fields are filled', () => {
    (component as any).form.get('title')?.enable();
    (component as any).form.patchValue({ title: 'Aula Teste', scheduledDate: '2024-03-01T08:00', duration: '01:00' });
    expect((component as any).form.valid).toBeTrue();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).save();
    expect(lessonService.apiLessonPost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiLessonPost on valid save', () => {
    lessonService.apiLessonPost.and.returnValue(of({} as any));
    (component as any).form.get('title')?.enable();
    (component as any).form.patchValue({ title: 'Aula Teste', scheduledDate: '2024-03-01T08:00', duration: '01:00' });
    (component as any).save();
    expect(lessonService.apiLessonPost).toHaveBeenCalled();
  });

  it('should emit lessonCreated and show success on successful save', () => {
    lessonService.apiLessonPost.and.returnValue(of({} as any));
    let emitted = false;
    component.lessonCreated.subscribe(() => (emitted = true));
    (component as any).form.get('title')?.enable();
    (component as any).form.patchValue({ title: 'Aula Teste', scheduledDate: '2024-03-01T08:00', duration: '01:00' });
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    lessonService.apiLessonPost.and.returnValue(throwError(() => new Error()));
    (component as any).form.get('title')?.enable();
    (component as any).form.patchValue({ title: 'Aula Teste', scheduledDate: '2024-03-01T08:00', duration: '01:00' });
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Criar Aula!', jasmine.any(String));
  });
});
