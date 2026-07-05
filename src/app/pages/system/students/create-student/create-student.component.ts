import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { CreateStudentDTO } from '../../../../generated_services/model/createStudentDTO';
import { NotificationService } from '../../../../services/notification.service';
import { AddressType } from '../../../../generated_services/model/addressType';
import { RelationshipType } from '../../../../generated_services/model/relationshipType';
import { ShowStudentDTO } from '../../../../generated_services/model/showStudentDTO';
import { CreateAddressDTO } from '../../../../generated_services';

@Component({
  selector: 'app-create-student',
  imports: [ReactiveFormsModule],
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

  protected readonly addressTypes = Object.values(AddressType);
  protected readonly relationshipTypes = Object.values(RelationshipType);

  protected readonly responsibleSearchResults = signal<ShowStudentDTO[][]>([]);

  protected readonly form = this.fb.group({
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    birthDay: [null as string | null, Validators.required],
    cpf: [null as string | null, Validators.required],
    isActive: [true],
    addresses: this.fb.array([]),
    responsibles: this.fb.array([]),
  });

  protected get addresses() {
    return this.form.get('addresses') as FormArray;
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
      complement: ['']
    }));
  }

  protected get responsibles() {
    return this.form.get('responsibles') as FormArray;
  }

  protected addResponsible(): void {
    this.responsibles.push(this.fb.group({
      mode: ['search'],
      searchQuery: [''],
      relatedPersonId: [''],
      selectedPersonName: [''],
      relationshipType: ['' as RelationshipType | '', Validators.required],
      firstName: [''],
      lastName: [''],
      cpf: [''],
      phoneNumber: [''],
      email: [''],
    }));
    this.responsibleSearchResults.update(r => [...r, []]);
  }

  protected removeAddress(index: number): void {
    this.addresses.removeAt(index);
  }

  protected removeResponsible(index: number): void {
    this.responsibles.removeAt(index);
    this.responsibleSearchResults.update(r => r.filter((_, i) => i !== index));
  }

  protected getResponsibleGroup(index: number): FormGroup {
    return this.responsibles.at(index) as FormGroup;
  }

  protected setResponsibleMode(index: number, mode: 'search' | 'create'): void {
    const group = this.getResponsibleGroup(index);
    group.patchValue({ mode, searchQuery: '', relatedPersonId: '', selectedPersonName: '' });
    this.responsibleSearchResults.update(r => r.map((res, i) => i === index ? [] : res));
  }

  protected searchResponsible(index: number): void {
    const query: string = this.getResponsibleGroup(index).get('searchQuery')?.value ?? '';
    if (!query.trim()) {
      this.responsibleSearchResults.update(r => r.map((res, i) => i === index ? [] : res));
      return;
    }
    this.studentsService.apiStudentsGet(query).subscribe({
      next: (data) => {
        const results = data.items ?? [];
        this.responsibleSearchResults.update(r => r.map((res, i) => i === index ? results : res));
      },
      error: () => this.notificationService.showError('Erro', 'Não foi possível buscar pessoas.'),
    });
  }

  protected selectResponsible(index: number, student: ShowStudentDTO): void {
    this.getResponsibleGroup(index).patchValue({
      relatedPersonId: student.id,
      selectedPersonName: student.fullName ?? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim(),
      searchQuery: '',
    });
    this.responsibleSearchResults.update(r => r.map((res, i) => i === index ? [] : res));
  }

  protected clearSelectedResponsible(index: number): void {
    this.getResponsibleGroup(index).patchValue({ relatedPersonId: '', selectedPersonName: '' });
  }

  protected close(): void { this.closeEvent.emit(); }

  protected save(): void {
    if (this.form.invalid) {
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.studentsService.apiStudentsPost(this.toDTO()).subscribe({
      next: () => { this.notificationService.showSuccess('Sucesso!', 'Aluno criado com sucesso.'); this.studentCreated.emit(); },
      error: () => { this.notificationService.showError('Erro!', 'Erro ao criar aluno. Tente novamente.'); }
    });
  }

  protected isMinor(): boolean {
    const birthDay = this.form.get('birthDay')?.value;
    if (!birthDay) return false;
    const birthDate = new Date(birthDay);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 < 18;
    }
    return age < 18;
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
        relatedPersonId: r.mode === 'search' ? r.relatedPersonId : undefined,
        relationshipType: r.relationshipType as RelationshipType,
      })).filter((r: any) => r.relationshipType),
    };
  }
}

