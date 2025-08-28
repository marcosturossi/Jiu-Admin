import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { PersonDetailResponse } from '../../../../generated_services/api2/model/personDetailResponse';
import { FaceImageResponse } from '../../../../generated_services/api2/model/faceImageResponse';

@Component({
  selector: 'app-update-persons',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './update-persons.component.html',
  styleUrl: './update-persons.component.scss'
})
export class UpdatePersonsComponent implements OnInit {
  @Input() person!: PersonDetailResponse;
  @Output() closeEvent = new EventEmitter<void>();
  @Output() personUpdated = new EventEmitter<PersonDetailResponse>();

  personForm: FormGroup;
  isUpdating = false;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private personsService: PersonsService
  ) {
    this.personForm = this.formBuilder.group({
      name: ['', Validators.required],
      images: [null]
    });
  }

  ngOnInit(): void {
    if (this.person) {
      this.personForm.patchValue({
        name: this.person.name
      });
      this.previewUrls = this.person.images?.map(img => this.getImageSrc(img)) || [];
    }
  }

  onFilesSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFiles = Array.from(target.files);
      this.previewUrls = [];
      for (const file of this.selectedFiles) {
        if (!file.type.startsWith('image/')) {
          alert('Por favor, selecione apenas arquivos de imagem.');
          this.clearImages();
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('O arquivo deve ter no máximo 5MB.');
          this.clearImages();
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrls.push(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
      this.personForm.get('images')?.setValue(this.selectedFiles);
    }
  }

  clearImages(): void {
    this.selectedFiles = [];
    this.previewUrls = this.person.images?.map(img => this.getImageSrc(img)) || [];
    this.personForm.get('images')?.setValue(null);
    const fileInput = document.getElementById('imagesInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  update(): void {
    if (this.personForm.invalid || this.isUpdating) return;
    this.isUpdating = true;
    const name = this.personForm.get('name')?.value;
    const images = this.selectedFiles;
    // Atualiza apenas o nome (caso mude)
    if (name !== this.person.name) {
      // Não há endpoint de update direto, então só exibe mensagem
      this.person.name = name;
    }
    // Adiciona novas imagens se houver
    if (images && images.length > 0) {
      this.personsService.addPersonImagesApiV1PersonsPersonIdImagesPost(this.person.id, images).subscribe({
        next: () => {
          alert('Imagens adicionadas com sucesso!');
          this.personUpdated.emit(this.person);
          this.close();
        },
        error: () => {
          alert('Erro ao adicionar imagens.');
          this.isUpdating = false;
        },
        complete: () => {
          this.isUpdating = false;
        }
      });
    } else {
      // Só nome alterado
      this.personUpdated.emit(this.person);
      this.close();
      this.isUpdating = false;
    }
  }

  close() {
    this.closeEvent.emit();
  }

  removeImage(img: FaceImageResponse): void {
    if (confirm('Tem certeza que deseja remover esta imagem?')) {
      this.personsService.removePersonImageApiV1PersonsPersonIdImagesImageIdDelete(this.person.id, img.id).subscribe({
        next: () => {
          // Remove the image from the local array
          this.person.images = this.person.images?.filter(image => image.id !== img.id) || [];
          // Update preview URLs
          this.previewUrls = this.person.images?.map(image => this.getImageSrc(image)) || [];
          alert('Imagem removida com sucesso!');
        },
        error: (error) => {
          console.error('Erro ao remover imagem:', error);
          alert('Erro ao remover imagem.');
        }
      });
    }
  }

  getImageSrc(img: any): string {
    if (!img || !img.base64) {
      console.warn('Image or base64 data is missing:', img);
      return '';
    }
    
    // Clean the base64 string (remove any whitespace or invalid characters)
    let base64 = img.base64.trim();
    
    // Check if base64 already includes data:image prefix
    if (base64.startsWith('data:image')) {
      return base64;
    }
    
    // Remove any data:image prefix that might be embedded in the base64 string
    if (base64.includes('base64,')) {
      base64 = base64.split('base64,')[1];
    }
    
    // If not, add the prefix
    try {
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('Error creating image src:', error, img);
      return '';
    }
  }
}
