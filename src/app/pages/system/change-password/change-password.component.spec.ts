import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ChangePasswordComponent } from './change-password.component';
import { AccountService } from '../../../services/account.service';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let accountService: jasmine.SpyObj<AccountService>;
  let ns: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    const accountSpy = jasmine.createSpyObj('AccountService', ['changePassword']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
    const subnavSpy = jasmine.createSpyObj('SubnavService', ['setTitle']);

    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [
        { provide: AccountService, useValue: accountSpy },
        { provide: NotificationService, useValue: nsSpy },
        { provide: SubnavService, useValue: subnavSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    accountService = TestBed.inject(AccountService) as jasmine.SpyObj<AccountService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should block save and show an error when required fields are missing', () => {
    (component as any).save();
    expect(ns.showError).toHaveBeenCalled();
    expect(accountService.changePassword).not.toHaveBeenCalled();
  });

  it('should block save and show a mismatch error when confirmation does not match', () => {
    (component as any).form.setValue({
      currentPassword: 'old-password',
      newPassword: 'new-password-123',
      confirmPassword: 'different-password',
    });

    (component as any).save();

    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', 'A confirmação de senha não corresponde à nova senha.');
    expect(accountService.changePassword).not.toHaveBeenCalled();
  });

  it('should call the service and notify success on valid submit', () => {
    accountService.changePassword.and.returnValue(of(undefined));
    (component as any).form.setValue({
      currentPassword: 'old-password',
      newPassword: 'new-password-123',
      confirmPassword: 'new-password-123',
    });

    (component as any).save();

    expect(accountService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old-password',
      newPassword: 'new-password-123',
    });
    expect(ns.showSuccess).toHaveBeenCalled();
    expect((component as any).isSaving()).toBeFalse();
    expect((component as any).form.value.currentPassword).toBeFalsy();
  });

  it('should surface an error and reset saving state when the request fails', () => {
    accountService.changePassword.and.returnValue(throwError(() => ({ error: { error: 'Senha atual incorreta.' } })));
    (component as any).form.setValue({
      currentPassword: 'wrong-password',
      newPassword: 'new-password-123',
      confirmPassword: 'new-password-123',
    });

    (component as any).save();

    expect(ns.showError).toHaveBeenCalledWith('Erro ao Alterar Senha', 'Senha atual incorreta.');
    expect((component as any).isSaving()).toBeFalse();
  });
});
