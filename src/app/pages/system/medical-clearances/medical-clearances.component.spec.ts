import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { MedicalClearancesComponent } from './medical-clearances.component';
import { MedicalClearanceService } from '../../../generated_services/api/medicalClearance.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { ShowMedicalClearanceDto } from '../../../generated_services/model/showMedicalClearanceDto';

const MOCK_CLEARANCE: ShowMedicalClearanceDto = { id: 'mc1', studentId: 'student-1', expiresAt: '2025-01-01', isExpired: false, isExpiringSoon: false };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_CLEARANCE, id: `mc${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});

describe('MedicalClearancesComponent', () => {
  let component: MedicalClearancesComponent;
  let fixture: ComponentFixture<MedicalClearancesComponent>;
  let medicalClearanceService: jasmine.SpyObj<MedicalClearanceService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const clearanceSpy = jasmine.createSpyObj('MedicalClearanceService', [
      'apiMedicalClearanceGet',
      'apiMedicalClearanceIdDelete',
      'apiMedicalClearanceIdAttachmentGet',
    ]);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    clearanceSpy.apiMedicalClearanceGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[8] ?? 1), Number(args[9] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [MedicalClearancesComponent],
      providers: [
        provideRouter([]),
        { provide: MedicalClearanceService, useValue: clearanceSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalClearancesComponent);
    component = fixture.componentInstance;
    medicalClearanceService = TestBed.inject(MedicalClearanceService) as jasmine.SpyObj<MedicalClearanceService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    medicalClearanceService.apiMedicalClearanceGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((medicalClearanceService.apiMedicalClearanceGet as any)).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    medicalClearanceService.apiMedicalClearanceGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((medicalClearanceService.apiMedicalClearanceGet as any)).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(20);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  describe('getStatusSeverity', () => {
    it('should return danger for expired clearance', () => {
      const expired: ShowMedicalClearanceDto = { id: 'x', studentId: 'y', expiresAt: '2020-01-01', isExpired: true, isExpiringSoon: false };
      expect((component as any).getStatusSeverity(expired)).toBe('danger');
    });

    it('should return warn for expiring-soon clearance', () => {
      const expiringSoon: ShowMedicalClearanceDto = { id: 'x', studentId: 'y', expiresAt: '2024-04-01', isExpired: false, isExpiringSoon: true };
      expect((component as any).getStatusSeverity(expiringSoon)).toBe('warn');
    });

    it('should return success for valid clearance', () => {
      expect((component as any).getStatusSeverity(MOCK_CLEARANCE)).toBe('success');
    });
  });

  describe('closeAttachmentViewer', () => {
    it('should hide attachment dialog and clear blob', () => {
      (component as any).attachmentDialogVisible.set(true);
      (component as any).attachmentBlob.set(new Blob());
      (component as any).closeAttachmentViewer();
      expect((component as any).attachmentDialogVisible()).toBeFalse();
      expect((component as any).attachmentBlob()).toBeUndefined();
    });
  });

  describe('deleteMedicalClearance', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      medicalClearanceService.apiMedicalClearanceIdDelete.and.returnValue(of(null as any));
      medicalClearanceService.apiMedicalClearanceGet.calls.reset();
    });

    it('should delete clearance and reload on confirmation', async () => {
      await (component as any).deleteMedicalClearance(MOCK_CLEARANCE);
      expect(medicalClearanceService.apiMedicalClearanceIdDelete).toHaveBeenCalledWith(MOCK_CLEARANCE.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(medicalClearanceService.apiMedicalClearanceGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).deleteMedicalClearance(MOCK_CLEARANCE);
      expect(medicalClearanceService.apiMedicalClearanceIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', async () => {
      medicalClearanceService.apiMedicalClearanceIdDelete.and.returnValue(throwError(() => new Error()));
      await (component as any).deleteMedicalClearance(MOCK_CLEARANCE);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
