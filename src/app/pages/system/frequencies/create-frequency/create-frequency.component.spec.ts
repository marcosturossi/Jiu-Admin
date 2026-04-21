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
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsActiveGet']);
    const lessonSpy = jasmine.createSpyObj('LessonService', ['apiLessonActiveGet']);
    const personsSpy = jasmine.createSpyObj('PersonsService', ['listPersonsApiV1PersonsGet', 'recognizeFacesApiV1RecognizePost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError', 'showWarning', 'showInfo']);
    studentsSpy.apiStudentsActiveGet.and.returnValue(of([{ id: 'stu1', firstName: 'João', lastName: 'Silva' }]));
    lessonSpy.apiLessonActiveGet.and.returnValue(of([{ id: 'l1', title: 'Aula 1' }]));
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

  it('should initialize student form array matching students count', () => {
    expect((component as any).studentsFormArray.length).toBe(1);
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
    expect((component as any).studentsFormArray.at(0).value).toBeTrue();
    (component as any).toggleSelectAll();
    expect((component as any).studentsFormArray.at(0).value).toBeFalse();
  });
});
