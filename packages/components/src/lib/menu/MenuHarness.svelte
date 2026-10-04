<script lang="ts">
  import Menu, { type MenuItem } from './Menu.svelte';

  export let items: MenuItem[] = [];
  export let onAction: ((detail: { value: string }) => void) | undefined = undefined;
  export let onActionEvent: ((detail: { value: string }) => void) | undefined = undefined;
</script>

<Menu {items} {onAction} on:action={(event) => onActionEvent?.(event.detail)} />
