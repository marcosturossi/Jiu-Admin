import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
      <div class="d-flex align-items-center gap-2">
        <label class="text-muted small mb-0">Itens por página:</label>
        <select class="form-select form-select-sm" style="width:auto"
          [value]="pageSize()"
          (change)="onSizeChange($any($event.target).value)">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
        <span class="text-muted small">{{ rangeLabel() }}</span>
      </div>
      <nav>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="currentPage() <= 1">
            <button type="button" class="page-link" (click)="goTo(currentPage() - 1)" [disabled]="currentPage() <= 1">
              &laquo;
            </button>
          </li>
          @for (p of visiblePages(); track p) {
            <li class="page-item" [class.active]="p === currentPage()">
              <button type="button" class="page-link" (click)="goTo(p)">{{ p }}</button>
            </li>
          }
          <li class="page-item" [class.disabled]="currentPage() >= totalPages()">
            <button type="button" class="page-link" (click)="goTo(currentPage() + 1)" [disabled]="currentPage() >= totalPages()">
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly currentPage  = input<number>(1);
  readonly totalPages   = input<number>(1);
  readonly pageSize     = input<number>(10);
  readonly totalItems   = input<number>(0);
  readonly pageChange     = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly rangeLabel = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end   = Math.min(this.currentPage() * this.pageSize(), this.totalItems());
    return this.totalItems() > 0 ? `${start}–${end} de ${this.totalItems()}` : '0 registros';
  });

  protected readonly visiblePages = computed(() => {
    const total  = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (current >= total - 3) {
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      for (let i = current - 2; i <= current + 2; i++) pages.push(i);
    }
    return pages;
  });

  protected goTo(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.pageChange.emit(page);
  }

  protected onSizeChange(value: string): void {
    const size = Number(value);
    if (size !== this.pageSize()) this.pageSizeChange.emit(size);
  }
}
