---
name: e2e-testing
description: Playwright e2e conventions for the Jiu-Admin project. Use this skill whenever implementing a new feature, page, or user-facing change, or modifying an existing one — every such change must ship with a new or updated e2e spec under e2e/, not just unit tests.
---

# E2E Testing Guidelines

Mirrored at `.github/skills/e2e_testing/SKILL.md` for GitHub Copilot — keep both in sync when
either changes.

## Every user-facing change ships with an e2e test

A change is not done when unit tests (`*.component.spec.ts`) pass — those mock every service and
never prove the real HTTP contract, routing, guards, or DOM wiring work together. If the change
touches a page, form, modal, or navigation flow, it needs a Playwright spec in `e2e/` that
exercises it against the real backend:

- **New page/route** → new `e2e/<feature>.spec.ts`, and add the route to the `sections` array in
  `e2e/smoke.spec.ts` so it's covered by the navigation smoke test too.
- **New field on an existing form** → extend that form's existing spec (fill it, save, reload,
  assert it persisted) rather than creating a parallel file.
- **New modal/dialog on an existing list page** → add a describe block to that page's existing
  spec (see the "Configurações de Pagamento da Academia" block in `e2e/academies.spec.ts` for the
  pattern: open, assert fields, verify conditional field visibility, close).
- **Bug fix** → add a regression test that fails without the fix, in the relevant existing spec.

Don't treat this as optional scaffolding to add "later" — a PR that changes frontend behavior
without a corresponding e2e change is incomplete, the same way an untested backend use case would
be.

## File conventions

- Import `test`/`expect` from `./coverage-fixture`, never directly from `@playwright/test` — it
  wraps the real test object with automatic V8/CSS coverage collection needed by
  `global-teardown.ts`.
- Reuse `e2e/helpers.ts` rather than re-implementing: `waitForTableReady`, `openCreateModal`,
  `saveAndWaitModalClose`, `acceptConfirmDialog` (for the custom `app-confirm-dialog`, never
  the native `confirm()`), `selectFromSearchSelect`, `generateValidCpf`. If a new page needs a
  reusable create/delete helper others will also need (see `createTestStudent` /
  `deleteTestStudent`, `createTestBelt` / `deleteTestBelt`), add it there instead of duplicating
  setup logic per spec file.
- Generate unique test data with `Date.now()` (+ `Math.floor(Math.random() * 1000)` when tests in
  the same file might collide within the same millisecond) — never hardcode a name/slug/email
  that could collide with a previous run or another parallel suite.

## Two resource shapes, two lifecycle patterns

**List/CRUD resources** (students, belts, fee-plans, suppliers, academies, ...): create your own
throwaway record with unique test data, exercise it, then delete it. Never mutate or depend on
seed data another test might also be using.

**Singleton settings resources** (tenant-wide config like `payment-settings`, `academy-profile`):
there is exactly one row shared by the whole tenant, so tests must not permanently change it.
Follow the pattern in `e2e/payment-settings.spec.ts`:
```ts
test.beforeAll(async ({ browser }) => {
  // open a fresh context, read the current value, save it as `original`
});
test.afterAll(async ({ browser }) => {
  // open a fresh context, restore `original`, assert the save succeeded
});
```
If a field is write-only (never echoed back on GET, e.g. a masked secret) and was already set
before the suite ran, there is no faithful way to restore it — log a warning and skip the restore
rather than leaving `afterAll` failing on every future run (see the guard in the git history of
`payment-settings.spec.ts` for the shape of that comment).

## Permission-gated actions

Some actions require a role the e2e user (`E2E_USER`/`E2E_PASSWORD` in `e2e/.env`) doesn't have.
The whole `/api/admin/*` surface (not just mutating actions — GET/list included) is gated at the
middleware level (`TenantResolverMiddleware`, logs "Access denied to admin route ... for
non-superadmin") for whichever account is currently in `e2e/.env`, and tenant-scoped admin-only
pages (e.g. `/system/payment-settings`, guarded by `TenantAdminGuard`) can silently redirect to
`/system/home` client-side before any request fires if that account also lacks the tenant's
`/admin` group claim. **Verify against the real backend before assuming a list/view action
works** — don't take "it's just a GET" as proof it's unguarded; check by running the spec, or by
watching network responses (`page.on('requestfinished', ...)`) for a 401/403, or the post-nav URL
for an unexpected guard redirect.

When a real action genuinely can't be exercised end-to-end with the available test credentials,
`test.skip` (or `test.describe.skip` for a whole block) it with a comment naming the exact reason
— see the skipped CRUD test in `e2e/academies.spec.ts` — rather than silently omitting coverage,
asserting around the failure, or writing an assertion so loose it passes vacuously regardless of
whether the request even succeeded (e.g. asserting a table element is present without checking it
has any rows, or that data actually loaded).

### Two authorization layers, two different checks — and they don't agree on "admin"

There isn't one "is admin" flag. Getting a test account working means satisfying both,
independently, and a account that has one but not the other fails in a way that looks unrelated:

- **Backend, per-request**: `TenantResolverMiddleware` — `/api/admin/*` requires a Keycloak user
  with **no** `/tenant/*` group membership at all (superadmin). Any tenant-scoped write (e.g.
  `PATCH /api/settings`) requires the **opposite** — membership in exactly one `/tenant/<slug>`
  group, since the write needs a concrete tenant to stamp. A superadmin account cannot exercise
  tenant-scoped write endpoints; a tenant member cannot exercise `/api/admin/*`. These are
  mutually exclusive personas — one test account cannot cover both.
- **Frontend, on app load**: `AuthGuard` (wraps every `/system/*` route) independently requires
  the Keycloak **realm role** `admin` or `manager` — checked via `realmAccess.roles` on the token,
  nothing to do with tenant group membership. A superadmin account with *no* realm role assigned
  gets bounced to `/forbidden` before ever reaching a page, even though the backend would have
  accepted it. So a working superadmin test account needs: no `/tenant/*` group, **plus** the
  `admin` (or `manager`) realm role assigned separately.

When creating a Keycloak test user with `kcadm.sh`, use `--uid <id>` for `add-roles` /
group-membership calls, not `--uusername <name>` — if the realm has "email as username" enabled,
the username you passed to `create users` gets silently normalized to the email address, and a
later `--uusername <original-name>` silently fails to resolve ("User not found") without
necessarily aborting the script. Always re-fetch and print the role-mappings/groups afterward to
confirm the assignment actually landed — don't trust the create/set-password commands succeeding
as proof the role/group calls after them did too.

### `browser.newContext()` inherits the project's default `storageState`

If a helper or a test needs to log in as a **different** account than the suite-wide `E2E_USER`
(e.g. a superadmin persona for `/api/admin/*` — see `loginAsSuperAdmin()` in `e2e/helpers.ts`),
calling `browser.newContext()` with no options does **not** give you a blank session — it silently
inherits the `chromium` project's configured `storageState: 'e2e/.auth/state.json'` from
`playwright.config.ts`, i.e. the default E2E_USER's already-authenticated cookies. The result
looks like a login flow (you can still `goto` a page, `fill` inputs, `click` submit) but you're
actually driving a hidden, already-logged-in session, and whatever page that session happens to
land on determines what your `fill`/`click` calls actually hit — usually failing confusingly far
from the real cause. Always pass `{ storageState: { cookies: [], origins: [] } }` explicitly when
a context needs to start genuinely unauthenticated.

## Running the suite

Requires the Angular dev server on `localhost:4200` and the backend on `localhost:8080` (plus its
Postgres/Redis/Keycloak dependencies) reachable, and real Keycloak credentials in `e2e/.env`
(copy `e2e/.env.example`). Auth happens once via `e2e/auth.setup.ts`, which logs into Keycloak and
persists the session to `e2e/.auth/state.json` for every other spec to reuse.

```bash
npm run e2e       # headless run
npm run e2e:ui    # Playwright UI mode, useful while writing a new spec
```

Run at least the spec(s) you touched or added before considering the change done — don't rely on
unit tests alone to claim e2e coverage exists.
