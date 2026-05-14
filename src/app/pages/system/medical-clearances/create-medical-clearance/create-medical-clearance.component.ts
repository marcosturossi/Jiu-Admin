import { ChangeDetectionStrategy, Component, DestroyRef, inject, output, signal, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MedicalClearanceService } from '../../../../generated_services/api/medicalClearance.service';
import { StudentsService } from '../../../../generated_services/api/students.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { CreateMedicalClearanceDTO } from '../../../../generated_services/model/createMedicalClearanceDTO';
import { ShowStudentDTO } from '../../../../generated_services/model/showStudentDTO';
import { NotificationService } from '../../../../services/notification.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SearchOption } from '../../../../shared/search-select/search-option';
import { SearchSelectComponent } from '../../../../shared/search-select/search-select.component';

@Component({
  selector: 'app-create-medical-clearance',
  imports: [ReactiveFormsModule, SearchSelectComponent],
  templateUrl: './create-medical-clearance.component.html',
  styleUrl: './create-medical-clearance.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateMedicalClearanceComponent implements OnDestroy {
  readonly closeEvent = output<void>();
  readonly medicalClearanceCreated = output<void>();

  private readonly medicalClearanceService = inject(MedicalClearanceService);
  private readonly studentsService = inject(StudentsService);
  private readonly fb = inject(FormBuilder);
  private readonly ns = inject(NotificationService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly students = signal<ShowStudentDTO[]>([]);
  protected readonly studentOptions = signal<SearchOption[]>([]);
  protected readonly selectedStudent = signal<SearchOption | null>(null);
  protected readonly isLoadingStudents = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly filePreviewUrl = signal<SafeResourceUrl | null>(null);
  protected readonly filePreviewLink = signal<string | null>(null);
  protected readonly filePreviewType = signal<'image' | 'pdf' | 'other' | null>(null);
  private readonly studentSearchSubject = new Subject<string>();

  protected readonly form = this.fb.group({
    studentId: ['', Validators.required],
    expiresAt: [null as Date | null, Validators.required],
    isApproved: [false],
    isActive: [true]
  });

  constructor() {
    this.studentSearchSubject.pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.loadStudents(term));
    this.isLoadingStudents.set(true);
    this.loadStudents();
  }

  ngOnDestroy(): void { this.clearFilePreview(); }

  protected close(): void { this.closeEvent.emit(); }

  protected onStudentSelected(opt: SearchOption | null): void {
    this.selectedStudent.set(opt);
    this.form.patchValue({ studentId: opt?.id ?? '' });
  }

  protected onStudentSearch(term: string): void {
    this.studentSearchSubject.next(term);
  }

  private loadStudents(term = ''): void {
    this.isLoadingStudents.set(true);
    this.studentsService.apiStudentsActiveGet(term || undefined, undefined, undefined, undefined, undefined, 1, 100).subscribe({
      next: result => {
        const list = result ?? [];
        this.students.set(list);
        this.studentOptions.set(list.map(s => ({ id: s.id ?? '', label: `${s.firstName} ${s.lastName}` })));
        this.isLoadingStudents.set(false);
      },
      error: () => { this.isLoadingStudents.set(false); this.ns.showError('Erro ao Carregar Alunos', 'Não foi possível carregar a lista de alunos.'); }
    });
  }

  protected create(): void {
    if (this.form.invalid) {
      this.ns.showError('Formulário Inválido', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    this.medicalClearanceService.apiMedicalClearancePost(this.toDTO()).subscribe({
      next: result => {
        this.ns.showSuccess('Atestado Criado!', 'O atestado médico foi criado com sucesso.');
        if (this.selectedFile() && result?.id) {
          this.medicalClearanceService.apiMedicalClearanceIdAttachmentPost(result.id, this.selectedFile()!).subscribe({
            next: () => { this.ns.showSuccess('Arquivo Enviado!', 'O arquivo foi anexado ao atestado médico.'); this.finishCreate(); },
            error: () => { this.ns.showError('Erro ao Enviar Arquivo!', 'O atestado foi criado, mas não foi possível anexar o arquivo.'); this.finishCreate(); }
          });
          return;
        }
        this.finishCreate();
      },
      error: () => this.ns.showError('Erro ao Criar Atestado!', 'Não foi possível criar o atestado médico. Tente novamente.')
    });
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.setFilePreview(file);
  }

  private setFilePreview(file: File | null): void {
    this.clearFilePreview();
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.filePreviewLink.set(url);
    if (file.type.startsWith('image/')) {
      this.filePreviewType.set('image');
      this.filePreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } else if (file.type === 'application/pdf') {
      this.filePreviewType.set('pdf');
      this.filePreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    } else {
      this.filePreviewType.set('other');
    }
  }

  private clearFilePreview(): void {
    const link = this.filePreviewLink();
    if (link) URL.revokeObjectURL(link);
    this.filePreviewLink.set(null);
    this.filePreviewUrl.set(null);
    this.filePreviewType.set(null);
  }

  protected finishCreate(): void { this.medicalClearanceCreated.emit(); this.close(); }

  private toDTO(): CreateMedicalClearanceDTO {
    const v = this.form.value;
    return {
      studentId: v.studentId,
      expiresAt: v.expiresAt ? (v.expiresAt as Date).toISOString() : null,
      isApproved: v.isApproved,
      isActive: v.isActive
    } as CreateMedicalClearanceDTO;
  }
}
