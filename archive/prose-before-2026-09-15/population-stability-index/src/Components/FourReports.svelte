<script>
  /*
    The question the article opens on. Four channels of one lender, one month,
    one scorecard, and a reader asked to rank them by how much the population
    actually moved. The ranking they can see is mostly a ranking of N.

    The month button redraws all four from their TRUE bin probabilities, which
    is the honest way to make the point: no single month is cherry-picked, and
    what the reader notices after four or five presses is that the steadiest
    number in the pack belongs to the channel that moved and the jumpiest one
    to a channel that did not.
  */
  import { SEGS, psiFmt, int, num, pct, floorOf, drawMonth, PRE } from "../experiments.js";
  import { SIGNAL, INK, RULE, LABEL, MARK, FLOOR, ZONE, ZONE_LABEL, zoneOf } from "../palette.js";

  let month = 1;
  let guess = null;
  let revealed = false;

  /* drawMonth lives in experiments.js so the closing section can redraw the
     same month rather than a lookalike: same seed, same order, same counts. */
  $: rows = drawMonth(month);

  let boxWidth = 320;
  $: BW = Math.max(260, boxWidth);
  $: across = BW > 780 ? 4 : BW > 430 ? 2 : 1;
  /* Splitting a row exactly is a knife edge - asking for 604px of a 603px row
     drops a whole card below the fold with every check still green. */
  $: cardW = Math.floor((BW - (across - 1) * 12 - 2) / across);

  /* The deviations are a few points of share, so the box has to be scaled to
     them or every card is a flat line. SCALE is the half-range in share points;
     anything past it is drawn to the edge with a chevron rather than clipped
     silently, which is rare but does happen on the smallest panel. */
  const CH = 78;
  const SCALE = 0.08;
  $: plotW = cardW - 20;
  $: band = plotW / 10;
  /* Reactive, not const: these read `band` and `plotW`, and a plain const that
     closes over a $: variable is invisible to Svelte's dirty tracking. */
  $: barX = (i) => 9 + band * i + 1;
  $: barY = (p) => CH / 2 - (Math.max(-1, Math.min(1, (p - 0.1) / SCALE))) * (CH / 2 - 7);
  $: clipped = (p) => Math.abs(p - 0.1) > SCALE;

  const fmtN = (n) => int(n) + " applications";
</script>

<h1 class="body-header">One month of a monitoring pack</h1>

<p class="body-text">
  Same scorecard, same development sample, same ten bins, same month. The only
  thing that differs between these four is the channel the applications came
  through — and how many of them there were.
</p>

<div class="wrap">
  <div class="measure" bind:clientWidth={boxWidth} />
  <div class="pack" style="--cols: {across}">
    {#each SEGS as s, i (s.id)}
      <div class="card" class:picked={guess === s.id} style="width: {cardW}px">
        <button
          class="hit"
          aria-pressed={guess === s.id}
          on:click={() => { if (!revealed) guess = s.id; }}
        >
          <div class="top">
            <div class="nm">{s.name}</div>
            <div class="n">{fmtN(s.n)}</div>
          </div>
          <svg width={cardW - 2} height={CH} viewBox="0 0 {cardW - 2} {CH}" role="img"
               aria-label="share of applications in each decile of the development sample, against the expected tenth">
            <line x1="9" y1={CH / 2} x2={9 + plotW} y2={CH / 2} stroke={LABEL} stroke-width="1" stroke-dasharray="3 3" opacity="0.45" />
            {#each rows[i].a as p, k}
              <rect
                x={barX(k)}
                y={Math.min(barY(p), CH / 2)}
                width={Math.max(1, band - 2)}
                height={Math.max(0.8, Math.abs(barY(p) - CH / 2))}
                fill={SIGNAL}
                opacity="0.85"
              />
              {#if clipped(p)}
                <path d={p > 0.1
                    ? `M ${barX(k)} 6 L ${barX(k) + band - 2} 6 L ${barX(k) + (band - 2) / 2} 1 Z`
                    : `M ${barX(k)} ${CH - 6} L ${barX(k) + band - 2} ${CH - 6} L ${barX(k) + (band - 2) / 2} ${CH - 1} Z`}
                  fill={MARK} />
              {/if}
            {/each}
          </svg>
          <div class="foot">
            <div class="val">{psiFmt(rows[i].psi)}</div>
            <div class="verdict" style="background: {ZONE[zoneOf(rows[i].psi)]}">{ZONE_LABEL[zoneOf(rows[i].psi)]}</div>
          </div>
          {#if revealed}
            <div class="truth" class:moved={s.moved}>
              <div class="tl">{s.moved ? "moved" : "did not move"}</div>
              <div class="tx">{s.truth}</div>
              <div class="split">
                <span>expected reading <b>{psiFmt(s.expRaw)}</b></span>
                <span>of which noise floor <b>{psiFmt(s.floor)}</b></span>
              </div>
            </div>
          {/if}
        </button>
      </div>
    {/each}
  </div>

  <div class="ctrl">
    <button class="pill" on:click={() => { month += 1; }}>next month</button>
    <button class="pill alt" on:click={() => { revealed = !revealed; }}>
      {revealed ? "hide the answer" : "show me which one moved"}
    </button>
    <span class="hint">
      {guess && !revealed ? "Now press a few more months before you look." : "Pick the channel whose population you think moved the most."}
    </span>
  </div>
</div>

<p class="body-text">
  Press <span class="bold">next month</span> four or five times before reading
  on. The bars barely change on the first card and jump around on the last one,
  and that is not a hint about the populations — it is a hint about
  {int(SEGS[0].n)} against {int(SEGS[3].n)}.
</p>

<style>
  .wrap { max-width: 860px; margin: 1.5rem auto 0.5rem auto; padding: 0 0.75rem; }
  /* First child of the box being sized. As a flex sibling of the grid it would
     report its own negotiated width and every card would be laid out for the
     wrong box. */
  .measure { width: 100%; height: 0; }

  .pack { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; align-items: flex-start; }

  .card {
    background: var(--white);
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
    transition: border-color 140ms ease, box-shadow 140ms ease;
  }
  .card.picked { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(124, 90, 237, 0.18); }

  .hit {
    display: block; width: 100%; text-align: left; background: none;
    border: 0; padding: 0.55rem 0 0.1rem 0; cursor: pointer; font: inherit; color: inherit;
  }

  .top { padding: 0 0.55rem; }
  .nm { font-family: var(--font-heavy); font-size: 0.9rem; color: var(--squid-ink); line-height: 1.2; }
  .n { font-family: var(--font-mono, monospace); font-size: 0.72rem; color: #718096; margin-top: 0.1rem; }

  .foot { display: flex; align-items: baseline; gap: 0.5rem; padding: 0.15rem 0.55rem 0.55rem 0.55rem; flex-wrap: wrap; }
  .val { font-family: var(--font-heavy); font-size: 1.5rem; color: var(--squid-ink); letter-spacing: -0.5px; }
  .verdict {
    font-family: var(--font-main); font-size: 0.66rem; color: #3d4a5c;
    padding: 0.16rem 0.4rem; border-radius: 3px; white-space: nowrap;
  }

  .truth { border-top: 1px solid #eef1f5; padding: 0.5rem 0.55rem 0.6rem 0.55rem; background: #fbfcfd; }
  .tl {
    font-family: var(--font-heavy); font-size: 0.68rem; text-transform: uppercase;
    letter-spacing: 0.6px; color: #8a94a2; margin-bottom: 0.25rem;
  }
  .truth.moved .tl { color: #2074d5; }
  .tx { font-size: 0.78rem; line-height: 1.4; color: var(--squid-ink); }
  .split { display: flex; flex-direction: column; gap: 0.1rem; margin-top: 0.35rem; font-size: 0.7rem; color: #718096; }
  .split b { font-family: var(--font-mono, monospace); color: var(--squid-ink); }

  .ctrl { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 0.9rem; justify-content: center; }
  .pill {
    font-family: var(--font-main); font-size: 0.78rem; padding: 0.35rem 0.7rem;
    border: 1px solid #cbd5e0; background: var(--white); border-radius: 999px;
    color: var(--squid-ink); cursor: pointer;
  }
  .pill:hover { border-color: var(--primary); color: var(--primary); }
  .pill.alt { border-color: var(--primary); color: var(--primary); }
  .hint { font-size: 0.72rem; color: #718096; flex-basis: 100%; text-align: center; }

  @media screen and (max-width: 950px) {
    .wrap { padding: 0 0.5rem; }
  }
</style>
