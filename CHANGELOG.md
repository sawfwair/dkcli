# @dkcli/cli

## 0.3.1

### Patch Changes

- Ship security hardening for public CLI and package APIs.

  - Bind stored DKCMS sessions to their original base URL before authenticated requests.
  - Escape `dk future` generated CSS selectors and comments.
  - Validate component specs and use safer maps during recipe compilation.
  - Reject unsafe CSS custom property names and declaration-breaking values during token and recipe CSS emission.
  - Sanitize public component href props before rendering links.
  - Pin the release workflow Changesets action to an immutable commit.

## 0.3.0

### Minor Changes

- Split the public CLI/package workspace from the private website and runtime surface.

  The CLI package now treats hosted DKCMS features as a public client only, removes rendered audit runtime coupling from the public command surface, and adds package-content checks for private server, route, worker, deploy, and runtime-token references.

  The component package build/test configuration now avoids generated Svelte package output during Vitest collection and compiles Svelte component tests through the Svelte Vite plugin.

## 0.2.1

### Patch Changes

- Tightened public package verification and tarball content checks.
- Removed unlicensed runtime hyphenation data in favor of deterministic built-in word breaking.
- Updated public repo metadata, Cloudflare deployment placeholders, and open-source docs.

## 0.2.0

### Minor Changes

- First coordinated public release for the DK docs system, public packages, starter app, and advanced component wave.
