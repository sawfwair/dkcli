# Theme projects

A theme project is a portable JSON document containing theme inputs, font stacks,
token overrides, recorded viewport widths, earlier revisions, reviews, and browser
qualification results. The CLI and workbench compile the same public package APIs.

## Create a project

Use `createThemeProject` from `@dkcli/core`. Use `createProjectTheme` from
`@dkcli/tokens` to compile its tokens.

```js
import { createThemeProject } from '@dkcli/core';
import { createProjectTheme, emitThemeCss } from '@dkcli/tokens';

const project = createThemeProject({
  id: 'northstar',
  theme: {
    name: 'Northstar',
    seed: {
      color: '#c44724',
      ratio: 'perfect-fourth',
      mode: 'light',
      density: 'comfortable',
      motion: 'snappy'
    },
    fonts: {
      body: 'system-ui, sans-serif',
      display: 'Georgia, serif',
      mono: 'monospace'
    },
    overrides: { radius: { md: '8px' } }
  },
  viewports: [320, 768, 1280]
});

const css = emitThemeCss(createProjectTheme(project.theme));
```

Font stacks select fonts available in the consuming app. Package or load custom
font files in that app; a project does not embed them. Qualification waits for the
browser's font loading and records the requested stacks and available font faces.

Token overrides use existing family names. Color overrides must be opaque because
project contrast checks do not resolve alpha compositing. Size overrides support
nonnegative `px`, `rem`, and `em` lengths and validated fluid `clamp()` expressions.
Mathematical fixtures use the conservative upper clamp bound with a 16 px root
font assumption; browser qualification records actual computed sizes. Motion
values accept `ms` or `s`. State, font stacks, and motion presets use their dedicated
project settings.

## Verify and measure

To generate mathematical fixtures from a saved project, run:

```bash
dk project verify --input northstar.dkproject.json --format json
```

Add `--strict` to exit with status 1 when a declared mathematical check fails.
The command writes its report before exiting. Line-width estimates remain
mathematical checks; they do not establish browser overflow.

To measure the project in a running workbench, run:

```bash
dk project qualify --input northstar.dkproject.json \
  --runtime-url http://127.0.0.1:4177 --format json
```

If the runtime requires authentication, add `--runtime-token` with a
bearer token accepted by that runtime. Do not store credentials in project files.
Check `dk project --help` for the supported flags.

A qualification receipt records the exact project identity and public package
fingerprint, widths, mathematical fixtures, browser measurements, interactions,
fonts, screenshots, and remaining coverage. Its scope describes the scenes it
measured. A receipt is evidence reported by its producing runtime, not a signed
certificate or a substitute for rerunning the checks.

To require a particular prepared package artifact, add
`--artifact-fingerprint` with its SHA-256 fingerprint.

To measure named release cases in Firefox at 200% CSS zoom, run:

```bash
dk project qualify --input northstar.dkproject.json \
  --runtime-url http://127.0.0.1:4177 --browser firefox --zoom 2 \
  --cases button:release-disabled,button:release-loading --format json
```

A request accepts up to 12 named cases. Chromium, Firefox, and WebKit are local
runtime options; Cloudflare Browser Rendering supports Chromium. The
`--color-scheme` option selects `light` or `dark` browser media preferences.
The project's seed still determines its theme tokens.

The `--font-fixture release-sans-v1` option loads the workbench's same-origin
ABeeZee test face. Set the project body or display font stack to `ABeeZee, sans-serif` to measure
it in the components. The receipt records the face and its loading status.

Every receipt lists declared cases, required checks, and missing measurements.
A selected batch does not qualify unmeasured cases. CSS zoom is a recorded reflow
condition; native browser zoom and assistive technology remain separate checks.
Failed mathematical estimates and incomplete coverage still make `--strict`
exit with status 1 after writing the receipt.

## Apply a token patch

A patch identifies the project content it changes and the previous override value
for each token. A `null` value means that the override is absent. The following
patch changes the radius override from its current `8px` value to `10px`:

```json
{
  "schemaVersion": 1,
  "id": "adjust-radius",
  "title": "Adjust control radius",
  "projectIdentity": "REPLACE_WITH_PROJECT_SHA256",
  "changes": [
    { "family": "radius", "token": "md", "before": "8px", "after": "10px" }
  ]
}
```

Use the project identity from the verification report. To save a new project
revision, run:

```bash
dk project patch --input northstar.dkproject.json \
  --patch radius.patch.json --output revised.dkproject.json --format json
```

The command rejects a stale identity or an override that has changed. The revised
project retains earlier inputs and evidence. Rerun qualification using the same
recorded widths after applying a patch.

## Save, reopen, and review

In the workbench, save a project locally or export its JSON file. Import the file
to reopen it elsewhere. Local saves belong to the browser profile; exported files
are the portable copy. An invalid import keeps the current project intact.

Restoring a revision creates a new revision and retains the intervening history.
Reviews and qualification remain attached to the original theme content and
package artifact. Changes to tokens, fonts, widths, or packaged component recipes
make earlier evidence stale. Restoring identical content can make evidence current
again when the component artifact also matches.
