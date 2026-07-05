import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';

import { SupplierService } from '../../../../generated_services/api/supplier.service';
import { FinancialTransactionService } from '../../../../generated_services/api/financialTransaction.service';
import { ShowSupplierDTO } from '../../../../generated_services/model/showSupplierDTO';
import { PaginatedResultOfShowFinancialTransactionDTO } from '../../../../generated_services/model/paginatedResultOfShowFinancialTransactionDTO';
import { NotificationService } from '../../../../services/notification.service';
import { SubnavService } from '../../../../services/subnav.service';
import { UpdateSupplierComponent } from '../update-supplier/update-supplier.component';

@Component({
  selector: 'app-detail-supplier',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, UpdateSupplierComponent],
  templateUrl: './detail-supplier.component.html',
  styleUrl: './detail-supplier.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailSupplierComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supplierService = inject(SupplierService);
  private readonly financialTransactionService = inject(FinancialTransactionService);
  private readonly notificationService = inject(NotificationService);
  private readonly subnavService = inject(SubnavService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly supplier = signal<ShowSupplierDTO | null>(null);
  protected readonly transactions = signal<PaginatedResultOfShowFinancialTransactionDTO | null>(null);
  protected readonly isLoadingSupplier = signal(false);
  protected readonly isLoadingTransactions = signal(false);
  protected readonly openedUpdate = signal(false);

  ngOnInit(): void {
    this.subnavService.setTitle('Detalhes do Fornecedor');
    this.loadSupplier();
  }

  protected loadSupplier(): void {
    this.isLoadingSupplier.set(true);
    this.supplierService.apiSupplierIdGet(this.id).subscribe({
      next: s => {
        this.supplier.set(s);
        this.isLoadingSupplier.set(false);
        if (s.personId) {
          this.loadTransactions(s.personId);
        }
      },
      error: () => {
        this.notificationService.showError('Erro', 'Não foi possível carregar o fornecedor.');
        this.isLoadingSupplier.set(false);
      },
    });
  }

  protected loadTransactions(personId: string): void {
    this.isLoadingTransactions.set(true);
    this.financialTransactionService.apiFinancialTransactionGet(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1 as any,
      10 as any,
      undefined,
      undefined,
      personId,
    ).subscribe({
      next: data => {
        this.transactions.set(data);
        this.isLoadingTransactions.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro', 'Não foi possível carregar as transações.');
        this.isLoadingTransactions.set(false);
      },
    });
  }

  protected openUpdate(): void { this.openedUpdate.set(true); }

  protected goBack(): void { this.router.navigate(['/system/suppliers']); }

  protected onSupplierUpdated(): void {
    this.openedUpdate.set(false);
    this.loadSupplier();
  }

  protected transactionStatusBadge(status: string | undefined): string {
    switch (status) {
      case 'Paid':      return 'bg-success';
      case 'Pending':   return 'bg-warning text-dark';
      case 'Overdue':   return 'bg-danger';
      case 'Cancelled': return 'bg-secondary';
      case 'Refunded':  return 'bg-secondary';
      default:          return 'bg-secondary';
    }
  }

  protected transactionStatusLabel(status: string | undefined): string {
    const map: Record<string, string> = {
      Paid:      'Pago',
      Pending:   'Pendente',
      Overdue:   'Vencido',
      Cancelled: 'Cancelado',
      Refunded:  'Reembolsado',
    };
    return map[status ?? ''] ?? status ?? '';
  }

  protected transactionTypeBadge(type: string | undefined): string {
    switch (type) {
      case 'Income':     return 'bg-success';
      case 'Expense':    return 'bg-danger';
      case 'Refund':     return 'bg-info text-dark';
      case 'Adjustment': return 'bg-secondary';
      default:           return 'bg-secondary';
    }
  }

  protected transactionTypeLabel(type: string | undefined): string {
    const map: Record<string, string> = {
      Income:     'Receita',
      Expense:    'Despesa',
      Refund:     'Reembolso',
      Adjustment: 'Ajuste',
    };
    return map[type ?? ''] ?? type ?? '';
  }

  protected addressTypeLabel(type: string | undefined): string {
    const map: Record<string, string> = {
      Comercial:   'Comercial',
      Residential: 'Residencial',
    };
    return map[type ?? ''] ?? 'Não informado';
  }
}
