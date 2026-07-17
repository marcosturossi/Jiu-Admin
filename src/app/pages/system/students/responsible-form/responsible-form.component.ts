import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { IndividualPersonsService } from '../../../../generated_services/api/individualPersons.service';
import { RelationshipType } from '../../../../generated_services/model/relationshipType';
import { NotificationService } from '../../../../services/notification.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

export interface ExistingResponsible {
  relatedPersonId?: string | null;
  relationshipType?: RelationshipType | null;
  personName?: string | null;
}

export function buildResponsibleFormGroup(fb: FormBuilder, existing?: ExistingResponsible): FormGroup {
  return fb.group({
    relatedPersonId: [existing?.relatedPersonId ?? '', Validators.required],
    personName: [existing?.personName ?? ''],
    relationshipType: [existing?.relationshipType ?? '' as RelationshipType | '', Validators.required],
    cpf: [''],
    firstName: [''],
    lastName: [''],
    email: ['', Validators.email],
    phoneNumber: [''],
  });
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  Mother: 'Mãe',
  Father: 'Pai',
  LegalGuardian: 'Responsável Legal',
};

@Component({
  selector: 'app-responsible-form',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './responsible-form.component.html',
  styleUrl: './responsible-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsibleFormComponent {
  readonly group = input.required<FormGroup>();
  readonly index = input(0);
  readonly remove = output<void>();

  private readonly individualPersonsService = inject(IndividualPersonsService);
  private readonly notificationService = inject(NotificationService);

  protected readonly relationshipTypes = Object.values(RelationshipType);
  protected readonly notFoundMode = signal(false);
  protected readonly isSearching = signal(false);
  protected readonly isCreating = signal(false);

  protected relationshipLabel(type: string): string {
    return RELATIONSHIP_LABELS[type] ?? type;
  }

  protected isResolved(): boolean {
    return !!this.group().get('relatedPersonId')?.value;
  }

  protected searchByCpf(): void {
    const cpf = (this.group().get('cpf')?.value ?? '').replace(/\D/g, '');
    if (cpf.length !== 11) {
      this.notificationService.showError('CPF Inválido', 'Informe um CPF válido com 11 dígitos para buscar.');
      return;
    }

    this.isSearching.set(true);
    this.individualPersonsService.apiIndividualPersonsGet(undefined, undefined, undefined, cpf).subscribe({
      next: (result) => {
        this.isSearching.set(false);
        const found = (result.items ?? [])[0];
        if (found) {
          this.group().patchValue({
            relatedPersonId: found.personId,
            personName: `${found.firstName ?? ''} ${found.lastName ?? ''}`.trim(),
          });
          this.notFoundMode.set(false);
        } else {
          this.notFoundMode.set(true);
        }
      },
      error: (err) => {
        this.isSearching.set(false);
        this.notificationService.showError('Erro', extractErrorMessage(err, 'Não foi possível buscar pessoa pelo CPF.'));
      },
    });
  }

  protected createAndLink(): void {
    const v = this.group().getRawValue();
    const cpf = (v.cpf ?? '').replace(/\D/g, '');
    if (!v.firstName || !v.lastName || !v.email || cpf.length !== 11) {
      this.notificationService.showError('Formulário Inválido', 'Preencha nome, sobrenome, e-mail e CPF do responsável.');
      return;
    }

    this.isCreating.set(true);
    this.individualPersonsService.apiIndividualPersonsPost({
      firstName: v.firstName,
      lastName: v.lastName,
      email: v.email,
      phoneNumber: v.phoneNumber || null,
      cpf,
    }).subscribe({
      next: (created) => {
        this.isCreating.set(false);
        this.group().patchValue({
          relatedPersonId: created.personId,
          personName: `${created.firstName ?? ''} ${created.lastName ?? ''}`.trim(),
        });
        this.notFoundMode.set(false);
      },
      error: (err) => {
        this.isCreating.set(false);
        this.notificationService.showError('Erro', extractErrorMessage(err, 'Não foi possível criar a pessoa responsável.'));
      },
    });
  }

  protected clear(): void {
    this.group().patchValue({ relatedPersonId: '', personName: '', cpf: '', firstName: '', lastName: '', email: '', phoneNumber: '' });
    this.notFoundMode.set(false);
  }
}
