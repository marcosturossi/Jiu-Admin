import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateGraduationRequirementComponent } from './create-graduation-requirement.component';
import { GraduationRequirementsService, BeltService } from '../../../../generated_services';
import { NotificationService } from '../../../../services/notification.service';

describe('CreateGraduationRequirementComponent', () => {
  let component: CreateGraduationRequirementComponent;
  let fixture: ComponentFixture<CreateGraduationRequirementComponent>;
  let requirementService: jasmine.SpyObj<GraduationRequirementsService>;
  let beltService: jasmine.SpyObj<BeltService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const reqSpy = jasmine.createSpyObj('GraduationRequirementsService', ['apiGraduationRequirementsPost']);
    const beltSpy = jasmine.createSpyObj('BeltService', ['apiBeltGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    beltSpy.apiBeltGet.and.returnValue(of({ items: [{ id: 'belt1', color: 'Azul' }] } as any));
    await TestBed.configureTestingModule({
      imports: [CreateGraduationRequirementComponent],
      providers: [
        { provide: GraduationRequirementsService, useValue: reqSpy },
        { provide: BeltService, useValue: beltSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateGraduationRequirementComponent);
    component = fixture.componentInstance;
    requirementService = TestBed.inject(GraduationRequirementsService) as jasmine.SpyObj<GraduationRequirementsService>;
    beltService = TestBed.inject(BeltService) as jasmine.SpyObj<BeltService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should load belts on init', () => {
    expect(beltService.apiBeltGet).toHaveBeenCalled();
    expect((component as any).belts().length).toBe(1);
  });

  it('should have invalid form on init (beltId and description required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should be valid when required fields are filled', () => {
    (component as any).form.patchValue({ beltId: 'belt1', description: 'Mínimo 100 aulas' });
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
    expect(requirementService.apiGraduationRequirementsPost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiGraduationRequirementsPost on valid save', () => {
    requirementService.apiGraduationRequirementsPost.and.returnValue(of({} as any));
    (component as any).form.patchValue({ beltId: 'belt1', description: 'Mínimo 100 aulas', minimumClasses: 100 });
    (component as any).save();
    expect(requirementService.apiGraduationRequirementsPost).toHaveBeenCalled();
  });

  it('should emit graduationRequirementCreated and show success on successful save', () => {
    requirementService.apiGraduationRequirementsPost.and.returnValue(of({} as any));
    let emitted = false;
    component.graduationRequirementCreated.subscribe(() => (emitted = true));
    (component as any).form.patchValue({ beltId: 'belt1', description: 'Mínimo 100 aulas' });
    (component as any).save();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    requirementService.apiGraduationRequirementsPost.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ beltId: 'belt1', description: 'Mínimo 100 aulas' });
    (component as any).save();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Criar Requisito!', jasmine.any(String));
  });
});
