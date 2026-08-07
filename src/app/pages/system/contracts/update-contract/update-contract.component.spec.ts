import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UpdateContractComponent } from './update-contract.component';
import { ContractService } from '../../../../generated_services/api/contract.service';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';
import { ShowContractDTO, ContractStatus } from '../../../../generated_services';

const MOCK_CONTRACT: ShowContractDTO = { id: 'c1', personId: 'student-1', status: ContractStatus.Active as any };

describe('UpdateContractComponent', () => {
  let component: UpdateContractComponent;
  let fixture: ComponentFixture<UpdateContractComponent>;
  let contractService: jasmine.SpyObj<ContractService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const contractSpy = jasmine.createSpyObj('ContractService', ['apiContractIdStatusPatch']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    contractSpy.apiContractIdStatusPatch.and.returnValue(of(MOCK_CONTRACT));

    await TestBed.configureTestingModule({
      imports: [UpdateContractComponent],
      providers: [
        { provide: ContractService, useValue: contractSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateContractComponent);
    component = fixture.componentRef.instance;
    fixture.componentRef.setInput('contract', MOCK_CONTRACT);
    contractService = TestBed.inject(ContractService) as jasmine.SpyObj<ContractService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should save without confirming when the new status is not Cancelled', async () => {
    (component as any).form.patchValue({ status: ContractStatus.Suspended });
    await (component as any).save();
    expect(confirmService.confirm).not.toHaveBeenCalled();
    expect(contractService.apiContractIdStatusPatch).toHaveBeenCalledWith('c1', { status: ContractStatus.Suspended });
  });

  it('should confirm before saving when the new status is Cancelled', async () => {
    confirmService.confirm.and.returnValue(Promise.resolve(true));
    (component as any).form.patchValue({ status: ContractStatus.Cancelled });
    await (component as any).save();
    expect(confirmService.confirm).toHaveBeenCalled();
    expect(contractService.apiContractIdStatusPatch).toHaveBeenCalledWith('c1', { status: ContractStatus.Cancelled });
  });

  it('should not save when cancelling is not confirmed', async () => {
    confirmService.confirm.and.returnValue(Promise.resolve(false));
    (component as any).form.patchValue({ status: ContractStatus.Cancelled });
    await (component as any).save();
    expect(contractService.apiContractIdStatusPatch).not.toHaveBeenCalled();
  });

  it('should not re-confirm when the contract is already Cancelled', async () => {
    fixture.componentRef.setInput('contract', { ...MOCK_CONTRACT, status: ContractStatus.Cancelled as any });
    fixture.detectChanges();
    (component as any).form.patchValue({ status: ContractStatus.Cancelled });
    await (component as any).save();
    expect(confirmService.confirm).not.toHaveBeenCalled();
    expect(contractService.apiContractIdStatusPatch).toHaveBeenCalled();
  });

  it('should show error notification on failure', async () => {
    contractService.apiContractIdStatusPatch.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ status: ContractStatus.Suspended });
    await (component as any).save();
    expect(ns.showError).toHaveBeenCalled();
  });
});
