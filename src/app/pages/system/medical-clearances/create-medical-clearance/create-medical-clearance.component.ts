import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { MedicalClearanceService } from '../../../../generated_services/api/medicalClearance.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateMedicalClearanceDTO } from '../../../../generated_services/model/createMedicalClearanceDTO';
import { ShowStudentDTO } from '../../../../generated_services/model/showStudentDTO';
import { NotificationService } from '../../../../services/notification.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-create-medical-clearance',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-medical-clearance.component.html',
  styleUrl: './create-medical-clearance.component.scss'
})
export class CreateMedicalClearanceComponent implements OnInit, OnDestroy {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() medicalClearanceCreated = new EventEmitter<void>();
  medicalClearanceForm!: FormGroup;
  students: ShowStudentDTO[] = [];
  isLoadingStudents: boolean = false;
  selectedFile: File | null = null;
  filePreviewUrl: SafeResourceUrl | null = null;
  filePreviewLink: string | null = null;
  filePreviewType: 'image' | 'pdf' | 'other' | null = null;

  constructor(
    private medicalClearanceService: MedicalClearanceService,
    private studentsService: StudentsService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer
  ) {
    console.log('CreateMedicalClearanceComponent constructor called');
    this.medicalClearanceForm = this.formBuilder.group({
      studentId: ["", Validators.required],
      expiresAt: ["", Validators.required],
      isApproved: [false],
      isActive: [true],
    })
  }

  ngOnInit(): void {
    console.log('CreateMedicalClearanceComponent ngOnInit called');
    this.loadStudents();
  }

  ngOnDestroy(): void {
    this.clearFilePreview();
  }

  loadStudents(): void {
    this.isLoadingStudents = true;
    console.log('Loading students...');
    this.studentsService.apiStudentsGet(1, 100).subscribe({
      next: (result) => {
        console.log('Students loaded:', result);
        console.log('Students items:', result.items);
        this.students = result.items || [];
        console.log('Students array:', this.students);
        this.isLoadingStudents = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.isLoadingStudents = false;
        this.notificationService.showError(
          'Erro ao Carregar Alunos', 
          'Não foi possível carregar a lista de alunos.'
        );
      }
    });
  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    if (this.medicalClearanceForm.invalid) {
      this.notificationService.showError(
        'Formulário Inválido', 
        'Por favor, preencha todos os campos obrigatórios.'
      );
      return;
    }

    this.medicalClearanceService.apiMedicalClearancePost(this.formToCreateMedicalClearance()).subscribe({
      next: result => {
        this.notificationService.showSuccess(
          'Atestado Criado!', 
          'O atestado médico foi criado com sucesso.'
        );
        if (this.selectedFile && result?.id) {
          this.medicalClearanceService.apiMedicalClearanceIdAttachmentPost(result.id, this.selectedFile).subscribe({
            next: () => {
              this.notificationService.showSuccess(
                'Arquivo Enviado!',
                'O arquivo foi anexado ao atestado médico.'
              );
              this.finishCreate();
            },
            error: (error) => {
              console.log(error);
              this.notificationService.showError(
                'Erro ao Enviar Arquivo!',
                'O atestado foi criado, mas não foi possível anexar o arquivo.'
              );
              this.finishCreate();
            }
          });
          return;
        }

        this.finishCreate();
      },
      error: error => {
        console.log(error);
        this.notificationService.showError(
          'Erro ao Criar Atestado!', 
          'Não foi possível criar o atestado médico. Tente novamente.'
        );
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files && input.files.length > 0 ? input.files[0] : null;
    this.setFilePreview(this.selectedFile);
  }

  private setFilePreview(file: File | null): void {
    this.clearFilePreview();

    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    this.filePreviewLink = previewUrl;

    if (file.type.startsWith('image/')) {
      this.filePreviewType = 'image';
      this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl);
      return;
    }

    if (file.type === 'application/pdf') {
      this.filePreviewType = 'pdf';
      this.filePreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(previewUrl);
      return;
    }

    this.filePreviewType = 'other';
  }

  private clearFilePreview(): void {
    if (this.filePreviewLink) {
      URL.revokeObjectURL(this.filePreviewLink);
    }

    this.filePreviewLink = null;
    this.filePreviewUrl = null;
    this.filePreviewType = null;
  }

  finishCreate(): void {
    this.medicalClearanceCreated.emit();
    this.close();
  }

  formToCreateMedicalClearance(): CreateMedicalClearanceDTO {
    const formValue = this.medicalClearanceForm.value;
    return {
      studentId: formValue.studentId,
      expiresAt: formValue.expiresAt,
      isApproved: formValue.isApproved,
      isActive: formValue.isActive,
    } as CreateMedicalClearanceDTO
  }
}
