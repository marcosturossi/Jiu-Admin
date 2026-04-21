import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateGraduationRequirementComponent } from './update-graduation-requirement.component';
import { GraduationRequirementsService, BeltService, ShowGraduationRequirementsDTO } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_REQUIREMENT: ShowGraduationRequirementsDTO = { id: 'r1', beltId: 'belt1', description: 'Mínimo 100 aulas', minimumClasses: 100 };

describe('UpdateGraduationRequirementComponent', () => {
  let component: UpdateGraduationRequirementComponent;
  let fixture: ComponentFixture<UpdateGraduationRequirementComponent>;
  let componentRef: ComponentRef<UpdateGraduationRequirementComponent>;
  let requirementService: jasmine.SpyObj<GraduationRequirementsService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const reqSpy = jasmine.createSpyObj('GraduationRequirementsService', ['apiGraduationRequirementsIdPut']);
    const beltSpy = jasmine.createSpyObj('BeltService', ['apiBeltGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    beltSpy.apiBeltGet.and.returnValue(of({ items: [{ id: 'belt1', color: 'Azul' }] }));
    await TestBed.configureTestingModule({
      imports: [UpdateGraduationRequirementComponent],
      providers: [
        { provide: GraduationRequirementsService, useValue: reqSpy },
        { provide: BeltService, useValue: beltSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateGraduationRequirementComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    requirementService = TestBed.inject(GraduationRequirementsService) as jasmine.SpyObj<GraduationRequirementsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('requirement', MOCK_REQUIREMENT);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input requirement', () => {
    expect((component as any).form.get('beltId')?.value).toBe('belt1');
    expect((component as any).form.get('description')?.value).toBe('Mínimo 100 aulas');
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).form.get('description')?.setValue('');
    (component as any).save();
    expect(requirementService.apiGraduationRequirementsIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiGraduationRequirementsIdPut with correct id on valid save', () => {
    requirementService.apiGraduationRequirementsIdPut.and.returnValue(of({} as any));
    (component as any).save();
    expect(requirementService.apiGraduationRequirementsIdPut).toHaveBeenCalledWith('r1', jasmine.any(Object));
  });

  it('should emit graduationRequirementUpdated and show success on successful save', () => {
    requirementService.apiGraduationRequirementsIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.graduationRequirementUpdated.subscribe(() => (emitted = true));
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    requirementService.apiGraduationRequirementsIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar Requisito!', jasmine.any(String));
  });
});
