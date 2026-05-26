import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CreatePersonsComponent } from './create-persons.component';
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreatePersonsComponent', () => {
  let component: CreatePersonsComponent;
  let fixture: ComponentFixture<CreatePersonsComponent>;
  let studentsService: jasmine.SpyObj<StudentsService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const personsSpy = jasmine.createSpyObj('PersonsService', ['registerMultiplePhotosApiV1RegisterMultiplePost']);
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    studentsSpy.apiStudentsGet.and.returnValue(of({ items: [{ id: 'stu1', firstName: 'João', lastName: 'Silva', userName: 'joao' }] } as any));
    await TestBed.configureTestingModule({
      imports: [CreatePersonsComponent],
      providers: [
        { provide: PersonsService, useValue: personsSpy },
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreatePersonsComponent);
    component = fixture.componentInstance;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should load students on init', () => {
    expect(studentsService.apiStudentsGet).toHaveBeenCalled();
    expect((component as any).students().length).toBe(1);
    expect((component as any).studentOptions().length).toBe(1);
  });

  it('should have invalid form on init (studentId and images required)', () => {
    expect((component as any).personForm.valid).toBeFalse();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    const personsSpy = TestBed.inject(PersonsService) as jasmine.SpyObj<PersonsService>;
    (component as any).create();
    expect(personsSpy.registerMultiplePhotosApiV1RegisterMultiplePost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalled();
  });
});
