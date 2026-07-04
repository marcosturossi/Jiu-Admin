import { Component, inject, OnInit, } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContractService, GraduationService, PaginatedResultOfShowContractDTO, PaginatedResultOfShowFinancialTransactionDTO, PaginatedResultOfShowGraduationDTO, ShowContractDTO, ShowStudentDTO, StudentsService } from '../../../../generated_services';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-detail-student',
  imports: [DatePipe],
  templateUrl: './detail-student.component.html',
  styleUrl: './detail-student.component.scss',
})
export class DetailStudentComponent implements OnInit {
  ngOnInit(): void {
    this.getContract();
    this.getStudent();
    this.getGraduations();
  }
  private readonly route = inject(ActivatedRoute);
  private id = this.route.snapshot.paramMap.get('id');

  private readonly graduationService = inject(GraduationService);
  private readonly contractService = inject(ContractService);
  private readonly studentService = inject(StudentsService);

  student: ShowStudentDTO | null = null;
  contracts: PaginatedResultOfShowContractDTO | null = null;
  transactions: PaginatedResultOfShowFinancialTransactionDTO | null = null;
  graduations: PaginatedResultOfShowGraduationDTO | null = null;

  private getStudent() {
    this.studentService.apiStudentsIdGet(this.id as string).subscribe({
      next: (student) => {
        this.student = student;
      },
      error: (error) => {
        console.error('Error fetching student:', error);
      }
    });
  }

  private getGraduations() {
    this.graduationService.apiGraduationGet(
      this.id as string,
      undefined,
      undefined,
      undefined,
      1,
      10,
      undefined,
      true,
    ).subscribe({
      next: (graduations) => {
        this.graduations = graduations;
      },
      error: (error) => {
        console.error('Error fetching graduations:', error);
      }
    });
  }
  private getContract() {
    this.contractService.apiContractGet(undefined,
      this.id as string,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1,
      10).subscribe({
        next: (contracts) => {
          this.contracts = contracts;
        },
        error: (error) => {
          console.error('Error fetching contracts:', error);
        }
      });

  }

  protected updateStudent(){

  }
}
