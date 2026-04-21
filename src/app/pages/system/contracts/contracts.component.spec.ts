import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { ContractsComponent } from './contracts.component';

registerLocaleData(localePt, 'pt-BR');
import { ContractService } from '../../../generated_services/api/contract.service';
import { StudentsService } from '../../../generated_services/api/students.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationContractDTO, ShowContractDTO, ContractStatus } from '../../../generated_services';
import { ShowStudentDTO } from '../../../generated_services/model/showStudentDTO';

const MOCK_CONTRACT: ShowContractDTO = { id: 'c1', studentId: 'student-1', feePlanName: 'Plano Mensal', monthlyAmount: 150, status: ContractStatus.NUMBER_0 };
const MOCK_PAGINATION: PaginationContractDTO = { items: [MOCK_CONTRACT], totalCount: 1, pageNumber: 1, pageSize: 10, totalPages: 1 };
const MOCK_STUDENTS: ShowStudentDTO[] = [{ id: 'student-1', userName: 'joao', email: 'joao@test.com', firstName: 'João', lastName: 'Silva' }];

describe('ContractsComponent', () => {
  let component: ContractsComponent;
  let fixture: ComponentFixture<ContractsComponent>;
  let contractService: jasmine.SpyObj<ContractService>;
  let studentsService: jasmine.SpyObj<StudentsService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const contractSpy = jasmine.createSpyObj('ContractService', ['apiContractGet', 'apiContractIdDelete']);
    const studentsSpy = jasmine.createSpyObj('StudentsService', ['apiStudentsActiveGet']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    contractSpy.apiContractGet.and.returnValue(of(MOCK_PAGINATION));
    studentsSpy.apiStudentsActiveGet.and.returnValue(of(MOCK_STUDENTS));

    await TestBed.configureTestingModule({
      imports: [ContractsComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: ContractService, useValue: contractSpy },
        { provide: StudentsService, useValue: studentsSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractsComponent);
    component = fixture.componentInstance;
    contractService = TestBed.inject(ContractService) as jasmine.SpyObj<ContractService>;
    studentsService = TestBed.inject(StudentsService) as jasmine.SpyObj<StudentsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Contratos'); });

  it('should load contracts on init', () => {
    expect(contractService.apiContractGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual(MOCK_PAGINATION);
  });

  it('should build student map on init', () => {
    expect(studentsService.apiStudentsActiveGet).toHaveBeenCalled();
    expect((component as any).studentMap().get('student-1')).toBe('João Silva');
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    contractService.apiContractGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected contract', () => {
    (component as any).openEdit(MOCK_CONTRACT);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_CONTRACT);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    contractService.apiContractGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(contractService.apiContractGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    contractService.apiContractGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(contractService.apiContractGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onFilterChange', () => {
    (component as any).currentPage.set(3);
    contractService.apiContractGet.calls.reset();
    (component as any).onFilterChange();
    expect((component as any).currentPage()).toBe(1);
    expect(contractService.apiContractGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    contractService.apiContractGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(contractService.apiContractGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(4);
    contractService.apiContractGet.calls.reset();
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect(contractService.apiContractGet).toHaveBeenCalled();
  });

  describe('getStatusLabel', () => {
    it('should return correct labels for each status', () => {
      expect((component as any).getStatusLabel(ContractStatus.NUMBER_0)).toBe('Ativo');
      expect((component as any).getStatusLabel(ContractStatus.NUMBER_1)).toBe('Suspenso');
      expect((component as any).getStatusLabel(ContractStatus.NUMBER_2)).toBe('Cancelado');
      expect((component as any).getStatusLabel(ContractStatus.NUMBER_3)).toBe('Concluído');
      expect((component as any).getStatusLabel(undefined)).toBe('—');
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
      spyOn(window, 'confirm').and.returnValue(true);
      contractService.apiContractIdDelete.and.returnValue(of(null as any));
      contractService.apiContractGet.calls.reset();
    });

    it('should delete contract and reload on confirmation', () => {
      (component as any).delete(MOCK_CONTRACT);
      expect(contractService.apiContractIdDelete).toHaveBeenCalledWith(MOCK_CONTRACT.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(contractService.apiContractGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_CONTRACT);
      expect(contractService.apiContractIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      contractService.apiContractIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_CONTRACT);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
