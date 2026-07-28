import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AddressService } from '../../generated_services/api/address.service';
import { AddressType } from '../../generated_services/model/addressType';
import { CreateAddressDTO } from '../../generated_services/model/createAddressDTO';
import { FieldErrorComponent } from '../field-error/field-error.component';

export function buildAddressFormGroup(fb: FormBuilder, addr?: Partial<CreateAddressDTO>): FormGroup {
  return fb.group({
    typeAddress: [addr?.typeAddress ?? '' as AddressType | '', Validators.required],
    zipCode: [addr?.zipCode ?? '', Validators.required],
    street: [addr?.street ?? '', Validators.required],
    number: [addr?.number ?? '', Validators.required],
    complement: [addr?.complement ?? ''],
    neighborhood: [addr?.neighborhood ?? '', Validators.required],
    city: [addr?.city ?? '', Validators.required],
    state: [addr?.state ?? '', Validators.required],
  });
}

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressFormComponent {
  readonly group = input.required<FormGroup>();
  readonly index = input(0);
  readonly remove = output<void>();

  private readonly addressService = inject(AddressService);

  protected readonly addressTypes: AddressType[] = ['Comercial', 'Residential'];

  protected onZipCodeChange(): void {
    const zipCode = (this.group().get('zipCode')?.value ?? '').replace(/\D/g, '');

    if (zipCode.length !== 8) {
      return;
    }

    this.addressService.apiAddressCepGet(zipCode).subscribe({
      next: address => {
        this.group().patchValue({
          street: address.street,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          complement: address.complement,
        });
      },
    });
  }
}
