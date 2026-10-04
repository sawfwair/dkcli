# Ship components

For component maintainers, this guide connects API, behavior, recipe, and consumer checks before packaging a component.

## Review the component

Verify the following requirements:

- Type and document public props.
- Test keyboard behavior and accessible names.
- Verify recipe output and declared mathematical checks.
- Inspect density, target sizes, and contrast.
- Install the packed component in a consumer app.

Mathematical fixtures do not establish browser behavior or accessibility compliance. Review their evidence scope and any failing or unsupported checks.

## Run component checks

To type-check components, inspect fixture verdicts, build the package, and test the starter, run:

```bash
pnpm check:components:strict
pnpm dk components verify --all
pnpm build:components
pnpm example:verify
```

To fail on any unsuccessful or unsupported mathematical check, add `--strict` to component verification. Default generation returns exit code `0` even when a fixture fails.

## Separate recipes and rendering

Keep rendering focused on the component API and behavior. Put style inputs and mathematical checks in recipes. Use tokens for shared values and tests for behavior changes.
