# Release desk

Release desk is a SvelteKit example for developers using the public DesignKit
packages. It demonstrates release creation and review, search and status
filters, server validation, and theme preferences.

## Verify the example

From the repository root, run:

```sh
pnpm example:sveltekit:verify
```

The command builds and packs core, tokens, and components, then installs their
exact tarballs in a temporary consumer. It checks declarations, validation,
HTTP form actions, and Chromium interactions against the built app. It prints
the consumer directory.

If Chromium is missing, run the following command in that consumer directory,
then rerun `pnpm test:browser`:

```sh
pnpm exec playwright install chromium
```

The browser dependency is pinned to Playwright 1.58.2.

## Run the prepared consumer

Replace `CONSUMER_DIR` with the directory printed by the verification command.
To start the development server, run:

```sh
cd CONSUMER_DIR
pnpm dev --host 127.0.0.1
```

To run the built Node server instead, run:

```sh
HOST=127.0.0.1 PORT=4186 ORIGIN=http://127.0.0.1:4186 pnpm start
```

The source manifest uses `0.0.0-local` package placeholders. Verification
replaces them with tarball paths. For a standalone project, select published
package versions, install dependencies, and commit the resulting lockfile.

## Server rendering and forms

The server validates theme preferences and emits CSS before hydration.
Components receive the same theme contract. Named actions validate fields on
the server and preserve invalid values. SvelteKit enhancement adds loading and
feedback states.

Creation and theme preferences work without JavaScript. A native status form
provides the status-change fallback.

## Import a theme

In **Appearance**, set a six-digit hex seed, mode, density, and a scale ratio
from 1.05 to 2. In **Import theme**, paste JSON exported from the workbench.
The import uses its `name` and `seed`, including named public ratios.

The server regenerates tokens through `createTheme`. It does not insert
arbitrary token values from the imported JSON.

## Storage and evidence

This personal demo stores up to eight releases and theme preferences in validated
browser cookies for 30 days. It has no authentication, shared database, or team
permissions. For shared use, supply persistence and access controls.

Mathematical fixtures and browser interaction checks report separate evidence.
A mathematical verdict does not establish rendered accessibility compliance.
