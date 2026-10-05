<script lang="ts">
  type Props = {
    required: boolean;
    disabled: boolean;
    value: string;
    focusTarget: HTMLElement | null;
  };

  let { required, disabled, value, focusTarget }: Props = $props();
</script>

{#if required}
  <input
    class="selection-constraint"
    type="text"
    {value}
    {required}
    {disabled}
    tabindex="-1"
    aria-hidden="true"
    oninvalid={(event) => {
      event.preventDefault();
      focusTarget?.focus();
    }}
  />
{/if}

<style>
  .selection-constraint {
    block-size: 1px;
    clip-path: inset(50%);
    inline-size: 1px;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    position: absolute;
  }
</style>
