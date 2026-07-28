import { ChangeDetectionStrategy, Component, inject, input, output, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { PersonDetailResponse } from '../../../../generated_services/api2/model/personDetailResponse';
import { FaceImageResponse } from '../../../../generated_services/api2/model/faceImageResponse';
import { NotificationService } from '../../../../services/notification.service';
import { ConfirmService } from '../../../../services/confirm.service';
import { extractErrorMessage } from '../../../../utils/error.utils';
import { FieldErrorComponent } from '../../../../shared/field-error/field-error.component';

@Component({
  selector: 'app-update-persons',
  standalone: true,
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './update-persons.component.html',
  styleUrl: './update-persons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdatePersonsComponent {
  readonly person = input.required<PersonDetailResponse>();
  readonly closeEvent = output<void>();
  readonly personUpdated = output<PersonDetailResponse>();

  private readonly fb = inject(FormBuilder);
  private readonly personsService = inject(PersonsService);
  private readonly ns = inject(NotificationService);
  private readonly confirmService = inject(ConfirmService);

  protected readonly isUpdating = signal(false);
  protected readonly selectedFiles = signal<File[]>([]);
  protected readonly previewUrls = signal<string[]>([]);
  protected readonly existingImages = signal<FaceImageResponse[]>([]);

  protected readonly personForm = this.fb.group({
    name: ['', Validators.required],
    images: [null as File[] | null]
  });

  constructor() {
    effect(() => {
      const p = this.person();
      if (p) {
        this.personForm.patchValue({ name: p.name });
        this.existingImages.set(p.images ?? []);
        this.previewUrls.set((p.images ?? []).map(img => this.getImageSrc(img)));
      }
    });
  }

  protected onFilesSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.files?.length) return;
    const files = Array.from(target.files);
    for (const file of files) {
      if (!file.type.startsWith('image/')) { this.ns.showError('Arquivo Inválido', 'Por favor, selecione apenas arquivos de imagem.'); this.clearImages(); return; }
      if (file.size > 5 * 1024 * 1024) { this.ns.showError('Arquivo Muito Grande', 'O arquivo deve ter no máximo 5MB.'); this.clearImages(); return; }
    }
    this.selectedFiles.set(files);
    const urls: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = e => { urls.push(e.target?.result as string); this.previewUrls.set([...urls]); };
      reader.readAsDataURL(file);
    });
    this.personForm.get('images')?.setValue(files as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  protected clearImages(): void {
    this.selectedFiles.set([]);
    this.previewUrls.set(this.existingImages().map(img => this.getImageSrc(img)));
    this.personForm.get('images')?.setValue(null);
    const input = document.getElementById('imagesInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  protected update(): void {
    if (this.personForm.invalid || this.isUpdating()) return;
    this.isUpdating.set(true);
    const images = this.selectedFiles();
    if (images.length > 0) {
      this.personsService.addPersonImagesApiV1PersonsPersonIdImagesPost(this.person().id, images).subscribe({
        next: () => { this.ns.showSuccess('Imagens Adicionadas!', 'As imagens foram adicionadas com sucesso.'); this.personUpdated.emit(this.person()); this.close(); },
        error: (err) => { this.ns.showError('Erro ao Adicionar Imagens', extractErrorMessage(err, 'Não foi possível adicionar as imagens.')); this.isUpdating.set(false); },
        complete: () => this.isUpdating.set(false)
      });
    } else {
      this.personUpdated.emit(this.person());
      this.close();
      this.isUpdating.set(false);
    }
  }

  protected close(): void { this.closeEvent.emit(); }

  protected async removeImage(img: FaceImageResponse): Promise<void> {
    const ok = await this.confirmService.confirm('Tem certeza que deseja remover esta imagem?');
    if (!ok) return;
    this.personsService.removePersonImageApiV1PersonsPersonIdImagesImageIdDelete(this.person().id, img.id).subscribe({
      next: () => {
        this.ns.showSuccess('Imagem Removida!', 'A imagem foi removida com sucesso.');
        this.existingImages.set(this.existingImages().filter(i => i.id !== img.id));
        this.previewUrls.set(this.existingImages().map(i => this.getImageSrc(i)));
      },
      error: (err) => this.ns.showError('Erro ao Remover Imagem', extractErrorMessage(err, 'Não foi possível remover a imagem.'))
    });
  }

  protected getImageSrc(img: any): string {
    if (!img?.base64) return '';
    let base64 = img.base64.trim();
    if (base64.startsWith('data:image')) return base64;
    if (base64.includes('base64,')) base64 = base64.split('base64,')[1];
    return `data:image/png;base64,${base64}`;
  }
}
