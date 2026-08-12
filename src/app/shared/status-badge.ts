import { ContractStatus, FeeStatus, TransactionType } from '../generated_services';

export interface BadgeInfo {
  cssClass: string;
  label: string;
}

export function activeBadge(isActive: boolean | undefined): BadgeInfo {
  return isActive
    ? { cssClass: 'bg-success', label: 'Ativo' }
    : { cssClass: 'bg-secondary', label: 'Inativo' };
}

export function forKidsBadgeClass(isForKids: boolean | undefined): string {
  return isForKids ? 'bg-success' : 'bg-warning text-dark';
}

const CONTRACT_STATUS_BADGES: Record<ContractStatus, BadgeInfo> = {
  Active: { cssClass: 'bg-success', label: 'Ativo' },
  Inactive: { cssClass: 'bg-secondary', label: 'Inativo' },
  Suspended: { cssClass: 'bg-warning text-dark', label: 'Suspenso' },
  Terminated: { cssClass: 'bg-info text-dark', label: 'Encerrado' },
  Cancelled: { cssClass: 'bg-danger', label: 'Cancelado' },
  Expired: { cssClass: 'bg-secondary', label: 'Expirado' },
};

export function contractStatusBadge(status: ContractStatus | string | undefined): BadgeInfo {
  return CONTRACT_STATUS_BADGES[status as ContractStatus] ?? { cssClass: 'bg-secondary', label: status ?? '—' };
}

const FEE_STATUS_BADGES: Record<FeeStatus, BadgeInfo> = {
  Pending: { cssClass: 'bg-warning text-dark', label: 'Pendente' },
  Paid: { cssClass: 'bg-success', label: 'Pago' },
  Overdue: { cssClass: 'bg-danger', label: 'Vencido' },
  Cancelled: { cssClass: 'bg-secondary', label: 'Cancelado' },
  Refunded: { cssClass: 'bg-secondary', label: 'Reembolsado' },
};

export function feeStatusBadge(status: FeeStatus | string | undefined): BadgeInfo {
  return FEE_STATUS_BADGES[status as FeeStatus] ?? { cssClass: 'bg-secondary', label: status ?? '—' };
}

// A charge (cobrança) can be generated for a Pending receivable, but the FeeStatus itself only
// moves to Paid once the gateway confirms payment — so a generated-but-unpaid charge still reads
// "Pendente" today. Surface that distinct state instead of the generic Pending badge.
export function receivableStatusBadge(status: FeeStatus | string | undefined, externalChargeId?: string | null): BadgeInfo {
  if (status === FeeStatus.Pending && externalChargeId != null) {
    return { cssClass: 'bg-info text-dark', label: 'Cobrança Gerada' };
  }
  return feeStatusBadge(status);
}

const TRANSACTION_TYPE_BADGES: Record<TransactionType, BadgeInfo> = {
  Income: { cssClass: 'bg-success', label: 'Receita' },
  Expense: { cssClass: 'bg-danger', label: 'Despesa' },
  Refund: { cssClass: 'bg-secondary', label: 'Reembolso' },
  Adjustment: { cssClass: 'bg-secondary', label: 'Ajuste' },
};

export function transactionTypeBadge(type: TransactionType | string | undefined): BadgeInfo {
  return TRANSACTION_TYPE_BADGES[type as TransactionType] ?? { cssClass: 'bg-secondary', label: type ?? '—' };
}
