import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MedicalClearancesComponent } from './medical-clearances.component';
import { MedicalClearanceService } from '../../../generated_services/api/medicalClearance.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ShowMedicalClearanceDTO } from '../../../generated_services/model/showMedicalClearanceDTO';

const MOCK_CLEARANCE: ShowMedicalClearanceDTO = { id: 'mc1', studentId: 'student-1', expiresAt: '2025-01-01', isExpired: false, isExpiringSoon: false };
const MOCK_ODATA_RESPONSE = { '@odata.count': 1, value: [MOCK_CLEARANCE] };
const MOCK_PAGE = { items: [MOCK_CLEARANCE], totalCount: 1, totalPages: 1 };

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
    clearanceSpy.apiMedicalClearanceGet.and.returnValue(of(MOCK_ODATA_RESPONSE));

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

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Atestados Médicos'); });

  it('should load clearances on init', () => {
    expect(medicalClearanceService.apiMedicalClearanceGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual(MOCK_PAGE);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    medicalClearanceService.apiMedicalClearanceGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    medicalClearanceService.apiMedicalClearanceGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(medicalClearanceService.apiMedicalClearanceGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    medicalClearanceService.apiMedicalClearanceGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(medicalClearanceService.apiMedicalClearanceGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(3);
    medicalClearanceService.apiMedicalClearanceGet.calls.reset();
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect(medicalClearanceService.apiMedicalClearanceGet).toHaveBeenCalled();
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
