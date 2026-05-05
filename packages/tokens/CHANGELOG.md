# @dkcli/tokens

## 0.2.2

### Patch Changes

- Ship security hardening for public CLI and package APIs.

  - Bind stored DKCMS sessions to their original base URL before authenticated requests.
  - Escape `dk future` generated CSS selectors and comments.
  - Validate component specs and use safer maps during recipe compilation.
  - Reject unsafe CSS custom property names and declaration-breaking values during token and recipe CSS emission.
  - Sanitize public component href props before rendering links.
  - Pin the release workflow Changesets action to an immutable commit.

- Updated dependencies
  - @dkcli/core@0.2.2

## 0.2.1

### Patch Changes

- Tightened package metadata and public release verification.
- Updated dependencies
  - @dkcli/core@0.2.1

## 0.2.0

### Minor Changes

- First coordinated public release for the DK docs system, public packages, starter app, and advanced component wave.

### Patch Changes

- Updated dependencies
  - @dkcli/core@0.2.0
