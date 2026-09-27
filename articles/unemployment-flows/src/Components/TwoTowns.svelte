<script>
  /*
    The case. Two towns at exactly the same unemployment rate, drawn as small
    multiples on one shared scale: the steady-state share of their unemployed
    by how many months they have been searching. Computed in closed form by
    flows.durationBins; the agent simulation in check-numbers.mjs agrees.
  */
  import { steady, meanSpell, longTermShare, durationBins } from "../flows.js";
  import { TOWN_A, TOWN_B, LONG_TERM } from "../datasets.js";
  import { SERIES } from "../palette.js";
  import { linear, clampW } from "../chart.js";

  const EDGES = [0, 3, 6, 12, Infinity];
  const LABELS = ["under 3", "3–5", "6–11", "12+"];
  const towns = [TOWN_A, TOWN_B].map((t, i) => ({
    ...t,
    colour: SERIES[i],
    u: steady(t.s, t.f),
    spell: meanSpell(t.f),
    lt: longTermShare(t.f, LONG_TERM),
    bins: durationBins(t.f, EDGES),
  }));

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth, 280));
  let twoUp = $derived(W >= 560);
  let panelW = $derived(twoUp ? Math.floor((W - 24 - 2) / 2) : W);
  const H = 200;
  const M = { top: 10, right: 8, bottom: 36, left: 36 };
  let band = $derived((panelW - M.left - M.right) / LABELS.length);
  let y = $derived(linear(0, 1, H - M.bottom, M.top));
  const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
  const lt = (v) => (v < 0.001 ? (v * 100).toFixed(2) : (v * 100).toFixed(1)) + "%";
</script>

<div class="fig" id="two-towns">
  <div class="measure" bind:clientWidth={boxWidth}></div>
  <div class="pair" class:two-up={twoUp}>
    {#each towns as t, ti}
      <div class="cell town" data-town={t.name}>
        <p class="t-title">{t.name}: unemployment {pct(t.u, 1)}</p>
        <p class="t-sub">each month {pct(t.s, 1)} of workers lose their job and {pct(t.f, 1)} of the unemployed find one</p>
        <svg width={panelW} height={H} viewBox={`0 0 ${panelW} ${H}`}>
          {#each [0, 0.25, 0.5, 0.75, 1] as g}
            <line class="grid" x1={M.left} x2={panelW - M.right} y1={y(g)} y2={y(g)} />
            <text class="tick" x={M.left - 5} y={y(g) + 4} text-anchor="end">{pct(g)}</text>
          {/each}
          {#each t.bins as b, i}
            <rect class="bin" data-share={b.share} x={M.left + band * i + band * 0.15} y={y(b.share)} width={band * 0.7}
              height={Math.max(0, y(0) - y(b.share))} fill={t.colour} opacity="0.85" />
            <text class="val" x={M.left + band * i + band / 2} y={y(b.share) - 4} text-anchor="middle">{b.share < 0.01 ? "<1%" : pct(b.share)}</text>
            <text class="tick" x={M.left + band * i + band / 2} y={H - M.bottom + 14} text-anchor="middle">{LABELS[i]}</text>
          {/each}
          <text class="axis-title" x={(M.left + panelW - M.right) / 2} y={H - 4} text-anchor="middle">months out of work so far</text>
        </svg>
        <div class="facts">
          <span><b>{t.spell.toFixed(1)}</b> months, the average spell</span>
          <span><b>{lt(t.lt)}</b> out of work a year or more</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .fig {
    max-width: 780px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  .measure {
    width: 100%;
    height: 0;
  }

  .pair {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .pair.two-up {
    flex-direction: row;
    gap: 24px;
  }

  .cell {
    min-width: 0;
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
    padding: 0.8rem 0 0.7rem 0;
  }

  .t-title {
    font-family: var(--font-main);
    font-weight: 700;
    font-size: 1rem;
    margin: 0 12px 0.15rem 12px;
  }

  .t-sub {
    font-family: var(--font-main);
    font-size: 0.82rem;
    line-height: 1.45;
    color: #61707d;
    margin: 0 12px 0.4rem 12px;
    min-height: 2.9em;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  .grid {
    stroke: #eef1f3;
  }

  .tick {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }

  .val {
    font-family: var(--font-mono);
    font-size: 10.5px;
    fill: var(--squid-ink);
  }

  .axis-title {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }

  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 1.2rem;
    margin: 0.4rem 12px 0 12px;
    font-family: var(--font-main);
    font-size: 0.84rem;
    color: #3d4a57;
  }

  .facts b {
    font-family: var(--font-mono);
    color: var(--squid-ink);
  }
</style>
