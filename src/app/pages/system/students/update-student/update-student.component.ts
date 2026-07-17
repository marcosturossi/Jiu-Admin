import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowStudentDTO, UpdateStudentDTO, UpdateAddressDTO } from '../../../../generated_services';
import { AddressType } from '../../../../generated_services/model/addressType';
import { RelationshipType } from '../../../../generated_services/model/relationshipType';
import { NotificationService } from '../../../../services/notification.service';
import { AddressFormComponent, buildAddressFormGroup } from '../../../../shared/address-form/address-form.component';
import { ResponsibleFormComponent, buildResponsibleFormGroup } from '../responsible-form/responsible-form.component';
import { isMinor } from '../../../../utils/date.utils';

@Component({
  selector: 'app-update-student',
  imports: [ReactiveFormsModule, AddressFormComponent, ResponsibleFormComponent],
  templateUrl: './update-student.component.html',
  styleUrl: './update-student.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateStudentComponent {
  readonly closeEvent = output<void>();
  readonly studentUpdated = output<void>();
  readonly student = input.required<ShowStudentDTO>();

  private readonly fb = inject(FormBuilder);
  private readonly studentsService = inject(StudentsService);
  private readonly notificationService = inject(NotificationService);

  protected readonly isMinorSignal = signal(false);

  protected readonly form = this.fb.group({
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    cpf: [null as string | null],
    birthDay: [null as string | null],
    isActive: [true],
    addresses: this.fb.array([]),
    responsibles: this.fb.array([]),
  });

  constructor() {
    effect(() => {
      const s = this.student();

      this.form.patchValue({
        userName: s.userName,
        email: s.email,
        phoneNumber: s.phoneNumber ?? '',
        firstName: s.firstName ?? '',
        lastName: s.lastName ?? '',
        cpf: s.cpf ?? null,
        birthDay: s.birthDay ?? null,
        isActive: s.isActive ?? true,
      });

      // Rebuild addresses
      this.addresses.clear();
      (s.addresses ?? []).forEach(addr => {
        this.addresses.push(buildAddressFormGroup(this.fb, addr));
      });

      // Rebuild responsibles
      this.responsibles.clear();
      (s.relationships ?? []).forEach(rel => {
        this.responsibles.push(buildResponsibleFormGroup(this.fb, {
          relatedPersonId: rel.relatedPersonId,
          relationshipType: rel.relationshipType,
          personName: rel.relatedIndividual
            ? `${rel.relatedIndividual.firstName ?? ''} ${rel.relatedIndividual.lastName ?? ''}`.trim()
            : '',
        }));
      });

      this.isMinorSignal.set(isMinor(s.birthDay));
    });
  }

  protected get addresses(): FormArray { return this.form.get('addresses') as FormArray; }
  protected get responsibles(): FormArray { return this.form.get('responsibles') as FormArray; }

  protected addAddress(): void {
    this.addresses.push(buildAddressFormGroup(this.fb));
  }

  protected removeAddress(i: number): void { this.addresses.removeAt(i); }

  protected addResponsible(): void {
    this.responsibles.push(buildResponsibleFormGroup(this.fb));
  }

  protected removeResponsible(i: number): void { this.responsibles.removeAt(i); }

  protected onBirthDayChange(): void {
    this.isMinorSignal.set(isMinor(this.form.get('birthDay')?.value));
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (this.isMinorSignal() && this.responsibles.length === 0) {
      this.notificationService.showError('Responsável Obrigatório', 'Alunos menores de idade precisam de ao menos um responsável vinculado.');
      return;
    }
    const s = this.student();
    this.studentsService.apiStudentsIdPut(s.id!, this.toDTO()).subscribe({
      next: () => {
        this.notificationService.showSuccess('Aluno Atualizado!', `Os dados de ${this.form.value.firstName} ${this.form.value.lastName} foram atualizados.`);
        this.studentUpdated.emit();
      },
      error: () => this.notificationService.showError('Erro ao Atualizar!', 'Não foi possível atualizar os dados do aluno. Tente novamente.'),
    });
  }

  private toDTO(): UpdateStudentDTO {
    const v = this.form.getRawValue();
    return {
      userName: v.userName!,
      email: v.email!,
      phoneNumber: v.phoneNumber || null,
      firstName: v.firstName || null,
      lastName: v.lastName || null,
      cpf: v.cpf || null,
      birthDay: v.birthDay ?? null,
      isActive: v.isActive ?? true,
      addresses: (v.addresses as any[]).map(a => ({
        typeAddress: a.typeAddress as AddressType,
        street: a.street,
        number: a.number,
        complement: a.complement || null,
        neighborhood: a.neighborhood,
        city: a.city,
        state: a.state,
        zipCode: a.zipCode,
      } as UpdateAddressDTO)),
      relationships: (v.responsibles as any[])
        .filter(r => r.relationshipType && r.relatedPersonId)
        .map(r => ({
          relatedPersonId: r.relatedPersonId,
          relationshipType: r.relationshipType as RelationshipType,
        })),
    };
  }
}
