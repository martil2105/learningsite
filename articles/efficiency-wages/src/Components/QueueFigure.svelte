<script>
  /*
    The queue. At the efficiency wage firms hire fewer workers than want to
    work at it: the gap between the workforce and employment is the queue,
    and nothing in the firm's problem wants to close it. The unemployed
    workers are what makes the dismissal threat real.
  */
  import { WR, closedWage } from "../effort.js";
  import { clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const WORKFORCE = 100;
  const K = 1200; // firms' staffing budget: employment = K / wage
  const H = 190;

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let wStar = $derived(closedWage(WR, 1));
  let employed = $derived(K / wStar);
  let queue = $derived(WORKFORCE - employed);

  let readout = $derived(
    `At a wage of ${wStar.toFixed(0)}, the firms hire ${employed.toFixed(0)} of the ${WORKFORCE} people who want work, and ${queue.toFixed(0)} wait outside.`
  );
</script>

<div class="fig" id="queue-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">Who gets a job at the best wage</p>
  <p class="readout">{readout}</p>

  <div class="row">
    <div class="seg employed" style:width={`${employed}%`}>
      <span>{employed.toFixed(0)} employed</span>
    </div>
    <div class="seg queue" style:width={`${queue}%`}>
      <span>{queue.toFixed(0)} waiting</span>
    </div>
  </div>
  <p class="caption">
    A lower wage would shorten the queue, but it would also buy less effort
    from each worker, so the firms aren't trying to clear this market.
  </p>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.3rem 0; color: var(--squidink); }
  .readout { font-family: var(--font-main); font-size: 0.88rem; line-height: 1.5; margin: 0 0 0.6rem 0; color: #5a6672; }
  .row { display: flex; height: 44px; border-radius: 4px; overflow: hidden; }
  .seg { display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.75rem; color: white; white-space: nowrap; overflow: hidden; }
  .seg.employed { background: var(--primary); }
  .seg.queue { background: #df2a5d; opacity: 0.85; }
  .caption { font-family: var(--font-main); font-size: 0.88rem; line-height: 1.5; color: #5a6672; margin: 0.6rem 0 0 0; }
</style>