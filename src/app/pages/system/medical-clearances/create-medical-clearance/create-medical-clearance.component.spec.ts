import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateMedicalClearanceComponent } from './create-medical-clearance.component';
import { MedicalClearanceService } from '../../../../generated_services/api/medicalClearance.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateMedicalClearanceComponent', () => {
  let component: CreateMedicalClearanceComponent;
  let fixture: ComponentFixture<CreateMedicalClearanceComponent>;
  let clearanceService: jasmine.SpyObj<MedicalClearanceService>;
  let studentsService: jasmine.SpyObj<StudentsService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const clearanceSpy = jasmine.createSpyObj('MedicalClearanceService', ['apiMedicalClearancePost', 'apiMedicalClearanceIdAttachmentPost']);
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsActiveGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    studentsSpy.apiStudentsActiveGet.and.returnValue(of([{ id: 'stu1', firstName: 'João', lastName: 'Silva' }] as any));
    await TestBed.configureTestingModule({
      imports: [CreateMedicalClearanceComponent],
      providers: [
        { provide: MedicalClearanceService, useValue: clearanceSpy },
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateMedicalClearanceComponent);
    component = fixture.componentInstance;
    clearanceService = TestBed.inject(MedicalClearanceService) as jasmine.SpyObj<MedicalClearanceService>;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should load students on init', () => {
    expect(studentsService.apiStudentsActiveGet).toHaveBeenCalled();
    expect((component as any).students().length).toBe(1);
  });

  it('should have invalid form on init (studentId and expiresAt required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).create();
    expect(clearanceService.apiMedicalClearancePost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiMedicalClearancePost on valid create (no file)', () => {
    clearanceService.apiMedicalClearancePost.and.returnValue(of({ id: 'mc1' } as any));
    (component as any).form.patchValue({ studentId: 'stu1', expiresAt: new Date('2025-01-01') });
    (component as any).create();
    expect(clearanceService.apiMedicalClearancePost).toHaveBeenCalled();
  });

  it('should emit medicalClearanceCreated and show success on successful create', () => {
    clearanceService.apiMedicalClearancePost.and.returnValue(of({ id: 'mc1' } as any));
    let emitted = false;
    component.medicalClearanceCreated.subscribe(() => (emitted = true));
    (component as any).form.patchValue({ studentId: 'stu1', expiresAt: new Date('2025-01-01') });
    (component as any).create();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    clearanceService.apiMedicalClearancePost.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ studentId: 'stu1', expiresAt: new Date('2025-01-01') });
    (component as any).create();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Criar Atestado!', jasmine.any(String));
  });
});
