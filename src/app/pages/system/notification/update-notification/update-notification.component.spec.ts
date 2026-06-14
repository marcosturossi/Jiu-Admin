import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ComponentRef } from '@angular/core';
import { UpdateNotificationComponent } from './update-notification.component';
import { NotificationService as ApiNotificationService } from '../../../../generated_services/api/notification.service';
import { ShowNotificationDto as ShowNotificationDTO } from '../../../../generated_services/model/showNotificationDto';
import { NotificationType } from '../../../../generated_services/model/notificationType';
import { NotificationService } from '../../../../services/notification.service';

const MOCK_NOTIFICATION: ShowNotificationDTO = { id: 'notif1', title: 'Aviso', message: 'Mensagem', type: NotificationType.Info as any, isActive: true };

describe('UpdateNotificationComponent', () => {
  let component: UpdateNotificationComponent;
  let fixture: ComponentFixture<UpdateNotificationComponent>;
  let componentRef: ComponentRef<UpdateNotificationComponent>;
  let apiService: jasmine.SpyObj<ApiNotificationService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiNotificationService', ['apiNotificationIdPut']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [UpdateNotificationComponent],
      providers: [
        { provide: ApiNotificationService, useValue: apiSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateNotificationComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiNotificationService) as jasmine.SpyObj<ApiNotificationService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    componentRef.setInput('notification', MOCK_NOTIFICATION);
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should patch form from input notification', () => {
    expect((component as any).form.get('title')?.value).toBe('Aviso');
    expect((component as any).form.get('message')?.value).toBe('Mensagem');
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).form.get('title')?.setValue('');
    (component as any).update();
    expect(apiService.apiNotificationIdPut).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiNotificationIdPut with correct id on valid update', () => {
    apiService.apiNotificationIdPut.and.returnValue(of({} as any));
    (component as any).update();
    expect(apiService.apiNotificationIdPut).toHaveBeenCalledWith('notif1', jasmine.any(Object));
  });

  it('should emit notificationUpdated and show success on successful update', () => {
    apiService.apiNotificationIdPut.and.returnValue(of({} as any));
    let emitted = false;
    component.notificationUpdated.subscribe(() => (emitted = true));
    (component as any).update();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    apiService.apiNotificationIdPut.and.returnValue(throwError(() => new Error()));
    (component as any).update();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Atualizar Notificação!', jasmine.any(String));
  });
});
