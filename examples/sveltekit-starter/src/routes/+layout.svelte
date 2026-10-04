<script lang="ts">
  import '../app.css';
  let { data, children } = $props();
</script>

<svelte:head>
  <!-- Token CSS comes from validated inputs and the public emitter, including the first SSR response. -->
  {@html `<style data-designkit-theme>${data.themeCss.replaceAll('<', '\\3c ')}</style>`}
  <meta name="theme-color" content={String(data.theme.families.color.surface)} />
</svelte:head>

<a class="skip-link" href="#main">Skip to main content</a>
<div class="app" data-mode={data.config.seed.mode}>
  <aside class="rail" aria-label="Workspace navigation">
    <a class="brand" href="/" aria-label="Release desk home"><span class="brand-mark" aria-hidden="true">r.</span><span>Release desk</span></a>
    <nav>
      <a href="/" aria-current="page">Releases</a>
      <a href="/#appearance">Appearance</a>
    </nav>
  </aside>
  <div class="content">{@render children()}</div>
</div>
