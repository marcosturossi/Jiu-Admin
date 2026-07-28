import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

const MESSAGES: Record<string, (error: unknown) => string> = {
  required: () => 'Este campo é obrigatório.',
  email: () => 'Informe um e-mail válido.',
  minlength: (error) => `Mínimo de ${(error as { requiredLength: number }).requiredLength} caracteres.`,
  maxlength: (error) => `Máximo de ${(error as { requiredLength: number }).requiredLength} caracteres.`,
  min: (error) => `O valor mínimo é ${(error as { min: number }).min}.`,
  max: (error) => `O valor máximo é ${(error as { max: number }).max}.`,
  pattern: () => 'Formato inválido.',
};

@Component({
  selector: 'app-field-error',
  standalone: true,
  template: `
    @if (message(); as msg) {
      <div class="invalid-feedback d-block">{{ msg }}</div>
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl | null>();

  protected message(): string | null {
    const control = this.control();
    if (!control || !control.invalid || !(control.touched || control.dirty)) {
      return null;
    }
    const errors = control.errors;
    if (!errors) {
      return null;
    }
    for (const key of Object.keys(errors)) {
      const build = MESSAGES[key];
      if (build) {
        return build(errors[key]);
      }
    }
    return 'Valor inválido.';
  }
}
