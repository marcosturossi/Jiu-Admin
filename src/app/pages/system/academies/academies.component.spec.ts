import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AcademiesComponent } from './academies.component';
import { AcademyService } from '../../../generated_services/api/academy.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmService } from '../../../services/confirm.service';
import { ShowAcademyDto } from '../../../generated_services/model/showAcademyDto';

const MOCK_ACADEMY_1: ShowAcademyDto = {
  id: 'abc-1',
  name: 'Carlson Gracie SP',
  slug: 'carlson-sp',
  isActive: true,
  createdAt: '2024-01-15',
};

const MOCK_ACADEMY_2: ShowAcademyDto = {
  id: 'abc-2',
  name: 'Carlson Gracie RJ',
  slug: 'carlson-rj',
  isActive: false,
  createdAt: '2024-02-10',
};

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_ACADEMY_1, id: `ac${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => ({
  items: MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize),
  totalCount: MOCK_ITEMS.length,
  totalPages: Math.ceil(MOCK_ITEMS.length / pageSize),
});

describe('AcademiesComponent', () => {
  let component: AcademiesComponent;
  let fixture: ComponentFixture<AcademiesComponent>;
  let academyService: jasmine.SpyObj<AcademyService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;
  let confirmService: jasmine.SpyObj<ConfirmService>;

  beforeEach(async () => {
    const academySpy = jasmine.createSpyObj('AcademyService', [
      'apiAdminAcademiesGet',
      'apiAdminAcademiesIdDelete',
    ]);
    const notifySpy = jasmine.createSpyObj('NotificationService', [
      'showSuccess',
      'showError',
    ]);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    const confirmSpy = jasmine.createSpyObj('ConfirmService', ['confirm']);
    confirmSpy.confirm.and.returnValue(Promise.resolve(true));

    academySpy.apiAdminAcademiesGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[4] ?? 1), Number(args[5] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [AcademiesComponent],
      providers: [
        { provide: AcademyService, useValue: academySpy },
        { provide: NotificationService, useValue: notifySpy },
        { provide: SubnavService, useValue: subnavSpy },
        { provide: ConfirmService, useValue: confirmSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcademiesComponent);
    component = fixture.componentInstance;
    academyService = TestBed.inject(AcademyService) as jasmine.SpyObj<AcademyService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    confirmService = TestBed.inject(ConfirmService) as jasmine.SpyObj<ConfirmService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    academyService.apiAdminAcademiesGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect((academyService.apiAdminAcademiesGet as any)).toHaveBeenCalled();
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    academyService.apiAdminAcademiesGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(25);
    expect((component as any).pageSize()).toBe(25);
    expect((component as any).currentPage()).toBe(1);
    expect((academyService.apiAdminAcademiesGet as any)).toHaveBeenCalled();
    expect((component as any).items().items.length).toBe(25);
    expect((component as any).items().items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  it('should reset to page 1 and reload on onSearch', () => {
    (component as any).currentPage.set(4);
    (component as any).searchName.set('test');
    academyService.apiAdminAcademiesGet.calls.reset();
    (component as any).onSearch();
    expect((component as any).currentPage()).toBe(1);
    expect((academyService.apiAdminAcademiesGet as any)).toHaveBeenCalled();
  });

  describe('delete', () => {
    beforeEach(() => {
      confirmService.confirm.and.returnValue(Promise.resolve(true));
      academyService.apiAdminAcademiesIdDelete.and.returnValue(of(null as any));
      academyService.apiAdminAcademiesGet.calls.reset();
    });

    it('should call delete service and reload on confirmation', async () => {
      await (component as any).delete(MOCK_ACADEMY_1);
      expect(academyService.apiAdminAcademiesIdDelete).toHaveBeenCalledWith(MOCK_ACADEMY_1.id!);
      expect(notificationService.showSuccess).toHaveBeenCalled();
      expect(academyService.apiAdminAcademiesGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', async () => {
      confirmService.confirm.and.returnValue(Promise.resolve(false));
      await (component as any).delete(MOCK_ACADEMY_1);
      expect(academyService.apiAdminAcademiesIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification when delete fails', async () => {
      academyService.apiAdminAcademiesIdDelete.and.returnValue(throwError(() => new Error('fail')));
      await (component as any).delete(MOCK_ACADEMY_1);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Erro ao Excluir',
        'Não foi possível excluir a academia. Tente novamente.',
      );
    });
  });

});
