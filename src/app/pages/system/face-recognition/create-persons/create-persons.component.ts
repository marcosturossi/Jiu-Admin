import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { RegisterMultipleResponse } from '../../../../generated_services/api2/model/registerMultipleResponse';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { ShowStudentDTO } from '../../../../generated_services/model/showStudentDTO';

@Component({
  selector: 'app-create-persons',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-persons.component.html',
  styleUrl: './create-persons.component.scss'
})
export class CreatePersonsComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() personCreated = new EventEmitter<RegisterMultipleResponse>();

  personForm: FormGroup;
  isCreating = false;
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  students: ShowStudentDTO[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private personsService: PersonsService,
    private studentsService: StudentsService
  ) {
    this.personForm = this.formBuilder.group({
      studentId: ['', Validators.required],
      images: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.studentsService.apiStudentsActiveGet().subscribe({
      next: (students) => {
        this.students = students;
      },
      error: () => {
        alert('Erro ao carregar alunos.');
      }
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
    const studentId = this.personForm.get('studentId')?.value;
    const images = this.selectedFiles;
    if (!studentId || !images || images.length === 0) {
      alert('Preencha todos os campos obrigatórios.');
      this.isCreating = false;
      return;
    }
    const student = this.students.find(s => s.id === studentId);
    const name = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : '';
    this.personsService.registerMultiplePhotosApiV1RegisterMultiplePost(name, images, studentId).subscribe({
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
