import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GraduationRequirementsComponent } from './graduation-requirements.component';
import { GraduationRequirementsService, ShowGraduationRequirementDTO as ShowGraduationRequirementsDTO } from '../../../generated_services';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';

const MOCK_REQUIREMENT: ShowGraduationRequirementsDTO = { id: 'r1', beltId: 'belt-1', description: 'Mínimo 100 aulas', minimumClasses: 100 };
const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_REQUIREMENT, id: `r${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});

describe('GraduationRequirementsComponent', () => {
  let component: GraduationRequirementsComponent;
  let fixture: ComponentFixture<GraduationRequirementsComponent>;
  let requirementsService: jasmine.SpyObj<GraduationRequirementsService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const reqSpy = jasmine.createSpyObj('GraduationRequirementsService', ['apiGraduationRequirementsGet', 'apiGraduationRequirementsIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    reqSpy.apiGraduationRequirementsGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[4] ?? 1), Number(args[5] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [GraduationRequirementsComponent],
      providers: [
        { provide: GraduationRequirementsService, useValue: reqSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GraduationRequirementsComponent);
    component = fixture.componentInstance;
    requirementsService = TestBed.inject(GraduationRequirementsService) as jasmine.SpyObj<GraduationRequirementsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Requisitos de Graduação'); });

  it('should load requirements on init', () => {
    expect(requirementsService.apiGraduationRequirementsGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual(buildResponse());
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    requirementsService.apiGraduationRequirementsGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected requirement', () => {
    (component as any).openEdit(MOCK_REQUIREMENT);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_REQUIREMENT);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    requirementsService.apiGraduationRequirementsGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(requirementsService.apiGraduationRequirementsGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    requirementsService.apiGraduationRequirementsGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(requirementsService.apiGraduationRequirementsGet).toHaveBeenCalled();
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      requirementsService.apiGraduationRequirementsIdDelete.and.returnValue(of(null as any));
      requirementsService.apiGraduationRequirementsGet.calls.reset();
    });

    it('should delete requirement and reload on confirmation', () => {
      (component as any).delete(MOCK_REQUIREMENT);
      expect(requirementsService.apiGraduationRequirementsIdDelete).toHaveBeenCalledWith(MOCK_REQUIREMENT.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(requirementsService.apiGraduationRequirementsGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_REQUIREMENT);
      expect(requirementsService.apiGraduationRequirementsIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      requirementsService.apiGraduationRequirementsIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_REQUIREMENT);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
