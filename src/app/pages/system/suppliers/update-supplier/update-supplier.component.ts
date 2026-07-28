import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';

import { SupplierService } from '../../../../generated_services/api/supplier.service';
import { ShowSupplierDTO } from '../../../../generated_services/model/showSupplierDTO';
import { UpdateSupplierDTO } from '../../../../generated_services/model/updateSupplierDTO';
import { UpdateIndividualPersonDTO } from '../../../../generated_services/model/updateIndividualPersonDTO';
import { UpdateCompanyPersonDTO } from '../../../../generated_services/model/updateCompanyPersonDTO';
import { UpdateAddressDTO } from '../../../../generated_services/model/updateAddressDTO';
import { AddressType } from '../../../../generated_services/model/addressType';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { AddressFormComponent, buildAddressFormGroup } from '../../../../shared/address-form/address-form.component';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-update-supplier',
  standalone: true,
  imports: [ReactiveFormsModule, AddressFormComponent, FieldErrorComponent],
  templateUrl: './update-supplier.component.html',
  styleUrl: './update-supplier.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateSupplierComponent {
  readonly closeEvent = output<void>();
  readonly supplierUpdated = output<void>();
  readonly supplier = input.required<ShowSupplierDTO>();

  private readonly fb = inject(FormBuilder);
  private readonly supplierService = inject(SupplierService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form: FormGroup = this.fb.group({
    addresses: this.fb.array([]),
  });

  protected readonly isSaving = signal(false);

  constructor() {
    effect(() => {
      const s = this.supplier();

      this.form.removeControl('individualPerson');
      this.form.removeControl('companyPerson');

      if (s.individualPerson) {
        this.form.addControl('individualPerson', this.fb.group({
          personId: [s.individualPerson.personId ?? ''],
          firstName: [s.individualPerson.firstName ?? '', Validators.required],
          lastName: [s.individualPerson.lastName ?? '', Validators.required],
          cpf: [s.individualPerson.cpf ?? '', [Validators.required, Validators.minLength(11), Validators.maxLength(11)]],
          email: [s.individualPerson.email ?? '', [Validators.required, Validators.email]],
          phoneNumber: [s.individualPerson.phoneNumber ?? ''],
        }));
      } else if (s.companyPerson) {
        this.form.addControl('companyPerson', this.fb.group({
          personId: [s.companyPerson.personId ?? ''],
          name: [s.companyPerson.name ?? '', Validators.required],
          cnpj: [s.companyPerson.cnpj ?? '', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
          foundedIn: [(s.companyPerson.foundedIn ?? '').slice(0, 10)],
          email: [s.companyPerson.email ?? '', [Validators.required, Validators.email]],
          phoneNumber: [s.companyPerson.phoneNumber ?? ''],
        }));
      }

      this.addresses.clear();
      (s.addresses ?? []).forEach(addr => {
        this.addresses.push(buildAddressFormGroup(this.fb, addr));
      });
    });
  }

  protected get addresses() {
    return this.form.get('addresses') as FormArray;
  }

  protected get individualPerson() {
    return this.form.get('individualPerson') as FormGroup | null;
  }

  protected get companyPerson() {
    return this.form.get('companyPerson') as FormGroup | null;
  }

  protected supplierTypeLabel(): string {
    return this.supplier().companyPerson ? 'Pessoa Jurídica' : 'Pessoa Física';
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
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    const s = this.supplier();
    this.isSaving.set(true);
    this.supplierService.apiSupplierIdPut(s.id!, this.toDTO()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.notificationService.showSuccess('Fornecedor Atualizado!', 'Os dados do fornecedor foram atualizados com sucesso.');
        this.supplierUpdated.emit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.showError('Erro ao Atualizar!', extractErrorMessage(err, 'Não foi possível atualizar os dados do fornecedor. Tente novamente.'));
      },
    });
  }

  private toDTO(): UpdateSupplierDTO {
    const v = this.form.getRawValue();
    const dto: UpdateSupplierDTO = {
      id: this.supplier().id,
      addresses: (v.addresses as UpdateAddressDTO[]).map(a => ({
        typeAddress: a.typeAddress as AddressType,
        street: a.street ?? null,
        number: a.number ?? null,
        complement: a.complement || null,
        neighborhood: a.neighborhood ?? null,
        city: a.city ?? null,
        state: a.state ?? null,
        zipCode: a.zipCode ?? null,
      })),
    };

    if (v.individualPerson) {
      dto.individualPerson = this.toIndividualPersonDTO(v.individualPerson);
    } else if (v.companyPerson) {
      dto.companyPerson = this.toCompanyPersonDTO(v.companyPerson);
    }

    return dto;
  }

  private toIndividualPersonDTO(p: any): UpdateIndividualPersonDTO {
    return {
      personId: p.personId || undefined,
      firstName: p.firstName,
      lastName: p.lastName,
      cpf: p.cpf,
      email: p.email,
      phoneNumber: p.phoneNumber || null,
    };
  }

  private toCompanyPersonDTO(p: any): UpdateCompanyPersonDTO {
    return {
      personId: p.personId || undefined,
      name: p.name,
      cnpj: p.cnpj,
      foundedIn: p.foundedIn || null,
      email: p.email,
      phoneNumber: p.phoneNumber || null,
    };
  }
}
