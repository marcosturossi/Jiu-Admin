import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GraduationsComponent } from './graduations.component';
import { GraduationService } from '../../../generated_services/api/graduation.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { ShowGraduationDTO as ShowGraduationDTO } from '../../../generated_services';

const MOCK_GRADUATION: ShowGraduationDTO = { id: 'g1', studentId: 'student-1', beltId: 'belt-1', graduationDate: '2024-01-01' };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_GRADUATION, id: `g${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});

describe('GraduationsComponent', () => {
  let component: GraduationsComponent;
  let fixture: ComponentFixture<GraduationsComponent>;
  let graduationService: jasmine.SpyObj<GraduationService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const graduationSpy = jasmine.createSpyObj('GraduationService', ['apiGraduationGet', 'apiGraduationIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));
    graduationSpy.apiGraduationGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[4] ?? 1), Number(args[5] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [GraduationsComponent],
      providers: [
        { provide: GraduationService, useValue: graduationSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GraduationsComponent);
    component = fixture.componentInstance;
    graduationService = TestBed.inject(GraduationService) as jasmine.SpyObj<GraduationService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    graduationService.apiGraduationGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((graduationService.apiGraduationGet as any)).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    graduationService.apiGraduationGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect((graduationService.apiGraduationGet as any)).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(20);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  describe('delete', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      graduationService.apiGraduationIdDelete.and.returnValue(of(null as any));
      graduationService.apiGraduationGet.calls.reset();
    });

    it('should delete graduation and reload on confirmation', async () => {
      await (component as any).delete(MOCK_GRADUATION);
      expect(graduationService.apiGraduationIdDelete).toHaveBeenCalledWith(MOCK_GRADUATION.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(graduationService.apiGraduationGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).delete(MOCK_GRADUATION);
      expect(graduationService.apiGraduationIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', async () => {
      graduationService.apiGraduationIdDelete.and.returnValue(throwError(() => new Error()));
      await (component as any).delete(MOCK_GRADUATION);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
