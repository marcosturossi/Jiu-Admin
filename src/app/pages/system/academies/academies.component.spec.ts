import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AcademiesComponent } from './academies.component';
import { AcademyService } from '../../../generated_services/api/academy.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ODataPage } from '../../../utils/odata.utils';
import { ShowAcademyDTO } from '../../../generated_services/model/showAcademyDTO';

const MOCK_ACADEMY_1: ShowAcademyDTO = {
  id: 'abc-1',
  name: 'Carlson Gracie SP',
  slug: 'carlson-sp',
  isActive: true,
  createdAt: '2024-01-15',
};

const MOCK_ACADEMY_2: ShowAcademyDTO = {
  id: 'abc-2',
  name: 'Carlson Gracie RJ',
  slug: 'carlson-rj',
  isActive: false,
  createdAt: '2024-02-10',
};

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_ACADEMY_1, id: `ac${i + 1}` }));
const MOCK_ODATA_RESPONSE = { value: MOCK_ITEMS };
const MOCK_PAGE: any = {
  items: MOCK_ITEMS.slice(0, 10),
  totalCount: 25,
  totalPages: 3,
  currentPage: 1,
};

describe('AcademiesComponent', () => {
  let component: AcademiesComponent;
  let fixture: ComponentFixture<AcademiesComponent>;
  let academyService: jasmine.SpyObj<AcademyService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

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

    academySpy.apiAdminAcademiesGet.and.returnValue(of(MOCK_ODATA_RESPONSE));

    await TestBed.configureTestingModule({
      imports: [AcademiesComponent],
      providers: [
        { provide: AcademyService, useValue: academySpy },
        { provide: NotificationService, useValue: notifySpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AcademiesComponent);
    component = fixture.componentInstance;
    academyService = TestBed.inject(AcademyService) as jasmine.SpyObj<AcademyService>;
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should update page and reload on onPageChange', () => {
    academyService.apiAdminAcademiesGet.calls.reset();
    (component as any).onPageChange(3);
    expect((component as any).currentPage()).toBe(3);
    const page = (component as any).items();
    expect(page.currentPage).toBe(3);
    expect(page.items[0].id).toBe(MOCK_ITEMS[20].id);
    expect(academyService.apiAdminAcademiesGet).not.toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    academyService.apiAdminAcademiesGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(25);
    expect((component as any).pageSize()).toBe(25);
    expect((component as any).currentPage()).toBe(1);
    const page = (component as any).items();
    expect(page.currentPage).toBe(1);
    expect(page.items.length).toBe(25);
    expect(page.items[0].id).toBe(MOCK_ITEMS[0].id);
    expect(academyService.apiAdminAcademiesGet).not.toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onSearch', () => {
    (component as any).currentPage.set(4);
    (component as any).searchName.set('test');
    academyService.apiAdminAcademiesGet.calls.reset();
    (component as any).onSearch();
    expect((component as any).currentPage()).toBe(1);
    expect(academyService.apiAdminAcademiesGet).toHaveBeenCalled();
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      academyService.apiAdminAcademiesIdDelete.and.returnValue(of(null as any));
      academyService.apiAdminAcademiesGet.calls.reset();
    });

    it('should call delete service and reload on confirmation', () => {
      (component as any).delete(MOCK_ACADEMY_1);
      expect(academyService.apiAdminAcademiesIdDelete).toHaveBeenCalledWith(MOCK_ACADEMY_1.id!);
      expect(notificationService.showSuccess).toHaveBeenCalled();
      expect(academyService.apiAdminAcademiesGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_ACADEMY_1);
      expect(academyService.apiAdminAcademiesIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification when delete fails', () => {
      academyService.apiAdminAcademiesIdDelete.and.returnValue(throwError(() => new Error('fail')));
      (component as any).delete(MOCK_ACADEMY_1);
      expect(notificationService.showError).toHaveBeenCalledWith(
        'Erro ao Excluir',
        'Não foi possível excluir a academia. Tente novamente.',
      );
    });
  });

});
