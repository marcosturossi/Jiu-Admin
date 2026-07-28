import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateGraduationComponent } from './update-graduation.component';
import { GraduationService } from '../../../../generated_services/api/graduation.service';
import { BeltService } from '../../../../generated_services/api/belt.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowGraduationDTO as ShowGraduationDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_GRADUATION: ShowGraduationDTO = { id: 'g1', studentId: 'stu1', beltId: 'belt1', graduationDate: '2024-03-01' };

describe('UpdateGraduationComponent', () => {
  let component: UpdateGraduationComponent;
  let fixture: ComponentFixture<UpdateGraduationComponent>;
  let componentRef: ComponentRef<UpdateGraduationComponent>;
  let graduationService: jasmine.SpyObj<GraduationService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const gradSpy = jasmine.createSpyObj('GraduationService', ['apiGraduationIdPut']);
    const beltSpy = jasmine.createSpyObj('BeltService', ['apiBeltGet']);
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    beltSpy.apiBeltGet.and.returnValue(of([{ id: 'belt1', color: 'Azul' }]));
    studentsSpy.apiStudentsGet.and.returnValue(of([{ id: 'stu1', firstName: 'João', lastName: 'Silva' }]));
    await TestBed.configureTestingModule({
      imports: [UpdateGraduationComponent],
      providers: [
        { provide: GraduationService, useValue: gradSpy },
        { provide: BeltService, useValue: beltSpy },
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateGraduationComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    graduationService = TestBed.inject(GraduationService) as jasmine.SpyObj<GraduationService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('graduation', MOCK_GRADUATION);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input graduation', () => {
    expect((component as any).form.get('studentId')?.value).toBe('stu1');
    expect((component as any).form.get('beltId')?.value).toBe('belt1');
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).form.get('studentId')?.setValue('');
    (component as any).save();
    expect(graduationService.apiGraduationIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiGraduationIdPut with correct id on valid save', () => {
    graduationService.apiGraduationIdPut.and.returnValue(of({} as any));
    (component as any).save();
    expect(graduationService.apiGraduationIdPut).toHaveBeenCalledWith('g1', jasmine.any(Object));
  });

  it('should emit graduationUpdated and show success on successful save', () => {
    graduationService.apiGraduationIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.graduationUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    graduationService.apiGraduationIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar Graduação!', jasmine.any(String));
  });
});
