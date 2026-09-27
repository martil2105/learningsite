<script>
  /*
    Horizontal bars, one per label, for one of several named sets of values.
    Used for per-feature R² (the set is k), for four importance measures, for
    who switches peer group by margin decile, and for bootstrap stability.

    sets: { name: values[] }   max: axis maximum   format: value -> string
    refLine: optional x value to mark (e.g. 0.75 for "stable")
  */
  import { clampW } from "../chart.js";

  let { id, title, labels, sets, max = 1, format = (v) => v.toFixed(2), setLabel = "", refLine = null, refLabel = "", initial = null, highlight = null, children } = $props();

  let names = $derived(Object.keys(sets));
  let which = $state(null);
  let cur = $derived(which ?? initial ?? names[0]);
  let vals = $derived(sets[cur]);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let lab = $derived(W < 480 ? 108 : 132);
  const RH = 24;
  let H = $derived(labels.length * RH + (refLine !== null ? 22 : 6));
  let bw = $derived(W - lab - 58);
  let top = $derived(max);
</script>

<div class="fig feature-bars" {id}>
  <p class="fig-title">{title}</p>
  {#if names.length > 1}
    <div class="pills">
      {#if setLabel}<span class="ctl-label">{setLabel}</span>{/if}
      {#each names as nm}
        <button class="pill" class:active={cur === nm} data-set={nm} onclick={() => (which = nm)}>{nm}</button>
      {/each}
    </div>
  {/if}
  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      {#each labels as l, i}
        <text class="row-label" x={lab - 8} y={i * RH + 16} text-anchor="end">{l}</text>
        <rect class="bar-bg" x={lab} y={i * RH + 5} width={bw} height={RH - 10} />
        <rect class="bar" class:hl={highlight === i} x={lab} y={i * RH + 5} width={Math.max(0, (bw * Math.min(vals[i], top)) / top)} height={RH - 10} data-v={vals[i]} />
        <text class="bar-value" x={lab + (bw * Math.min(vals[i], top)) / top + 5} y={i * RH + 16}>{format(vals[i])}</text>
      {/each}
      {#if refLine !== null}
        <line class="ref" x1={lab + (bw * refLine) / top} x2={lab + (bw * refLine) / top} y1="2" y2={labels.length * RH + 2} />
        <text class="ref-label" x={lab + (bw * refLine) / top} y={labels.length * RH + 16} text-anchor="middle">{refLabel}</text>
      {/if}
    </svg>
  </div>
  {#if children}<div class="caption">{@render children()}</div>{/if}
</div>
