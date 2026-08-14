---
name: no-broken-tests
description: Zero-tolerance policy for a red test suite in Jiu-Admin. Use whenever finishing any change (frontend or backend) — run the full test suite before calling the work done, and never leave a failing test unfixed or unexplained, whether you caused it or just found it.
---

# No Broken Tests

Mirrored at `.github/skills/no_broken_tests/SKILL.md` for GitHub Copilot — keep both in sync when
either changes.

## The rule

A test suite with known-red tests is worthless as a safety net — every real regression hides in
the noise of "oh, that one's always been failing." Never leave it that way:

- **Run the full suite before finishing a task**, not just the spec file you touched. `ng test
  --watch=false --browsers=ChromeHeadless` for frontend, `dotnet test` for backend. A change that
  only "looks done" because you only ran the one file you edited is not done.
- **A failure you find but didn't cause is still yours to fix**, not to shrug off as "pre-existing."
  If you're touching the codebase anyway and you find red tests, fix them in the same session
  unless the user explicitly says to leave them. Don't just note them and move on.
- **When behavior changes, the test changes in the same commit** — never leave a test asserting
  what the code used to do. A test that still passes after a behavior change usually means the
  test wasn't actually exercising the changed path; check for that too, not just for red tests.
- **Never delete or skip a test to make the suite green** unless the thing it tested was
  legitimately removed from the product. Silencing coverage is not the same as fixing it.

## The specific failure mode this project keeps hitting: DI stub drift

A component or guard starts injecting a new service (`inject(AuthServiceService)`,
`inject(SomeNewService)`), and the existing `.spec.ts` file's `TestBed.configureTestingModule`
doesn't get updated to provide it — or a service method changes its role/claim logic
(`hasAnyRole`, `isTenantAdmin`, `isSuperAdmin`) and the stub's fake data (`realmAccess`,
`tokenParsed`, `groups`) no longer produces the result the test expects. The suite fails with
`NG0201: No provider found for X` or a silently-wrong boolean, and because it's not tied to the
file you were actually editing, it's easy to write off as unrelated and leave red.

Concretely hit in this project: `sidebar.component.spec.ts` never provided `Keycloak` at all
(the component's `isVisible()` reads `AuthServiceService.isTenantAdmin()`, which needs it) — 21
tests failed with `No provider found for Keycloak`. `auth.guard.spec.ts` provided `Keycloak` but
the stub had no `realmAccess.roles`, so `AuthGuard`'s `hasAnyRole(['manager', 'admin'])` check
always failed once that check was added to the guard, sending every test down the
`router.navigate(['/forbidden'])` branch instead of the one being tested. Both had been red long
enough that they were treated as "known failures" rather than fixed.

When you see this pattern: find every place the same service is injected in production code,
check what claims/methods it reads, and give the stub *just enough* fake data to produce a
deterministic result for each test case — don't stub the whole Keycloak API, just
`realmAccess.roles` / `tokenParsed.groups` / whatever the specific check under test reads. Prefer
a `Partial<Keycloak>` stub via `{ provide: Keycloak, useValue: keycloakStub }`, matching the
existing pattern in `auth-service.service.spec.ts` and `auth.guard.spec.ts`.

## Backend equivalent

Same discipline for `Backend.Tests`: when a use case's validation or an authorization
requirement/handler changes, grep for every test that constructs the affected DTO or hits the
affected route and update the ones whose expectations no longer hold — see
`TenantSettingsControllerTests.Upsert_ShouldClearDefaultBillingType_WhenNull` (renamed and
re-asserted after `UpsertTenantSettingsUseCase`'s null-handling changed) and
`TenantResolverMiddlewareTests.InvokeAsync_ShouldReturn403_WhenSuperAdminHitsNonAdminRoute` (added
alongside a new authorization rule, not left for someone else to cover later) for the shape of
that fix.
