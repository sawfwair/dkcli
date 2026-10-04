<script lang="ts">
  import type { ComponentType } from 'svelte';

  export let component: ComponentType;
  export let componentProps: Record<string, unknown> = {};
  export let onChangeEvent: ((detail: unknown) => void) | undefined = undefined;
  export let onDismissEvent: ((detail: unknown) => void) | undefined = undefined;
  export let onActionEvent: ((detail: unknown) => void) | undefined = undefined;
  export let onOpenChangeEvent: ((detail: unknown) => void) | undefined = undefined;
  export let onSortChangeEvent: ((detail: unknown) => void) | undefined = undefined;
  export let onSelectionChangeEvent: ((detail: unknown) => void) | undefined = undefined;
  export let onActiveCellChangeEvent: ((detail: unknown) => void) | undefined = undefined;
</script>

<svelte:component
  this={component}
  {...componentProps}
  on:change={(event: CustomEvent<unknown>) => onChangeEvent?.(event.detail)}
  on:dismiss={(event: CustomEvent<unknown>) => onDismissEvent?.(event.detail)}
  on:action={(event: CustomEvent<unknown>) => onActionEvent?.(event.detail)}
  on:openchange={(event: CustomEvent<unknown>) => onOpenChangeEvent?.(event.detail)}
  on:sortchange={(event: CustomEvent<unknown>) => onSortChangeEvent?.(event.detail)}
  on:selectionchange={(event: CustomEvent<unknown>) => onSelectionChangeEvent?.(event.detail)}
  on:activecellchange={(event: CustomEvent<unknown>) => onActiveCellChangeEvent?.(event.detail)}
/>
