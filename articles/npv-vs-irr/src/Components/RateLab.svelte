<script>
  /*
    The hook. Two projects at a cost of capital r. The first chart is each
    project's NPV against r, with the r line, the IRRs where the curves cross
    zero and the crossover dot where they cross each other. The second chart is
    the identity: each project is a rectangle as wide as the money it keeps
    tied up (dollar-years at today's value) and as tall as its margin, IRR - r,
    so its area is its NPV.
  */
  import { linear, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { PAIRS, npv, irr, rectangle, crossover } from "../projects.js";
  import { fixed, pct } from "../format.js";

  let { width } = $props();
  let key = $state("timing");
  let r = $state(0.1);
  const VIEW = { timing: { npv: [-80, 220], npvTicks: [-50, 0, 50, 100, 150, 200], cap: 850, capTicks: [0, 200, 400, 600, 800] },
                 scale: { npv: [-180, 320], npvTicks: [-100, 0, 100, 200, 300], cap: 1050, capTicks: [0, 250, 500, 750, 1000] } };
  let pair = $derived(PAIRS[key]);
  let view = $derived(VIEW[key]);
  let A = $derived({ ...pair.A, k: irr(pair.A.cf), rect: rectangle(pair.A.cf, r) });
  let B = $derived({ ...pair.B, k: irr(pair.B.cf), rect: rectangle(pair.B.cf, r) });
  let cross = $derived(crossover(pair.A.cf, pair.B.cf));

  const H1 = 250, H2 = 250, RMAX = 0.55;
  const m = { top: 26, right: 18, bottom: 46, left: 50 };
  let x = $derived(linear([0, RMAX], [m.left, width - m.right]));
  let y = $derived(linear(view.npv, [H1 - m.bottom, m.top]));
  const profile = (cf) => { const pts = []; for (let i = 0; i <= 220; i++) { const rr = (RMAX * i) / 220; pts.push([x(rr), y(npv(cf, rr))]); } return path(pts); };
  let pA = $derived(profile(pair.A.cf));
  let pB = $derived(profile(pair.B.cf));

  let xc = $derived(linear([0, view.cap], [m.left, width - m.right]));
  const yc = linear([-0.2, 0.55], [H2 - m.bottom, m.top]);
  const rectOf = (rc) => ({ x: xc(0), w: xc(rc.width) - xc(0), y: rc.height >= 0 ? yc(rc.height) : yc(0), h: Math.abs(yc(rc.height) - yc(0)) });
  let rA = $derived(rectOf(A.rect));
  let rB = $derived(rectOf(B.rect));
  const money = (v) => (v < -0.004 ? "−$" : "$") + fixed(Math.abs(v), 2);
  const pts = (v) => (v > 0.00005 ? "+" : v < -0.00005 ? "−" : "") + fixed(Math.abs(100 * v), 1) + " pts";
</script>

<div class="controls">
  <Segmented label="Projects" id="rl-pair" options={Object.entries(PAIRS).map(([k, o]) => ({ value: k, label: o.label }))} bind:value={key} />
  <Slider label="Cost of capital" id="rl-r" min={0} max={0.4} step={0.005} bind:value={r} format={(u) => pct(+u, 1)} width={260} />
</div>

<p class="ptitle">NPV at each cost of capital</p>
<svg {width} height={H1} viewBox="0 0 {width} {H1}" role="img" aria-label="Each project's NPV against the cost of capital" class="profile-panel">
  <AxisY scale={y} ticks={view.npvTicks} x0={m.left} x1={width - m.right} format={(t) => (t < 0 ? "−$" : "$") + Math.abs(t)} />
  <AxisX scale={x} ticks={[0, 0.1, 0.2, 0.3, 0.4, 0.5]} y={H1 - m.bottom} format={(t) => pct(t, 0)} title="Cost of capital" />
  <line class="zero" x1={x(0)} x2={x(RMAX)} y1={y(0)} y2={y(0)} stroke="var(--ink)" stroke-opacity="0.6" />
  <line class="rline" x1={x(r)} x2={x(r)} y1={y(view.npv[0])} y2={y(view.npv[1])} stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="4 3" />
  <path class="prof a" d={pA} fill="none" stroke="var(--c1)" stroke-width="3" />
  <path class="prof b" d={pB} fill="none" stroke="var(--c2)" stroke-width="3" />
  <circle class="irr a" cx={x(A.k)} cy={y(0)} r="4.5" fill="white" stroke="var(--c1)" stroke-width="2" />
  <circle class="irr b" cx={x(B.k)} cy={y(0)} r="4.5" fill="white" stroke="var(--c2)" stroke-width="2" />
  <circle class="cross" cx={x(cross)} cy={y(npv(pair.A.cf, cross))} r="5" fill="var(--ink)" stroke="white" stroke-width="1.5" />
  <circle class="at a" cx={x(r)} cy={y(A.rect.npv)} r="5.5" fill="var(--c1)" stroke="white" stroke-width="1.5" />
  <circle class="at b" cx={x(r)} cy={y(B.rect.npv)} r="5.5" fill="var(--c2)" stroke="white" stroke-width="1.5" />
</svg>

<p class="ptitle">The same NPVs as rectangles</p>
<svg {width} height={H2} viewBox="0 0 {width} {H2}" role="img" aria-label="Each project as a rectangle: money tied up across, margin up, area equal to its NPV" class="rect-panel">
  <AxisY scale={yc} ticks={[-0.2, -0.1, 0, 0.1, 0.2, 0.3, 0.4, 0.5]} x0={m.left} x1={width - m.right} format={(t) => (t < 0 ? "−" : t > 0 ? "+" : "") + Math.round(Math.abs(100 * t))} />
  <AxisX scale={xc} ticks={view.capTicks} y={H2 - m.bottom} title="Money tied up, in dollar-years at today's value" />
  <text class="axis-title" x="4" y={m.top - 10} text-anchor="start">IRR minus the cost of capital, points</text>
  <rect class="box b" x={rB.x} y={rB.y} width={rB.w} height={rB.h} fill="var(--c2)" fill-opacity="0.28" stroke="var(--c2)" stroke-width="2" />
  <rect class="box a" x={rA.x} y={rA.y} width={rA.w} height={rA.h} fill="var(--c1)" fill-opacity="0.32" stroke="var(--c1)" stroke-width="2" />
  <line class="zero" x1={xc(0)} x2={xc(view.cap)} y1={yc(0)} y2={yc(0)} stroke="var(--ink)" stroke-opacity="0.6" />
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>{pair.A.name}</span>
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>{pair.B.name}</span>
  <span class="key"><span class="dot"></span>where the NPVs cross</span>
</p>

<div class="readouts">
  <Readout id="rl-r-npva" label={pair.A.name + ": NPV"} value={money(A.rect.npv)} color="var(--c1)" />
  <Readout id="rl-r-npvb" label={pair.B.name + ": NPV"} value={money(B.rect.npv)} color="var(--c2)" />
  <Readout id="rl-r-irra" label={pair.A.name + ": IRR"} value={pct(A.k, 1)} />
  <Readout id="rl-r-irrb" label={pair.B.name + ": IRR"} value={pct(B.k, 1)} />
  <Readout id="rl-r-capa" label={pair.A.name + ": money tied up"} value={fixed(A.rect.width, 1)} />
  <Readout id="rl-r-capb" label={pair.B.name + ": money tied up"} value={fixed(B.rect.width, 1)} />
  <Readout id="rl-r-mara" label={pair.A.name + ": margin"} value={pts(A.rect.height)} />
  <Readout id="rl-r-marb" label={pair.B.name + ": margin"} value={pts(B.rect.height)} />
  <Readout id="rl-r-cross" label="The NPVs cross at" value={pct(cross, 1)} />
</div>

<style>
  .ptitle { font-size: 0.92rem; font-weight: 700; margin: 0.4rem 0 0.2rem; color: var(--ink); }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.3rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; background: var(--ink); }
</style>
