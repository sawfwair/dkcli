# Theme project implementation plan

This local milestone completes the five priorities agreed on October 4, 2026.

1. Move retained design algorithms into public core and make CLI and web modules
   consume those APIs. Reproduce the Fibonacci and optical defects before repair.
2. Add a portable, validated version 1 project document. It contains theme inputs,
   token overrides, font choices, recorded widths, saved revisions, qualification,
   and revision-bound review notes. Import failures retain the current project.
3. Apply authored themes throughout all 38 component docs, comparison, and review.
   Add project save/import/export, revision comparison, and undo/redo.
4. Measure the authored artifact across recorded widths and exercise interactions.
   Receipts distinguish mathematical estimates, measured results, unsupported
   checks, screenshots, fonts, and exact artifact provenance. Integrate local
   Chromium and Cloudflare's browser binding. CLI and UI use the same contract.
5. Map supported findings to explicit token patches. Preview changes, retain the
   previous revision, apply a patch, and rerun the same qualification. Never label
   a mathematical warning as measured evidence or silently approve stale reviews.

## Ownership

- CLI worker: public math modules, retained CLI/web bridges, CLI project commands,
  math regression and parity tests. Excludes core project contract and tokens.
- UI worker: theme authoring, project editor/store, component theme propagation,
  revision-bound review, patch interface, relevant unit and browser tests.
- Qualification worker: browser adapters, qualification API and preview route,
  measured geometry/interaction receipts, rendered audit completion and tests.
- Root: shared project contracts, token compilation support, package integration,
  documentation, complete consumer qualification and final verification.

No builds run concurrently against the same checkout. Root coordinates final
artifact preparation, previews, unit/coverage checks, browser tests, and packed
consumer verification. Existing local work and math failure baselines are retained.

## Shared contract

Public core exports versioned project types and pure validation/history/patch
operations from `project.ts`. A project theme contains `name`, `seed`, optional
`overrides` for existing token families, and `fonts` (`body`, `display`, `mono`).
Recorded `viewports` default to 320, 768, and 1280 pixels. Project identity uses
canonical JSON and SHA-256 through Web Crypto. Qualification and reviews include
that identity plus the exact prepared package fingerprint. A recipe or theme
change invalidates evidence rather than rewriting its original identity.

The public tokens package compiles this theme configuration. Qualification takes
`{ project }` at `POST /api/dk/projects/qualify` and returns a versioned receipt.
The CLI exposes `dk project verify`, `qualify`, and `patch`, with artifact-first
strict exits. The measured command uses an explicit runtime origin. Receipt
verification regenerates identity and rejects stale or malformed evidence;
recorded checks remain claims of their producing runtime, not signed certificates.

## Delivered behavior

All five source changes are implemented. The workbench uses prepared public
packages for math, authored tokens, and all 38 component families. Its API and the
standalone packed CLI measure the same default scenes at recorded widths.

The actual browser repair flow verifies measured 192 px label overflow, visible
before/proposed components, a checked patch, undo/redo, same-width rerun, and
receipt retention after reload. Reviews and receipts retain their original
identities when inputs or artifacts change.

Integration also repairs saved-project reopening through editor URLs, controlled
overlay focus, private worker type aliases, and artifact-specific Vite caching.
Final validation and remaining evidence limits are recorded in `REVIVAL.md`.
