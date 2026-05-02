<script lang="ts">
  import type { ComponentType, SvelteComponent } from 'svelte';

  type HarnessComponent = ComponentType<
    SvelteComponent<Record<string, unknown>, Record<string, CustomEvent<unknown>>>
  >;

  export let component: HarnessComponent;
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
  on:change={(event: CustomEvent) => onChangeEvent?.(event.detail)}
  on:dismiss={(event: CustomEvent) => onDismissEvent?.(event.detail)}
  on:action={(event: CustomEvent) => onActionEvent?.(event.detail)}
  on:openchange={(event: CustomEvent) => onOpenChangeEvent?.(event.detail)}
  on:sortchange={(event: CustomEvent) => onSortChangeEvent?.(event.detail)}
  on:selectionchange={(event: CustomEvent) => onSelectionChangeEvent?.(event.detail)}
  on:activecellchange={(event: CustomEvent) => onActiveCellChangeEvent?.(event.detail)}
/>
