import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FrequencyService, StudentsService, ShowStudentDTO, ShowLessonDTO, LessonService } from '../../../../generated_services';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateFrequencyDTO } from '../../../../generated_services/model/createFrequencyDTO';
import { CommonModule } from '@angular/common';
import { forkJoin, Observable } from 'rxjs';
// Import PersonsService and models from api2
import { PersonsService } from '../../../../generated_services/api2/api/persons.service';
import { RecognitionResponse } from '../../../../generated_services/api2/model/recognitionResponse';
import { PersonListResponse } from '../../../../generated_services/api2/model/personListResponse';

@Component({
  selector: 'app-create-frequency',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-frequency.component.html',
  styleUrl: './create-frequency.component.scss'
})
export class CreateFrequencyComponent implements OnInit {
  @Output() closeEvent = new EventEmitter<void>();
  @Output() frequencyCreated = new EventEmitter<void>();
  frequencyForm!: FormGroup;
  students: ShowStudentDTO[] = [];
  lessons: ShowLessonDTO[] = [];
  isCreating = false;
  
  // Image recognition properties
  isRecognizing = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  recognizedStudentIds: string[] = [];

  // Add property to cache person list from api2
  private api2Persons: PersonListResponse | null = null;

  constructor(
    private frequencyService: FrequencyService,
    private studentsService: StudentsService,
    private lessonService: LessonService,
    private formBuilder: FormBuilder,
    private personsService: PersonsService // Inject api2 PersonsService
  ) {
    this.frequencyForm = this.formBuilder.group({
      lessonId: ["", Validators.required],
      students: this.formBuilder.array([])
    })
  }

  ngOnInit(): void {
    this.studentsService.apiStudentsGet().subscribe(
      {
        next: (result) => {
          this.students = result;
          this.initializeStudentFormArray();
        }
      }
    )

    this.lessonService.apiLessonGet().subscribe({
      next: (result) => this.lessons = result
    });

    // Load api2 persons for recognition mapping
    this.personsService.listPersonsApiV1PersonsGet().subscribe({
      next: (result) => this.api2Persons = result
    });
  }

  get studentsFormArray(): FormArray {
    return this.frequencyForm.get('students') as FormArray;
  }

  private initializeStudentFormArray(): void {
    const studentsArray = this.formBuilder.array([]);
    this.students.forEach(() => {
      studentsArray.push(new FormControl(false));
    });
    this.frequencyForm.setControl('students', studentsArray);
  }

  getSelectedStudents(): ShowStudentDTO[] {
    return this.students.filter((student, index) => 
      this.studentsFormArray.at(index).value === true
    );
  }

  getSelectedStudentsCount(): number {
    return this.studentsFormArray.value.filter((selected: boolean) => selected).length;
  }

  isFormValid(): boolean {
    const hasSelectedStudents = this.studentsFormArray.value.some((selected: boolean) => selected);
    const hasSelectedLesson = this.frequencyForm.get('lessonId')?.value;
    return hasSelectedStudents && hasSelectedLesson;
  }

  toggleSelectAll(): void {
    const allSelected = this.studentsFormArray.value.every((selected: boolean) => selected);
    this.studentsFormArray.controls.forEach(control => {
      control.setValue(!allSelected);
    });
  }

  isAllSelected(): boolean {
    return this.studentsFormArray.value.length > 0 && 
           this.studentsFormArray.value.every((selected: boolean) => selected);
  }

  // Image upload and recognition methods
  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.selectedFile = target.files[0];
      
      // Validate file type
      if (!this.selectedFile.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        this.clearImage();
        return;
      }

      // Validate file size (5MB limit)
      if (this.selectedFile.size > 5 * 1024 * 1024) {
        alert('O arquivo deve ter no máximo 5MB.');
        this.clearImage();
        return;
      }

      // Create preview
      this.createImagePreview();
    }
  }

  private createImagePreview(): void {
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  clearImage(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.recognizedStudentIds = [];
    
    // Clear file input
    const fileInput = document.getElementById('imageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async recognizeStudents(): Promise<void> {
    if (!this.selectedFile || !this.frequencyForm.get('lessonId')?.value) {
      alert('Por favor, selecione uma aula e uma imagem primeiro.');
      return;
    }

    this.isRecognizing = true;
    try {
      // Call the API2 recognition service
      const recognitionResult = await this.personsService
        .recognizeFacesApiV1RecognizePost(this.selectedFile, false)
        .toPromise() as RecognitionResponse;

      // Map recognized faces to student IDs
      const recognizedIds: string[] = [];
      if (recognitionResult && recognitionResult.faces && this.api2Persons) {
        for (const face of recognitionResult.faces) {
          if (face.person_id) {
            // Try to find a student with the same id as person_id
            const student = this.students.find(s => s.id === face.person_id);
            if (student) {
              recognizedIds.push(student.id!);
            } else {
              // Try to match by name if id is not found
              const person = this.api2Persons.persons.find(p => p.id === face.person_id);
              if (person) {
                const matchByName = this.students.find(s => `${s.firstName} ${s.lastName}`.trim().toLowerCase() === person.name.trim().toLowerCase());
                if (matchByName) {
                  recognizedIds.push(matchByName.id!);
                }
              }
            }
          }
        }
      }
      this.handleRecognitionResult(recognizedIds);
      this.isRecognizing = false;
    } catch (error) {
      console.error('Error recognizing students:', error);
      alert('Erro ao reconhecer alunos. Tente novamente.');
      this.isRecognizing = false;
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private handleRecognitionResult(studentIds: string[]): void {
    this.recognizedStudentIds = studentIds;
    
    // Auto-select recognized students
    studentIds.forEach(studentId => {
      const index = this.students.findIndex(student => student.id === studentId);
      if (index >= 0) {
        this.studentsFormArray.at(index).setValue(true);
      }
    });

    if (studentIds.length > 0) {
      alert(`${studentIds.length} aluno(s) reconhecido(s) e selecionado(s) automaticamente!`);
    } else {
      alert('Nenhum aluno foi reconhecido na imagem.');
    }
  }

  isStudentRecognized(studentId: string): boolean {
    return this.recognizedStudentIds.includes(studentId);
  }

  close() {
    this.closeEvent.emit();
  }

  create() {
    if (!this.isFormValid() || this.isCreating) return;
    
    this.isCreating = true;
    const selectedStudents = this.getSelectedStudents();
    const lessonId = this.frequencyForm.get('lessonId')?.value;
    
    // Create array of observables for each frequency creation
    const frequencyRequests: Observable<any>[] = selectedStudents.map(student => {
      const frequencyData: CreateFrequencyDTO = {
        studentId: student.id!,
        lessonId: lessonId
      };
      return this.frequencyService.apiFrequencyPost(frequencyData);
    });

    // Execute all requests in parallel
    forkJoin(frequencyRequests).subscribe({
      next: (results) => {
        console.log(`Created ${results.length} frequencies successfully`);
        this.frequencyCreated.emit();
        this.close();
      },
      error: (error) => {
        console.error('Error creating frequencies:', error);
        this.isCreating = false;
      },
      complete: () => {
        this.isCreating = false;
      }
    });
  }
}
