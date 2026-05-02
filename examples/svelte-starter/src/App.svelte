<script lang="ts">
  import { Button, Card, DatePicker, Dialog, Stepper, Table, TextField } from '@dkcli/components';
  import { apcaContrast } from '@dkcli/core';
  import { createTheme } from '@dkcli/tokens';

  const theme = createTheme({
    name: 'Starter',
    seed: {
      color: '#295dff',
      ratio: 'perfect-fourth',
      mode: 'light',
      density: 'comfortable',
      motion: 'snappy'
    }
  });

  const primaryColor = theme.families.color.primary;
  const onPrimaryColor = theme.families.color['on-primary'];
  const contrast = apcaContrast(onPrimaryColor, primaryColor);

  const columns = [
    { key: 'release', header: 'Release', sortable: true },
    { key: 'owner', header: 'Owner' },
    { key: 'shipDate', header: 'Ship date', align: 'end' as const }
  ];

  const rows = [
    { id: 'apollo', release: 'Apollo', owner: 'Nina', shipDate: 'Apr 16' },
    { id: 'zephyr', release: 'Zephyr', owner: 'Rafi', shipDate: 'Apr 18' }
  ];

  const stepperItems = [
    { id: 'draft', label: 'Draft', description: 'Define the scope.', status: 'complete' as const },
    { id: 'review', label: 'Review', description: 'Resolve feedback.', status: 'current' as const },
    { id: 'ship', label: 'Ship', description: 'Roll out the release.', status: 'upcoming' as const }
  ];
</script>

<main class="app-shell">
  <header>
    <p class="eyebrow">DesignKit starter</p>
    <h1>DK components from packed packages</h1>
    <p>APCA brand contrast: {contrast.Lc.toFixed(1)} Lc</p>
  </header>

  <section class="grid">
    <Card theme={theme} surface="raised">
      <svelte:fragment slot="header"><h2>Theme bootstrap</h2></svelte:fragment>
      <p>The starter consumes `@dkcli/core`, `@dkcli/tokens`, and `@dkcli/components` from packed tarballs.</p>
      <Button theme={theme}>Continue</Button>
    </Card>

    <Card theme={theme} surface="outlined">
      <svelte:fragment slot="header"><h2>Field flow</h2></svelte:fragment>
      <TextField theme={theme} label="Project name" placeholder="Atlas release" />
      <DatePicker theme={theme} label="Launch date" value="2026-04-16" />
    </Card>

    <Card theme={theme} surface="default">
      <svelte:fragment slot="header"><h2>Data flow</h2></svelte:fragment>
      <Table theme={theme} caption="Release table" columns={columns} rows={rows} sortable={true} />
    </Card>

    <Card theme={theme} surface="raised">
      <svelte:fragment slot="header"><h2>Advanced flow</h2></svelte:fragment>
      <Stepper theme={theme} items={stepperItems} value="review" />
    </Card>

    <Dialog theme={theme} title="Starter dialog" description="This dialog confirms the packaged component flow.">
      Packed components are working inside the starter app.
      <svelte:fragment slot="footer">
        <Button theme={theme} variant="soft">Looks good</Button>
      </svelte:fragment>
    </Dialog>
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: #f4f7fb;
    color: #0f172a;
  }

  .app-shell {
    display: grid;
    gap: 1.5rem;
    margin: 0 auto;
    max-width: 1100px;
    padding: 2rem;
  }

  .eyebrow {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  section :global(.dk-card-root),
  section :global(.dk-dialog-trigger) {
    width: 100%;
  }
</style>
