<script>
  /*
    Three stocks, one month. Both indices start at a third in each. A rises by
    d, B stays put and C falls by d. The cap-weighted index's weights drift
    with the prices and that's the whole story; the equal-weighted index's
    drift the same way and then it trades back to a third each (the outlines),
    selling A and buying C.
  */
  import { linear } from "../scale.js";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { oneMonth } from "../index.js";
  import { pct } from "../format.js";

  let { width } = $props();
  let d = $state(0.2);
  let o = $derived(oneMonth(d));
  const GAP = 16;
  let wide = $derived(width >= 560);
  let pw = $derived(wide ? Math.floor((width - GAP - 2) / 2) : width);
  const H = 210;
  const m = { top: 26, right: 8, bottom: 30, left: 40 };
  const y = linear([0, 0.5], [H - m.bottom, m.top]);
  let x = $derived(linear([0, 3], [m.left, pw - m.right]));
  let bw = $derived(Math.min(56, (pw - m.left - m.right) / 3 - 18));
  const NAMES = ["A", "B", "C"];
  const COLORS = ["var(--c1)", "#8a94a2", "var(--c2)"];
</script>

<div class="controls">
  <Slider label="A rises and C falls by" id="df-d" min={0} max={0.4} step={0.05} bind:value={d} format={(v) => pct(+v, 0)} width={260} />
</div>

<div class="panels" style="gap:{GAP}px">
  {#each ["cap", "equal"] as kind (kind)}
    <div class="panel" style="width:{pw}px">
      <p class="ptitle">{kind === "cap" ? "Cap-weighted" : "Equal-weighted"}</p>
      <svg width={pw} height={H} viewBox="0 0 {pw} {H}" role="img" aria-label="{kind === 'cap' ? 'Cap-weighted' : 'Equal-weighted'} weights after one month" class="drift-panel {kind}">
        {#each [0, 0.1, 0.2, 0.3, 0.4, 0.5] as t (t)}
          <g class="grid"><line x1={m.left} x2={pw - m.right} y1={y(t)} y2={y(t)} /></g>
          <text class="tick-label" x={m.left - 6} y={y(t) + 4} text-anchor="end">{pct(t, 0)}</text>
        {/each}
        {#each o.drifted as w, i (i)}
          {@const cx = x(i + 0.5)}
          <rect class="bar s{NAMES[i]}" x={cx - bw / 2} y={y(w)} width={bw} height={y(0) - y(w)} fill={COLORS[i]} opacity="0.85" />
          {#if kind === "equal"}
            <rect class="target s{NAMES[i]}" x={cx - bw / 2 - 3} y={y(1 / 3)} width={bw + 6} height={y(0) - y(1 / 3)} fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="4 3" />
            {#if Math.abs(o.trades[i]) > 1e-9}
              <line class="arrow s{NAMES[i]}" x1={cx + bw / 2 + 10} x2={cx + bw / 2 + 10} y1={y(w)} y2={y(1 / 3)} stroke="var(--ink)" stroke-width="1.6" marker-end="url(#arr-{kind})" />
            {/if}
          {/if}
          <text class="name" x={cx} y={H - m.bottom + 18} text-anchor="middle">{NAMES[i]}</text>
        {/each}
        <defs>
          <marker id="arr-{kind}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--ink)" />
          </marker>
        </defs>
      </svg>
    </div>
  {/each}
</div>

<div class="readouts">
  <Readout id="df-r-cap" label="Cap-weighted trades" value="none" />
  <Readout id="df-r-sell" label="Equal-weighted sells A" value={pct(-o.trades[0], 1)} color="var(--c1)" />
  <Readout id="df-r-buy" label="Equal-weighted buys C" value={pct(o.trades[2], 1)} color="var(--c2)" />
  <Readout id="df-r-turn" label="Share of the fund traded" value={pct(o.turnover, 1)} />
</div>

<style>
  .panels { display: flex; flex-wrap: wrap; }
  .ptitle { font-size: 0.92rem; font-weight: 700; margin: 0 0 0.2rem; color: var(--ink); }
  .name { font-weight: 700; fill: var(--ink); font-size: 12px; }
</style>
