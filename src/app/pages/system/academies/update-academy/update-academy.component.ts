import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AcademyService } from '../../../../generated_services/api/academy.service';
import { AddressService } from '../../../../generated_services/api/address.service';
import { ShowAcademyDto } from '../../../../generated_services/model/showAcademyDto';
import { UpdateAcademyDto } from '../../../../generated_services/model/updateAcademyDto';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';

@Component({
  selector: 'app-update-academy',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './update-academy.component.html',
  styleUrl: './update-academy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateAcademyComponent {
  readonly closeEvent = output<void>();
  readonly academyUpdated = output<void>();
  readonly academy = input.required<ShowAcademyDto>();

  private readonly fb = inject(FormBuilder);
  private readonly academyService = inject(AcademyService);
  private readonly addressService = inject(AddressService);
  private readonly notificationService = inject(NotificationService);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    isActive: [true],
    cnpj: [''],
    email: ['', Validators.email],
    zipCode: [''],
    street: [''],
    number: [''],
    complement: [''],
    neighborhood: [''],
    city: [''],
    state: [''],
  });

  constructor() {
    effect(() => {
      const a = this.academy();
      this.form.patchValue({
        name: a.name ?? '',
        isActive: a.isActive ?? true,
        cnpj: a.cnpj ?? '',
        email: a.email ?? '',
        zipCode: a.zipCode ?? '',
        street: a.street ?? '',
        number: a.number ?? '',
        complement: a.complement ?? '',
        neighborhood: a.neighborhood ?? '',
        city: a.city ?? '',
        state: a.state ?? '',
      });
    });
  }

  protected close(): void {
    this.closeEvent.emit();
  }

  /** Mirrors AddressFormComponent's CEP autofill (used for student addresses). */
  protected onZipCodeChange(): void {
    const zipCode = (this.form.value.zipCode ?? '').replace(/\D/g, '');
    if (zipCode.length !== 8) return;

    this.addressService.apiAddressCepGet(zipCode).subscribe({
      next: (address) => {
        this.form.patchValue({
          street: address.street,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          complement: address.complement,
        });
      },
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    const a = this.academy();
    this.academyService.apiAdminAcademiesIdPut(a.id!, this.toDTO()).subscribe({
      next: () => {
        this.notificationService.showSuccess('Academia Atualizada!', `A academia "${a.name}" foi atualizada com sucesso.`);
        this.academyUpdated.emit();
      },
      error: (err) => {
        this.notificationService.showError('Erro ao Atualizar', extractErrorMessage(err, 'Não foi possível atualizar a academia. Tente novamente.'));
      },
    });
  }

  private toDTO(): UpdateAcademyDto {
    const v = this.form.value;
    return {
      name: v.name!,
      isActive: v.isActive ?? true,
      cnpj: v.cnpj || null,
      email: v.email || null,
      zipCode: v.zipCode || null,
      street: v.street || null,
      number: v.number || null,
      complement: v.complement || null,
      neighborhood: v.neighborhood || null,
      city: v.city || null,
      state: v.state || null,
    } as UpdateAcademyDto;
  }
}
