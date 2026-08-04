import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MyAcademyService } from '../../../generated_services/api/myAcademy.service';
import { AddressService } from '../../../generated_services/api/address.service';
import { UpdateMyAcademyDto } from '../../../generated_services/model/updateMyAcademyDto';
import { ShowAcademyDto } from '../../../generated_services/model/showAcademyDto';
import { NotificationService } from '../../../services/notification.service';
import { SubnavService } from '../../../services/subnav.service';
import { extractErrorMessage } from '../../../utils/error.utils';
import { FieldErrorComponent } from '../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-academy-profile',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './academy-profile.component.html',
  styleUrl: './academy-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademyProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly myAcademyService = inject(MyAcademyService);
  private readonly addressService = inject(AddressService);
  private readonly notificationService = inject(NotificationService);
  private readonly subnavService = inject(SubnavService);

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
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

  ngOnInit(): void {
    this.subnavService.setTitle('Dados da Academia');
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.myAcademyService.apiAcademyMeGet().subscribe({
      next: (academy) => {
        this.patchFromAcademy(academy);
        this.form.markAsPristine();
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.notificationService.showError('Erro de Carregamento', extractErrorMessage(err, 'Não foi possível carregar os dados da academia.'));
      },
    });
  }

  /** Mirrors AddressFormComponent's CEP autofill (used for student addresses) so filling in the
   *  academy's own address gets the same convenience. */
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
      this.notificationService.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }
    this.isSaving.set(true);
    this.myAcademyService.apiAcademyMePut(this.toDTO()).subscribe({
      next: (academy) => {
        this.isSaving.set(false);
        this.patchFromAcademy(academy);
        this.form.markAsPristine();
        this.notificationService.showSuccess('Dados Salvos!', 'As informações da academia foram atualizadas com sucesso.');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.showError('Erro ao Salvar', extractErrorMessage(err, 'Não foi possível salvar os dados da academia. Tente novamente.'));
      },
    });
  }

  private patchFromAcademy(academy: ShowAcademyDto): void {
    this.form.patchValue({
      name: academy.name ?? '',
      cnpj: academy.cnpj ?? '',
      email: academy.email ?? '',
      zipCode: academy.zipCode ?? '',
      street: academy.street ?? '',
      number: academy.number ?? '',
      complement: academy.complement ?? '',
      neighborhood: academy.neighborhood ?? '',
      city: academy.city ?? '',
      state: academy.state ?? '',
    });
  }

  private toDTO(): UpdateMyAcademyDto {
    const v = this.form.value;
    return {
      name: v.name ?? null,
      cnpj: v.cnpj || null,
      email: v.email || null,
      zipCode: v.zipCode || null,
      street: v.street || null,
      number: v.number || null,
      complement: v.complement || null,
      neighborhood: v.neighborhood || null,
      city: v.city || null,
      state: v.state || null,
    };
  }
}
