<script>
  import { linear, ticks, path } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";

  // Value paths starting at 1 (drawn as returns), with optional reference
  // lines and markers at the right edge. Shared by the zigzag and the lab.
  let { width, series, refs = [], markers = [], height = 280, xTitle = "trading day", minSpan = 0.2 } = $props();

  const m = { top: 14, right: 118, bottom: 44, left: 60 };
  let n = $derived(series[0].values.length - 1);
  let x = $derived(linear([0, n], [m.left, width - m.right]));
  let yDom = $derived.by(() => {
    const all = series.flatMap((s) => s.values).concat(refs.map((r) => r.y), markers.map((mk) => mk.y), [1]);
    let lo = Math.min(...all), hi = Math.max(...all);
    if (hi - lo < minSpan) { const c = (hi + lo) / 2; lo = c - minSpan / 2; hi = c + minSpan / 2; }
    const pad = (hi - lo) * 0.06;
    return [Math.max(0, lo - pad), hi + pad];
  });
  let y = $derived(linear(yDom, [height - m.bottom, m.top]));
  let yt = $derived(ticks(yDom[0], yDom[1], 5));
  const asReturn = (v) => { const p = Math.round((v - 1) * 100); return (p > 0 ? "+" : p < 0 ? "−" : "") + Math.abs(p) + "%"; };

  // spread the right-edge labels so they don't collide
  let labels = $derived.by(() => {
    const items = [...series.map((s) => ({ y: y(s.values[s.values.length - 1]), text: s.label, color: s.color })),
      ...refs.filter((r) => r.label).map((r) => ({ y: y(r.y), text: r.label, color: r.color }))].sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 14) items[i].y = items[i - 1].y + 14;
    const over = items.length ? items[items.length - 1].y - (height - m.bottom) : 0;
    if (over > 0) for (const it of items) it.y -= over;
    return items;
  });
</script>

<svg {width} {height} role="img" aria-label="Value paths" class="path-chart" viewBox="0 0 {width} {height}">
  <AxisY scale={y} ticks={yt} x0={m.left} x1={width - m.right} format={asReturn} title="return so far" />
  <AxisX scale={x} ticks={ticks(0, n, width < 500 ? 3 : 6)} y={height - m.bottom} title={xTitle} />
  <line x1={m.left} x2={width - m.right} y1={y(1)} y2={y(1)} stroke="#9aa0ab" stroke-width="1" />
  {#each refs as r (r.label + r.y)}
    <line class={r.cls} x1={m.left} x2={width - m.right} y1={y(r.y)} y2={y(r.y)} stroke={r.color} stroke-dasharray="5 4" stroke-width="1.3" />
  {/each}
  {#each series as s (s.label)}
    <path class={s.cls} d={path(s.values.map((v, i) => [x(i), y(v)]))} fill="none" stroke={s.color} stroke-width={s.thin ? 1.4 : 2} />
  {/each}
  {#each markers as mk (mk.label)}
    <circle class={mk.cls} cx={x(n)} cy={y(mk.y)} r="5" fill="white" stroke={mk.color} stroke-width="2" />
  {/each}
  {#each labels as l (l.text)}
    <text x={width - m.right + 8} y={l.y + 4} font-size="11" fill={l.color}>{l.text}</text>
  {/each}
</svg>
