import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateStudentComponent } from './update-student.component';
import { StudentsService, ShowStudentDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_STUDENT: ShowStudentDTO = { id: 's1', userName: 'joao', email: 'joao@test.com', firstName: 'João', lastName: 'Silva', isActive: true };

describe('UpdateStudentComponent', () => {
  let component: UpdateStudentComponent;
  let fixture: ComponentFixture<UpdateStudentComponent>;
  let componentRef: ComponentRef<UpdateStudentComponent>;
  let studentsService: jasmine.SpyObj<StudentsService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsIdPut']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [UpdateStudentComponent],
      providers: [
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateStudentComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('student', MOCK_STUDENT);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input student', () => {
    expect((component as any).form.get('userName')?.value).toBe('joao');
    expect((component as any).form.get('email')?.value).toBe('joao@test.com');
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
    (component as any).form.get('email')?.setValue('bad-email');
    (component as any).save();
    expect(studentsService.apiStudentsIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiStudentsIdPut with correct id on valid save', () => {
    studentsService.apiStudentsIdPut.and.returnValue(of({} as any));
    (component as any).save();
    expect(studentsService.apiStudentsIdPut).toHaveBeenCalledWith('s1', jasmine.any(Object));
  });

  it('should emit studentUpdated and show success on successful save', () => {
    studentsService.apiStudentsIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.studentUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    studentsService.apiStudentsIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar!', jasmine.any(String));
  });
});
