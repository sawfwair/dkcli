<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Card, Combobox, Menu, Select, TextField } from '@dkcli/components';
  import { createTheme, emitThemeCss } from '@dkcli/tokens';

  const theme = createTheme({
    name: 'Starter',
    seed: { color: '#295dff', ratio: 'perfect-fourth', mode: 'light', density: 'comfortable', motion: 'snappy' }
  });
  const environments = [
    { value: 'staging', label: 'Staging' },
    { value: 'production', label: 'Production' }
  ];
  const reviewers = [
    { value: 'nina', label: 'Nina' },
    { value: 'rafi', label: 'Rafi' },
    { value: 'mara', label: 'Mara', disabled: true }
  ];
  type ReleaseDraft = { project: string; owner: string; environment: string; reviewer: string };
  let project = $state('');
  let owner = $state('');
  let environment = $state<string | undefined>('staging');
  let reviewer = $state<string | undefined>(undefined);
  let preview = $state<ReleaseDraft | null>(null);
  let message = $state('');
  const canSave = $derived(Boolean(project.trim() && owner.trim() && environment && reviewer));
  const actions = $derived([
    { value: 'preview', label: 'Preview release', disabled: !canSave },
    { value: 'clear', label: 'Clear form' }
  ]);

  onMount(() => {
    const stylesheet = document.createElement('style');
    stylesheet.dataset.designkitTheme = 'starter';
    stylesheet.textContent = emitThemeCss(theme);
    document.head.append(stylesheet);
    return () => stylesheet.remove();
  });

  function snapshot(): ReleaseDraft {
    return {
      project: project.trim(),
      owner: owner.trim(),
      environment: environments.find((item) => item.value === environment)?.label ?? '',
      reviewer: reviewers.find((item) => item.value === reviewer)?.label ?? ''
    };
  }

  function saveRelease(): void {
    if (!canSave) return;
    preview = snapshot();
    message = `Saved ${preview.project}.`;
  }

  function handleAction({ value }: { value: string }): void {
    if (value === 'preview' && canSave) {
      preview = snapshot();
      message = `Preview: ${preview.project}.`;
    } else if (value === 'clear') {
      project = '';
      owner = '';
      environment = 'staging';
      reviewer = undefined;
      preview = null;
      message = 'Form cleared.';
    }
  }
</script>

<main class="app-shell">
  <header class="intro">
    <h1>Plan a release</h1>
  </header>
  <section class="grid" aria-label="Release planner">
    <Card {theme} surface="raised">
      <div class="form-stack">
        <h2>Release details</h2>
        <TextField {theme} label="Project name" bind:value={project} />
        <TextField {theme} label="Release owner" bind:value={owner} />
        <Select {theme} label="Environment" items={environments} value={environment} onChange={({ value }) => environment = value} />
        <Combobox {theme} label="Reviewer" items={reviewers} value={reviewer} onChange={({ value }) => reviewer = value} />
        <div class="actions">
          <Button {theme} disabled={!canSave} onClick={saveRelease}>Save release</Button>
          <Menu {theme} items={actions} onAction={handleAction}>
            <span slot="trigger">More actions</span>
          </Menu>
        </div>
        {#if !canSave}
          <p class="hint">To save, enter a project name and owner, and select a reviewer.</p>
        {/if}
      </div>
    </Card>
    <Card {theme} surface="outlined">
      <div class="form-stack">
        <h2>Release summary</h2>
        {#if message}<p role="status">{message}</p>{/if}
        {#if preview}
          <dl>
            <div><dt>Project</dt><dd>{preview.project}</dd></div>
            <div><dt>Owner</dt><dd>{preview.owner}</dd></div>
            <div><dt>Environment</dt><dd>{preview.environment}</dd></div>
            <div><dt>Reviewer</dt><dd>{preview.reviewer}</dd></div>
          </dl>
        {:else}
          <p class="hint">No saved release</p>
        {/if}
      </div>
    </Card>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: var(--surface, #f4f7fb);
    color: var(--text, #0f172a);
  }
  .app-shell { display: grid; gap: 2rem; margin: 0 auto; max-width: 1040px; padding: clamp(1rem, 4vw, 3rem); }
  .intro, .form-stack { display: grid; gap: 1rem; }
  .grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); }
  .actions { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }
  h1, h2, p, dl, dd { margin: 0; }
  h1 { font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -0.03em; }
  h2 { font-size: 1.25rem; }
  .hint, dt { color: var(--text-muted, #475569); }
  .hint { font-size: 0.9rem; line-height: 1.5; }
  dl { display: grid; gap: 1rem; }
  dl > div { display: grid; gap: 0.25rem; }
  dt { font-size: 0.8rem; }
  dd { font-weight: 600; overflow-wrap: anywhere; }
</style>
