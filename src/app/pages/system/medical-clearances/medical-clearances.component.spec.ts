import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MedicalClearancesComponent } from './medical-clearances.component';
import { MedicalClearanceService } from '../../../generated_services/api/medicalClearance.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ShowMedicalClearanceDTO } from '../../../generated_services/model/showMedicalClearanceDTO';

const MOCK_CLEARANCE: ShowMedicalClearanceDTO = { id: 'mc1', studentId: 'student-1', expiresAt: '2025-01-01', isExpired: false, isExpiringSoon: false };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_CLEARANCE, id: `mc${i + 1}` }));
const buildResponse = (top = 20, skip = 0) => ({
  '@odata.count': MOCK_ITEMS.length,
  value: MOCK_ITEMS.slice(skip, skip + top),
});

describe('MedicalClearancesComponent', () => {
  let component: MedicalClearancesComponent;
  let fixture: ComponentFixture<MedicalClearancesComponent>;
  let medicalClearanceService: jasmine.SpyObj<MedicalClearanceService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const clearanceSpy = jasmine.createSpyObj('MedicalClearanceService', [
      'apiMedicalClearanceGet',
      'apiMedicalClearanceIdDelete',
      'apiMedicalClearanceIdAttachmentGet',
    ]);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    clearanceSpy.apiMedicalClearanceGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[2] ?? 20), Number(args[3] ?? 0))));

    await TestBed.configureTestingModule({
      imports: [MedicalClearancesComponent],
      providers: [
        { provide: MedicalClearanceService, useValue: clearanceSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MedicalClearancesComponent);
    component = fixture.componentInstance;
    medicalClearanceService = TestBed.inject(MedicalClearanceService) as jasmine.SpyObj<MedicalClearanceService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    medicalClearanceService.apiMedicalClearanceGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((medicalClearanceService.apiMedicalClearanceGet as any)).toHaveBeenCalledWith(undefined, undefined, '10', '10', 'true', undefined, 'response');
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    medicalClearanceService.apiMedicalClearanceGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((medicalClearanceService.apiMedicalClearanceGet as any)).toHaveBeenCalledWith(undefined, undefined, '20', '0', 'true', undefined, 'response');
    expect((component as any).items().items.length).toBe(20);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  describe('getStatusSeverity', () => {
    it('should return danger for expired clearance', () => {
      const expired: ShowMedicalClearanceDTO = { id: 'x', studentId: 'y', expiresAt: '2020-01-01', isExpired: true, isExpiringSoon: false };
      expect((component as any).getStatusSeverity(expired)).toBe('danger');
    });

    it('should return warn for expiring-soon clearance', () => {
      const expiringSoon: ShowMedicalClearanceDTO = { id: 'x', studentId: 'y', expiresAt: '2024-04-01', isExpired: false, isExpiringSoon: true };
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
      spyOn(window, 'confirm').and.returnValue(true);
      medicalClearanceService.apiMedicalClearanceIdDelete.and.returnValue(of(null as any));
      medicalClearanceService.apiMedicalClearanceGet.calls.reset();
    });

    it('should delete clearance and reload on confirmation', () => {
      (component as any).deleteMedicalClearance(MOCK_CLEARANCE);
      expect(medicalClearanceService.apiMedicalClearanceIdDelete).toHaveBeenCalledWith(MOCK_CLEARANCE.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(medicalClearanceService.apiMedicalClearanceGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).deleteMedicalClearance(MOCK_CLEARANCE);
      expect(medicalClearanceService.apiMedicalClearanceIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      medicalClearanceService.apiMedicalClearanceIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).deleteMedicalClearance(MOCK_CLEARANCE);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
