<script>
  let { label = "", options, value = $bindable(), id = "" } = $props();
</script>

<div class="seg" role="group" aria-label={label} {id}>
  {#if label}<span class="lab">{label}</span>{/if}
  <div class="buttons">
    {#each options as o (o.value)}
      <button type="button" class:on={o.value === value} aria-pressed={o.value === value} data-value={o.value} onclick={() => (value = o.value)}>{o.label}</button>
    {/each}
  </div>
</div>

<style>
  .seg { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
  .lab { color: var(--muted); }
  .buttons { display: flex; flex-wrap: wrap; gap: 6px; }
  button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft);
    padding: 4px 10px; border-radius: 999px; cursor: pointer; }
  button.on { background: var(--ink); color: white; border-color: var(--ink); }
</style>
