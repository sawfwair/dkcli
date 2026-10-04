# Release workflow

For package maintainers, this guide describes local qualification and the repository's release workflows. Local validation and npm publication are separate actions. Qualification reports must identify their measured states, browser, viewport, theme, zoom condition, and font files.

## Pin the release inputs

CI actions use commit hashes. The validation toolchain uses Node.js 22.23.1 and pnpm 10.33.0. Trusted publication uses Node.js 24.14.1 and npm 11.5.1 in the configured GitHub Actions workflow.

The workbench records its public source commit in `public-kit-source.json`. Qualify the public commit and its workbench consumer before publishing. Keep the source commit, package versions, tarball checksums, browser results, and hosted receipts together in the release record.

## Run the local gate

To qualify package changes, run:

```bash
pnpm release:verify
```

The gate runs linting, strict type checks, tests, actual component geometry checks in Chromium, builds, package validation, dry packs, and package-content checks.

The CLI smoke runs the packed executable without workspace dependencies. It checks component verification and matrix commands.

The starter installs local tarballs and tests keyboard selection, button and menu actions, mounting, saving, and clearing.

The SvelteKit Release desk is an isolated tarball consumer. It checks declarations, validation, server rendering, form actions, hydration, interactions, reload persistence, and mobile page width.

To set up a verification host, install Chromium:

```bash
pnpm exec playwright install --with-deps chromium
```

To run the SvelteKit consumer independently, run:

```bash
pnpm example:sveltekit:verify
```

## GitHub Actions workflows

The repository contains the following workflows:

- **CI**: linting, type checks, tests, coverage, and builds
- **Packages**: package builds and validation
- **Example Starter**: packed-artifact consumer checks
- **Release**: qualification and npm publication through Changesets or version changes
- **Docs**: VitePress builds and GitHub Pages deployment

A configured workflow does not establish that a remote run or publication passed. Inspect the run for the source revision that you intend to release.

## Publish the qualified versions

1. Apply the reviewed Changesets release plan:

   ```bash
   pnpm changeset:version
   ```

2. Update the lockfile and run the local gate against the versioned artifacts.
3. Commit the public kit, update the workbench source pin, and qualify both commits in CI.
4. Run the configured **Release** workflow for the qualified public revision.
5. Verify all four registry versions before updating the installed CLI.

The publishing workflow uses npm trusted publishing. A local npm sign-in is not required for that workflow. A completed build does not confirm registry publication.

## Release credentials

Keep service tokens, `.env` files, credential-bearing `.npmrc` files, and deployment overlays out of Git. Configure release credentials as GitHub and npm secrets.
