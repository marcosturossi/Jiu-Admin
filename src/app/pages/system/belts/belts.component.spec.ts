import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BeltsComponent } from './belts.component';
import { BeltService } from '../../../generated_services/api/belt.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ShowBeltDTO } from '../../../generated_services/model/showBeltDTO';

const MOCK_BELT: ShowBeltDTO = { id: 'b1', color: 'Branca', orderIndex: 1, isForKids: false };
const MOCK_ODATA_RESPONSE = { '@odata.count': 1, value: [MOCK_BELT] };
const MOCK_PAGE = { items: [MOCK_BELT], totalCount: 1, totalPages: 1 };

describe('BeltsComponent', () => {
  let component: BeltsComponent;
  let fixture: ComponentFixture<BeltsComponent>;
  let beltService: jasmine.SpyObj<BeltService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const beltSpy = jasmine.createSpyObj('BeltService', ['apiBeltGet', 'apiBeltIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    beltSpy.apiBeltGet.and.returnValue(of(MOCK_ODATA_RESPONSE));

    await TestBed.configureTestingModule({
      imports: [BeltsComponent],
      providers: [
        { provide: BeltService, useValue: beltSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BeltsComponent);
    component = fixture.componentInstance;
    beltService = TestBed.inject(BeltService) as jasmine.SpyObj<BeltService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Faixas'); });

  it('should load belts on init', () => {
    expect(beltService.apiBeltGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual(MOCK_PAGE);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    beltService.apiBeltGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected belt', () => {
    (component as any).openEdit(MOCK_BELT);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_BELT);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    beltService.apiBeltGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(beltService.apiBeltGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    beltService.apiBeltGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(beltService.apiBeltGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    beltService.apiBeltGet.calls.reset();
    (component as any).onPageChange(3);
    expect((component as any).currentPage()).toBe(3);
    expect(beltService.apiBeltGet).toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(5);
    beltService.apiBeltGet.calls.reset();
    (component as any).onPageSizeChange(25);
    expect((component as any).pageSize()).toBe(25);
    expect((component as any).currentPage()).toBe(1);
    expect(beltService.apiBeltGet).toHaveBeenCalled();
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      beltService.apiBeltIdDelete.and.returnValue(of(null as any));
      beltService.apiBeltGet.calls.reset();
    });

    it('should delete belt and reload on confirmation', () => {
      (component as any).delete(MOCK_BELT);
      expect(beltService.apiBeltIdDelete).toHaveBeenCalledWith(MOCK_BELT.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(beltService.apiBeltGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_BELT);
      expect(beltService.apiBeltIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      beltService.apiBeltIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_BELT);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
