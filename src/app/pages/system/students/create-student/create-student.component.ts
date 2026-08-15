import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { CreateStudentDTO } from '../../../../generated_services/model/createStudentDTO';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { AddressType } from '../../../../generated_services/model/addressType';
import { RelationshipType } from '../../../../generated_services/model/relationshipType';
import { CreateAddressDTO } from '../../../../generated_services';
import { AddressFormComponent, buildAddressFormGroup } from '../../../../shared/address-form/address-form.component';
import { ResponsibleFormComponent, buildResponsibleFormGroup } from '../responsible-form/responsible-form.component';
import { isMinor } from '../../../../utils/date.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

/** Matches Backend.Shared.Domain.Enums.BillingType. Empty = no override, use the academy's default. */
const NONE_BILLING_TYPE = '';

@Component({
  selector: 'app-create-student',
  imports: [ReactiveFormsModule, AddressFormComponent, ResponsibleFormComponent, FieldErrorComponent],
  templateUrl: './create-student.component.html',
  styleUrl: './create-student.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateStudentComponent {
  readonly closeEvent = output<void>();
  readonly studentCreated = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly studentsService = inject(StudentsService);
  private readonly notificationService = inject(NotificationService);

  protected readonly billingTypes = [
    { label: 'Padrão da academia', value: NONE_BILLING_TYPE },
    { label: 'PIX', value: 'PIX' },
    { label: 'Boleto', value: 'BOLETO' },
    { label: 'Cartão de Crédito', value: 'CREDIT_CARD' },
    { label: 'Dinheiro', value: 'MONEY' },
  ];

  protected readonly form = this.fb.group({
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    birthDay: [null as string | null, Validators.required],
    cpf: [null as string | null, Validators.required],
    isActive: [true],
    defaultBillingType: [NONE_BILLING_TYPE as string],
    addresses: this.fb.array([]),
    responsibles: this.fb.array([]),
  });

  protected readonly isSaving = signal(false);

  protected get addresses() {
    return this.form.get('addresses') as FormArray;
  }

  protected addAddress(): void {
    this.addresses.push(buildAddressFormGroup(this.fb));
  }

  protected get responsibles() {
    return this.form.get('responsibles') as FormArray;
  }

  protected addResponsible(): void {
    this.responsibles.push(buildResponsibleFormGroup(this.fb));
  }

  protected removeAddress(index: number): void {
    this.addresses.removeAt(index);
  }

  protected removeResponsible(index: number): void {
    this.responsibles.removeAt(index);
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (this.isMinor() && this.responsibles.length === 0) {
      this.notificationService.showError('Responsável Obrigatório', 'Alunos menores de idade precisam de ao menos um responsável vinculado.');
      return;
    }
    this.isSaving.set(true);
    this.studentsService.apiStudentsPost(this.toDTO()).subscribe({
      next: () => { this.isSaving.set(false); this.notificationService.showSuccess('Sucesso!', 'Aluno criado com sucesso.'); this.studentCreated.emit(); },
      error: (err) => { this.isSaving.set(false); this.notificationService.showError('Erro!', extractErrorMessage(err, 'Erro ao criar aluno. Tente novamente.')); }
    });
  }

  protected isMinor(): boolean {
    return isMinor(this.form.get('birthDay')?.value);
  }

  private toDTO(): CreateStudentDTO {
    const v = this.form.getRawValue();

    return {
      userName: v.userName!,
      email: v.email!,
      phoneNumber: v.phoneNumber || null,
      firstName: v.firstName!,
      lastName: v.lastName!,
      birthDay: v.birthDay!,
      cpf: v.cpf!,
      isActive: v.isActive!,
      defaultBillingType: v.defaultBillingType || null,

      addresses: ((v.addresses ?? []) as CreateAddressDTO[]).map(address => ({
        street: address.street,
        typeAddress: address.typeAddress as AddressType,
        number: address.number,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        neighborhood: address.neighborhood,
        complement: address.complement,
      })),

      relationships: (v.responsibles ?? []).map((r: any) => ({
        relatedPersonId: r.relatedPersonId,
        relationshipType: r.relationshipType as RelationshipType,
      })).filter((r: any) => r.relationshipType && r.relatedPersonId),
    };
  }
}

