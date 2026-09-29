<script>
  let { label, min, max, step = 1, value = $bindable(), format = (v) => v, id = "", width = 200 } = $props();
</script>

<label class="slider" style="--w:{width}px">
  <span class="top"><span class="lab">{label}</span><span class="val">{format(value)}</span></span>
  <input type="range" {id} {min} {max} {step} bind:value />
</label>

<style>
  .slider { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; width: min(var(--w), 100%); }
  .top { display: flex; justify-content: space-between; gap: 10px; }
  .lab { color: var(--muted); }
  .val { font-family: var(--font-mono); color: var(--ink); }
  input { width: 100%; accent-color: var(--c1); }
</style>
