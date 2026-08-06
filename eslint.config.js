// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    // openapi-generator output — regenerated wholesale from the backend's OpenAPI spec via `npm run
    // generate:api1/api2` and explicitly marked "Do not edit the class manually" in every file.
    // Linting it is pointless (findings can't be fixed in place, they'd just come back on the next
    // generate) and it accounts for most of this ruleset's `any`/type-assertion noise. `dist` and
    // `coverage` are build/test-report output (see .gitignore) — flat config, unlike the old
    // .eslintrc, doesn't auto-ignore these, so `ng lint` was linting rendered coverage HTML as if it
    // were application templates.
    ignores: ["**/generated_services/**", "dist/**", "coverage/**"],
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      // `any` is a deliberate, necessary escape hatch throughout this codebase, not an oversight —
      // the generated API client aliases several backend `decimal` fields (Amount, PaidAmount, ...)
      // to an empty interface (`ChargeStatusConfirmedValue`) that carries no real shape, so call
      // sites route through `any`/`as any` to actually use them as numbers. Kept visible as a
      // warning rather than silenced entirely, but not a hard error against ~1100 pre-existing,
      // intentional uses.
      "@typescript-eslint/no-explicit-any": "warn",
      // Standard convention for an intentionally-unused parameter (e.g. a callback whose signature
      // requires a positional arg the handler doesn't need) — prefix it with `_` instead of leaving
      // it unnamed/renamed to something misleading.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      // `!= null` / `== null` deliberately catch both null and undefined in one check — several
      // generated DTO fields are typed `T | null | undefined` for exactly that. Naively requiring
      // `!==` here would be a behavior change, not just style: `undefined !== null` is `true`, so a
      // strict check would treat an omitted field as "present".
      "@angular-eslint/template/eqeqeq": ["error", { allowNullOrUndefined: true }],
      // Real, pre-existing accessibility debt (~130 clickable <div>/<tr>/<span> elements with no
      // keyboard equivalent) — genuine and worth fixing, but properly fixing each one means judging,
      // per element, whether it should become a real <button>, or gain role="button" + tabindex="0"
      // + a keydown handler, which risks changing focus order/styling if done mechanically across
      // ~100 files in one pass. Kept visible as warnings (tracked, not hidden) rather than silenced
      // or bulk-"fixed" without that per-element review.
      "@angular-eslint/template/click-events-have-key-events": "warn",
      "@angular-eslint/template/interactive-supports-focus": "warn",
    },
  },
  {
    // Playwright e2e specs, not application source — `.catch(() => {})` here is a deliberate
    // "best-effort, ignore failure" idiom (e.g. an optional UI interaction that may not apply on
    // every run), repeated identically throughout; not a sign of dropped error handling.
    files: ["e2e/**/*.ts"],
    rules: {
      "@typescript-eslint/no-empty-function": "off",
    },
  }
]);
