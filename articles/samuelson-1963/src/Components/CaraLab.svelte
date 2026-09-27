<script>
  /*
    The second hook. A person with constant absolute risk aversion a. The
    certainty equivalent of n bets is n times that of one, so it's a straight
    line through zero, and its sign is set by the first bet alone. The dots
    are the same quantity worked out the long way, by summing over every
    possible number of wins, so the reader can see them sit on the line.
  */
  import { linear, ticks } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { ce1, ceN, outcomes, expectedGain, lossCap, A_STAR, N_MAX } from "../bets.js";
  import { thousands } from "../format.js";

  let { width, a = $bindable(0.006) } = $props();

  const height = 280;
  const m = { top: 14, right: 16, bottom: 46, left: 66 };
  let x = $derived(linear([0, N_MAX], [m.left, width - m.right]));
  const y = linear([-4000, 5000], [height - m.bottom, m.top]);
  const DOTS = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  // the long way: -1/a ln E[exp(-a total)] over every outcome
  const longWay = (a, n) => (a === 0 ? expectedGain(n) : -Math.log(outcomes(n).reduce((s, o) => s + o.prob * Math.exp(-a * o.total), 0)) / a);
  let dots = $derived(DOTS.map((n) => ({ n, v: longWay(a, n) })));
  const kMoney = (v) => (v === 0 ? "$0" : `${v < 0 ? "−" : ""}$${Math.abs(v) / 1000}k`);
  const money = (v) => (Math.round(v) < 0 ? "−" : "") + "$" + thousands(Math.abs(v));
  const money2 = (v) => { const r = Math.round(v * 100) / 100; return (r < 0 ? "−" : "") + "$" + Math.abs(r).toFixed(2); };
  let c1 = $derived(ce1(a));
  let c100 = $derived(ceN(a, N_MAX));
  const verdict = (v) => (v > 0.005 ? "takes it" : v < -0.005 ? "turns it down" : "doesn't mind");
  const PRESETS = [
    { label: "Keen", v: 0.003 },
    { label: "On the fence", v: A_STAR },
    { label: "Cautious", v: 0.006 },
  ];
  const aText = (v) => `${(v * 1000).toFixed(2)} per $1,000`;
</script>

<div class="controls">
  <Slider label="Risk aversion, a" id="cl-a" min={0} max={0.01} step={0.00001} bind:value={a} format={aText} width={260} />
  <div class="presets" id="cl-presets">
    <span class="lab">Presets</span>
    <div class="buttons">
      {#each PRESETS as p (p.label)}
        <button type="button" class:on={Math.abs(a - p.v) < 1e-9} data-v={p.v} onclick={() => (a = p.v)}>{p.label}</button>
      {/each}
    </div>
  </div>
</div>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="What n bets are worth to a cautious person" class="cara-lab">
  <AxisY scale={y} ticks={[-4000, -2000, 0, 2000, 4000]} x0={m.left} x1={width - m.right} format={kMoney} title="worth, as a sure sum" />
  <AxisX scale={x} ticks={[0, 20, 40, 60, 80, 100]} y={height - m.bottom} title="number of bets" />
  <line class="zero" x1={m.left} x2={width - m.right} y1={y(0)} y2={y(0)} stroke="var(--ink)" stroke-width="1.2" />
  <line class="mean-line" x1={x(0)} y1={y(0)} x2={x(N_MAX)} y2={y(expectedGain(N_MAX))} stroke="var(--ink)" stroke-dasharray="5 4" opacity="0.6" />
  <line class="ce-line" x1={x(0)} y1={y(0)} x2={x(N_MAX)} y2={y(c100)} stroke={c1 >= 0 ? "var(--c1)" : "var(--c2)"} stroke-width="2.4" />
  {#each dots as d (d.n)}
    <circle class="long-way" cx={x(d.n)} cy={y(d.v)} r="4" fill="white" stroke={c1 >= 0 ? "var(--c1)" : "var(--c2)"} stroke-width="1.8" />
  {/each}
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style={`background:${c1 >= 0 ? "var(--c1)" : "var(--c2)"}`}></span>n times one bet's worth</span>
  <span class="key"><span class="ring"></span>worked out over every outcome</span>
  <span class="key"><span class="swatch dashed"></span>the average winnings</span>
</p>
<div class="readouts">
  <Readout id="cl-r-one" label="One bet is worth" value={money2(c1)} color={c1 >= 0 ? "var(--c1)" : "var(--c2)"} />
  <Readout id="cl-r-hundred" label="A hundred are worth" value={money(c100)} color={c1 >= 0 ? "var(--c1)" : "var(--c2)"} />
  <Readout id="cl-r-verdict" label="One bet" value={verdict(c1)} />
  <Readout id="cl-r-cap" label="Largest 50-50 loss ever risked" value={a > 0 ? money(lossCap(a)) : "no limit"} />
</div>

<style>
  .presets { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
  .lab { color: var(--muted); }
  .buttons { display: flex; flex-wrap: wrap; gap: 6px; }
  button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 4px 10px; border-radius: 999px; cursor: pointer; }
  button.on { background: var(--ink); color: white; border-color: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
  .ring { display: inline-block; width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--ink); }
</style>
