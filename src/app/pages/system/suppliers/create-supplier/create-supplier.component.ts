import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';

import { SupplierService } from '../../../../generated_services/api/supplier.service';
import { CreateSupplierDTO } from '../../../../generated_services/model/createSupplierDTO';
import { CreateAddressDTO } from '../../../../generated_services/model/createAddressDTO';
import { AddressType } from '../../../../generated_services/model/addressType';
import { NotificationService } from '../../../../services/notification.service';
import { CreateCompanyPersonDTO, CreateIndividualPersonDTO } from '../../../../generated_services';
import { AddressFormComponent, buildAddressFormGroup } from '../../../../shared/address-form/address-form.component';

@Component({
  selector: 'app-create-supplier',
  standalone: true,
  imports: [ReactiveFormsModule, AddressFormComponent],
  templateUrl: './create-supplier.component.html',
  styleUrl: './create-supplier.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSupplierComponent {
  readonly closeEvent = output<void>();
  readonly supplierCreated = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly supplierService = inject(SupplierService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form: FormGroup = this.fb.group({

    personType: ['' as 'individual' | 'company' | '', Validators.required],

    addresses: this.fb.array([]),
  });

  protected get addresses() {
    return this.form.get('addresses') as FormArray;
  }

  // call this from a (change) on your radio/select for personType
  protected onPersonTypeChange(type: 'individual' | 'company' | ''): void {
    // always remove both first, so switching types doesn't leave stale controls
    this.form.removeControl('individualPerson');
    this.form.removeControl('companyPerson');

    if (type === 'individual') {
      this.addIndividualPerson();
    } else if (type === 'company') {
      this.addCompanyPerson();
    }
  }

  protected addIndividualPerson(): void {
    this.form.addControl('individualPerson', this.fb.group({
      email: [''],
      phoneNumber: [''],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      cpf: ['', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
    }));
  }

  protected addCompanyPerson(): void {
    this.form.addControl('companyPerson', this.fb.group({
      email: [''],
      phoneNumber: [''],
      name: ['', Validators.required],
      foundedIn: ['', Validators.required],
      cnpj: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
    }));
  }

  // optional helpers for the template
  protected get individualPerson() {
    return this.form.get('individualPerson') as FormGroup | null;
  }

  protected get companyPerson() {
    return this.form.get('companyPerson') as FormGroup | null;
  }

  protected addAddress(): void {
    this.addresses.push(buildAddressFormGroup(this.fb));
  }

  protected removeAddress(index: number): void {
    this.addresses.removeAt(index);
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.logInvalidControls(this.form);
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.supplierService.apiSupplierPost(this.toDTO()).subscribe({
      next: () => {
        this.notificationService.showSuccess('Sucesso!', 'Fornecedor criado com sucesso.');
        this.supplierCreated.emit();
      },
      error: () => {
        this.notificationService.showError('Erro!', 'Erro ao criar fornecedor. Tente novamente.');
      },
    });
  }

  private logInvalidControls(form: FormGroup | FormArray, path: string = ''): void {
    Object.keys(form.controls).forEach((key) => {
      const control = form.get(key);
      const controlPath = path ? `${path}.${key}` : key;

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.logInvalidControls(control, controlPath);
      } else if (control && control.invalid) {
        console.log(`Campo inválido: ${controlPath}`, control.errors);
      }
    });
  }

  private toDTO(): CreateSupplierDTO {
    const v = this.form.getRawValue();

    const dto: CreateSupplierDTO = {
      addresses: (v.addresses as CreateAddressDTO[]).map(a => ({
        typeAddress: a.typeAddress as AddressType,
        street: a.street,
        number: a.number,
        complement: a.complement || null,
        neighborhood: a.neighborhood,
        city: a.city,
        state: a.state,
        zipCode: a.zipCode,
      })),
    };

    if (v.personType === 'individual') {
      dto.individualPerson = this.toIndividualPersonDTO(v.individualPerson);
      dto.companyPerson = null;
    } else if (v.personType === 'company') {
      dto.companyPerson = this.toCompanyPersonDTO(v.companyPerson);
      dto.individualPerson = null;
    }

    return dto;
  }

  private toIndividualPersonDTO(p: any): CreateIndividualPersonDTO {
    return {
      email: p.email,
      phoneNumber: p.phoneNumber || null,
      photoUrl: p.photoUrl || null,
      firstName: p.firstName,
      lastName: p.lastName,
      cpf: p.cpf,
    };
  }

  private toCompanyPersonDTO(p: any): CreateCompanyPersonDTO {
    return {
      email: p.email,
      phoneNumber: p.phoneNumber || null,
      name: p.name,
      foundedIn: p.foundedIn || null,
      cnpj: p.cnpj,
    };
  }
}
