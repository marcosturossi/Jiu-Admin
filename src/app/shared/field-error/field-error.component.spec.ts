import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { FieldErrorComponent } from './field-error.component';

describe('FieldErrorComponent', () => {
  let component: FieldErrorComponent;
  let fixture: ComponentFixture<FieldErrorComponent>;
  let componentRef: ComponentRef<FieldErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FieldErrorComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
  });

  function setControl(control: FormControl) {
    componentRef.setInput('control', control);
    fixture.detectChanges();
  }

  it('should create', () => {
    setControl(new FormControl(''));
    expect(component).toBeTruthy();
  });

  it('should render nothing when control is null', () => {
    setControl(null as any);
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('should render nothing when control is valid', () => {
    const control = new FormControl('ok', Validators.required);
    setControl(control);
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('should render nothing when control is invalid but untouched and pristine', () => {
    const control = new FormControl('', Validators.required);
    setControl(control);
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('should show the required message once touched', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    setControl(control);
    expect(fixture.nativeElement.textContent).toContain('Este campo é obrigatório.');
  });

  it('should show the required message when dirty even if not touched', () => {
    const control = new FormControl('', Validators.required);
    control.markAsDirty();
    setControl(control);
    expect(fixture.nativeElement.textContent).toContain('Este campo é obrigatório.');
  });

  it('should show the email message', () => {
    const control = new FormControl('invalid', Validators.email);
    control.markAsTouched();
    setControl(control);
    expect(fixture.nativeElement.textContent).toContain('Informe um e-mail válido.');
  });

  it('should show the minlength message with the required length', () => {
    const control = new FormControl('ab', Validators.minLength(5));
    control.markAsTouched();
    setControl(control);
    expect(fixture.nativeElement.textContent).toContain('Mínimo de 5 caracteres.');
  });

  it('should show the maxlength message with the required length', () => {
    const control = new FormControl('abcdef', Validators.maxLength(3));
    control.markAsTouched();
    setControl(control);
    expect(fixture.nativeElement.textContent).toContain('Máximo de 3 caracteres.');
  });

  it('should show the min message', () => {
    const control = new FormControl(1, Validators.min(5));
    control.markAsTouched();
    setControl(control);
    expect(fixture.nativeElement.textContent).toContain('O valor mínimo é 5.');
  });

  it('should show the max message', () => {
    const control = new FormControl(10, Validators.max(5));
    control.markAsTouched();
    setControl(control);
    expect(fixture.nativeElement.textContent).toContain('O valor máximo é 5.');
  });

  it('should show the pattern message', () => {
    const control = new FormControl('abc', Validators.pattern(/^\d+$/));
    control.markAsTouched();
    setControl(control);
    expect(fixture.nativeElement.textContent).toContain('Formato inválido.');
  });

  it('should fall back to a generic message for unknown error keys', () => {
    const control = new FormControl('');
    control.setErrors({ somethingElse: true });
    control.markAsTouched();
    setControl(control);
    expect(fixture.nativeElement.textContent).toContain('Valor inválido.');
  });
});
