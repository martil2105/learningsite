<script>
  import { log10Scale, logTicks } from "../scale.js";
  import { continuousReach, SHAPES } from "../book.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Readout from "./Readout.svelte";
  import { thousands } from "../format.js";

  // How far an order walks against its size, on log scales, for the three
  // book shapes. The continuous rule is the line; whole-level orders in the
  // discrete book are the dots.
  let { width, q = $bindable(10000) } = $props();

  const height = 300;
  const m = { top: 16, right: 92, bottom: 48, left: 54 };
  const K = { flat: 500, v: 100, steep: 20 };
  const COLORS = { flat: "var(--c1)", v: "var(--c2)", steep: "var(--c3)" };
  const NAMES = { flat: "flat", v: "linear", steep: "square" };
  let x = $derived(log10Scale([1000, 100000], [m.left, width - m.right]));
  const y = log10Scale([1, 300], [height - m.bottom, m.top]);

  const reach = (s, Q) => continuousReach(SHAPES[s].a, K[s], Q);
  const qs = Array.from({ length: 61 }, (_, i) => 1000 * Math.pow(100, i / 60));
  let lines = $derived(Object.keys(K).map((s) => ({ s, d: qs.map((Q, i) => `${i ? "L" : "M"}${x(Q).toFixed(1)},${y(reach(s, Q)).toFixed(1)}`).join("") })));
  // whole-level orders: q = sum of depths over the first n levels, walk = n - 1 ticks... drawn at n levels
  let dots = $derived(Object.keys(K).flatMap((s) => {
    const out = []; let cum = 0;
    for (let j = 0; j < 400; j++) {
      cum += SHAPES[s].depth(j);
      if (cum > 100000) break;
      if (cum >= 1000 && j + 1 >= 1) out.push({ s, q: cum, n: j + 1 });
    }
    return out;
  }));
  const fmtQ = (v) => (v >= 1000 ? v / 1000 + "k" : v);
</script>

<div class="controls">
  <Slider label="Order size (shares)" id="gq" min={1000} max={100000} step={1000} bind:value={q} format={thousands} width={280} />
</div>
<svg {width} {height} role="img" aria-label="Distance walked against order size" class="growth-chart" viewBox="0 0 {width} {height}">
  <AxisY scale={y} ticks={[1, 3, 10, 30, 100, 300]} x0={m.left} x1={width - m.right} title="price levels used" />
  <AxisX scale={x} ticks={logTicks(1000, 100000).concat([3000, 30000]).sort((a, b) => a - b)} y={height - m.bottom} format={fmtQ} title="order size (shares)" />
  {#each dots as d (d.s + d.q)}
    <circle cx={x(d.q)} cy={y(d.n)} r="2" fill={COLORS[d.s]} opacity="0.45" />
  {/each}
  {#each lines as l (l.s)}
    <path class="growth-line" data-shape={l.s} d={l.d} fill="none" stroke={COLORS[l.s]} stroke-width="2.2" />
    <text x={width - m.right + 6} y={y(reach(l.s, 100000)) + 4} font-size="11" fill={COLORS[l.s]}>{NAMES[l.s]}</text>
  {/each}
  <line x1={x(q)} x2={x(q)} y1={m.top} y2={height - m.bottom} stroke="var(--muted)" stroke-dasharray="3 3" />
  {#each Object.keys(K) as s (s)}
    <circle class="q-marker" cx={x(q)} cy={y(reach(s, q))} r="4.5" fill="white" stroke={COLORS[s]} stroke-width="2" />
  {/each}
</svg>
<div class="readouts">
  {#each Object.keys(K) as s (s)}
    <Readout id={"g-" + s} label={`${SHAPES[s].label}: uses ${reach(s, q).toFixed(1)} levels`} value={`×${Math.pow(2, 1 / (SHAPES[s].a + 1)).toFixed(2)} if doubled`} color={COLORS[s]} />
  {/each}
</div>
