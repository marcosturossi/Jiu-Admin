import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';

import { SupplierService } from '../../../../generated_services/api/supplier.service';
import { ShowSupplierDTO } from '../../../../generated_services/model/showSupplierDTO';
import { UpdateSupplierDTO } from '../../../../generated_services/model/updateSupplierDTO';
import { UpdateAddressDTO } from '../../../../generated_services/model/updateAddressDTO';
import { AddressType } from '../../../../generated_services/model/addressType';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-supplier',
  standalone: true,
  imports: [ReactiveFormsModule],
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

  protected readonly addressTypes: AddressType[] = ['Comercial', 'Residential'];

  protected readonly form = this.fb.group({
    addresses: this.fb.array([]),
  });

  constructor() {
    effect(() => {
      const s = this.supplier();
      // Reset addresses array
      while (this.addresses.length) this.addresses.removeAt(0);
      if (s) {
        // No addresses available directly on ShowSupplierDTO — start empty
      }
    });
  }

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
    const s = this.supplier();
    this.supplierService.apiSupplierIdPut(s.id!, this.toDTO()).subscribe({
      next: () => {
        this.notificationService.showSuccess('Fornecedor Atualizado!', 'Os dados do fornecedor foram atualizados com sucesso.');
        this.supplierUpdated.emit();
      },
      error: () => {
        this.notificationService.showError('Erro ao Atualizar!', 'Não foi possível atualizar os dados do fornecedor. Tente novamente.');
      },
    });
  }

  private toDTO(): UpdateSupplierDTO {
    const v = this.form.getRawValue();
    return {
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
  }
}
