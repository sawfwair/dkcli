<script lang="ts">
  import { createTheme } from '@dkcli/tokens';
  import SideNav from '../side-nav/SideNav.svelte';
  import TreeView from '../tree-view/TreeView.svelte';
  import TextField from '../text-field/TextField.svelte';
  import Dialog from '../dialog/Dialog.svelte';
  import Drawer from '../drawer/Drawer.svelte';
  import Popover from '../popover/Popover.svelte';
  import Menu from '../menu/Menu.svelte';
  import DataGridLite from '../data-grid-lite/DataGridLite.svelte';
  import Stepper from '../stepper/Stepper.svelte';
  import DatePicker from '../date-picker/DatePicker.svelte';
  import RangeDatePicker from '../range-date-picker/RangeDatePicker.svelte';
  import RadioGroup from '../radio-group/RadioGroup.svelte';
  import Select from '../select/Select.svelte';
  import Combobox from '../combobox/Combobox.svelte';
  import CommandPalette from '../command-palette/CommandPalette.svelte';
  import FileUpload from '../file-upload/FileUpload.svelte';
  import Button from '../button/Button.svelte';
  import Badge from '../badge/Badge.svelte';
  import Tabs from '../tabs/Tabs.svelte';
  import InlineEdit from '../inline-edit/InlineEdit.svelte';
  import Table from '../table/Table.svelte';

  const theme = createTheme({ name: 'Target geometry', seed: { color: '#c44724', mode: 'light', density: 'comfortable', ratio: 'perfect-fourth', motion: 'snappy' } });
  const longText = 'Release readiness for the international workspace, including accessibility review, deployment notes, and remaining dependencies';
  let commandOpen = $state(false);
  let expandedActions = $state(0);
  const items = [{ id: 'branch', label: 'Planning', children: [{ id: 'child', label: 'Release' }] }];
  const disabledItems = [{ id: 'blocked', label: 'Unavailable', disabled: true, children: [{ id: 'hidden', label: 'Hidden child' }] }];
</script>

<main data-ready="true">
  <section data-target="side-nav"><SideNav {theme} {items} /></section>
  <section data-target="tree-view"><TreeView {theme} {items} /></section>
  <section data-target="text-field"><TextField {theme} label="Project"><svelte:fragment slot="leading">#</svelte:fragment><svelte:fragment slot="trailing">ok</svelte:fragment></TextField></section>
  <section data-target="dialog"><Dialog {theme} title={longText}>{longText}</Dialog></section>
  <section data-target="drawer"><Drawer {theme} title={longText}>Drawer body</Drawer></section>
  <section data-target="popover"><Popover {theme}>Popover body</Popover></section>
  <section data-target="menu"><Menu {theme} items={[{ value: 'rename', label: 'Rename' }]} /></section>
  <section data-target="data-grid-lite"><DataGridLite {theme} columns={[{ key: 'arr', header: 'ARR', sortable: true }]} rows={[{ id: 'row', arr: '$1.2M' }]} /></section>
  <section data-disabled="side-nav"><SideNav {theme} items={disabledItems} /></section>
  <section data-disabled="tree-view" data-expanded-actions={expandedActions}><TreeView {theme} items={disabledItems} onExpandedChange={() => { expandedActions += 1; }} /></section>
  <section data-disabled="stepper"><Stepper {theme} interactive={false} items={[{ id: 'draft', label: 'Draft' }, { id: 'review', label: 'Review' }]} /></section>
  <section data-invalid="date-picker"><DatePicker {theme} label="Date" value="2026-04-15" error="Choose an available date." /></section>
  <section data-invalid="range-date-picker" style="max-width:200px"><RangeDatePicker {theme} label="Window" value={{ start: '2026-04-14', end: '2026-04-18' }} error="Choose an available window." /></section>
  <section data-invalid="radio-group"><RadioGroup {theme} label="Cadence" items={[{ value: 'daily', label: 'Daily' }]} error="Choose a cadence." /></section>
  <section data-open="select"><Select {theme} label="Environment" items={[{ value: 'staging', label: 'Staging' }]} /></section>
  <section data-open="combobox"><Combobox {theme} label="System" items={[{ value: 'cobalt', label: 'Cobalt' }]} /></section>
  <section data-open="command-palette"><button type="button" data-command-launch onclick={() => { commandOpen = true; }}>Open command</button><CommandPalette {theme} bind:open={commandOpen} items={[{ id: 'new-file', label: 'Create file' }]} /></section>
  <section data-target="file-upload"><FileUpload {theme} label="Assets" /></section>
  <section data-long="button"><Button {theme}>{longText}</Button></section>
  <section data-long="badge"><Badge {theme}>{longText}</Badge></section>
  <section data-math="button-solid" style="width: 180px"><Button {theme} size="lg">Continue</Button></section>
  <section data-math="button-link" style="width: 180px"><Button {theme} variant="link" as="a" href="#">Open details</Button></section>
  <section data-short="button"><Button {theme}>Save</Button></section>
  <section data-short="badge"><Badge {theme}>Healthy</Badge></section>
  <section data-zoom="select"><Select {theme} label="Release" items={[{ value: 'long', label: longText, description: longText }]} /></section>
  <section data-zoom="text-field" style="max-width:73px"><TextField {theme} label="Project" error="Enter a project name."><svelte:fragment slot="leading">#</svelte:fragment><svelte:fragment slot="trailing">ok</svelte:fragment></TextField></section>
  <section data-zoom="button"><Button {theme} loading>Save changes</Button></section>
  <section data-zoom="tabs"><Tabs {theme} items={[{ value: 'overview', label: 'Overview' }, { value: 'activity', label: 'Activity' }, { value: 'billing', label: 'Billing' }]} panels={{ overview: 'Workspace overview' }} /></section>
  <section data-keyboard="inline-edit"><InlineEdit {theme} value="Release notes" label="Title" /></section>
  <section data-target="table"><Table {theme} sortable columns={[{ key: "release", header: "A", sortable: true }]} rows={[{ id: "one", release: longText }]} /></section>
</main>

<style>
  main { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; padding: 1rem; }
  section { min-width: 0; }
  :global(input) { padding: 8px 12px; }
</style>
