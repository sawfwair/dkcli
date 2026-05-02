<script lang="ts">
  import type { ThemeContract } from '@dkcli/core';

  import InlineEdit from './InlineEdit.svelte';
  import type { InlineEditSize } from './inline-edit.spec.js';

  export let theme: ThemeContract;
  export let size: InlineEditSize = 'md';
  export let disabled = false;
  export let multiline = false;
  export let onChange: ((detail: { value: string }) => void) | undefined = undefined;
</script>

<InlineEdit
  {theme}
  {size}
  label="Project name"
  description="Use a short name."
  placeholder="Launch roadmap"
  {disabled}
  {multiline}
  {onChange}
/>
