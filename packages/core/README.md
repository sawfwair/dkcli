# `@dkcli/core`

Use `@dkcli/core` to generate palettes and scales, compile component recipes,
and evaluate mathematical proofs without a UI framework.

## Install

Install the package:

```bash
npm install @dkcli/core
```

## Compile a recipe

Pass a `ComponentSpec` and a `ThemeContract` to `compileComponentRecipe`.
The result includes CSS variables for each case and proof fixtures.

Fixtures report declared proof coverage, unsupported checks, and pass or fail
results. Layout checks use conservative single-line estimates and maximum token
values. They do not measure browser overflow.

Source CSS audits use heuristics without resolving the cascade or rendering
elements. APCA checks do not establish WCAG compliance.

## Theme projects

`createThemeProject` creates a versioned document containing theme inputs, fonts,
token overrides, recorded widths, history, and evidence. Validate imported files
with `validateThemeProject`; use `projectIdentity` to identify their exact authored
content. `reviseThemeProject`, `restoreThemeProjectRevision`, and
`applyThemeProjectPatch` retain earlier inputs.

`compileProjectComponentFixtures` evaluates recorded and declared recipe widths.
Browser receipts use `validateProjectQualificationReceipt` and
`assertProjectQualificationMatches` to check structure, identity, and package
provenance. Those checks validate reported evidence; they do not measure a browser.

For Svelte components, see
[`@dkcli/components`](https://www.npmjs.com/package/@dkcli/components).
For setup and API guides, see the [DesignKit documentation](https://dkcli.com).
