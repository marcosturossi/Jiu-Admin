---
name: use-installed-libs
description: Check package.json/installed tooling before hand-rolling something the project already has a library for. Use whenever about to write parsing, reporting, or utility code from scratch — a coverage summary, a diff, a chart, a date formatter, anything a dependency already listed in package.json (or Backend's .csproj/NuGet packages) is built to do.
---

# Use What's Already Installed

Mirrored at `.github/skills/use_installed_libs/SKILL.md` for GitHub Copilot — keep both in sync
when either changes.

## The rule

Before writing ad-hoc code to parse, format, or report on something (test coverage, diffs, dates,
charts, PDFs, whatever), check `package.json` (frontend) or the relevant `.csproj` (backend) for
a library already in the project that does it properly. Hand-rolling a regex over an HTML report,
a bespoke date formatter, or a manual PDF layout when the project already ships a real tool for
that job wastes effort and produces something worse than the maintained library would.

## Concrete incident that prompted this skill

Asked "how's test coverage," the first instinct was to regex-scrape `coverage/erp/index.html`
(Istanbul's HTML report) for percentages — repeatedly wrong on the first few tries (the markup
doesn't match generic Istanbul templates 1:1) before it worked. The project already has
**`monocart-coverage-reports`** installed and configured (`e2e/mcr.config.ts`,
`e2e/coverage-fixture.ts`) — it emits clean `console-details` tables and `lcov`/`json` reports for
e2e coverage without any scraping. That's the tool to reach for, or at minimum the pattern to
follow (a `reports: [...]` config with a proper machine-readable output), rather than parsing
rendered HTML by hand.

## Known gotcha: karma's `coverageReporter.reporters` under the new builder

This project's `angular.json` uses `"builder": "@angular/build:karma"` (Angular's newer
esbuild/Vite-based test builder), not the older `@angular-devkit/build-angular:karma`. That newer
builder does **not** honor extra `coverageReporter.reporters` entries added to `karma.conf.js`
beyond what it already emits (`html` + the `text-summary` printed to stdout) — adding e.g.
`{ type: 'json-summary' }` silently produces no file. Don't spend time chasing that again; the
stdout `text-summary` block from `ng test --code-coverage` is the reliable, already-working
source for aggregate numbers. For a per-file breakdown, read `coverage/erp/index.html`'s
per-directory rows (`data-value="NN.NN"` on the `<td class="pic ...">` cells) rather than
assuming a generic Istanbul template — verify the actual markup with a quick `grep` first, since
report-generator versions differ in what classes/attributes they emit.

## When reading frontend coverage numbers, generated_services skews them

`src/app/generated_services/` (the openapi-generator output) is over 2x the line count of the
actual hand-written app code and is exercised through real HTTP calls in e2e, not unit specs — its
low coverage (rarely above ~50%, often single digits for the `api/` subfolder) drags the aggregate
number down in a way that doesn't reflect real app-code coverage. When reporting a coverage
number, call out this split rather than quoting the raw aggregate as if it means "app code is
untested."

## Backend equivalent

`coverlet.collector` is already referenced in `Backend.Tests.csproj` and works fine via
`dotnet test --collect:"XPlat Code Coverage"` (emits a Cobertura XML). There is no
`reportgenerator` global tool installed in this repo (`.config/dotnet-tools.json` only lists
`dotnet-ef`) — parsing the Cobertura XML directly (e.g. with a short Python script summing
`<line hits="...">` per package, excluding `Backend.Migrations.*`/`*ModelSnapshot` classes since
those are auto-generated schema history, not app code) is the reasonable approach here since no
better-installed tool exists for it. If nicer backend coverage reports become a recurring need,
that's a case for *asking* to add `dotnet-reportgenerator-globaltool` — not for silently
installing it mid-task.
