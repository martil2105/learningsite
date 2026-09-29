<script>
  /*
    A thousand ordinary days. Each dot is one day: today's reported premium
    against tomorrow's change in the NAV (first panel) and in the ETF's price
    (second panel). The line through each cloud is its least-squares slope.
    Both panels share one scale, so the slopes can be compared by eye.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { ordinaryDays, nextDay, slope } from "../etf.js";
  import { pct, fixed } from "../format.js";

  let { width, p = $bindable(0.2) } = $props();
  const DAYS = 1000;
  let pts = $derived(nextDay(ordinaryDays({ days: DAYS, p })));
  let sN = $derived(slope(pts, "dNav"));
  let sP = $derived(slope(pts, "dP"));
  let XM = $derived(Math.ceil(100 * 1.05 * Math.max(...pts.map((q) => Math.abs(q.prem)))) / 100);
  let YM = $derived(Math.ceil(100 * 1.05 * Math.max(...pts.map((q) => Math.max(Math.abs(q.dNav), Math.abs(q.dP))))) / 100);

  const GAP = 16;
  let wide = $derived(width >= 560);
  let pw = $derived(wide ? Math.floor((width - GAP - 2) / 2) : width);
  const H = 240;
  const m = { top: 12, right: 12, bottom: 44, left: 48 };
  let x = $derived(linear([-XM, XM], [m.left, pw - m.right]));
  let y = $derived(linear([-YM, YM], [H - m.bottom, m.top]));
  // ticks on whole percentages: every 2% for a wide window, every 1% otherwise
  const tk = (M) => { const st = M > 0.03 ? 0.02 : 0.01, out = []; for (let v = -Math.floor(M / st + 1e-9) * st; v <= M + 1e-9; v += st) out.push(+v.toFixed(3)); return out; };
  const fit = (s) => `M${x(-XM).toFixed(2)},${y(s.my + s.slope * (-XM - s.mx)).toFixed(2)}L${x(XM).toFixed(2)},${y(s.my + s.slope * (XM - s.mx)).toFixed(2)}`;
  const PANELS = [
    { key: "dNav", cls: "nav", title: "Tomorrow's change in the NAV", color: "var(--c1)" },
    { key: "dP", cls: "price", title: "Tomorrow's change in the price", color: "var(--c2)" },
  ];
</script>

<div class="controls">
  <Slider label="Share of the bonds that trade each day" id="gr-p" min={0.1} max={0.6} step={0.05} bind:value={p} format={(v) => pct(+v, 0)} width={260} />
</div>

<div class="panels" style="gap:{GAP}px">
  {#each PANELS as P (P.key)}
    {@const s = P.key === "dNav" ? sN : sP}
    <div class="panel" style="width:{pw}px">
      <p class="ptitle">{P.title}</p>
      <svg width={pw} height={H} viewBox="0 0 {pw} {H}" role="img" aria-label="{P.title} against today's premium" class="reg-panel {P.cls}">
        <AxisY scale={y} ticks={tk(YM)} x0={m.left} x1={pw - m.right} format={(v) => pct(v, 0)} />
        <AxisX scale={x} ticks={tk(XM)} y={H - m.bottom} format={(v) => pct(v, 0)} title="today's premium over the NAV" />
        {#each pts as q, i (i)}
          <circle class="day" cx={x(q.prem)} cy={y(q[P.key])} r="1.6" fill={P.color} opacity="0.35" />
        {/each}
        <path class="fit" d={fit(s)} fill="none" stroke="var(--ink)" stroke-width="2" />
      </svg>
    </div>
  {/each}
</div>

<div class="readouts">
  <Readout id="gr-r-nav" label="Slope, NAV" value={fixed(sN.slope, 2)} color="var(--c1)" />
  <Readout id="gr-r-price" label="Slope, price" value={fixed(sP.slope, 2)} color="var(--c2)" />
  <Readout id="gr-r-p" label="Share of bonds trading daily" value={pct(p, 0)} />
</div>

<style>
  .panels { display: flex; flex-wrap: wrap; }
  .ptitle { font-size: 0.92rem; font-weight: 700; margin: 0 0 0.2rem; color: var(--ink); }
</style>
