<script>
  /*
    The central lab. A fresh month of our bank with a mule ring of the size you
    choose, drawn in two of its six features (money in, and different senders,
    both logged and standardised) and clustered live with k-means. The 50
    alerts are ringed. As the ring grows, or k grows, the ring gets a centroid
    of its own (or drags a neighbour's onto it) and its members stop looking
    unusual.

    Equal aspect ratio, because the whole argument is about distance.
  */
  import { makeProfiles, drawMonth, idxOf, budgetFor } from "../bank.js";
  import { pipeline, LOG_Z } from "../prep.js";
  import { kmeans, scores, topK } from "../cluster.js";
  import { clampW, linear } from "../chart.js";

  const SIZES = [1, 5, 10, 20, 30, 40, 60, 80];
  let si = $state(3);
  let k = $state(5);
  let t = $state(0);
  let m = $derived(SIZES[si]);

  let world = $derived.by(() => {
    const month = drawMonth(makeProfiles(5000, 1000 + t, { mules: m, struct: 0, extreme: 0 }), 2000 + t);
    const X = pipeline(LOG_Z, month.map((c) => [c.x[0], c.x[5]]));
    const f = kmeans(X, k, 3000 + t, 10);
    const sc = scores(X, f);
    const A = topK(sc.dist, budgetFor(X.length));
    const ring = idxOf(month, "mule");
    const caught = ring.filter((i) => A.has(i)).length;
    const cnt = {}; ring.forEach((i) => (cnt[f.lab[i]] = (cnt[f.lab[i]] || 0) + 1));
    const [cl, c] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    const share = c / sc.n[cl];
    const meanRingD = ring.reduce((s, i) => s + sc.dist[i], 0) / ring.length;
    return { X, f, A, ring: new Set(ring), caught, owns: share >= 0.5, together: c, clusterSize: sc.n[cl], meanRingD };
  });

  // The window covers every customer and centroid in this month, with equal
  // units on both axes, and the chart is capped in width so it isn't too tall.
  let XR = $derived.by(() => { const v = world.X.map((p) => p[0]); return [Math.min(...v) - 0.3, Math.max(...v) + 0.3]; });
  let YR = $derived.by(() => { const v = world.X.map((p) => p[1]); return [Math.min(...v) - 0.3, Math.max(...v) + 0.3]; });
  let boxWidth = $state(320);
  let W = $derived(Math.min(clampW(boxWidth), 560));
  let H = $derived(Math.round((W - 20) * ((YR[1] - YR[0]) / (XR[1] - XR[0]))) + 20);
  let x = $derived(linear(XR[0], XR[1], 10, W - 10));
  let y = $derived(linear(YR[0], YR[1], H - 10, 10));
  const PAD = 20;
  const inside = () => true;

  let verdict = $derived(
    world.owns
      ? `With ${m} ${m === 1 ? "mule" : "mules"} and k = ${k}, the ring has a centroid of its own, so ${world.caught} of its members are among the 50 alerts.`
      : world.together >= Math.max(2, Math.round(0.8 * m)) && world.caught < m
        ? `With ${m} mules and k = ${k}, ${world.together} of them share a cluster of ${world.clusterSize} and pull its centroid towards them, so only ${world.caught} are among the 50 alerts.`
        : `With ${m} ${m === 1 ? "mule" : "mules"} and k = ${k}, ${world.caught} of ${m} ${m === 1 ? "is" : "are"} among the 50 alerts.`
  );
</script>

<div class="fig ring-lab" id="ring-lab">
  <p class="fig-title">A month of our bank in two features, with a mule ring of your chosen size</p>
  <div class="controls-bar">
    <label class="slider">
      <span class="s-name">mules in the ring <b>{m}</b></span>
      <input type="range" min="0" max={SIZES.length - 1} step="1" bind:value={si} aria-label="mules in the ring" />
    </label>
    <label class="slider">
      <span class="s-name">clusters k <b>{k}</b></span>
      <input type="range" min="2" max="12" step="1" bind:value={k} aria-label="clusters k" />
    </label>
    <div class="pills">
      <button class="pill resample" onclick={() => (t = (t + 1) % 12)}>another month</button>
      <span class="s-hint">month {t + 1} of 12</span>
    </div>
  </div>
  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <svg class="lab-svg" width={W} height={H + PAD} viewBox={`0 0 ${W} ${H + PAD}`} role="img" aria-label="Customers by money in and number of senders, with centroids and alerts">
      <rect class="plot-bg" x="0" y="0" width={W} height={H} />
      {#each world.X as p, i}
        {#if inside(p) && !world.ring.has(i)}
          <circle class="cust" class:alert={world.A.has(i)} cx={x(p[0])} cy={y(p[1])} r={world.A.has(i) ? 3.2 : 1.5} />
        {/if}
      {/each}
      {#each world.X as p, i}
        {#if inside(p) && world.ring.has(i)}
          <circle class="mule" class:alert={world.A.has(i)} cx={x(p[0])} cy={y(p[1])} r={world.A.has(i) ? 4.2 : 3.2} />
        {/if}
      {/each}
      {#each world.f.C as c}
        {#if inside(c)}
          <g class="centroid" transform={`translate(${x(c[0])} ${y(c[1])})`}>
            <line x1="-6" y1="-6" x2="6" y2="6" /><line x1="-6" y1="6" x2="6" y2="-6" />
          </g>
        {/if}
      {/each}
      <text class="axis-note" x={W - 4} y={H + 14} text-anchor="end">money in →</text>
      <text class="axis-note" x="14" y="24">↑ different senders</text>
    </svg>
  </div>
  <p class="legend">
    <span class="key"><span class="swatch dot mule-sw"></span>ring member</span>
    <span class="key"><span class="swatch dot"></span>customer</span>
    <span class="key"><span class="swatch ringed"></span>one of the 50 alerts</span>
    <span class="key"><span class="swatch cross">×</span>centroid</span>
  </p>
  <p class="readout lab-readout">ring caught <b class="ring-caught">{world.caught}/{m}</b> · ring owns a centroid <b class="ring-owns">{world.owns ? "yes" : "no"}</b></p>
  <p class="verdict">{verdict}</p>
</div>

<style>
  .plot-bg { fill: #fff; }
  .lab-svg { margin: 0 auto; }
  .cust { fill: #8a94a2; opacity: 0.55; }
  .cust.alert { fill: none; stroke: #232f3e; stroke-width: 1.4; opacity: 1; }
  .mule { fill: #df2a5d; opacity: 0.9; }
  .mule.alert { stroke: #232f3e; stroke-width: 1.8; }
  .centroid line { stroke: #232f3e; stroke-width: 2.6; }
  .axis-note { font-family: var(--font-main); font-size: 11px; fill: #61707d; }
  .mule-sw { background: #df2a5d !important; }
  .ringed { border: 1.6px solid #232f3e; border-radius: 50%; background: transparent !important; }
  .cross { background: transparent !important; font-weight: 700; line-height: 10px; text-align: center; }
</style>
