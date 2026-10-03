<script>
  /*
    The hook. Pick an asset and the factors in the model (the market is always
    in). The waterfall starts from the asset's CAPM alpha; each added factor
    moves it by minus the asset's loading on that factor times the factor's
    own CAPM alpha; the last bar is the alpha in the chosen model, with two
    standard errors either side. The steps add up to the last bar exactly.
  */
  import { linear } from "../scale.js";
  import AxisY from "./AxisY.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { ASSETS, FACTORS, SHORT, NAMES, waterfall } from "../factors.js";
  import { fixed } from "../format.js";

  let { width } = $props();
  let asset = $state("hml");
  let on = $state({ smb: false, hml: false, rmw: false, cma: false, mom: false });
  const PRESETS = [
    { id: "capm", label: "CAPM", set: [] },
    { id: "ff3", label: "Three factors", set: ["smb", "hml"] },
    { id: "ff5", label: "Five factors", set: ["smb", "hml", "rmw", "cma"] },
    { id: "ff6", label: "Five plus momentum", set: ["smb", "hml", "rmw", "cma", "mom"] },
  ];
  let own = $derived(ASSETS[asset].own);
  let chosen = $derived(FACTORS.filter((f) => on[f] && f !== own));
  let w = $derived(waterfall(asset, chosen));
  const setPreset = (p) => { for (const f of FACTORS) on[f] = p.set.includes(f); };
  const isPreset = (p) => FACTORS.every((f) => f === own || on[f] === p.set.includes(f));

  const H = 290, YL = -4, YH = 14;
  const m = { top: 16, right: 12, bottom: 54, left: 44 };
  let cols = $derived(chosen.length + 2);
  let slot = $derived((width - m.left - m.right) / cols);
  let bw = $derived(Math.min(46, slot * 0.6));
  const Y = linear([YL, YH], [H - m.bottom, m.top]);
  const cx = (i) => m.left + slot * (i + 0.5);
  let bars = $derived.by(() => {
    const out = [{ key: "capm", label: ["CAPM", "alpha"], from: 0, to: w.capm, kind: "start" }];
    let run = w.capm;
    for (const s of w.steps) { out.push({ key: s.f, label: [SHORT[s.f], (s.move >= 0 ? "+" : "−") + fixed(Math.abs(s.move), 1)], from: run, to: run + s.move, kind: s.move >= 0 ? "up" : "down" }); run += s.move; }
    out.push({ key: "model", label: ["This", "model"], from: 0, to: w.alpha, kind: "end" });
    return out;
  });
  const fill = { start: "#8a94a2", up: "var(--c3)", down: "var(--c2)", end: "var(--c1)" };
  const signed = (v) => (v > 0.005 ? "+" : v < -0.005 ? "−" : "") + fixed(Math.abs(v), 1) + "%";
</script>

<div class="controls">
  <Segmented label="Asset" id="al-asset" options={Object.entries(ASSETS).map(([k, a]) => ({ value: k, label: a.label }))} bind:value={asset} />
  <div class="toggles" role="group" aria-label="Factors in the model" id="al-factors">
    <span class="lab">Factors besides the market</span>
    <div class="buttons">
      {#each FACTORS as f (f)}
        <button type="button" data-f={f} class:on={on[f] && f !== own} disabled={f === own} aria-pressed={on[f] && f !== own} onclick={() => (on[f] = !on[f])}>{NAMES[f]}</button>
      {/each}
    </div>
  </div>
  <div class="toggles" role="group" aria-label="Models" id="al-presets">
    <span class="lab">Models</span>
    <div class="buttons">
      {#each PRESETS as p (p.id)}
        <button type="button" data-p={p.id} class:on={isPreset(p)} onclick={() => setPreset(p)}>{p.label}</button>
      {/each}
    </div>
  </div>
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="How the alpha moves from the CAPM to the chosen model, factor by factor" class="fall-panel">
  <AxisY scale={Y} ticks={[-4, -2, 0, 2, 4, 6, 8, 10, 12, 14]} x0={m.left} x1={width - m.right} format={(t) => t + "%"} />
  <line class="zero" x1={m.left} x2={width - m.right} y1={Y(0)} y2={Y(0)} stroke="var(--ink)" stroke-opacity="0.6" />
  {#each bars as b, i (b.key)}
    <rect class="bar {b.kind} k-{b.key}" x={cx(i) - bw / 2} y={Y(Math.max(b.from, b.to))} width={bw} height={Math.max(0.5, Math.abs(Y(b.from) - Y(b.to)))} fill={fill[b.kind]} />
    {#if i < bars.length - 1}
      <line class="link" x1={cx(i) + bw / 2} x2={cx(i + 1) - bw / 2} y1={Y(b.to)} y2={Y(b.to)} stroke="var(--ink)" stroke-opacity="0.35" stroke-dasharray="2 2" />
    {/if}
    <text class="bar-label" x={cx(i)} y={H - m.bottom + 16} text-anchor="middle">{b.label[0]}</text>
    <text class="bar-label sub" x={cx(i)} y={H - m.bottom + 30} text-anchor="middle">{b.label[1]}</text>
  {/each}
  <line class="whisker" x1={cx(bars.length - 1)} x2={cx(bars.length - 1)} y1={Y(w.alpha + 2 * w.se)} y2={Y(w.alpha - 2 * w.se)} stroke="var(--ink)" stroke-width="1.4" />
</svg>
<p class="legend">
  <span class="key"><span class="block" style="background:var(--c3)"></span>a factor that raises the alpha</span>
  <span class="key"><span class="block" style="background:var(--c2)"></span>a factor that lowers it</span>
  <span class="key"><span class="block" style="background:var(--c1)"></span>alpha in this model, with two standard errors</span>
</p>

<div class="readouts">
  <Readout id="al-r-capm" label="CAPM alpha a year" value={signed(w.capm)} />
  <Readout id="al-r-alpha" label="Alpha in this model" value={signed(w.alpha)} color="var(--c1)" />
  <Readout id="al-r-t" label="Its t-statistic" value={fixed(w.t, 1)} />
  {#each w.steps as s (s.f)}
    <Readout id={"al-r-b-" + s.f} label={NAMES[s.f] + " loading"} value={fixed(s.loading, 2)} />
  {/each}
</div>

<style>
  .toggles { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
  .lab { color: var(--muted); }
  .buttons { display: flex; flex-wrap: wrap; gap: 6px; }
  .toggles button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; }
  .toggles button.on { background: var(--ink); color: white; border-color: var(--ink); }
  .toggles button:disabled { opacity: 0.35; cursor: default; }
  .bar-label { font-size: 11px; fill: var(--ink-soft); }
  .bar-label.sub { font-size: 10.5px; fill: var(--muted); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .block { display: inline-block; width: 14px; height: 10px; }
</style>
