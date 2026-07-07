import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowStudentDTO, UpdateStudentDTO, UpdateAddressDTO, AddressService } from '../../../../generated_services';
import { AddressType } from '../../../../generated_services/model/addressType';
import { RelationshipType } from '../../../../generated_services/model/relationshipType';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-update-student',
  imports: [ReactiveFormsModule],
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
  private readonly addressService = inject(AddressService)

  protected readonly addressTypes = Object.values(AddressType);
  protected readonly relationshipTypes = Object.values(RelationshipType);
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
        this.addresses.push(this.fb.group({
          street: [addr.street ?? '', Validators.required],
          city: [addr.city ?? '', Validators.required],
          state: [addr.state ?? '', Validators.required],
          zipCode: [addr.zipCode ?? '', Validators.required],
          neighborhood: [addr.neighborhood ?? '', Validators.required],
          number: [addr.number ?? '', Validators.required],
          typeAddress: [addr.typeAddress ?? '' as AddressType | '', Validators.required],
          complement: [addr.complement ?? ''],
        }));
      });

      // Rebuild responsibles
      this.responsibles.clear();
      (s.relationships ?? []).forEach(rel => {
        this.responsibles.push(this.fb.group({
          relatedPersonId: [rel.relatedPersonId ?? ''],
          selectedPersonName: [
            rel.relatedIndividual
              ? `${rel.relatedIndividual.firstName ?? ''} ${rel.relatedIndividual.lastName ?? ''}`.trim()
              : ''
          ],
          relationshipType: [rel.relationshipType ?? '' as RelationshipType | '', Validators.required],
        }));
      });

      this.isMinorSignal.set(this.checkIsMinor(s.birthDay));
    });
  }

  protected get addresses(): FormArray { return this.form.get('addresses') as FormArray; }
  protected get responsibles(): FormArray { return this.form.get('responsibles') as FormArray; }

  protected getResponsibleGroup(i: number): FormGroup { return this.responsibles.at(i) as FormGroup; }

  protected onZipCodeChange(index: number): void {
    const group = this.addresses.at(index) as FormGroup;

    const zipCode = group.get('zipCode')?.value?.replace(/\D/g, '');

    if (!zipCode || zipCode.length !== 8) {
      return;
    }

    this.addressService.apiAddressCepGet(zipCode).subscribe({
      next: address => {
        group.patchValue({
          street: address.street,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          complement: address.complement
        });
      }
    });
  }

  protected addAddress(): void {
    this.addresses.push(this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      neighborhood: ['', Validators.required],
      number: ['', Validators.required],
      typeAddress: ['' as AddressType | '', Validators.required],
      complement: [''],
    }));
  }

  protected removeAddress(i: number): void { this.addresses.removeAt(i); }

  protected addResponsible(): void {
    this.responsibles.push(this.fb.group({
      relatedPersonId: [''],
      selectedPersonName: [''],
      relationshipType: ['' as RelationshipType | '', Validators.required],
    }));
  }

  protected removeResponsible(i: number): void { this.responsibles.removeAt(i); }

  protected onBirthDayChange(): void {
    this.isMinorSignal.set(this.checkIsMinor(this.form.get('birthDay')?.value));
  }

  private checkIsMinor(birthDay: string | null | undefined): boolean {
    if (!birthDay) return false;
    const birth = new Date(birthDay);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age < 18;
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
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
        .filter(r => r.relationshipType)
        .map(r => ({
          relatedPersonId: r.relatedPersonId || null,
          relationshipType: r.relationshipType as RelationshipType,
        })),
    };
  }
}
