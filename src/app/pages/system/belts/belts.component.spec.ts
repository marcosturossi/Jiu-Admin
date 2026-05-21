import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BeltsComponent } from './belts.component';
import { BeltService } from '../../../generated_services/api/belt.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ShowBeltDTO } from '../../../generated_services/model/showBeltDTO';

const MOCK_BELT: ShowBeltDTO = { id: 'b1', color: 'Branca', orderIndex: 1, isForKids: false };

const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_BELT, id: `b${i + 1}` }));
const MOCK_ODATA_RESPONSE = { value: MOCK_ITEMS };
const MOCK_PAGE = { items: MOCK_ITEMS.slice(0, 10), totalCount: 25, totalPages: 3, currentPage: 1 };

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

  it('should update page and reload on onPageChange', () => {
    beltService.apiBeltGet.calls.reset();
    (component as any).onPageChange(3);
    expect((component as any).currentPage()).toBe(3);
    const page = (component as any).items();
    expect(page.currentPage).toBe(3);
    expect(page.items[0].id).toBe(MOCK_ITEMS[20].id);
    expect(beltService.apiBeltGet).not.toHaveBeenCalled();
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    beltService.apiBeltGet.calls.reset();
    (component as any).currentPage.set(3);
    (component as any).onPageSizeChange(25);
    expect((component as any).pageSize()).toBe(25);
    expect((component as any).currentPage()).toBe(1);
    const page = (component as any).items();
    expect(page.currentPage).toBe(1);
    expect(page.items.length).toBe(25);
    expect(page.items[0].id).toBe(MOCK_ITEMS[0].id);
    expect(beltService.apiBeltGet).not.toHaveBeenCalled();
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
