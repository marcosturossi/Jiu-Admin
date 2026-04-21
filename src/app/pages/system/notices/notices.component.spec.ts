import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoticesComponent } from './notices.component';
import { NoticesService } from '../../../generated_services/api/notices.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ShowNoticesDTO } from '../../../generated_services/model/showNoticesDTO';

const MOCK_NOTICE: ShowNoticesDTO = { id: 'n1', description: 'Treino cancelado sexta-feira', isActive: true, createdAt: '2024-03-01' };

describe('NoticesComponent', () => {
  let component: NoticesComponent;
  let fixture: ComponentFixture<NoticesComponent>;
  let noticesService: jasmine.SpyObj<NoticesService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const noticesSpy = jasmine.createSpyObj('NoticesService', ['apiNoticesGet', 'apiNoticesIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    noticesSpy.apiNoticesGet.and.returnValue(of([MOCK_NOTICE]));

    await TestBed.configureTestingModule({
      imports: [NoticesComponent],
      providers: [
        { provide: NoticesService, useValue: noticesSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NoticesComponent);
    component = fixture.componentInstance;
    noticesService = TestBed.inject(NoticesService) as jasmine.SpyObj<NoticesService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Avisos'); });

  it('should load notices on init', () => {
    expect(noticesService.apiNoticesGet).toHaveBeenCalled();
    expect((component as any).items()).toEqual([MOCK_NOTICE]);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    noticesService.apiNoticesGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected notice', () => {
    (component as any).openEdit(MOCK_NOTICE);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_NOTICE);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    noticesService.apiNoticesGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(noticesService.apiNoticesGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    noticesService.apiNoticesGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(noticesService.apiNoticesGet).toHaveBeenCalled();
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      noticesService.apiNoticesIdDelete.and.returnValue(of(null as any));
      noticesService.apiNoticesGet.calls.reset();
    });

    it('should delete notice and reload on confirmation', () => {
      (component as any).delete(MOCK_NOTICE);
      expect(noticesService.apiNoticesIdDelete).toHaveBeenCalledWith(MOCK_NOTICE.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(noticesService.apiNoticesGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).delete(MOCK_NOTICE);
      expect(noticesService.apiNoticesIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      noticesService.apiNoticesIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).delete(MOCK_NOTICE);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
