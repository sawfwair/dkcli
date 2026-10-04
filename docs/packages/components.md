# Component package

For Svelte app developers, `@dkcli/components` provides UI components, behavior helpers, and theme-driven recipes. It requires Svelte 5.20 or later in the Svelte 5 release line.

## Package responsibilities

The package provides the following features:

- Typed Svelte component APIs and rendering
- Keyboard, focus, labeling, and slot behavior
- Recipes that consume theme values
- Component fixtures and mathematical checks

Components include buttons, fields, choice controls, menus, badges, avatars, tables, date pickers, steppers, toasts, command palettes, and tree views.

## Verify from source

To inspect fixtures and type-check the source package, run:

```bash
pnpm dk components verify --all
pnpm check:components:strict
```

For strict exit codes and evidence limits, see [Design with mathematical evidence](/guides/proof-driven-design).

## Actions and input values

The following callbacks and legacy events expose component actions and value changes:

| Component | Callback | Legacy event | Payload |
| --- | --- | --- | --- |
| `Button` | `onClick` | `on:click` | Original `MouseEvent`, including `preventDefault()` |
| `Menu` | `onAction` | `on:action` | `{ value: string }` |
| `Select` | `onChange` | `on:change` | `{ value: string \| undefined }`, with `bind:value` support |
| `Combobox` | `onChange` | `on:change` | `{ value: string \| undefined }`, with `bind:value` support |

Legacy action and change events expose the payload on `event.detail`. `Button` forwards the original mouse event directly.

Disabled or loading buttons do not deliver clicks. Disabled menu and choice items do not deliver actions or changes.

The following example connects actions and bound values:

```svelte
<Button onClick={(event) => {
  event.preventDefault();
  saveDraft();
}}>Save draft</Button>

<Menu items={actions} onAction={({ value }) => runAction(value)} />
<Select label="Environment" items={environments} bind:value={environment} />
<Combobox label="Owner" items={owners} bind:value={owner} />
```

## IDs and focus

`Select` and `Combobox` generate unique IDs that remain stable during server rendering and hydration. Supply `id` when your app requires a specific identifier.

The label identifies the `Select` trigger or `Combobox` input. Related listbox IDs use the same base.

Arrow keys navigate the active control once per key and skip disabled options. `Combobox` retains input focus during filtering. It identifies the highlighted option with `aria-activedescendant`.

Selection or <kbd>Escape</kbd> restores control focus. Outside clicks or focus changes close choice lists without moving focus from the destination control. `Menu` also closes when focus leaves the component.
