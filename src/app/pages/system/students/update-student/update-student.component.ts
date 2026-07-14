import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowStudentDTO, UpdateStudentDTO, UpdateAddressDTO } from '../../../../generated_services';
import { AddressType } from '../../../../generated_services/model/addressType';
import { RelationshipType } from '../../../../generated_services/model/relationshipType';
import { NotificationService } from '../../../../services/notification.service';
import { AddressFormComponent, buildAddressFormGroup } from '../../../../shared/address-form/address-form.component';

@Component({
  selector: 'app-update-student',
  imports: [ReactiveFormsModule, AddressFormComponent],
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

  protected readonly relationshipTypes = Object.values(RelationshipType);
  protected readonly isMinorSignal = signal(false);

  protected readonly photoUrl = signal<string | null>(null);
  protected readonly photoPreview = signal<string | null>(null);
  protected readonly selectedPhotoFile = signal<File | null>(null);
  protected readonly isUploadingPhoto = signal(false);
  protected readonly isRemovingPhoto = signal(false);

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

      this.cancelPhotoSelection();
      this.loadPhoto(s.id);
    });
  }

  private loadPhoto(studentId: string | null | undefined): void {
    if (!studentId) { this.photoUrl.set(null); return; }
    this.studentsService.apiStudentsIdPhotoUrlGet(studentId).subscribe({
      next: (res: { url: string }) => this.photoUrl.set(res?.url ?? null),
      error: () => this.photoUrl.set(null),
    });
  }

  protected onPhotoSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.notificationService.showError('Arquivo Inválido', 'Por favor, selecione apenas arquivos de imagem.');
      this.cancelPhotoSelection();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.notificationService.showError('Arquivo Muito Grande', 'A foto deve ter no máximo 5MB.');
      this.cancelPhotoSelection();
      return;
    }
    this.selectedPhotoFile.set(file);
    const reader = new FileReader();
    reader.onload = e => this.photoPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  protected cancelPhotoSelection(): void {
    this.selectedPhotoFile.set(null);
    this.photoPreview.set(null);
    const input = document.getElementById('photoInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  protected uploadPhoto(): void {
    const file = this.selectedPhotoFile();
    const studentId = this.student().id;
    if (!file || !studentId || this.isUploadingPhoto()) return;
    this.isUploadingPhoto.set(true);
    this.studentsService.apiStudentsIdPhotoPost(studentId, file).subscribe({
      next: () => {
        this.notificationService.showSuccess('Foto Atualizada!', 'A foto do aluno foi atualizada com sucesso.');
        this.cancelPhotoSelection();
        this.loadPhoto(studentId);
      },
      error: () => this.notificationService.showError('Erro ao Enviar Foto', 'Não foi possível atualizar a foto do aluno. Tente novamente.'),
      complete: () => this.isUploadingPhoto.set(false),
    });
  }

  protected removePhoto(): void {
    const studentId = this.student().id;
    if (!studentId || this.isRemovingPhoto()) return;
    this.isRemovingPhoto.set(true);
    this.studentsService.apiStudentsIdPhotoDelete(studentId).subscribe({
      next: () => {
        this.notificationService.showSuccess('Foto Removida!', 'A foto do aluno foi removida com sucesso.');
        this.photoUrl.set(null);
      },
      error: () => this.notificationService.showError('Erro ao Remover Foto', 'Não foi possível remover a foto do aluno. Tente novamente.'),
      complete: () => this.isRemovingPhoto.set(false),
    });
  }

  protected get addresses(): FormArray { return this.form.get('addresses') as FormArray; }
  protected get responsibles(): FormArray { return this.form.get('responsibles') as FormArray; }

  protected getResponsibleGroup(i: number): FormGroup { return this.responsibles.at(i) as FormGroup; }

  protected addAddress(): void {
    this.addresses.push(buildAddressFormGroup(this.fb));
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
