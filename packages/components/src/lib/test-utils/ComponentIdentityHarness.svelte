<script lang="ts">
  import Accordion from '../accordion/Accordion.svelte';
  import Checkbox from '../checkbox/Checkbox.svelte';
  import CommandPalette from '../command-palette/CommandPalette.svelte';
  import Combobox from '../combobox/Combobox.svelte';
  import DatePicker from '../date-picker/DatePicker.svelte';
  import Dialog from '../dialog/Dialog.svelte';
  import Drawer from '../drawer/Drawer.svelte';
  import FileUpload from '../file-upload/FileUpload.svelte';
  import InlineEdit from '../inline-edit/InlineEdit.svelte';
  import RadioGroup from '../radio-group/RadioGroup.svelte';
  import RangeDatePicker from '../range-date-picker/RangeDatePicker.svelte';
  import Switch from '../switch/Switch.svelte';
  import Select from '../select/Select.svelte';
  import Tabs from '../tabs/Tabs.svelte';
  import TextField from '../text-field/TextField.svelte';
  import Textarea from '../textarea/Textarea.svelte';
  import Tooltip from '../tooltip/Tooltip.svelte';

  export let kind: string;
  export let explicitIds = false;

  const items = [{ value: 'overview', label: 'Overview', content: 'Overview content' }];
</script>

{#each [1, 2] as instance}
  {@const id = explicitIds ? `custom-${kind}-${instance}` : undefined}
  <section data-instance={instance}>
    {#if kind === 'text-field'}
      <TextField {id} label={`Text ${instance}`} description={`Help ${instance}`}>
        <svelte:fragment slot="leading"><span data-testid={`leading-${instance}`}>#</span></svelte:fragment>
        <svelte:fragment slot="trailing"><span data-testid={`trailing-${instance}`}>ok</span></svelte:fragment>
      </TextField>
    {:else if kind === 'textarea'}
      <Textarea {id} label={`Notes ${instance}`} description={`Help ${instance}`} />
    {:else if kind === 'checkbox'}
      <Checkbox {id} label={`Check ${instance}`} description={`Help ${instance}`} />
    {:else if kind === 'switch'}
      <Switch {id} label={`Switch ${instance}`} description={`Help ${instance}`} />
    {:else if kind === 'file-upload'}
      <FileUpload {id} label={`Upload ${instance}`} description={`Help ${instance}`} />
    {:else if kind === 'date-picker'}
      <DatePicker {id} label={`Date ${instance}`} value="2026-04-15" description={`Help ${instance}`} />
    {:else if kind === 'range-date-picker'}
      <RangeDatePicker {id} label={`Range ${instance}`} value={{ start: '2026-04-15', end: '2026-04-18' }} description={`Help ${instance}`} open />
    {:else if kind === 'inline-edit'}
      <InlineEdit label={`Edit ${instance}`} value={`Value ${instance}`} description={`Help ${instance}`} />
    {:else if kind === 'dialog'}
      <Dialog title={`Dialog ${instance}`} description={`Help ${instance}`} open>
        <svelte:fragment slot="trigger"><span data-testid={`trigger-${instance}`}>Dialog trigger</span></svelte:fragment>
        <p data-testid={`body-${instance}`}>Dialog body</p>
        <svelte:fragment slot="footer"><span data-testid={`footer-${instance}`}>Dialog footer</span></svelte:fragment>
      </Dialog>
    {:else if kind === 'drawer'}
      <Drawer title={`Drawer ${instance}`} description={`Help ${instance}`} open>
        <svelte:fragment slot="trigger"><span data-testid={`trigger-${instance}`}>Drawer trigger</span></svelte:fragment>
        <p data-testid={`body-${instance}`}>Drawer body</p>
        <svelte:fragment slot="footer"><span data-testid={`footer-${instance}`}>Drawer footer</span></svelte:fragment>
      </Drawer>
    {:else if kind === 'tooltip'}
      <Tooltip content={`Tooltip ${instance}`} open><button type="button">Trigger {instance}</button></Tooltip>
    {:else if kind === 'tabs'}
      <Tabs {items} panels={{ overview: `Panel ${instance}` }} />
    {:else if kind === 'accordion'}
      <Accordion {items} value="overview" />
    {:else if kind === 'command-palette'}
      <CommandPalette open items={[{ id: 'overview', label: `Command ${instance}` }]} />
    {:else if kind === 'radio-group' || kind === 'radio-group-shared-name'}
      <RadioGroup {items} name={kind === 'radio-group-shared-name' ? 'shared-choice' : undefined} label={`Radios ${instance}`} description={`Help ${instance}`} />
    {:else if kind === 'select'}
      <Select {id} {items} label={`Select ${instance}`} description={`Help ${instance}`} />
    {:else if kind === 'combobox'}
      <Combobox {id} {items} label={`Combobox ${instance}`} description={`Help ${instance}`} />
    {/if}
  </section>
{/each}
