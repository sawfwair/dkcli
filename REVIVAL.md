# DesignKit revival assessment

Reviewed October 4, 2026 against commit `be27c90`. The checkout was clean and matched `origin/main` after fetching. The most recent commit and successful GitHub workflows were from June 5. Archive searches for `dkcli`, `designkit`, and `dkweb` returned no matching Lab threads.

DesignKit has a useful deterministic engine and verification infrastructure. The main gap was that generated design metrics and successful builds did not establish that a consumer could use the components correctly. The local repairs now cover concrete output defects, authoritative proof verdicts, a workbench consuming packed public artifacts, editable theme exports, and a complete SvelteKit application installed from package tarballs. The subsequent theme-project milestone adds shared algorithms, portable history, measured browser qualification, and explicit token patches. Dependency maintenance remains separate follow-up work.

## Repairs in this pass

| Problem reproduced | Result after repair |
| --- | --- |
| A formatted CSS block starting with `color` skipped text contrast analysis. Reordering the same declarations changed the result from no contrast pairs to an APCA failure. | Leading whitespace no longer hides the text color. A regression compares the extracted pairs and contrast failures for both orders. |
| `dk optical icon` emitted two `transform` declarations, so the vertical correction overwrote the horizontal correction. | CSS emits one transform containing both corrections; JSON retains the individual correction records. |
| Equal viewport endpoints emitted `Infinity` in fluid CSS with exit code 0. Reversed endpoints also succeeded. | Both CLI and core scale functions reject equal, reversed, negative-minimum, and nonfinite viewport ranges. A zero minimum remains valid. |
| Theme aliases such as `floating-bg: overlay-bg` emitted bare identifiers as CSS color values. | Alias references emit `var(--overlay-bg)` and equivalent references for calendar and command tokens. Literal CSS values remain literal. |
| Vitest discovered workspace source through installed package symlinks. | Recursive exclusions remove 28 installed copies while retaining all 108 source test files. |
| The disposable consumer selected global pnpm 12, ignored the local tarball overrides, and rejected esbuild's install script. | The temporary manifest inherits the repo's pnpm 10.33.0 pin and explicit esbuild permission. Direct and transitive dependencies resolve the packed local packages, and the consumer builds. |

The CLI and core regressions failed before repair: four audit/CLI cases and eighteen API viewport cases. Token alias regression also failed before its emitter repair. The `reliable-design-outputs` Changeset was consumed into the release candidate described below.

## Consumer interaction and packaging repairs

The second pass reproduced the interaction and identity failures before repairing them:

| Problem reproduced | Result after repair |
| --- | --- |
| `<Button on:click={onClick}>` never delivered the consumer action. | `onClick` and legacy `on:click` receive the same native `MouseEvent`, including cancellation. Disabled and loading controls suppress delivery. |
| Enter on an unrelated control opened Select and Combobox. Overlapping Combobox handlers could move twice or steal typing focus. | Opening and navigation stay local to each control. Disabled controls and choices are excluded. Combobox keeps focus on its input; Escape restores focus and outside interactions preserve the destination. |
| Two TextFields shared the same ID; common item values also collided across overlay and tab instances. Date triggers lacked their label's target. | Seventeen component families use Svelte's instance ID mechanism. Multiple instances have independent label and panel associations, caller IDs are preserved, and actual repeated SSR plus hydration retains the IDs. |
| Menu selection closed private state without notifying the consumer. | `onAction({ value })` and legacy `on:action` report enabled selections once. Outside focus closes the menu without an action or focus theft. |
| The starter's built entry used `new App(...)` and failed to mount under Svelte 5. | The entry uses `mount`. The consumer gate runs the actual built browser bundle through mount, selection, save, and clear. |
| Isolated `dk components verify --all` could not import `@dkcli/components`. | The CLI bundles the authoritative verification module. The npm tarball runs verification and matrix commands without workspace packages or a framework installation. |

The interactive starter exercises two independently labelled fields, an Environment Select, a Reviewer Combobox, a Save Button, and Preview/Clear Menu actions. The temporary consumer installs the packed core, tokens, and component packages, checks types against their declarations, tests pointer and keyboard behavior, builds the application, and runs its compiled entry. It also verifies emitted theme styles. A browser run independently confirmed keyboard selection, save, and clear with the correct summary.

The ID repair required migrating the affected scripts to Svelte runes and updating the package's Svelte peer minimum to 5.20, when the supported instance ID API was introduced. Bindings, explicit IDs, legacy component events, and legacy named slots remain supported. Named-slot content is covered during SSR and hydration as well as existing behavior tests. Component API examples are in `docs/packages/components.md`.

The browser check also found a Combobox input wider than its containing card, with the icon wrapping below it. The input now includes padding and borders within its declared width, and the trigger supplies the icon's shared positioning variables without requiring a global CSS reset. Packed browser geometry confirms the input matches its parent at 437.02px in the default viewport and 298.73px at a 390px viewport; neither viewport has horizontal page overflow.

The `usable-component-consumers` Changeset was consumed into the release candidate described below. The release gate includes standalone CLI tarball smoke tests and the interactive packed starter checks. These checks measure consumer behavior separately from recipe math verification.

## Align proof output with actual validation

The reproduced discrepancy is repaired: `dk perfect` uses `compilePerfectProof` and includes its authoritative aggregate report. Default generation still writes an artifact, while `--strict` returns exit code 1 for a failing or unsupported proof. The default proof's deutan distinctness collision remains a visible failure. Audit, component verification, and component matrix commands follow the same artifact-first strict policy.

Component proofs evaluate every declared width, include authored distinctness/CVD requirements, and report declared, evaluated, and unsupported check coverage. Unknown proof requirements fail visibly. The matrix contains 720 fixtures across 38 components and four themes: 45 fail conservative single-line width estimates in 20 component/theme stages. These are mathematical estimates using the maximum fluid token size; they do not establish rendered overflow. The workbench displays these failures and per-width results, with a reviewed baseline that consumer gates never regenerate automatically. No recipe or threshold was weakened to remove a failing result.

Source CSS audits remain heuristic extraction, with assumptions about background and inheritance. The public CLI cannot perform rendered audits itself; that path requires the private web runtime. Typesetting accepts font-family and font-file options but currently estimates width using glyph factors rather than those font files. These boundaries should be explicit wherever the tool is presented as evidence.

## Public workbench and SvelteKit milestone

The sibling `dkweb` workbench installs packed public core, tokens, and component artifacts in an ignored standalone consumer. Its resolution gate checks exports, declarations, exact transitive package identity, Svelte alignment, and a checksum/provenance receipt. A source-free consumer check also passes with supplied tarballs. Preserved package copies remain available for historical scripts, without serving as a workbench fallback.

The Design systems page can author a theme name, seed color, mode, density, and named ratio; preview real public components; inspect mathematical results; and copy or download CSS and JSON. Shared links retain the authored settings. Invalid edits retain the last valid artifact. Reserved built-in theme names are rejected so custom recipes cannot accidentally select a default theme by name. Documented callback examples are checked against packed public declarations.

The workbench unit suite separates public-artifact workbench tests from the preserved source packages' own dependency tree. Semantic regressions prevent mixed compiler/token implementations. Four historical calendar test failures were traced to unpinned April fixtures opening the current October month; those fixtures pin only Date. Strict auth wrapper typing was also repaired by describing the helper fields actually consumed; emitted runtime operations remain unchanged.

`examples/sveltekit-starter` supplies Release desk: sortable and selectable releases, search and status filters, validated creation, review and status changes, readiness counts, empty states, and reset. Theme preferences render on the server before hydration. It imports workbench JSON, validates the public theme configuration, and regenerates tokens. Named actions preserve validation feedback and work without JavaScript. The example is a personal demo with bounded cookie storage, not a multi-user service.

`pnpm example:sveltekit:verify` builds and packs the public packages, creates a disposable SvelteKit consumer with exact direct and transitive tarball overrides, and runs strict checks, model tests, production build, HTTP server checks, and Chromium flows. The full public release gate includes this workflow. The browser checks cover create/review/filter/theme persistence and a 390px layout with JavaScript disabled. A manual browser check also confirmed that an exported workbench theme imports into Release desk and survives reload.

Workbench CI records the exact committed kit ref, tarball checksums, consumer lockfile, and browser reports. Its qualification workflow no longer publishes the historical copied packages; `dkcli` owns public package publication. The workbench's checked-in `public-kit-source.json` supplies the exact public revision for ordinary CI. The manual consumer workflow accepts an exact `dkcli_ref` commit.

## Dependency maintenance

The October 4 lockfile audit reported 70 advisories across the workspace: 33 high, 30 moderate, and 7 low. The production-only workspace audit reported 11, all on the component Svelte/devalue path, including 3 high. These are dependency reports, not reproduced exploits in DesignKit. The component's Svelte peer range also permits consumers to install newer releases, so this lockfile result does not describe every consumer installation.

Triage the runtime and development paths separately, upgrade compatible dependencies, and verify docs, package builds, and consumer behavior. The older VitePress dependency chain needs particular attention. Do not equate an audit count with an exploitable public endpoint or silently suppress an unpatched advisory.

The subsequent project milestone reproduces and repairs the Fibonacci scale's
negative-index error and the optical circle's compounded correction. CLI and web
math bridges now export public core algorithms. Broader CLI flag and numeric-range
consistency remains a separate maintenance task.

## Documentation and interface copy review

The October 4 copy review applies the Google developer documentation style guide
to the CLI, public package documentation, workbench, and examples. It removes
slogans, repeated instructions, decorative section labels, and default empty-state
filler. It retains required formats, validation, recovery actions, storage limits,
and evidence boundaries. Contribution guides record these conventions.

Documentation corrections identify public package ownership, source audit limits,
local browser runtime dependencies, supported DKCMS content fields and endpoints,
and archived plan scope. Generated API and agent Markdown use the same conventions.

The review reproduced a `dk future` error-classification defect: valid `[]` and
`{}` inputs were reported as malformed JSON because shape validation ran inside
the parsing catch. Two regression tests failed before repair. Parsing and shape
validation are separate after repair; a third test preserves the malformed-JSON
error. The focused suite passed 79 tests across 14 files.

The documentation build replaces unrendered diagrams with dependency tables and
an ordered build workflow. The proof table exposes four row headers to assistive
technology. Browser checks passed for 19 documentation pages and 129 internal
page or anchor targets. Static checks covered 51 Markdown files, 57 local file
targets, 2 Markdown anchors, 7 JSON examples, and 100 shell examples. Shell
examples were parsed without execution.

Workbench descriptions retain Markdown code delimiters in generated Markdown.
The HTML documentation renders paired inline code as escaped `<code>` elements.
Browser inspection confirms code font for `accept` and `YYYY-MM-DD`, with no
visible backticks in the checked descriptions.

One repeat workbench browser run passed 182 of 184 flows. Copy and review actions
failed their state assertions, then passed three unchanged repeats each. A
separate delayed-client-JavaScript check reproduced enabled controls accepting
lost early clicks and review notes being cleared during initialization. It did
not establish the exact cause of the original post-navigation failures.

Copy and browser-only review controls now remain disabled until their handlers
and stored review state are ready. Two delayed-loading browser regressions failed
against the old build. They check clipboard contents and saved review verdicts
and notes after initialization. Red evidence is saved under
`/tmp/dkweb-copy-readiness-red-evidence-20261004/` and
`/tmp/dkweb-copy-hydration-evidence-20261004/`.

The public copy gate passed `pnpm release:verify` with 558 tests across 111 files,
including standalone CLI and packed Vite and SvelteKit consumers. Coverage
thresholds passed at 85.28% statements, 84.26% lines, 88.01% functions, and 66.21%
branches. The final Release desk copy also passed both Chromium consumer flows.

The workbench copy gate passed lint, app and preserved-component strict checks,
backend typechecking, 517 unit tests across 148 files, and unchanged coverage
thresholds. Packed public artifact contracts passed 34 tests. The final inline
code and duplicate-label changes passed focused documentation and theme-authoring
checks, with 23 tests across 8 files and no strict-check errors or warnings.

After the readiness repair, full unit and coverage reruns passed all 517 tests.
Coverage remained at 83.35% statements, 82.61% lines, 86.43% functions, and 62.83%
branches. The final production build passed all 186 Chromium flows, including both
delayed-loading regressions. Focused clipboard and review-persistence unit tests
also passed, with no lint or strict-check errors or warnings.

Copy-review logs are `/tmp/dkcli-copy-release-20261004.log`,
`/tmp/dkcli-copy-coverage-20261004.log`,
`/tmp/dkcli-copy-desk-followup-browser-20261004.log`,
`/tmp/dkweb-copy-readiness-final-tests-20261004.log`,
`/tmp/dkweb-copy-readiness-final-coverage-20261004.log`,
`/tmp/dkweb-copy-readiness-final-browser-20261004.log`, and
`/tmp/dkcli-docs-style-build-final.log`. Browser captures and inline-code receipts
are saved in `.tmp/`.

## Portable theme-project milestone

The next local milestone implements all five agreed priorities:

| Priority | Delivered behavior |
| --- | --- |
| Shared engine | CLI and web math modules export public core. Negative Fibonacci indices and compounded optical circle sizing have persisted regressions and repairs. |
| Authored themes | Body, display, and mono font stacks, semantic token overrides, and motion presets compile through public tokens and apply across all 38 component pages. |
| Measured qualification | Hydrated, font-ready default scenes produce geometry, screenshots, keyboard checks, explicit coverage gaps, and content/package-bound receipts. Both local Chromium and the Cloudflare browser adapter run. |
| Portable projects | Version 1 JSON supports save/reopen, import/export, revision comparison, restore, undo/redo, retained receipts, and stale review detection. |
| Checked repairs | Supported measured text findings offer before/after component previews and identity-checked token patches. Applying a patch records a revision; undo/redo and same-width reruns retain the original evidence. |

The actual repair browser flow measures a 192 px Button label, previews a smaller
font, applies revision 2, undoes into revision 3, redoes into revision 4, and reruns
320 px measurements. The new Button text-overflow check passes. Reload retains
both receipts and the saved revision. Suggestions remain scoped trials, with other
controls and contrast rechecked by the subsequent qualification.

Additional persisted regressions cover imported colors and lengths, duration
units, project URL save/reopen retention, receipt and request bounds, review
backup failures, measured hidden-element scope, public worker type resolution,
and dependency-cache provenance. Controlled CommandPalette close returns focus
to its external opener; a Popover without focusable content focuses its surface.

Prepared package fingerprints now select distinct Vite dependency cache
directories. This prevents a fresh receipt from describing stale optimized
component code. The worker type aliases also select prepared declarations; its
actual Wrangler dry-run bundle already used public core and remains correct.

For the public format and commands, see [Theme projects](docs/guides/theme-projects.md).
The coordinated contract and ownership are in [Implementation plan](PROJECT-WORKFLOW.md).

## Project milestone verification

The public release gate passes lint, strict types, 646 tests across 118 files,
package builds and metadata, standalone CLI smoke, and both packed consumer apps.
The packed SvelteKit consumer passes server actions and both Chromium flows.
Public coverage passes the unchanged thresholds: 85.58% statements, 85.18% lines,
88.74% functions, and 68.70% branches. The updated documentation builds.

Workbench lint, strict app and preserved-component checks, worker typechecking,
public artifact contracts, and production build pass. Its final coverage run
passes all 564 tests across 161 files, with 81.82% statements, 80.61% lines,
85.14% functions, and 60.65% branches. The 60% branch threshold remains unchanged;
four CLI edge cases add meaningful validation, stdin, and remote-error coverage.
The complete production Chromium suite passes all 193 flows.

The current measured receipt covers 38 default scenes at 320, 768, and 1280 px:
114 measurements and 114 bounded JPEGs. All 39 implemented keyboard checks pass;
measured text and container overflow have no failures. The receipt remains
`failed` because 46 of 180 mathematical fixtures fail and 32 measured target-size
checks fail the project's 44 px criterion. These are retained findings; the target
criterion is not a WCAG verdict. Alternate variants, states, assistive technology,
per-glyph font selection, and cross-browser behavior remain untested.

The exact package fingerprint is
`8fd21a61f3998acdd895c420290735e8ee1ad75ac870c178cf273525d286c2f7`.
The standalone extracted CLI calls the built Node preview, matches this fingerprint
and the Northstar project identity, emits all 114 measurements/screenshots, then
exits 1 under `--strict`. Source-free verification does not require workspace
dependencies. The four-preset 720-fixture/45-estimate-failure baseline is unchanged.

During the project milestone, Cloudflare browser acquisition and the delivered
rendered snapshot path passed against the remote `BROWSER` binding. Its complete
114-scene capture was local Chromium evidence; it did not qualify the full hosted
project. That temporary harness and development qualification server were stopped
afterward. The subsequent release qualification uses a separately staged built
Worker and records its complete scope.

Current receipts, summaries, and desktop/phone captures are in
`dkweb/.tmp/qualification/` in the sibling checkout. Layout checks report no page
overflow or alerts at 1440 px and 390 px. Final logs are
`/tmp/dkcli-project-final-release-focus-20261004.log`,
`/tmp/dkcli-project-final-coverage-focus-20261004.log`,
`/tmp/dkcli-project-final-docs-focus-20261004.log`,
`/tmp/dkweb-project-final-coverage-green-20261004.log`,
`/tmp/dkweb-project-final-browser-20261004.log`, and
`/tmp/dkweb-project-final-build-20261004.log`.

At the end of the project milestone, the global `dk` installation contained
package version 0.2.0, and its implementation and Changesets were local and
uncommitted. Release qualification tracks the committed versions, registry
publication, and installed executable separately.

## Earlier verification

Validation uses Node 22.23.1 and pnpm 10.33.0. After the public workbench and SvelteKit milestone, the unit suite passed 555 tests across 111 source files. Coverage thresholds passed: 85.29% statements, 84.21% lines, 88.12% functions, and 66.23% branches. The docs built successfully. The 720-fixture component matrix retains 45 known mathematical estimate failures; actual consumer behavior and SSR/hydration are covered by separate passing tests.

The workbench passed lint, strict checks for both the app and preserved components, backend typechecking, 517 unit tests across 148 genuine source files, and unchanged coverage thresholds (83.35% statements, 82.61% lines, 86.43% functions, 62.83% branches). Its final production build passed all 184 Chromium tests. Public artifact contracts passed 34 tests; the source-free consumer passed strict checks and 11 tests. The discovered test reduction excludes 25 installed symlink copies containing 74 duplicate tests; every canonical first-party test remains. The inventory is recorded in `dkweb/docs/public-kit-test-discovery.md`, and final workbench gate logs are under `/tmp/designkit-workbench-gates.nDVZAS/`.

During the initial repair, eight CLI workflows passed from both source and an isolated npm tarball, with identical output: help, perfect, palette, fluid scale, text, CSS audit, optical corrections, and invalid fluid-range rejection. That comparison covered 16 process runs and did not validate remote CMS or rendered runtime paths. The current standalone smoke gate additionally checks authoritative proof output, the known matrix failure baseline, and artifact-first strict exits.

The `pnpm release:verify` run passed lint, strict checks, unit tests, builds, publint, dry packs, package-content checks, standalone CLI smoke, and the packed consumer's types, interactions, build, and compiled entry. The consumer's direct and transitive dependencies resolve local tarballs. The starter also passed types, both interaction tests, build, and compiled-entry checks with Svelte pinned to the supported minimum 5.20.0; the regular packed consumer used 5.57.1 and the source workspace used 5.55.0.

The initial consumer repair logs are `/tmp/dkcli-release-consumers-green-20261004.log`, `/tmp/dkcli-coverage-consumers-20261004.log`, `/tmp/dkcli-docs-consumers-20261004.log`, and `/tmp/dkcli-svelte-minimum-20261004.log`. Current milestone logs are `/tmp/dkcli-milestone-release-20261004.log`, `/tmp/dkcli-milestone-coverage-20261004.log`, and `/tmp/dkcli-milestone-docs-20261004.log`. Browser captures are saved locally in `.tmp/starter-consumer-20261004.jpg`, `.tmp/release-desk-final-20261004.jpg`, and `.tmp/theme-workbench-20261004.jpg`.

At the end of the project milestone, the changes were local and uncommitted.
The subsequent release candidate consumes those Changesets into CLI 0.4.0,
core 0.3.0, tokens 0.3.0, and components 0.2.5. The versioned lockfile and
changelogs are included in this checkout. Publication is tracked separately
from local verification in the release qualification record.

## Release qualification

The versioned kit contains CLI 0.4.0, core 0.3.0, tokens 0.3.0, and
components 0.2.5. CI actions use immutable commits. Validation uses Node.js
22.23.1 and pnpm 10.33.0; trusted publication uses Node.js 24.14.1 and npm
11.5.1. The workbench records its exact public source revision in
`public-kit-source.json`.

The original 46 mathematical findings are classified in
[Math qualification assessment](MATH-QUALIFICATION-ASSESSMENT.md). Explicit
authored viewport caps repair 29 responsive-width estimates. The remaining
17 conservative line-layout findings stay failed. The source-free release
guard seals all 180 fixture identities and the exact remaining failure
signatures; the four-preset 720-fixture/45-failure baseline is unchanged.

[Target finding classification](qualification/target-finding-classification.json)
records the original 32 check groups and additional state findings, with
persisted failing reproductions. Repairs cover native hit regions, disabled
branches, open-surface bounds, complete long-label wrapping, CSS zoom
coordinates, constrained field/tab grids, InlineEdit keyboard focus, and
the generated loading ring. Compact Chip, Tabs, and calendar-day targets
retain the failed 44 px project criterion with their measured geometry.
This criterion does not establish accessibility conformance.

The final public coverage run passes 701 tests across 121 files, at 85.77%
statements, 85.38% lines, 88.84% functions, and 69.72% branches. The source
browser checks retain the compact findings and require the repaired control,
layout, zoom, and focus behavior to pass. Package verification also checks
the standalone CLI and packed Vite and SvelteKit consumers.

The workbench release gate requires all 132 declared scenes at the three
recorded widths in Chromium, Firefox, and WebKit, using the actual bundled
ABeeZee font. Five named scenes additionally exercise a dark theme and 200%
CSS zoom. Its hosted harness exercises the actual built Worker, authentication
hooks, Browser Rendering binding, assets, and expiring fixture sessions.
Receipts distinguish raw failures from exact reviewed release criteria.
Native browser UI zoom, assistive technology, undeclared combinations, and
the production auth broker remain separate checks.

GitHub CI and npm publication must be verified for the qualified commits.
Local checks do not establish either result. See
[Release workflow](docs/guides/release-workflow.md) for the publishing sequence
and [Release qualification plan](RELEASE-QUALIFICATION.md) for acceptance
criteria.
