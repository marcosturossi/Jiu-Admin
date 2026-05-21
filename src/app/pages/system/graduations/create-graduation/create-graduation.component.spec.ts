import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateGraduationComponent } from './create-graduation.component';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { BeltService } from '../../../../generated_services/api/belt.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateGraduationComponent', () => {
  let component: CreateGraduationComponent;
  let fixture: ComponentFixture<CreateGraduationComponent>;
  let graduationService: jasmine.SpyObj<GraduationService>;
  let beltService: jasmine.SpyObj<BeltService>;
  let studentsService: jasmine.SpyObj<StudentsService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const gradSpy = jasmine.createSpyObj('GraduationService', ['apiGraduationPost']);
    const beltSpy = jasmine.createSpyObj('BeltService', ['apiBeltGet']);
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    beltSpy.apiBeltGet.and.returnValue(of([{ id: 'belt1', color: 'Azul' }]));
    studentsSpy.apiStudentsGet.and.returnValue(of([{ id: 'stu1', firstName: 'João', lastName: 'Silva', email: 'j@test.com' }]));
    await TestBed.configureTestingModule({
      imports: [CreateGraduationComponent],
      providers: [
        { provide: GraduationService, useValue: gradSpy },
        { provide: BeltService, useValue: beltSpy },
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateGraduationComponent);
    component = fixture.componentInstance;
    graduationService = TestBed.inject(GraduationService) as jasmine.SpyObj<GraduationService>;
    beltService = TestBed.inject(BeltService) as jasmine.SpyObj<BeltService>;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should load belts and students on init', () => {
    expect(beltService.apiBeltGet).toHaveBeenCalled();
    expect(studentsService.apiStudentsGet).toHaveBeenCalled();
    expect((component as any).belts().length).toBe(1);
    expect((component as any).students().length).toBe(1);
  });

  it('should have invalid form on init (studentId and beltId required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should be valid when required fields are filled', () => {
    (component as any).form.patchValue({ studentId: 'stu1', beltId: 'belt1', graduationDate: '2024-03-01' });
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
    expect(graduationService.apiGraduationPost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiGraduationPost on valid save', () => {
    graduationService.apiGraduationPost.and.returnValue(of({} as any));
    (component as any).form.patchValue({ studentId: 'stu1', beltId: 'belt1', graduationDate: '2024-03-01' });
    (component as any).save();
    expect(graduationService.apiGraduationPost).toHaveBeenCalled();
  });

  it('should emit graduationCreated and show success on successful save', () => {
    graduationService.apiGraduationPost.and.returnValue(of({} as any));
    let emitted = false;
    component.graduationCreated.subscribe(() => (emitted = true));
    (component as any).form.patchValue({ studentId: 'stu1', beltId: 'belt1', graduationDate: '2024-03-01' });
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    graduationService.apiGraduationPost.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ studentId: 'stu1', beltId: 'belt1', graduationDate: '2024-03-01' });
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Criar Graduação!', jasmine.any(String));
  });

  it('should show error notification when belts fail to load', () => {
    beltService.apiBeltGet.and.returnValue(throwError(() => new Error()));
    fixture = TestBed.createComponent(CreateGraduationComponent);
    fixture.detectChanges();
    expect(ns.showError).toHaveBeenCalled();
  });
});
