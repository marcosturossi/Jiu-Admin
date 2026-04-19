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
  <p-progressSpinner />
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

## PrimeNG 19 LTS Patterns

### Theme

The Aura preset from `@primeuix/themes` is applied globally in `app.config.ts`:

```ts
import Aura from '@primeuix/themes/aura';
providePrimeNG({ theme: { preset: Aura } })
```

Never import `primeng/themes/*` — that path does not exist in PrimeNG 19 LTS.

### Tables

Replace all `<table class="table">` with `p-table`:

```html
<p-table [value]="items()" [loading]="isLoading()" [paginator]="false" stripedRows>
  <ng-template #header>
    <tr>
      <th>Nome</th>
      <th>Ações</th>
    </tr>
  </ng-template>
  <ng-template #body let-item>
    <tr>
      <td>{{ item.name }}</td>
      <td>
        <p-button icon="pi pi-pencil" (onClick)="openEdit(item)" severity="secondary" text />
        <p-button icon="pi pi-trash" (onClick)="delete(item)" severity="danger" text />
      </td>
    </tr>
  </ng-template>
</p-table>
```

Use the shared `PaginationComponent` below the table for pagination.

### Dialogs (modals)

Create/update dialogs use `p-dialog`. The **parent** controls visibility; the **child** provides only form content:

**Parent template:**
```html
<p-dialog
  header="Criar Item"
  [visible]="openedCreate()"
  (visibleChange)="openedCreate.set($event)"
  [modal]="true"
  [style]="{ width: '600px' }">
  <app-create-item (itemCreated)="onCreated()" (closeEvent)="openedCreate.set(false)" />
</p-dialog>
```

**Child component** — form content only (no modal wrapper HTML):
```ts
readonly closeEvent   = output<void>();
readonly itemCreated  = output<void>();
```

### Buttons

```html
<p-button label="Criar" icon="pi pi-plus" (onClick)="openedCreate.set(true)" />
<p-button label="Salvar" icon="pi pi-check" (onClick)="submit()" />
<p-button label="Cancelar" severity="secondary" (onClick)="closeEvent.emit()" />
<p-button icon="pi pi-trash" severity="danger" text (onClick)="delete(item)" />
```

### Form inputs

```html
<p-inputtext [(ngModel)]="name" placeholder="Nome" fluid />
<p-select [options]="belts()" optionLabel="name" optionValue="id" [(ngModel)]="beltId" placeholder="Selecione" fluid />
<p-textarea [(ngModel)]="description" rows="4" fluid />
```

### Tags / badges

```html
<p-tag [value]="item.belt.name" severity="info" />
<p-tag value="Ativo" severity="success" />
<p-tag value="Inativo" severity="danger" />
```

### Toast notifications

`<p-toast />` must be present in the layout (it is in `system.component.html`).
Trigger notifications via `NotificationService` — never call `MessageService` directly in components.

### Icons

Use PrimeIcons (`pi pi-*`). Common icons:

| Action | Icon |
|---|---|
| Add / Create | `pi pi-plus` |
| Edit | `pi pi-pencil` |
| Delete | `pi pi-trash` |
| Save | `pi pi-check` |
| Close | `pi pi-times` |
| Search | `pi pi-search` |
| Refresh | `pi pi-refresh` |
| User | `pi pi-user` |
| Belt / Award | `pi pi-star` |
| Calendar | `pi pi-calendar` |
| File | `pi pi-file` |

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
- ❌ Do not use Bootstrap classes (`row`, `col-*`, `btn`, `modal`, etc.)
- ❌ Do not call `MessageService` directly from components — use `NotificationService`
- ❌ Do not edit `src/app/generated_services/` manually
- ❌ Do not create components without `changeDetection: ChangeDetectionStrategy.OnPush`
- ❌ Do not use `alert()` or `console.log()` for user feedback
- ❌ Do not write user-facing text in English — use Brazilian Portuguese
