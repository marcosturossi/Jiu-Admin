import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificationComponent } from './notification.component';
import { NotificationService as ApiNotificationService } from '../../../generated_services/api/notification.service';
import { SubnavService } from '../../../services/subnav.service';
import { NotificationService } from '../../../services/notification.service';
import { ShowNotificationDto as ShowNotificationDTO } from '../../../generated_services/model/showNotificationDto';
import { NotificationType } from '../../../generated_services/model/notificationType';

const MOCK_NOTIFICATION: ShowNotificationDTO = { id: 'notif-1', title: 'Aviso', message: 'Mensagem', type: NotificationType.Info, isActive: true };
const MOCK_ITEMS = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_NOTIFICATION, id: `notif-${i + 1}` }));
const buildResponse = (page = 1, pageSize = 10) => MOCK_ITEMS.slice((page - 1) * pageSize, page * pageSize);

describe('NotificationComponent', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;
  let apiNotificationService: jasmine.SpyObj<ApiNotificationService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let subnavService: jasmine.SpyObj<SubnavService>;

  beforeEach(async () => {
    const apiNotifSpy = jasmine.createSpyObj('ApiNotificationService', ['apiNotificationGet', 'apiNotificationIdDelete']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);
    apiNotifSpy.apiNotificationGet.and.callFake((...args: any[]) => of(buildResponse(Number(args[0] ?? 1), Number(args[1] ?? 10))));

    await TestBed.configureTestingModule({
      imports: [NotificationComponent],
      providers: [
        { provide: ApiNotificationService, useValue: apiNotifSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    apiNotificationService = TestBed.inject(ApiNotificationService) as jasmine.SpyObj<ApiNotificationService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    subnavService = TestBed.inject(SubnavService) as jasmine.SpyObj<SubnavService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should set page title on init', () => { expect(subnavService.setTitle).toHaveBeenCalledWith('Notificações'); });

  it('should load notifications on init', () => {
    expect(apiNotificationService.apiNotificationGet).toHaveBeenCalled();
    expect((component as any).items()?.items.length).toBe(10);
    expect((component as any).items()?.items[0].id).toBe(MOCK_ITEMS[0].id);
  });

  it('should set isLoading to false after successful load', () => {
    expect((component as any).isLoading()).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    apiNotificationService.apiNotificationGet.and.returnValue(throwError(() => new Error()));
    (component as any).load();
    expect(ns.showError).toHaveBeenCalled();
  });

  it('should open create dialog', () => {
    expect((component as any).openedCreate()).toBeFalse();
    (component as any).openCreate();
    expect((component as any).openedCreate()).toBeTrue();
  });

  it('should open update dialog with selected notification', () => {
    (component as any).openEdit(MOCK_NOTIFICATION);
    expect((component as any).openedUpdate()).toBeTrue();
    expect((component as any).selected()).toEqual(MOCK_NOTIFICATION);
  });

  it('should close create dialog and reload on onCreated', () => {
    (component as any).openedCreate.set(true);
    apiNotificationService.apiNotificationGet.calls.reset();
    (component as any).onCreated();
    expect((component as any).openedCreate()).toBeFalse();
    expect(apiNotificationService.apiNotificationGet).toHaveBeenCalled();
  });

  it('should close update dialog and reload on onUpdated', () => {
    (component as any).openedUpdate.set(true);
    apiNotificationService.apiNotificationGet.calls.reset();
    (component as any).onUpdated();
    expect((component as any).openedUpdate()).toBeFalse();
    expect(apiNotificationService.apiNotificationGet).toHaveBeenCalled();
  });

  it('should update page and reload on onPageChange', () => {
    apiNotificationService.apiNotificationGet.calls.reset();
    (component as any).onPageChange(2);
    expect((component as any).currentPage()).toBe(2);
    expect(apiNotificationService.apiNotificationGet).toHaveBeenCalled();
    expect((component as any).items()?.items[0].id).toBe(MOCK_ITEMS[10].id);
  });

  it('should reset to page 1 and reload on onPageSizeChange', () => {
    (component as any).currentPage.set(3);
    apiNotificationService.apiNotificationGet.calls.reset();
    (component as any).onPageSizeChange(20);
    expect((component as any).pageSize()).toBe(20);
    expect((component as any).currentPage()).toBe(1);
    expect(apiNotificationService.apiNotificationGet).toHaveBeenCalled();
    expect((component as any).items()?.items.length).toBe(20);
  });

  describe('delete', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiNotificationService.apiNotificationIdDelete.and.returnValue(of(null as any));
      apiNotificationService.apiNotificationGet.calls.reset();
    });

    it('should delete notification and reload on confirmation', () => {
      (component as any).deleteNotification(MOCK_NOTIFICATION);
      expect(apiNotificationService.apiNotificationIdDelete).toHaveBeenCalledWith(MOCK_NOTIFICATION.id!);
      expect(ns.showSuccess).toHaveBeenCalled();
      expect(apiNotificationService.apiNotificationGet).toHaveBeenCalled();
    });

    it('should not delete when confirmation is cancelled', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      (component as any).deleteNotification(MOCK_NOTIFICATION);
      expect(apiNotificationService.apiNotificationIdDelete).not.toHaveBeenCalled();
    });

    it('should show error notification on delete failure', () => {
      apiNotificationService.apiNotificationIdDelete.and.returnValue(throwError(() => new Error()));
      (component as any).deleteNotification(MOCK_NOTIFICATION);
      expect(ns.showError).toHaveBeenCalled();
    });
  });
});
