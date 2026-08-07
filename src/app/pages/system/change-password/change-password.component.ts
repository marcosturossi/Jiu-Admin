import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AccountService } from '../../../services/account.service';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly notificationService = inject(NotificationService);
  private readonly subnavService = inject(SubnavService);

  protected readonly isSaving = signal(false);

  protected readonly form = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  ngOnInit(): void {
    this.subnavService.setTitle('Alterar Senha');
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.errors?.['passwordsMismatch']) {
        this.notificationService.showError('Formulário Inválido', 'A confirmação de senha não corresponde à nova senha.');
      } else {
        this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos corretamente.');
      }
      return;
    }

    this.isSaving.set(true);
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.accountService.changePassword({ currentPassword: currentPassword!, newPassword: newPassword! }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.form.reset();
        this.notificationService.showSuccess('Senha Alterada!', 'Sua senha foi atualizada com sucesso.');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.showError('Erro ao Alterar Senha', extractErrorMessage(err, 'Não foi possível alterar sua senha. Tente novamente.'));
      },
    });
  }
}
