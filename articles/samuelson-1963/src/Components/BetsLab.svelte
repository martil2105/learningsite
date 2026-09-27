<script>
  /*
    The first hook. Every possible result of n coin-flip bets (win $200, lose
    $100), with its exact binomial probability, as bars. Two ways to hold the
    bets: take them all ourselves, or share them equally with n - 1 friends,
    so each person holds 1/n of every bet. The mean per person is the same
    story; the spread is not.
  */
  import { linear, ticks } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { outcomes, expectedGain, spread, worstCase, chanceLoss, N_MAX } from "../bets.js";
  import { pct, thousands } from "../format.js";

  let { width, n = $bindable(1), hold = $bindable("all") } = $props();

  const height = 260;
  const m = { top: 14, right: 16, bottom: 46, left: 56 };
  let outs = $derived(outcomes(n));
  let per = $derived(hold === "all" ? 1 : n); // divide every total by this
  let vals = $derived(outs.map((o) => ({ ...o, v: o.total / per })));
  let lo = $derived(hold === "all" ? Math.min(-200, worstCase(n)) : -100);
  let hi = $derived(hold === "all" ? Math.max(400, 200 * n) : 200);
  let x = $derived(linear([lo, hi], [m.left, width - m.right]));
  let pMax = $derived(Math.max(...vals.map((o) => o.prob)));
  let y = $derived(linear([0, pMax * 1.08], [height - m.bottom, m.top]));
  // bar width: the gap between neighbouring totals, 300/per, in pixels
  let bw = $derived(Math.max(1, Math.min(40, (x(300 / per) - x(0)) * 0.8)));
  let xt = $derived(ticks(lo, hi, width < 500 ? 4 : 6));
  const money = (v) => (v < 0 ? "−" : "") + "$" + thousands(Math.abs(v));
  let yt = $derived(ticks(0, pMax * 1.08, 4));

  let lossText = $derived.by(() => {
    const p = chanceLoss(n);
    if (p === 0) return "0%";
    return p < 0.001 ? `1 in ${thousands(1 / p)}` : pct(p, p < 0.1 ? 1 : 0);
  });
  let sd = $derived(spread(n) / per);
  let label = $derived(hold === "all" ? "Our total" : "Each person's share");
  const betsText = (k) => `${k} ${k === 1 ? "bet" : "bets"}`;
</script>

<div class="controls">
  <Slider label="Number of bets" id="bl-n" min={1} max={N_MAX} step={1} bind:value={n} format={betsText} width={240} />
  <Segmented label="Who takes them" id="bl-hold" bind:value={hold}
    options={[{ value: "all", label: "We take them all" }, { value: "share", label: "Shared equally" }]} />
</div>

<svg {width} {height} viewBox="0 0 {width} {height}" role="img" aria-label="Every possible result of the bets" class="bets-lab">
  <AxisY scale={y} ticks={yt} x0={m.left} x1={width - m.right} format={(v) => pct(v, 0)} title="chance" />
  <AxisX scale={x} ticks={xt} y={height - m.bottom} format={money} title={hold === "all" ? "our total winnings" : "each person's winnings"} />
  <line class="zero" x1={x(0)} x2={x(0)} y1={m.top} y2={height - m.bottom} stroke="var(--ink)" stroke-dasharray="4 3" />
  {#each vals as o (o.k)}
    <rect class={`bar ${o.total < 0 ? "loss" : o.total > 0 ? "gain" : "tie"}`} x={x(o.v) - bw / 2} y={y(o.prob)} width={bw}
      height={Math.max(0, y(0) - y(o.prob))} fill={o.total < 0 ? "var(--c2)" : o.total > 0 ? "var(--c1)" : "#8a94a2"} />
  {/each}
  <circle class="mean-dot" cx={x(expectedGain(n) / per)} cy={height - m.bottom} r="4.5" fill="var(--ink)" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>come out ahead</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>lose money</span>
  <span class="key"><span class="dot"></span>the average</span>
</p>
<div class="readouts">
  <Readout id="bl-r-mean" label={`${label}, on average`} value={money(expectedGain(n) / per)} />
  <Readout id="bl-r-loss" label="Chance of losing money" value={lossText} color="var(--c2)" />
  <Readout id="bl-r-worst" label="Worst case" value={money(worstCase(n) / per)} />
  <Readout id="bl-r-sd" label="Typical swing" value={`±${money(sd)}`} />
</div>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 12px; height: 12px; }
  .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: var(--ink); }
</style>
