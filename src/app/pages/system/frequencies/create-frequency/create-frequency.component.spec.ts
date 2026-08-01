import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CreateFrequencyComponent } from './create-frequency.component';
import { FrequencyService, StudentsService, LessonService } from '../../../../generated_services';
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateFrequencyComponent', () => {
  let component: CreateFrequencyComponent;
  let fixture: ComponentFixture<CreateFrequencyComponent>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const freqSpy = jasmine.createSpyObj('FrequencyService', ['apiFrequencyPost']);
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsGet']);
    const lessonSpy = jasmine.createSpyObj('LessonService', ['apiLessonGet']);
    const personsSpy = jasmine.createSpyObj('PersonsService', ['listPersonsApiV1PersonsGet', 'recognizeFacesApiV1RecognizePost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning', 'showInfo']);
    studentsSpy.apiStudentsGet.and.returnValue(of({ items: [{ id: 'stu1', firstName: 'João', lastName: 'Silva' }], totalCount: 1, totalPages: 1 }));
    lessonSpy.apiLessonGet.and.returnValue(of({ items: [{ id: 'l1', title: 'Aula 1' }], totalCount: 1, totalPages: 1 }));
    personsSpy.listPersonsApiV1PersonsGet.and.returnValue(of({ persons: [], total: 0, page: 1, page_size: 10 }));
    await TestBed.configureTestingModule({
      imports: [CreateFrequencyComponent],
      providers: [
        { provide: FrequencyService, useValue: freqSpy },
        { provide: StudentsService, useValue: studentsSpy },
        { provide: LessonService, useValue: lessonSpy },
        { provide: PersonsService, useValue: personsSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateFrequencyComponent);
    component = fixture.componentInstance;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should load students and lessons on init', () => {
    expect((component as any).students().length).toBe(1);
    expect((component as any).lessons().length).toBe(1);
  });

  it('should have no students selected initially', () => {
    expect((component as any).selectedStudentIds().size).toBe(0);
  });

  it('should be invalid when no lessonId is selected', () => {
    expect((component as any).isFormValid()).toBeFalse();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not create when form is invalid', () => {
    const freqSpy = TestBed.inject(FrequencyService) as jasmine.SpyObj<FrequencyService>;
    (component as any).create();
    expect(freqSpy.apiFrequencyPost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should toggle select all students', () => {
    (component as any).toggleSelectAll();
    expect((component as any).selectedStudentIds().has('stu1')).toBeTrue();
    (component as any).toggleSelectAll();
    expect((component as any).selectedStudentIds().has('stu1')).toBeFalse();
  });
});
