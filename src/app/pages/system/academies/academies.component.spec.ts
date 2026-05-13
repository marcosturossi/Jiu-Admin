import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AcademiesComponent } from './academies.component';
import { AcademyService } from '../../../generated_services/api/academy.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { PaginationAcademyDTO } from '../../../generated_services/model/paginationAcademyDTO';
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

const MOCK_PAGINATION: PaginationAcademyDTO = {
  items: [MOCK_ACADEMY_1, MOCK_ACADEMY_2],
  totalCount: 2,
  pageNumber: 1,
  pageSize: 10,
  totalPages: 1,
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

    academySpy.apiAdminAcademiesGet.and.returnValue(of(MOCK_PAGINATION));

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set page title on init', () => {
    expect(subnavService.setTitle).toHaveBeenCalledWith('Academias');
  });

  it('should load academies on init', () => {
    expect(academyService.apiAdminAcademiesGet).toHaveBeenCalled();
    const items = (component as any).items() as PaginationAcademyDTO;
    expect(items).toEqual(MOCK_PAGINATION);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification when load fails', () => {
    academyService.apiAdminAcademiesGet.and.returnValue(throwError(() => new Error('fail')));
    (component as any).load();
    expect(notificationService.showError).toHaveBeenCalledWith(
      'Erro de Carregamento',
      'Não foi possível carregar a lista de academias.',
    );
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected academy', () => {
    (component as any).openEdit(MOCK_ACADEMY_1);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_ACADEMY_1);
  });

  it('should reload and close create dialog on onCreated', () => {
    (component as any).openedCreate.set(true);
    academyService.apiAdminAcademiesGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(academyService.apiAdminAcademiesGet).toHaveBeenCalled();
  });

  it('should reload and close update dialog on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    academyService.apiAdminAcademiesGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(academyService.apiAdminAcademiesGet).toHaveBeenCalled();
  });

  it('should update current page and reload on onPageChange', () => {
    academyService.apiAdminAcademiesGet.calls.reset();
    (component as any).onPageChange(3);
    expect((component as any).currentPage()).toBe(3);
    expect(academyService.apiAdminAcademiesGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(5);
    academyService.apiAdminAcademiesGet.calls.reset();
    (component as any).onPageSizeChange(25);
    expect((component as any).pageSize()).toBe(25);
    expect((component as any).currentPage()).toBe(1);
    expect(academyService.apiAdminAcademiesGet).toHaveBeenCalled();
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
