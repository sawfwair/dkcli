# Release qualification

This milestone qualifies the public kit and its private workbench consumer for release. Preserve the existing revival work and recorded failures.

## Work plan

1. Classify the 46 mathematical findings and 32 target-size check findings in the recorded default receipt. Repair reproducible component or compiler defects. Retain conservative estimates with their assumptions and browser evidence.
2. Add a declared state manifest and browser checks for supported disabled, invalid, loading, open, and long-content states. Include dark themes, browser zoom, same-origin font files, Firefox, and WebKit. Record unsupported and untested behavior.
3. Run the built Worker through the authenticated qualification API with real Cloudflare Browser Rendering. Bind measurements to exact tarball checksums and the current project. Retain the complete receipt and a compact summary.
4. Run public release verification and coverage, private strict checks and coverage, packed-artifact contracts, production builds, and browser qualification. Pin CI actions, toolchain versions, and the public source revision.
5. Version and commit the validated milestone in both repositories, run remote CI for those commits, publish the public packages through the configured trusted publishing path, and update the installed CLI. Verify registry versions and the installed executable.

## Acceptance evidence

- Every repaired defect has a persisted failing reproduction and passing verification.
- Qualification records distinguish mathematical estimates from actual geometry. Findings do not disappear through weaker checks or an automatic baseline update.
- Required state and browser behavior passes for the declared scope. Exact reviewed compact-target exceptions retain their failed 44 px criterion, selector, dimensions, and reason. Unmeasured states remain explicit. Mathematical strict verdicts retain the reviewed conservative findings.
- Hosted evidence covers the full current qualification request, authentication, and same-origin font loading. A single-widget adapter check is insufficient.
- Published versions, Git commits, artifact checksums, remote CI, and local CLI version are reported separately.

## Current mathematical baseline

The audited layout model records each component's declared text behavior: single line, wrapping, wrapping anywhere, or managed scrolling. It retains the full single-line estimate and checks every requested width. Wrapping controls use their authored minimum block size; an explicit height or line cap still applies when declared.

The built CLI passes all 180 fixtures for `qualification/original-project.json` and all 720 fixtures across the 152 component-theme matrix runs. Both strict commands exit successfully. `qualification/reviewed-math-policy.json` pins the exact case inventory, width verdicts, layout assumptions, run results, and totals. The release guard rejects new failures, changed case inputs, incomplete evidence, or an exit status that disagrees with the artifact.

The previous 17 project and 45 matrix findings remain in `qualification/reviewed-math-policy-20261004.json` as historical results from the earlier single-line model. Current passing mathematical estimates do not establish rendered behavior or accessibility conformance.

Run `pnpm check:release:math` after building the CLI. Run the direct guard regressions with `node --test scripts/assess-release-math.test.mjs` against the same build.

## Ownership

- CLI review: public math, fixture contracts, receipt contracts, and CLI.
- Component review: public control hit regions and deterministic state rendering.
- Browser review: private capture/API, state browser checks, fonts, and hosted harness.
- Root: CI and release wiring, documentation, integration gates, versioning, commits, publication, and installed CLI verification.
