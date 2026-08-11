---
name: angular-skills
description: Angular 20 architecture and coding practices for the Jiu-Admin project. Use this skill when implementing, reviewing, or refactoring Angular code to ensure consistency with signals, standalone components, Bootstrap 5, ng-bootstrap, and the existing project conventions.
---

# Angular Coding Guidelines

This document defines the conventions, patterns, and guidelines for AI-assisted development
in the **Jiu-Admin** project. Follow these rules when generating or reviewing code.

Mirrored at `.github/skills/angular_skills/SKILL.md` for GitHub Copilot — keep both in sync when
either changes.

---

## Angular 20 Conventions

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

This is the common pattern for most list pages (e.g. `belts.component.html`) — but not
universal: `students.component.html` itself renders a card grid (`.students-grid` /
`.student-card`) instead of a table, since photos matter more there. Pick whichever fits the
data; don't force a table where a grid reads better.

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
| Preview | `bi bi-eye` |
| Arrow right | `bi bi-arrow-right` |
| Filter | `bi bi-funnel` |

---

## Notification Service

Always use `NotificationService` (wrapper around `ngx-toastr`):

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
  detail-student/                ← optional: a full detail/profile sub-page (own route via
    detail-student.component.ts    RouterOutlet on the parent), not a modal — used when an item
    ...                             has enough content to warrant its own page instead of a dialog
```

**List component signals** (`students.component.ts:41-61` is the reference example):

```ts
protected readonly isLoading    = signal(false);
protected readonly items        = signal<PageResult<ItemDTO> | null>(null); // { items, totalCount, totalPages } — src/app/utils/page-result.ts
protected readonly openedCreate = signal(false);
protected readonly openedUpdate = signal(false);
protected readonly selected     = signal<ItemDTO | null>(null);
protected readonly currentPage  = signal(1);
protected readonly pageSize     = signal(10);
protected readonly filterText   = signal<string | undefined>(undefined);
protected readonly filterFields: FilterField[] = [ /* see Filter Component below */ ];
```

There is no `PaginationDTO` type anywhere in the codebase — list responses are `PageResult<T>`.

---

## Subnav (Page Title)

Call `setTitle()` in every page component. The **constructor** is actually the more common
place for it in this codebase (most page components don't otherwise need `ngOnInit`) — use
`ngOnInit` only if the component already has one for other setup:

```ts
private readonly subnavService = inject(SubnavService);

constructor() {
  this.subnavService.setTitle('Alunos');
  this.load();
}
```

---

## Pagination Component

```html
<app-pagination
  [currentPage]="currentPage()"
  [totalPages]="items()?.totalPages ?? 1"
  [pageSize]="pageSize()"
  [totalItems]="items()?.totalCount ?? 0"
  (pageChange)="onPageChange($event)"
  (pageSizeChange)="onPageSizeChange($event)" />
```

Note the field-name mismatch: `PageResult<T>` calls it `totalCount`, but `PaginationComponent`'s
input is named `totalItems` — map `totalCount` → `[totalItems]`, don't assume the names line up.

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

`FilterComponent` (`src/app/shared/filter/filter.component.ts`) is a debounced text search plus
an optional "advanced filter" condition-builder modal — not a plain text-only filter. It takes a
`placeholder` string and a `fields: FilterField[]` describing which columns can be filtered, and
emits one `filterChange` event carrying both the free-text search and any structured conditions:

```html
<app-filter
  [placeholder]="'Buscar por nome...'"
  [fields]="filterFields"
  (filterChange)="onFilterChange($event)" />
```

```ts
import { FilterField, FilterOutput } from '../../../shared/filter/filter.types';

protected readonly filterFields: FilterField[] = [
  { key: 'isActive', label: 'Status', type: 'select', options: [
    { value: 'true', label: 'Ativo' },
    { value: 'false', label: 'Inativo' },
  ] },
];

protected onFilterChange(output: FilterOutput): void {
  this.filterText.set(output.text || undefined);
  this.currentPage.set(1);
  this.load();
}
```

`FilterField.type` is `'text' | 'number' | 'date' | 'select'` — each type gets its own set of
operators (contains/equals for text, comparison operators for number/date) defined in
`filter.types.ts`. There is no `[filterText]` input or `(filterReset)` output — those don't
exist on the real component.

---

## Keycloak Integration

### Reading user info

Don't call `inject(Keycloak)` directly in feature code — go through `AuthServiceService`
(`src/app/services/auth-service.service.ts`), which wraps the raw Keycloak instance:

```ts
private readonly authService = inject(AuthServiceService);

this.authService.isLoggedIn();               // boolean
this.authService.getUsernameFromToken();      // string | null, from preferred_username
this.authService.getRoles();                  // realm + resource roles, deduped
this.authService.hasRole('some-role');
this.authService.hasAnyRole(['role-a', 'role-b']);
this.authService.isTenantAdmin();             // true if the token's `groups` claim includes `/admin`
                                               // — mirrors the backend's ITenantContext.IsAdmin
await this.authService.logout();
```

### AuthGuard

`AuthGuard` (`src/app/guard/auth.guard.ts`) is built with `createAuthGuard()` from
`keycloak-angular`. It only checks that the user is **authenticated** — it does not require any
specific realm/resource role. (`manage-realm`/`manage-users` show up only in
`auth-service.service.spec.ts` test fixtures, not in any real guard — don't reintroduce that as
a real requirement without checking first.)

```ts
{ path: 'students', component: StudentsComponent, canActivate: [AuthGuard] }
```

### TenantAdminGuard

For pages that must be admin-only (e.g. payment settings), use `TenantAdminGuard`
(`src/app/guard/tenant-admin.guard.ts`) — a functional guard that calls
`authService.isTenantAdmin()` and redirects to `/system/home` on failure. This is the frontend
counterpart to the backend's `TenantAdmin` authorization policy; use both together when adding a
new admin-only feature (backend policy + frontend guard), not just one:

```ts
{ path: 'payment-settings', component: PaymentSettingsComponent, canActivate: [TenantAdminGuard] }
```

Sidebar entries also need to be hidden for non-admins, not just route-guarded — add
`adminOnly: true` to the `NavItem` in `src/app/shared/nav-config.ts`; `SidebarComponent` filters
those out via `isVisible(item)` in both its expanded and collapsed rendering (`sidebar.component.html`
has two separate `@for` loops — remember to gate both).

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

The generator occasionally emits a bogus `import { Null } from './null';` in a model file when a
DTO has a nullable `Dictionary<string,string>?`-shaped property. There's no `null.ts` file, so it's
a dead import — delete the line manually after regenerating (this is the one accepted exception to
"never edit generated_services by hand").

---

## Layout & Styling

- **CSS Grid** for page layouts (not Bootstrap `row`/`col-*` utility classes) — Bootstrap 5
  components (buttons, modals, tables, badges, forms — see above) are still used everywhere else.
- **CSS custom properties** for brand colors (`:root` block, `src/styles.scss:7-26`):
  - `--brand-sidebar-bg: #1a1f37` — dark navy sidebar
  - `--brand-sidebar-text: #ced4da`
  - `--brand-sidebar-active: #2e3759`
  - `--brand-sidebar-accent: #5c8df5`
  - `--brand-primary: #383838`
  - `--brand-surface: #fbfdff`
  - `--brand-bg: #f3f6f9`, `--brand-text: #101434`, `--brand-muted: #6c757d`, `--brand-border: #e9ecef`
  - `--brand-danger` / `--brand-success` / `--brand-warning` / `--brand-info` — standard semantic colors
  - Every one of these (plus several `--bs-*` overrides) gets redefined in the `:root.dark-mode` block right below (`styles.scss:29-` onward) — see "Dark mode" below before assuming a color is static.
- **Per-component SCSS** (`.component.scss`) for component-specific styles
- **No inline styles** in templates — use component SCSS or global CSS tokens

### Dark mode

Theme switching is custom (`ThemeService`, `src/app/services/theme.service.ts`) — it toggles a
`.dark-mode` class + `data-theme` attribute on `<html>`, **not** Bootstrap's own `data-bs-theme`
mechanism. This means Bootstrap components only look right in dark mode for the specific
`--bs-*` CSS variables that have been explicitly overridden inside the `:root.dark-mode { ... }`
block in `src/styles.scss`. If a Bootstrap class looks wrong in dark mode (e.g. `.form-text`
staying light-colored), the fix is almost always a missing `--bs-*` variable override in that
block, not a per-component style — check which Bootstrap CSS variable the class actually reads
(inspect the Bootstrap source or computed style) and add it next to the existing
`--bs-body-color`/`--bs-secondary-color` overrides there.

---

## What NOT to Do

- ❌ Do not use `*ngIf` / `*ngFor` — use `@if` / `@for`
- ❌ Do not use `@Input()` / `@Output()` decorators — use `input()` / `output()` signals
- ❌ Do not inject via constructor — use `inject()`
- ❌ Do not use PrimeNG components (`p-table`, `p-button`, `p-dialog`, etc.)
- ❌ Do not call `ToastrService` directly from components — use `NotificationService`
- ❌ Do not edit `src/app/generated_services/` manually (except deleting the stray `Null` import above)
- ❌ Do not create components without `changeDetection: ChangeDetectionStrategy.OnPush`
- ❌ Do not use `alert()` or `console.log()` for user feedback
- ❌ Do not write user-facing text in English — use Brazilian Portuguese
- ❌ Do not use Bootstrap `row`/`col-*` grid classes for page layout — use CSS Grid

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
