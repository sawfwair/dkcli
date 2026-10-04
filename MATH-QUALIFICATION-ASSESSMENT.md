# Mathematical qualification assessment

The original local browser receipt records 46 failed mathematical fixtures out of
180 and 32 failed rendered target-bound checks. These are separate findings.
The mathematical failures contain 29 anchored-width model defects and 17
conservative layout estimates that need matching rendered evidence.

[The classification](qualification/math-failure-classification.json) preserves
every original failed case, its checks, and the receipt and project identities.
It uses the exact `browser-qualification` project, named `Browser test`, rather
than the portable Northstar example. The source receipt is dated
`2026-10-04T16:18:30.561Z`. The classification is an assessment of that receipt;
it does not replace the receipt or qualify later package artifacts.

## Authored responsive caps

The seven components below constrain their surface widths in CSS. Their proof
declarations previously checked the preferred width against 288px of available
space at a 320px viewport, without applying the authored constraint.

| Component | Failed fixtures | Authored cap |
| --- | ---: | --- |
| Combobox | 9 | `min(preferred, calc(100vw - 2rem))` |
| Select | 9 | `min(preferred, calc(100vw - 2rem))` |
| CommandPalette | 2 | `min(42rem, calc(100vw - 2rem))` |
| DatePicker | 3 | `min(preferred, calc(100vw - 2rem))` |
| RangeDatePicker | 3 | `min(preferred, calc(100vw - 2rem))` |
| Popover | 1 | `min(preferred, calc(100vw - 2rem))` |
| Toast | 2 | `min(preferred, calc(100vw - 2rem))` |

The compiler now applies a cap only when the proof explicitly declares
`viewportConstrained`. Results retain `surfaceWidthPx` as the preferred width
and add `preferredSurfaceWidthPx`, `effectiveSurfaceWidthPx`, and assumptions.
Vertical overflow and uncapped surfaces still fail. The estimate assumes a
16px root, border-box dimensions, and the declared viewport padding. It does not
measure actual placement or content overflow inside the surface.

The CSS evidence is in the public [Select](packages/components/src/lib/select/Select.svelte),
[Combobox](packages/components/src/lib/combobox/Combobox.svelte),
[CommandPalette recipe](packages/components/src/lib/command-palette/command-palette.spec.ts),
[DatePicker](packages/components/src/lib/date-picker/DatePicker.svelte),
[RangeDatePicker](packages/components/src/lib/range-date-picker/RangeDatePicker.svelte),
[Popover](packages/components/src/lib/popover/Popover.svelte), and
[Toast](packages/components/src/lib/toast/Toast.svelte) sources.

## Remaining layout findings

| Component | Failed fixtures | Failing container width |
| --- | ---: | --- |
| Accordion | 1 | 320px |
| Badge | 3 | 120px |
| Breadcrumbs | 1 | 220px |
| Button | 2 | 180px |
| Checkbox | 9 | 240px |
| TextField | 1 | 240px |

These checks estimate single-line text using 0.56em per character and maximum
length-token values. They do not shape glyphs, measure wrapping, or inspect
rendered container geometry. The compiler now includes those assumptions in the
results. The checks remain failed; their thresholds and samples are unchanged.

[The render descriptors](qualification/layout-render-cases.json) list exact
axes, states, props, samples, targets, and failing container widths for all 17
cases. A default scene at a 320px viewport does not establish fit at a 120px,
180px, 220px, or 240px container, or for different sample text and state.
Expanded long-content scenes also have a separate scope unless their inputs
match these descriptors.

The four-theme mathematical baseline remains 720 fixtures with 45 explicitly
known layout failures. The responsive-cap repair changes only recorded narrow
anchored-width results; it does not alter that baseline. APCA results remain
mathematical contrast checks and do not certify WCAG compliance.

## Release evidence requirements

Every release receipt must identify the project content, package fingerprint,
actual browser provider and version, selected cases, recorded widths, and
environment. CSS zoom must be identified as CSS zoom. The same-origin font
fixture must record the loaded ABeeZee face; a font family string alone is
insufficient evidence of loading.

Every declared case and width must have matching axes and state, geometry,
bounded image evidence, and all required check kinds. Missing work must be
named in coverage and cannot produce a passing status. Explicit CLI requests
for engines, environments, cases, or font fixtures cannot be substituted.
Engine, dark-mode, zoom, and font receipts qualify their recorded scope only.

A release gate must reject actual required rendered failures, missing case or
width evidence, unsupported required checks, unloaded required fonts, stale
identities, and unreviewed mathematical regressions. Preserve known layout
findings as an explicit reviewed set with matching scope; do not turn them into
blanket passes. `--strict` continues to emit the artifact and exit 1 for failed
or incomplete evidence, including these unresolved mathematical findings.
Browser receipts are unsigned producer claims, not signed attestations.

Run `node scripts/assess-release-math.mjs` after building the CLI to assess the
reviewed mathematical findings. The check runs strict verification in a
temporary consumer with built artifacts and no workspace source. Both commands
must still exit 1 after emitting their reports. The check compares the original
project identity, 180-case inventory, exact 17 failure identities, case inputs,
failed widths, estimates, proof counts, and coverage against
[the reviewed policy](qualification/reviewed-math-policy.json). It also preserves
the complete 720-fixture, 45-failure matrix, including each failure reason.
An unexpected case, category, unsupported check, or changed input fails this
assessment. A successful assessment accepts the reviewed set; it does not turn
mathematical failures into passes or qualify rendered behavior.
