import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';

import { SupplierService } from '../../../../generated_services/api/supplier.service';
import { AccountsPayableService } from '../../../../generated_services/api/accountsPayable.service';
import { ShowSupplierDTO } from '../../../../generated_services/model/showSupplierDTO';
import { ShowAccountsPayableDTO } from '../../../../generated_services/model/showAccountsPayableDTO';
import { NotificationService } from '../../../../services/notification.service';
import { SubnavService } from '../../../../services/subnav.service';
import { UpdateSupplierComponent } from '../update-supplier/update-supplier.component';
import { feeStatusBadge as getFeeStatusBadge } from '../../../../shared/status-badge';

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
  private readonly accountsPayableService = inject(AccountsPayableService);
  private readonly notificationService = inject(NotificationService);
  private readonly subnavService = inject(SubnavService);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly supplier = signal<ShowSupplierDTO | null>(null);
  protected readonly transactions = signal<ShowAccountsPayableDTO[]>([]);
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
        if (s.id) {
          this.loadTransactions(s.id);
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
    // AccountsPayable has no server-side filter by supplier yet; fetch a page and filter client-side.
    this.accountsPayableService.apiAccountsPayableGet(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1 as any,
      100 as any,
    ).subscribe({
      next: data => {
        this.transactions.set((data?.items ?? []).filter(item => item.personId === personId).slice(0, 10));
        this.isLoadingTransactions.set(false);
      },
      error: () => {
        this.notificationService.showError('Erro', 'Não foi possível carregar as contas a pagar.');
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
    return getFeeStatusBadge(status).cssClass;
  }

  protected transactionStatusLabel(status: string | undefined): string {
    return getFeeStatusBadge(status).label;
  }

  protected addressTypeLabel(type: string | undefined): string {
    const map: Record<string, string> = {
      Comercial:   'Comercial',
      Residential: 'Residencial',
    };
    return map[type ?? ''] ?? 'Não informado';
  }

  protected supplierName(): string {
    const s = this.supplier();
    if (!s) return 'Fornecedor';
    if (s.individualPerson) {
      return `${s.individualPerson.firstName ?? ''} ${s.individualPerson.lastName ?? ''}`.trim() || 'Sem nome';
    }
    if (s.companyPerson) {
      return s.companyPerson.name || 'Sem nome';
    }
    return 'Fornecedor';
  }

  protected supplierTypeLabel(): string {
    const s = this.supplier();
    return s?.companyPerson ? 'Pessoa Jurídica' : 'Pessoa Física';
  }

  protected supplierIcon(): string {
    return this.supplier()?.companyPerson ? 'bi-building' : 'bi-person';
  }

  protected supplierDocument(): string {
    const s = this.supplier();
    return s?.individualPerson?.cpf ?? s?.companyPerson?.cnpj ?? '—';
  }

  protected supplierDocumentLabel(): string {
    return this.supplier()?.companyPerson ? 'CNPJ' : 'CPF';
  }

  protected supplierEmail(): string {
    const s = this.supplier();
    return s?.individualPerson?.email ?? s?.companyPerson?.email ?? '—';
  }

  protected supplierPhone(): string {
    const s = this.supplier();
    return s?.individualPerson?.phoneNumber ?? s?.companyPerson?.phoneNumber ?? '—';
  }
}
