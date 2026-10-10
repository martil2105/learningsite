<script>
  /*
    Four quarterly steps of Cox, Ross and Rubinstein's tree (volatility 20%,
    5% a year). Every node shows the share price; pressing "Step back" fills
    in the call's value one column at a time, from the payoffs at the end to
    today, as the risk-neutral average of the two nodes after it, discounted.
  */
  import Readout from "./Readout.svelte";
  import { tree, blackScholes } from "../binomial.js";
  import { money, fixed } from "../format.js";

  let { width } = $props();
  const N = 4;
  const t = tree(N);
  let filled = $state(N); // columns filled from here to the end
  const H = 330, top = 26, rowH = 32;
  const colX = (i) => 40 + (i * (width - 80)) / N;
  const rowY = (i, j) => top + (N + i - 2 * j) * rowH;
  const back = () => { if (filled > 0) filled -= 1; };
  const reset = () => (filled = N);
</script>

<div class="controls">
  <button type="button" id="tl-back" onclick={back} disabled={filled === 0}>Step back</button>
  <button type="button" id="tl-reset" onclick={reset} disabled={filled === N}>Start again</button>
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="A four-step tree of share prices and call values" class="tree-panel">
  {#each t.S.slice(0, N) as col, i (i)}
    {#each col as _, j (j)}
      <line class="edge" x1={colX(i)} y1={rowY(i, j)} x2={colX(i + 1)} y2={rowY(i + 1, j + 1)} stroke="#c3c9d0" stroke-width="1.2" />
      <line class="edge" x1={colX(i)} y1={rowY(i, j)} x2={colX(i + 1)} y2={rowY(i + 1, j)} stroke="#c3c9d0" stroke-width="1.2" />
    {/each}
  {/each}
  {#each t.S as col, i (i)}
    {#each col as s, j (j)}
      <circle class="node" cx={colX(i)} cy={rowY(i, j)} r="3.5" fill="var(--ink)" />
      <text class="share" x={colX(i)} y={rowY(i, j) - 7} text-anchor="middle">{fixed(s, 2)}</text>
      {#if i >= filled}<text class="value v{i}-{j}" x={colX(i)} y={rowY(i, j) + 15} text-anchor="middle">{fixed(t.V[i][j], 2)}</text>{/if}
    {/each}
  {/each}
</svg>
<div class="legend">
  <span><i style="background:var(--ink)"></i>the share price at each node</span>
  <span><i style="background:var(--c1)"></i>the call's value there</span>
</div>

<div class="readouts">
  <Readout id="tl-q" label="Risk-neutral chance of a rise" value={fixed(t.q, 4)} />
  <Readout id="tl-price" label="The call today" value={filled === 0 ? money(t.price, 2) : "step back to see"} />
  <Readout id="tl-delta" label="Shares to hold today" value={filled === 0 ? fixed(t.D[0][0], 3) : "…"} />
  <Readout id="tl-bs" label="Black and Scholes" value={money(blackScholes(), 2)} />
</div>

<style>
  svg { display: block; }
  .share { font-size: 11px; fill: var(--ink-soft); }
  .value { font-size: 11.5px; font-weight: 700; fill: var(--c1); }
  .controls button { font: inherit; font-size: 0.85rem; border: 1px solid #cfd3db; background: white; padding: 5px 14px; border-radius: 999px; cursor: pointer; color: var(--ink); }
  .controls button:disabled { opacity: 0.45; cursor: default; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--ink-soft); margin: 0.3rem 0 0.6rem; }
  .legend i { display: inline-block; width: 10px; height: 10px; margin-right: 6px; vertical-align: -1px; border-radius: 2px; }
</style>
