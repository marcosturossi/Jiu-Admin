import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateContractComponent } from './create-contract.component';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { FeePlanService } from '../../../../generated_services/api/feePlan.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { NotificationService } from '../../../../services/notification.service';
import { ShowStudentDTO as ShowStudentDTO, ShowFeePlanDTO as ShowFeePlanDTO } from '../../../../generated_services';

const MOCK_STUDENTS: ShowStudentDTO[] = [
  { id: 's1', firstName: 'João', lastName: 'Silva', userName: 'joao', email: 'j@test.com', cpf: null },
];

const MOCK_FEE_PLANS: ShowFeePlanDTO[] = [{ id: 'fp1', name: 'Mensal', price: 150 } as ShowFeePlanDTO];

describe('CreateContractComponent', () => {
  let fixture: ComponentFixture<CreateContractComponent>;
  let component: CreateContractComponent;
  let contractSvc: jasmine.SpyObj<ContractService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    contractSvc = jasmine.createSpyObj('ContractService', ['apiContractPost']);
    const feePlanSvc = jasmine.createSpyObj('FeePlanService', ['apiFeePlanGet']);
    const studentsSvc = jasmine.createSpyObj('StudentsService', ['apiStudentsGet']);
    ns = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    studentsSvc.apiStudentsGet.and.returnValue(of({ items: MOCK_STUDENTS } as any));
    feePlanSvc.apiFeePlanGet.and.returnValue(of({ items: MOCK_FEE_PLANS } as any));

    await TestBed.configureTestingModule({
      imports: [CreateContractComponent],
      providers: [
        { provide: ContractService, useValue: contractSvc },
        { provide: FeePlanService, useValue: feePlanSvc },
        { provide: StudentsService, useValue: studentsSvc },
        { provide: NotificationService, useValue: ns },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should load student and fee-plan options on init', () => {
    expect((component as any).studentOptions().length).toBe(1);
    expect((component as any).feePlanOptions().length).toBe(1);
    expect((component as any).studentOptions()[0].label).toBe('João Silva');
    expect((component as any).studentOptions()[0].id).toBe('s1');
  });

  it('should mark form touched and not call API when form is invalid', () => {
    (component as any).save();
    expect(contractSvc.apiContractPost).not.toHaveBeenCalled();
    expect((component as any).form.touched).toBeTrue();
  });

  it('should call apiContractPost with YYYY-MM-DD string date (not Date.toISOString)', () => {
    contractSvc.apiContractPost.and.returnValue(of({} as any));

    // Simulate what <input type="date"> stores — a plain string, never a Date object.
    (component as any).form.setValue({
      studentId: 's1',
      feePlanId: 'fp1',
      startDate: '2024-06-15',
      notes: '',
    });

    (component as any).save();

    expect(contractSvc.apiContractPost).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({ startDate: '2024-06-15' }),
    );
  });

  it('should emit contractCreated and show success on save success', () => {
    contractSvc.apiContractPost.and.returnValue(of({} as any));
    const emitSpy = spyOn((component as any).contractCreated, 'emit');

    (component as any).form.setValue({ studentId: 's1', feePlanId: 'fp1', startDate: '2024-06-15', notes: '' });
    (component as any).save();

    expect(ns.showSuccess).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('should show error notification on save failure', () => {
    contractSvc.apiContractPost.and.returnValue(throwError(() => new Error('500')));

    (component as any).form.setValue({ studentId: 's1', feePlanId: 'fp1', startDate: '2024-06-15', notes: '' });
    (component as any).save();

    expect(ns.showError).toHaveBeenCalled();
    expect((component as any).isSaving()).toBeFalse();
  });

  it('should emit closeEvent when close() is called', () => {
    const emitSpy = spyOn((component as any).closeEvent, 'emit');
    (component as any).close();
    expect(emitSpy).toHaveBeenCalled();
  });
});
