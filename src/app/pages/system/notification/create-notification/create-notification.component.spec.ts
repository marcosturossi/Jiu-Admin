import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateNotificationComponent } from './create-notification.component';
import { NotificationService as ApiNotificationService } from '../../../../generated_services/api/notification.service';
import { NotificationService } from '../../../../services/notification.service';
import { NotificationType } from '../../../../generated_services/model/notificationType';

describe('CreateNotificationComponent', () => {
  let component: CreateNotificationComponent;
  let fixture: ComponentFixture<CreateNotificationComponent>;
  let apiService: jasmine.SpyObj<ApiNotificationService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiNotificationService', ['apiNotificationPost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    await TestBed.configureTestingModule({
      imports: [CreateNotificationComponent],
      providers: [
        { provide: ApiNotificationService, useValue: apiSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateNotificationComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiNotificationService) as jasmine.SpyObj<ApiNotificationService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('should have invalid form on init (title and message required)', () => {
    expect((component as any).form.valid).toBeFalse();
  });

  it('should be valid when required fields are filled', () => {
    (component as any).form.patchValue({ title: 'Aviso', message: 'Mensagem importante', type: NotificationType.NUMBER_0 });
    expect((component as any).form.valid).toBeTrue();
  });

  it('should emit closeEvent when close() is called', () => {
    let emitted = false;
    component.closeEvent.subscribe(() => (emitted = true));
    (component as any).close();
    expect(emitted).toBeTrue();
  });

  it('should show error and not call service when form is invalid', () => {
    (component as any).create();
    expect(apiService.apiNotificationPost).not.toHaveBeenCalled();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
  });

  it('should call apiNotificationPost on valid create', () => {
    apiService.apiNotificationPost.and.returnValue(of({} as any));
    (component as any).form.patchValue({ title: 'Aviso', message: 'Mensagem', type: NotificationType.NUMBER_0 });
    (component as any).create();
    expect(apiService.apiNotificationPost).toHaveBeenCalled();
  });

  it('should emit notificationCreated and show success on successful create', () => {
    apiService.apiNotificationPost.and.returnValue(of({} as any));
    let emitted = false;
    component.notificationCreated.subscribe(() => (emitted = true));
    (component as any).form.patchValue({ title: 'Aviso', message: 'Mensagem', type: NotificationType.NUMBER_0 });
    (component as any).create();
    expect(emitted).toBeTrue();
    expect(ns.showSuccess).toHaveBeenCalled();
  });

  it('should show error notification on service failure', () => {
    apiService.apiNotificationPost.and.returnValue(throwError(() => new Error()));
    (component as any).form.patchValue({ title: 'Aviso', message: 'Mensagem', type: NotificationType.NUMBER_0 });
    (component as any).create();
    expect(ns.showError).toHaveBeenCalledWith('Erro ao Criar Notificação!', jasmine.any(String));
  });
});
