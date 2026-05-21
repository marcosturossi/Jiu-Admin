import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GraduationsComponent } from './graduations.component';
import { GraduationService } from '../../../generated_services/api/graduation.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { CarlonGracieBackendProgressionApplicationDTOsShowGraduationDTO as ShowGraduationDTO } from '../../../generated_services';

const MOCK_GRADUATION: ShowGraduationDTO = { id: 'g1', studentId: 'student-1', beltId: 'belt-1', graduationDate: '2024-01-01' };
const MOCK_ODATA_RESPONSE = { '@odata.count': 1, value: [MOCK_GRADUATION] };
const MOCK_PAGE = { items: [MOCK_GRADUATION], totalCount: 1, totalPages: 1 };

describe('GraduationsComponent', () => {
  let component: GraduationsComponent;
  let fixture: ComponentFixture<GraduationsComponent>;
  let graduationService: jasmine.SpyObj<GraduationService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const graduationSpy = jasmine.createSpyObj('GraduationService', ['apiGraduationGet', 'apiGraduationIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    graduationSpy.apiGraduationGet.and.returnValue(of(MOCK_ODATA_RESPONSE));

    await TestBed.configureTestingModule({
      imports: [GraduationsComponent],
      providers: [
        { provide: GraduationService, useValue: graduationSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GraduationsComponent);
    component = fixture.componentInstance;
    graduationService = TestBed.inject(GraduationService) as jasmine.SpyObj<GraduationService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Graduações'); });

  it('should load graduations on init', () => {
    expect(graduationService.apiGraduationGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual(MOCK_PAGE);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    graduationService.apiGraduationGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected graduation', () => {
    (component as any).openEdit(MOCK_GRADUATION);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_GRADUATION);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    graduationService.apiGraduationGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(graduationService.apiGraduationGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    graduationService.apiGraduationGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(graduationService.apiGraduationGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    graduationService.apiGraduationGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(graduationService.apiGraduationGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(3);
    graduationService.apiGraduationGet.calls.reset();
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect(graduationService.apiGraduationGet).toHaveBeenCalled();
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      graduationService.apiGraduationIdDelete.and.returnValue(of(null as any));
      graduationService.apiGraduationGet.calls.reset();
    });

    it('should delete graduation and reload on confirmation', () => {
      (component as any).delete(MOCK_GRADUATION);
      expect(graduationService.apiGraduationIdDelete).toHaveBeenCalledWith(MOCK_GRADUATION.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(graduationService.apiGraduationGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_GRADUATION);
      expect(graduationService.apiGraduationIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      graduationService.apiGraduationIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_GRADUATION);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
