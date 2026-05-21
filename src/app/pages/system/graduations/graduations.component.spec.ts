import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GraduationsComponent } from './graduations.component';
import { GraduationService } from '../../../generated_services/api/graduation.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { CarlonGracieBackendProgressionApplicationDTOsShowGraduationDTO as ShowGraduationDTO } from '../../../generated_services';

const MOCK_GRADUATION: ShowGraduationDTO = { id: 'g1', studentId: 'student-1', beltId: 'belt-1', graduationDate: '2024-01-01' };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_GRADUATION, id: `g${i + 1}` }));
const MOCK_ODATA_RESPONSE = { value: MOCK_ITEMS };
const MOCK_PAGE = { items: MOCK_ITEMS.slice(0, 10), totalCount: 25, totalPages: 3, currentPage: 1 };

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

  it('should update page and reload on onPageChange', () => {
    graduationService.apiGraduationGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    const page = (component as any).items();
    expect(page.currentPage).toBe(2);
    expect(page.items[0].id).toBe(MOCK_ITEMS[10].id);
    expect(graduationService.apiGraduationGet).not.toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    graduationService.apiGraduationGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    const page = (component as any).items();
    expect(page.currentPage).toBe(1);
    expect(page.items.length).toBe(20);
    expect(page.items[0].id).toBe(MOCK_ITEMS[0].id);
    expect(graduationService.apiGraduationGet).not.toHaveBeenCalled();
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
