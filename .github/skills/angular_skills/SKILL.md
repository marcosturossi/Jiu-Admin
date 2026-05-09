---
name: angular-skills
description: Angular 19 architecture and coding practices for the Jiu-Admin project. Use this skill when implementing, reviewing, or refactoring Angular code to ensure consistency with signals, standalone components, Bootstrap 5, ng-bootstrap, and the existing project conventions.
---

# Copilot Skills & Coding Guidelines

This document defines the conventions, patterns, and guidelines for AI-assisted development
in the **Jiu-Admin** project. Follow these rules when generating or reviewing code.

---

## Angular 19 Conventions

### Standalone components (always)

Every new component, directive, or pipe must be **standalone**:

```ts
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './my-component.component.html',
  styleUrl: './my-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {}
```

### `inject()` — no constructor injection

Use `inject()` at field level. Never inject via constructor parameters:

```ts
// ✅ Correct
private readonly service = inject(MyService);
private readonly router  = inject(Router);

// ❌ Wrong
constructor(private service: MyService) {}
```

### Signals — all component state

Replace all plain class properties that drive templates with signals:

```ts
// ✅ Correct
protected readonly isLoading = signal(false);
protected readonly items     = signal<Item[]>([]);
protected readonly selected  = signal<Item | null>(null);
protected readonly page      = signal(1);

// ❌ Wrong
isLoading = false;
items: Item[] = [];
```

Use `computed()` for derived values:

```ts
protected readonly isEmpty = computed(() => this.items().length === 0);
```

Use `effect()` for side effects triggered by signal changes (e.g., patching a form):

```ts
effect(() => {
  const item = this.selectedItem();
  if (item) this.form.patchValue(item);
});
```

### Signal-based `input()` / `output()`

```ts
// ✅ Correct
readonly item      = input.required<Item>();
readonly closeEvent = output<void>();

// ❌ Wrong
@Input()  item!: Item;
@Output() closeEvent = new EventEmitter<void>();
```

### Template control flow

Use built-in control flow — no `*ngIf` / `*ngFor`:

```html
<!-- ✅ Correct -->
@if (isLoading()) {
  <div class="d-flex justify-content-center py-5">
    <div class="spinner-border text-secondary" role="status">
      <span class="visually-hidden">Carregando...</span>
    </div>
  </div>
}

@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
}

<!-- ❌ Wrong -->
<div *ngIf="isLoading">
<li *ngFor="let item of items">
```

### `OnPush` change detection (always)

Every component must have `changeDetection: ChangeDetectionStrategy.OnPush`.
Signals update the view automatically — no `markForCheck()` needed.

---

## Bootstrap 5 Patterns

### Tables

```html
@if (isLoading()) {
  <div class="d-flex justify-content-center py-5">
    <div class="spinner-border text-secondary" role="status">
      <span class="visually-hidden">Carregando...</span>
    </div>
  </div>
} @else {
  <div class="table-responsive">
    <table class="table table-hover table-sm align-middle">
      <thead class="table-light">
        <tr>
          <th>Nome</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        @if ((items()?.items ?? []).length === 0) {
          <tr><td colspan="4" class="text-center py-5 text-muted">Nenhum registro encontrado.</td></tr>
        }
        @for (item of items()?.items ?? []; track item.id) {
          <tr>
            <td>{{ item.name }}</td>
            <td class="text-end">
              <button type="button" class="btn btn-sm btn-outline-secondary me-1" (click)="openEdit(item)">
                <i class="bi bi-pencil"></i>
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger" (click)="delete(item)">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>
}
```

Use the shared `PaginationComponent` below the table for pagination.

### Dialogs (modals)

Create/update dialogs use Bootstrap modal. The **parent** controls visibility; the **child** provides only form content:

**Parent template:**
```html
@if (openedCreate()) {
  <div class="modal-backdrop-custom" (click)="openedCreate.set(false)"></div>
  <div class="modal show d-block" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Criar Item</h5>
          <button type="button" class="btn-close" (click)="openedCreate.set(false)" aria-label="Fechar"></button>
        </div>
        <div class="modal-body">
          <app-create-item (itemCreated)="onCreated()" (closeEvent)="openedCreate.set(false)" />
        </div>
      </div>
    </div>
  </div>
}
```

**Child component** — form content only (no modal wrapper HTML):
```ts
readonly closeEvent   = output<void>();
readonly itemCreated  = output<void>();
```

### Buttons

```html
<button type="button" class="btn btn-primary" (click)="openedCreate.set(true)">
  <i class="bi bi-plus-lg me-1"></i>Criar
</button>
<button type="button" class="btn btn-primary" (click)="submit()">
  <i class="bi bi-check-lg me-1"></i>Salvar
</button>
<button type="button" class="btn btn-outline-secondary" (click)="closeEvent.emit()">Cancelar</button>
<button type="button" class="btn btn-sm btn-outline-danger" (click)="delete(item)">
  <i class="bi bi-trash"></i>
</button>
```

### Form inputs

```html
<input type="text" class="form-control" formControlName="name" placeholder="Nome" />
<select class="form-select" formControlName="beltId">
  <option value="" disabled>Selecione</option>
  @for (b of belts(); track b.id) { <option [value]="b.id">{{ b.color }}</option> }
</select>
<textarea class="form-control" formControlName="description" rows="4"></textarea>
<input type="date" class="form-control" formControlName="birthDate" />
<input type="number" class="form-control" formControlName="amount" step="0.01" />
<div class="form-check">
  <input class="form-check-input" type="checkbox" formControlName="isForKids" id="isForKids" />
  <label class="form-check-label" for="isForKids">Para Crianças</label>
</div>
```

### Badges

```html
<span class="badge bg-info text-dark">{{ item.belt.name }}</span>
<span class="badge bg-success">Ativo</span>
<span class="badge bg-danger">Inativo</span>
<span class="badge bg-warning text-dark">Pendente</span>
```

### Toast notifications

Notifications are handled globally by `ngx-toastr` (no `<p-toast>` needed in templates).
Trigger via `NotificationService` — never call `ToastrService` directly in components.

### Icons

Use Bootstrap Icons (`bi bi-*`). Common icons:

| Action | Icon |
|---|---|
| Add / Create | `bi bi-plus-lg` |
| Edit | `bi bi-pencil` |
| Delete | `bi bi-trash` |
| Save | `bi bi-check-lg` |
| Close | `bi bi-x-lg` |
| Search | `bi bi-search` |
| Refresh | `bi bi-arrow-clockwise` |
| User | `bi bi-person` |
| Users | `bi bi-people` |
| Calendar | `bi bi-calendar3` |
| File | `bi bi-file-earmark-text` |
| Arrow right | `bi bi-arrow-right` |
| Filter | `bi bi-funnel` |

---

## Notification Service

Always use `NotificationService` (wrapper around PrimeNG `MessageService`):

```ts
private readonly notify = inject(NotificationService);

// Usage
this.notify.showSuccess('Sucesso', 'Aluno criado com sucesso.');
this.notify.showError('Erro', 'Não foi possível salvar.');
this.notify.showWarning('Atenção', 'Verifique os dados.');
this.notify.showInfo('Info', 'Processando...');
```

All user-facing messages must be in **Brazilian Portuguese**.

---

## Page Structure Pattern

Every protected page follows this structure:

```
students/
  students.component.ts       ← list page (load, paginate, filter, open dialogs)
  students.component.html
  students.component.scss
  create-student/
    create-student.component.ts  ← form for creation, emits studentCreated + closeEvent
    create-student.component.html
    create-student.component.scss
  update-student/
    update-student.component.ts  ← form for editing, input() for selected item
    update-student.component.html
    update-student.component.scss
```

**List component signals:**

```ts
protected readonly isLoading    = signal(false);
protected readonly items        = signal<PaginationDTO | null>(null);
protected readonly openedCreate = signal(false);
protected readonly openedUpdate = signal(false);
protected readonly selected     = signal<ItemDTO | null>(null);
protected readonly currentPage  = signal(1);
protected readonly pageSize     = signal(10);
protected readonly filterText   = signal('');
```

---

## Subnav (Page Title)

Call `setTitle()` in every page component's `ngOnInit`:

```ts
private readonly subnavService = inject(SubnavService);

ngOnInit(): void {
  this.subnavService.setTitle('Alunos');
  this.loadItems();
}
```

---

## Pagination Component

```html
<app-pagination
  [currentPage]="currentPage()"
  [totalPages]="items()?.totalPages ?? 0"
  [pageSize]="pageSize()"
  [totalItems]="items()?.totalItems ?? 0"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)" />
```

```ts
protected onPageChange(page: number): void {
  this.currentPage.set(page);
  this.loadItems();
}

protected onPageSizeChange(size: number): void {
  this.pageSize.set(size);
  this.currentPage.set(1);
  this.loadItems();
}
```

---

## Filter Component

```html
<app-filter
  [filterText]="filterText()"
  (filterChange)="onFilter($event)"
  (filterReset)="onFilterReset()" />
```

---

## Keycloak Integration

### Reading user info

```ts
private readonly keycloak = inject(Keycloak);

// Username
const username = this.keycloak.tokenParsed?.['preferred_username'];

// Check role
const isAdmin = this.keycloak.hasRealmRole('manage-users');

// Logout
this.keycloak.logout({ redirectUri: window.location.origin });
```

### AuthGuard

`AuthGuard` extends `createAuthGuard()` from `keycloak-angular` and requires both
`manage-realm` and `manage-users` realm roles. Apply it to protected routes:

```ts
{ path: 'students', component: StudentsComponent, canActivate: [AuthGuard] }
```

---

## API Generation

Generated services live in `src/app/generated_services/`. Never edit them manually.

To regenerate after backend changes:

```bash
npm run generate:api1   # Main backend (localhost:8080)
npm run generate:api2   # Face recognition backend (localhost:8003)
npm run generate:all    # Both
```

Inject generated services with `inject()`:

```ts
private readonly studentsService = inject(StudentsService);

loadStudents(): void {
  this.isLoading.set(true);
  this.studentsService.getStudents(this.currentPage(), this.pageSize()).subscribe({
    next: (data) => this.items.set(data),
    error: ()     => this.notify.showError('Erro', 'Não foi possível carregar os alunos.'),
    complete: ()  => this.isLoading.set(false),
  });
}
```

---

## Layout & Styling

- **CSS Grid** for page layouts (not Bootstrap rows/cols)
- **CSS custom properties** for brand colors (defined in `styles.scss`):
  - `--brand-sidebar-bg: #1a1f37` — dark navy sidebar
  - `--brand-sidebar-text: #a8b5d8`
  - `--brand-sidebar-active: #4a90d9`
  - `--brand-primary: #3f51b5`
  - `--brand-surface: #ffffff`
- **Per-component SCSS** (`.component.scss`) for component-specific styles
- **No Bootstrap classes** anywhere (fully removed)
- **No inline styles** in templates — use component SCSS or global CSS tokens

---

## What NOT to Do

- ❌ Do not use `*ngIf` / `*ngFor` — use `@if` / `@for`
- ❌ Do not use `@Input()` / `@Output()` decorators — use `input()` / `output()` signals
- ❌ Do not inject via constructor — use `inject()`
- ❌ Do not use PrimeNG components (`p-table`, `p-button`, `p-dialog`, etc.)
- ❌ Do not call `ToastrService` directly from components — use `NotificationService`
- ❌ Do not edit `src/app/generated_services/` manually
- ❌ Do not create components without `changeDetection: ChangeDetectionStrategy.OnPush`
- ❌ Do not use `alert()` or `console.log()` for user feedback
- ❌ Do not write user-facing text in English — use Brazilian Portuguese

---

## Testing Policy

### Every change ships with tests

Every production code change — new feature, bug fix, or refactor — must include or update tests that verify the changed behaviour. A change without tests is incomplete.

### Tests must match the current implementation

When behaviour changes, update the affected tests in the same commit. Never leave a test asserting something the code no longer does. Never skip or comment out a failing test to make CI pass.

### Failing tests block the task

Either (a) fix the implementation so the test still passes, or (b) update the test because the behaviour intentionally changed — document why in the commit message. Silent breakage is not acceptable.

### Angular test setup conventions

- Standalone components go in `imports: []`, not `declarations: []`
- Always provide `provideHttpClient()` when the component or service makes HTTP calls
- Use `fixture.componentRef.setInput('inputName', value)` before `detectChanges()` for required `input()` signals (avoids NG0950)
- Use `jasmine.createSpyObj` to mock services; provide them via `{ provide: ServiceClass, useValue: spy }`
- Extract `window.location.href` assignments into a protected method so tests can spy on them without triggering real navigation
