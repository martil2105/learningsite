<script>
  /*
    A labelled square matrix with the value printed in every cell: the
    correlation matrix of our features, or how similar two sets of peer groups
    are. `sets` holds one or more matrices over the same labels; pills switch.
    Colour is a single-hue ramp on |value|, so sign is carried by the number.
  */
  import { clampW } from "../chart.js";

  let { id, title, labels, sets, digits = 2, scaleMax = 1, children } = $props();

  let names = $derived(Object.keys(sets));
  let which = $state(null);
  let cur = $derived(which ?? names[0]);
  let V = $derived(sets[cur]);

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let n = $derived(labels.length);
  let lab = $derived(W < 480 ? 74 : 96);
  let cell = $derived(Math.min(62, Math.floor((W - lab - 4) / n)));
  let H = $derived(lab * 0.55 + cell * n + 6);
  const ramp = ["#f4f2fd", "#e1dcfa", "#c6bdf3", "#a79eea", "#8c82d2", "#7366b9", "#5b4ba1"];
  const fill = (v) => ramp[Math.min(ramp.length - 1, Math.floor((Math.abs(v) / scaleMax) * (ramp.length - 0.001)))];
  const ink = (v) => (Math.abs(v) / scaleMax > 0.55 ? "#fff" : "#232f3e");
</script>

<div class="fig matrix-figure" {id}>
  <p class="fig-title">{title}</p>
  {#if names.length > 1}
    <div class="pills">
      {#each names as nm}
        <button class="pill" class:active={cur === nm} onclick={() => (which = nm)}>{nm}</button>
      {/each}
    </div>
  {/if}
  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
      {#each labels as l, j}
        <text class="col-label" x={lab + cell * j + cell / 2} y={lab * 0.55 - 6} text-anchor="middle">{l.length > 7 && cell < 56 ? l.slice(0, 6) + "." : l}</text>
      {/each}
      {#each labels as l, i}
        <text class="row-label" x={lab - 6} y={lab * 0.55 + cell * i + cell / 2 + 4} text-anchor="end">{l}</text>
        {#each labels as _, j}
          <rect class="cell" x={lab + cell * j} y={lab * 0.55 + cell * i} width={cell - 2} height={cell - 2} fill={fill(V[i][j])} data-v={V[i][j]} />
          <text class="cell-value" x={lab + cell * j + (cell - 2) / 2} y={lab * 0.55 + cell * i + (cell - 2) / 2 + 4} text-anchor="middle" fill={ink(V[i][j])}>{V[i][j].toFixed(digits)}</text>
        {/each}
      {/each}
    </svg>
  </div>
  {#if children}<div class="caption">{@render children()}</div>{/if}
</div>
