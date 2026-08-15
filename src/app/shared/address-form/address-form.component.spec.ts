import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { AddressFormComponent, buildAddressFormGroup } from './address-form.component';
import { AddressService } from '../../generated_services/api/address.service';

describe('buildAddressFormGroup', () => {
  const fb = new FormBuilder();

  it('should build an empty group with required validators when no address is given', () => {
    const group = buildAddressFormGroup(fb);
    expect(group.valid).toBeFalse();
    expect(group.get('typeAddress')?.hasError('required')).toBeTrue();
    expect(group.get('complement')?.hasError('required')).toBeFalse();
  });

  it('should prefill the group from an existing address', () => {
    const group = buildAddressFormGroup(fb, {
      typeAddress: 'Residential', zipCode: '12345-000', street: 'Rua A', number: '10',
      complement: 'Apto 1', neighborhood: 'Centro', city: 'Curitiba', state: 'PR',
    });
    expect(group.value.typeAddress).toBe('Residential');
    expect(group.value.city).toBe('Curitiba');
    expect(group.valid).toBeTrue();
  });
});

describe('AddressFormComponent', () => {
  let component: AddressFormComponent;
  let fixture: ComponentFixture<AddressFormComponent>;
  let componentRef: ComponentRef<AddressFormComponent>;
  let addressService: jasmine.SpyObj<AddressService>;
  let group: FormGroup;

  beforeEach(async () => {
    const addressServiceSpy = jasmine.createSpyObj('AddressService', ['apiAddressCepGet']);

    await TestBed.configureTestingModule({
      imports: [AddressFormComponent],
      providers: [
        { provide: AddressService, useValue: addressServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressFormComponent);
    componentRef = fixture.componentRef;
    component = fixture.componentInstance;
    addressService = TestBed.inject(AddressService) as jasmine.SpyObj<AddressService>;

    group = buildAddressFormGroup(new FormBuilder());
    componentRef.setInput('group', group);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should not call the CEP service when the zip code is incomplete', () => {
    group.patchValue({ zipCode: '123' });
    (component as any).onZipCodeChange();
    expect(addressService.apiAddressCepGet).not.toHaveBeenCalled();
  });

  it('should look up the address and patch the form when the zip code has 8 digits', () => {
    addressService.apiAddressCepGet.and.returnValue(of({
      street: 'Rua Encontrada', neighborhood: 'Bairro X', city: 'Curitiba', state: 'PR', complement: '',
    } as any));
    group.patchValue({ zipCode: '80000-000' });

    (component as any).onZipCodeChange();

    expect(addressService.apiAddressCepGet).toHaveBeenCalledWith('80000000');
    expect(group.value.street).toBe('Rua Encontrada');
    expect(group.value.city).toBe('Curitiba');
    expect(group.value.state).toBe('PR');
  });

  it('should emit remove when requested', () => {
    spyOn(component.remove, 'emit');
    component.remove.emit();
    expect(component.remove.emit).toHaveBeenCalled();
  });
});
