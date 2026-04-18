import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [PaginatorModule],
  template: `
    <p-paginator
      [first]="(currentPage() - 1) * pageSize()"
      [rows]="pageSize()"
      [totalRecords]="totalItems()"
      [rowsPerPageOptions]="[10, 25, 50, 100]"
      (onPageChange)="onPaginatorChange($event)"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly currentPage = input<number>(1);
  readonly totalPages = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly totalItems = input<number>(0);
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected onPaginatorChange(state: PaginatorState): void {
    const newRows = state.rows ?? this.pageSize();
    const newPage = Math.floor((state.first ?? 0) / newRows) + 1;

    if (newRows !== this.pageSize()) {
      // Page-size change: emit only pageSizeChange; parent handles reset to page 1
      this.pageSizeChange.emit(newRows);
    } else if (newPage !== this.currentPage()) {
      // Page navigation: emit only pageChange
      this.pageChange.emit(newPage);
    }
  }
}
