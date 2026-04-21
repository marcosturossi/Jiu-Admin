import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateStudentComponent } from './create-student.component';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateStudentComponent', () => {
  let component: CreateStudentComponent;
  let fixture: ComponentFixture<CreateStudentComponent>;
  let studentsService: jasmine.SpyObj<StudentsService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsPost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [CreateStudentComponent],
      providers: [
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateStudentComponent);
    component = fixture.componentInstance;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should have invalid form on init (userName and email required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should be valid when required fields are filled', () => {
    (component as any).form.patchValue({ userName: 'joao', email: 'joao@test.com' });
    expect((component as any).form.valid).toBeTrue();
  });

  it('should reject invalid email', () => {
    (component as any).form.patchValue({ userName: 'joao', email: 'not-an-email' });
    expect((component as any).form.get('email')?.errors?.['email']).toBeTruthy();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).save();
    expect(studentsService.apiStudentsPost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiStudentsPost on valid save', () => {
    studentsService.apiStudentsPost.and.returnValue(of({} as any));
    (component as any).form.patchValue({ userName: 'joao', email: 'joao@test.com' });
    (component as any).save();
    expect(studentsService.apiStudentsPost).toHaveBeenCalled();
  });

  it('should emit studentCreated and show success on successful save', () => {
    studentsService.apiStudentsPost.and.returnValue(of({} as any));
    let emitted = false;
    component.studentCreated.subscribe(() => (emitted = true));
    (component as any).form.patchValue({ userName: 'joao', email: 'joao@test.com' });
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    studentsService.apiStudentsPost.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ userName: 'joao', email: 'joao@test.com' });
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro!', jasmine.any(String));
  });
});
