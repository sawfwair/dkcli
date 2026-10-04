<script setup lang="ts">
import proof from '../generated/dk-proof.json'

const bodyProof = proof.perfect.proofCards.find((card) => card.label === 'Body on surface')
const actionProof = proof.perfect.proofCards.find((card) => card.label === 'Primary action')
const ratio = proof.scale.meta.ratio.toFixed(3)
const ratioName = proof.scale.meta.ratioName
</script>

<template>
  <section class="dk-terminal-proof" aria-labelledby="proof-title">
    <h2 id="proof-title">Documentation theme values</h2>
    <p>The build generates mathematical values with the local CLI:</p>

    <pre class="dk-command"><code>pnpm dk perfect --seed "#D96F32" --ratio perfect-fourth --motion snappy --mode light --json</code></pre>

    <div class="dk-proof-table" role="table" aria-label="Generated proof values">
      <div role="row">
        <span role="rowheader">Body on surface</span>
        <code role="cell">Lc {{ bodyProof?.lc }} {{ bodyProof?.pass ? 'Pass' : 'Fail' }}</code>
      </div>
      <div role="row">
        <span role="rowheader">Primary action</span>
        <code role="cell">Lc {{ actionProof?.lc }} {{ actionProof?.pass ? 'Pass' : 'Fail' }}</code>
      </div>
      <div role="row">
        <span role="rowheader">Scale ratio</span>
        <code role="cell">{{ ratioName }} {{ ratio }}</code>
      </div>
      <div role="row">
        <span role="rowheader">Generated files</span>
        <code role="cell">dk-tokens.css + dk-proof.json</code>
      </div>
    </div>
  </section>
</template>
