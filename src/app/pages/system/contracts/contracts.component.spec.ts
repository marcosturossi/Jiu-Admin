import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ContractsComponent } from './contracts.component';

registerLocaleData(localePt, 'pt-BR');
import { ContractService } from '../../../generated_services/api/contract.service';
import { StudentsService } from '../../../generated_services/api/students.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { ShowContractDTO as ShowContractDTO, ContractStatus as ContractStatus } from '../../../generated_services';
import { ShowStudentDTO } from '../../../generated_services/model/showStudentDTO';

const MOCK_CONTRACT: ShowContractDTO = { id: 'c1', personId: 'student-1', feePlanName: 'Plano Mensal', monthlyAmount: 150, status: ContractStatus.Active as any };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_CONTRACT, id: `ct${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});
const MOCK_STUDENTS: ShowStudentDTO[] = [{ id: 'student-1', userName: 'joao', email: 'joao@test.com', cpf: null, firstName: 'João', lastName: 'Silva' }];
const MOCK_STUDENTS_RESPONSE = { items: MOCK_STUDENTS, totalCount: MOCK_STUDENTS.length, totalPages: 1 };

describe('ContractsComponent', () => {
  let component: ContractsComponent;
  let fixture: ComponentFixture<ContractsComponent>;
  let contractService: jasmine.SpyObj<ContractService>;
  let studentsService: jasmine.SpyObj<StudentsService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const contractSpy = jasmine.createSpyObj('ContractService', ['apiContractGet', 'apiContractIdDelete', 'apiContractIdSendForConfirmationPost']);
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    contractSpy.apiContractGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[7] ?? 1), Number(args[8] ?? 10))));
    studentsSpy.apiStudentsGet.and.returnValue(of(MOCK_STUDENTS_RESPONSE));

    await TestBed.configureTestingModule({
      imports: [ContractsComponent],
      providers: [
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: ContractService, useValue: contractSpy },
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractsComponent);
    component = fixture.componentInstance;
    contractService = TestBed.inject(ContractService) as jasmine.SpyObj<ContractService>;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    contractService.apiContractGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((contractService.apiContractGet as any)).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    contractService.apiContractGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((contractService.apiContractGet as any)).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(20);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  describe('getStatusBadge', () => {
    it('should return correct labels for each status', () => {
      expect((component as any).getStatusBadge(ContractStatus.Active).label).toBe('Ativo');
      expect((component as any).getStatusBadge(ContractStatus.Inactive).label).toBe('Inativo');
      expect((component as any).getStatusBadge(ContractStatus.Suspended).label).toBe('Suspenso');
      expect((component as any).getStatusBadge(ContractStatus.Terminated).label).toBe('Encerrado');
      expect((component as any).getStatusBadge(ContractStatus.Cancelled).label).toBe('Cancelado');
      expect((component as any).getStatusBadge(ContractStatus.Expired).label).toBe('Expirado');
      expect((component as any).getStatusBadge(undefined).label).toBe('—');
    });
  });

  describe('getStudentName', () => {
    it('should return student name from map when id is present', () => {
      expect((component as any).getStudentName('student-1')).toBe('João Silva');
    });

    it('should return "—" when id is undefined', () => {
      expect((component as any).getStudentName(undefined)).toBe('—');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      contractService.apiContractIdDelete.and.returnValue(of(null as any));
      contractService.apiContractGet.calls.reset();
    });

    it('should delete contract and reload on confirmation', async () => {
      await (component as any).delete(MOCK_CONTRACT);
      expect(contractService.apiContractIdDelete).toHaveBeenCalledWith(MOCK_CONTRACT.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(contractService.apiContractGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).delete(MOCK_CONTRACT);
      expect(contractService.apiContractIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', async () => {
      contractService.apiContractIdDelete.and.returnValue(throwError(() => new Error()));
      await (component as any).delete(MOCK_CONTRACT);
      expect(ns.showError).toHaveBeenCalled();
    });
  });

  describe('sendForConfirmation', () => {
    let clipboardSpy: jasmine.Spy;

    beforeEach(() => {
      clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    });

    it('should copy the confirmation link to the clipboard on success', async () => {
      contractService.apiContractIdSendForConfirmationPost.and.returnValue(
        of({ contractVersionId: 'v1', sentAt: '2026-08-01T00:00:00Z', confirmationUrl: 'https://x/api/public/contracts/abc' }) as any);

      (component as any).sendForConfirmation(MOCK_CONTRACT);
      await fixture.whenStable();

      expect(clipboardSpy).toHaveBeenCalledWith('https://x/api/public/contracts/abc');
      expect(ns.showSuccess).toHaveBeenCalled();
    });

    it('should show error notification on failure', () => {
      contractService.apiContractIdSendForConfirmationPost.and.returnValue(throwError(() => new Error()));
      (component as any).sendForConfirmation(MOCK_CONTRACT);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
