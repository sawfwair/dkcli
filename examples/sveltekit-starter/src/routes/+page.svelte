<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { Badge, Button, Dialog, Table, TextField } from '@dkcli/components';
  import type { ComponentProps } from 'svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  const theme = $derived(data.theme);
  let search = $state('');
  let filter = $state('Active');
  let selectedIds = $state<string[]>([]);
  let pending = $state('');
  let reviewOpen = $state(false);
  const active = $derived(data.releases.filter((row) => row.status !== 'Archived'));
  const ready = $derived(active.filter((row) => row.status === 'Ready').length);
  const visible = $derived(data.releases.filter((row) =>
    (filter === 'All' || (filter === 'Active' ? row.status !== 'Archived' : row.status === filter))
    && `${row.title} ${row.owner} ${row.id}`.toLowerCase().includes(search.toLowerCase())
  ));
  const selected = $derived(data.releases.find((row) => row.id === selectedIds[0]));
  const createErrors = $derived(form?.kind === 'create' && 'errors' in form ? form.errors : undefined);
  const createFields = $derived(form?.kind === 'create' && 'fields' in form ? form.fields : undefined);
  const columns: ComponentProps<typeof Table>['columns'] = [
    { key: 'title', header: 'Release', width: '18rem', format: (_, row) => `${String(row.id)} / ${String(row.title)}` },
    { key: 'owner', header: 'Owner', width: '9rem' },
    { key: 'status', header: 'Status' }
  ];

  function enhanced(kind: string): SubmitFunction {
    return () => {
      pending = kind;
      return async ({ result, update }) => {
        try {
          await update();
          if (result.type === 'success' && kind === 'update') { reviewOpen = false; selectedIds = []; }
        } finally { pending = ''; }
      };
    };
  }
</script>

<svelte:head><title>Release desk</title><meta name="description" content="Create releases, review their status, and apply a theme." /></svelte:head>

<main id="main" tabindex="-1">
  <section class="intro" aria-labelledby="page-title">
    <div><Badge {theme} size="sm" tone="brand">Personal demo</Badge><h1 id="page-title">Releases</h1></div>
    <div class="readiness" aria-label={`${ready} of ${active.length} active releases ready`}>
      <p class="metric-label">Ready</p>
      <p class="readiness-number">{ready}<span>{' '}of {active.length}</span></p>
      <div class="readiness-track"><span style={`width:${active.length ? ready / active.length * 100 : 0}%`}></span></div>
      <p>Active releases</p>
    </div>
  </section>

  {#if form?.message}<p class="notice" role="status" class:error={'errors' in form || (form.kind === 'theme' && !form.message.startsWith('Applied'))}>{form.message}</p>{/if}

  <div class="workspace-grid">
    <section class="release-section" aria-labelledby="releases-title">
      <div class="section-heading"><h2 id="releases-title">Release queue</h2><span class="count">{visible.length} shown</span></div>
      <div class="toolbar">
        <label class="search"><span>Find a release</span><input type="search" placeholder="Search by release, owner, or ID" bind:value={search} /></label>
        <label class="filter"><span>Status</span><select bind:value={filter}><option>Active</option><option>In review</option><option>Ready</option><option>Archived</option><option>All</option></select></label>
      </div>
      <div class="table-wrap">
        <Table {theme} size="sm" {columns} rows={visible} caption="Release table" sortable selectable
          selectedRowIds={selectedIds} onSelectionChange={({ ids }) => selectedIds = ids.slice(-1)}
          emptyTitle="No matching releases" emptyDescription="Change the search or status filter, or create a release." />
      </div>
      <div class="queue-footer">
        <p>{selected ? `${selected.id} selected` : 'To update a status, select a release.'}</p>
        {#if selected}
          <Dialog {theme} bind:open={reviewOpen} title={`Review ${selected.id}`} description={selected.title}>
            <span slot="trigger" class="text-button">Review release</span>
            <dl class="review-summary"><div><dt>Owner</dt><dd>{selected.owner}</dd></div><div><dt>Target</dt><dd>{selected.environment}</dd></div><div><dt>Current status</dt><dd>{selected.status}</dd></div></dl>
            <form method="POST" action="?/update" use:enhance={enhanced('update')} class="form-stack">
              <input type="hidden" name="id" value={selected.id} />
              <label>Next status<select name="status" value={selected.status}><option>In review</option><option>Ready</option><option>Archived</option></select></label>
              <Button {theme} type="submit" loading={pending === 'update'}>Save status</Button>
            </form>
          </Dialog>
        {/if}
      </div>
      <noscript><details><summary>Change release status</summary><form method="POST" action="?/update" class="form-stack"><label>Release<select name="id">{#each data.releases as release}<option value={release.id}>{release.id} · {release.title}</option>{/each}</select></label><label>Status<select name="status"><option>In review</option><option>Ready</option><option>Archived</option></select></label><Button {theme} type="submit">Save status</Button></form></details></noscript>
      <p class="demo-note">This demo stores up to 8 releases in browser cookies for 30 days.</p>
    </section>

    <section class="create-section" aria-labelledby="create-title">
      <h2 id="create-title">Create a release</h2>
      <form method="POST" action="?/create" use:enhance={enhanced('create')} class="form-stack">
        <TextField {theme} size="sm" name="title" label="Release name" value={createFields?.title ?? ''} error={createErrors?.title} required />
        <TextField {theme} size="sm" name="owner" label="Release owner" value={createFields?.owner ?? ''} error={createErrors?.owner} required />
        <label>Environment<select name="environment" value={createFields?.environment ?? 'Staging'} aria-describedby={createErrors?.environment ? 'environment-error' : undefined}><option>Staging</option><option>Production</option></select></label>
        {#if createErrors?.environment}<p id="environment-error" class="field-error">{createErrors.environment}</p>{/if}
        <Button {theme} type="submit" loading={pending === 'create'}>Create release</Button>
      </form>
    </section>
  </div>

  <section id="appearance" class="appearance" aria-labelledby="appearance-title">
    <div class="appearance-intro"><h2 id="appearance-title">Appearance</h2></div>
    <div class="appearance-controls">
      <form method="POST" action="?/theme" use:enhance={enhanced('theme')} class="theme-form">
        <label>Theme name<input name="name" value={data.config.name} maxlength="64" required /></label>
        <label>Brand color<input name="color" value={data.config.seed.color} pattern={'#[0-9a-fA-F]{6}'} maxlength="7" required /></label>
        <label>Mode<select name="mode" value={data.config.seed.mode}><option value="light">Light</option><option value="dark">Dark</option></select></label>
        <label>Density<select name="density" value={data.config.seed.density}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
        <label>Scale ratio<input name="ratio" type="number" min="1.05" max="2" step="any" value={data.config.seed.ratio} required /></label>
        <div class="theme-submit"><Button {theme} type="submit" variant="outline" loading={pending === 'theme'}>Apply theme</Button></div>
      </form>
      <details class="import-theme"><summary>Import theme</summary><form method="POST" action="?/theme" use:enhance={enhanced('import')} class="form-stack"><label>Theme JSON<textarea name="themeJson" rows="5" required></textarea></label><Button {theme} type="submit" variant="outline" loading={pending === 'import'}>Import theme</Button></form></details>
    </div>
  </section>
  <footer class="page-footer"><p>Reset replaces your release list with the sample releases.</p><form method="POST" action="?/reset" use:enhance={enhanced('reset')}><Button {theme} type="submit" variant="ghost" loading={pending === 'reset'}>Reset releases</Button></form></footer>
</main>
