import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ResponsibleFormComponent, buildResponsibleFormGroup } from './responsible-form.component';
import { IndividualPersonsService } from '../../../../generated_services/api/individualPersons.service';
import { NotificationService } from '../../../../services/notification.service';

describe('buildResponsibleFormGroup', () => {
  const fb = new FormBuilder();

  it('should build an empty group with required validators', () => {
    const group = buildResponsibleFormGroup(fb);
    expect(group.valid).toBeFalse();
    expect(group.get('relatedPersonId')?.hasError('required')).toBeTrue();
    expect(group.get('relationshipType')?.hasError('required')).toBeTrue();
  });

  it('should prefill the group from an existing responsible', () => {
    const group = buildResponsibleFormGroup(fb, {
      relatedPersonId: 'p1', relationshipType: 'Mother' as any, personName: 'Maria',
    });
    expect(group.value.relatedPersonId).toBe('p1');
    expect(group.value.personName).toBe('Maria');
    expect(group.valid).toBeTrue();
  });
});

describe('ResponsibleFormComponent', () => {
  let component: ResponsibleFormComponent;
  let fixture: ComponentFixture<ResponsibleFormComponent>;
  let componentRef: ComponentRef<ResponsibleFormComponent>;
  let service: jasmine.SpyObj<IndividualPersonsService>;
  let ns: jasmine.SpyObj<NotificationService>;
  let group: FormGroup;

  beforeEach(async () => {
    const serviceSpy = jasmine.createSpyObj('IndividualPersonsService', ['apiIndividualPersonsGet', 'apiIndividualPersonsPost']);
    const nsSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [ResponsibleFormComponent],
      providers: [
        { provide: IndividualPersonsService, useValue: serviceSpy },
        { provide: NotificationService, useValue: nsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResponsibleFormComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    service = TestBed.inject(IndividualPersonsService) as jasmine.SpyObj<IndividualPersonsService>;
    ns = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    group = buildResponsibleFormGroup(new FormBuilder());
    componentRef.setInput('group', group);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should map relationship types to Portuguese labels, falling back to the raw value', () => {
    expect((component as any).relationshipLabel('Mother')).toBe('Mãe');
    expect((component as any).relationshipLabel('Father')).toBe('Pai');
    expect((component as any).relationshipLabel('LegalGuardian')).toBe('Responsável Legal');
    expect((component as any).relationshipLabel('Other')).toBe('Other');
  });

  it('isResolved should reflect whether relatedPersonId is set', () => {
    expect((component as any).isResolved()).toBeFalse();
    group.patchValue({ relatedPersonId: 'p1' });
    expect((component as any).isResolved()).toBeTrue();
  });

  it('should show an error when searching with an invalid CPF', () => {
    group.patchValue({ cpf: '123' });
    (component as any).searchByCpf();
    expect(ns.showError).toHaveBeenCalledWith('CPF Inválido', jasmine.any(String));
    expect(service.apiIndividualPersonsGet).not.toHaveBeenCalled();
  });

  it('should patch relatedPersonId and personName when a person is found by CPF', () => {
    service.apiIndividualPersonsGet.and.returnValue(of({
      items: [{ personId: 'p1', firstName: 'João', lastName: 'Silva' }],
    } as any));
    group.patchValue({ cpf: '123.456.789-00' });

    (component as any).searchByCpf();

    expect(service.apiIndividualPersonsGet).toHaveBeenCalledWith(undefined, undefined, undefined, '12345678900');
    expect(group.value.relatedPersonId).toBe('p1');
    expect(group.value.personName).toBe('João Silva');
    expect((component as any).notFoundMode()).toBeFalse();
    expect((component as any).isSearching()).toBeFalse();
  });

  it('should enter not-found mode when no person matches the CPF', () => {
    service.apiIndividualPersonsGet.and.returnValue(of({ items: [] } as any));
    group.patchValue({ cpf: '123.456.789-00' });

    (component as any).searchByCpf();

    expect((component as any).notFoundMode()).toBeTrue();
    expect(group.value.relatedPersonId).toBe('');
  });

  it('should show an error and stop searching when the CPF lookup fails', () => {
    service.apiIndividualPersonsGet.and.returnValue(throwError(() => new Error('fail')));
    group.patchValue({ cpf: '123.456.789-00' });

    (component as any).searchByCpf();

    expect(ns.showError).toHaveBeenCalledWith('Erro', jasmine.any(String));
    expect((component as any).isSearching()).toBeFalse();
  });

  it('should require firstName, lastName, email and a valid CPF before creating', () => {
    group.patchValue({ firstName: '', lastName: '', email: '', cpf: '' });
    (component as any).createAndLink();
    expect(ns.showError).toHaveBeenCalledWith('Formulário Inválido', jasmine.any(String));
    expect(service.apiIndividualPersonsPost).not.toHaveBeenCalled();
  });

  it('should create and link a new responsible person', () => {
    service.apiIndividualPersonsPost.and.returnValue(of({ personId: 'p2', firstName: 'Ana', lastName: 'Souza' } as any));
    group.patchValue({ firstName: 'Ana', lastName: 'Souza', email: 'ana@example.com', phoneNumber: '', cpf: '123.456.789-00' });

    (component as any).createAndLink();

    expect(service.apiIndividualPersonsPost).toHaveBeenCalledWith(jasmine.objectContaining({
      firstName: 'Ana', lastName: 'Souza', email: 'ana@example.com', cpf: '12345678900',
    }));
    expect(group.value.relatedPersonId).toBe('p2');
    expect(group.value.personName).toBe('Ana Souza');
    expect((component as any).isCreating()).toBeFalse();
  });

  it('should show an error and stop creating when the create request fails', () => {
    service.apiIndividualPersonsPost.and.returnValue(throwError(() => new Error('fail')));
    group.patchValue({ firstName: 'Ana', lastName: 'Souza', email: 'ana@example.com', cpf: '123.456.789-00' });

    (component as any).createAndLink();

    expect(ns.showError).toHaveBeenCalledWith('Erro', jasmine.any(String));
    expect((component as any).isCreating()).toBeFalse();
  });

  it('should clear the resolved responsible and reset notFoundMode', () => {
    group.patchValue({ relatedPersonId: 'p1', personName: 'X', cpf: '1', firstName: 'a', lastName: 'b', email: 'c', phoneNumber: 'd' });
    (component as any).notFoundMode.set(true);

    (component as any).clear();

    expect(group.value.relatedPersonId).toBe('');
    expect(group.value.personName).toBe('');
    expect((component as any).notFoundMode()).toBeFalse();
  });
});
