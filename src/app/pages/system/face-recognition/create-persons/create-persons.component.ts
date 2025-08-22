import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { RegisterMultipleResponse } from '../../../../generated_services/api2/model/registerMultipleResponse';

@Component({
  selector: 'app-create-persons',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-persons.component.html',
  styleUrl: './create-persons.component.scss'
})
export class CreatePersonsComponent {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() personCreated = new EventEmitter<RegisterMultipleResponse>();

  personForm: FormGroup;
  isCreating = false;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private personsService: PersonsService
  ) {
    this.personForm = this.formBuilder.group({
      name: ['', Validators.required],
      images: [null, Validators.required]
    });
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
    this.previewUrls = [];
    this.personForm.get('images')?.setValue(null);
    const fileInput = document.getElementById('imagesInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  create(): void {
    if (this.personForm.invalid || this.isCreating) return;
    this.isCreating = true;
    const name = this.personForm.get('name')?.value;
    const images = this.selectedFiles;
    if (!name || !images || images.length === 0) {
      alert('Preencha todos os campos obrigatórios.');
      this.isCreating = false;
      return;
    }
    this.personsService.registerMultiplePhotosApiV1RegisterMultiplePost(name, images).subscribe({
      next: (result: RegisterMultipleResponse) => {
        alert('Pessoa criada com sucesso!');
        this.personCreated.emit(result);
        this.close();
      },
      error: (err) => {
        alert('Erro ao criar pessoa.');
        this.isCreating = false;
      },
      complete: () => {
        this.isCreating = false;
      }
    });
  }

  close() {
    this.closeEvent.emit();
  }
}
