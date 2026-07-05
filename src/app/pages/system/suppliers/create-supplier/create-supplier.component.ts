import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';

import { SupplierService } from '../../../../generated_services/api/supplier.service';
import { CreateSupplierDTO } from '../../../../generated_services/model/createSupplierDTO';
import { CreateAddressDTO } from '../../../../generated_services/model/createAddressDTO';
import { AddressType } from '../../../../generated_services/model/addressType';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-create-supplier',
  standalone: true,
  imports: [ReactiveFormsModule],
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

  protected readonly addressTypes: AddressType[] = ['Comercial', 'Residential'];

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    addresses: this.fb.array([]),
  });

  protected get addresses() {
    return this.form.get('addresses') as FormArray;
  }

  protected addAddress(): void {
    this.addresses.push(this.fb.group({
      typeAddress: ['' as AddressType | '', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      complement: [''],
      neighborhood: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
    }));
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

  private toDTO(): CreateSupplierDTO {
    const v = this.form.getRawValue();
    return {
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
    } as CreateSupplierDTO;
  }
}
