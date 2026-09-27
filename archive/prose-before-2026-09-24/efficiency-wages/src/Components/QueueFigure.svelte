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
    `At the tangency wage of ${wStar.toFixed(0)}, the firms' staffing budget hires ${employed.toFixed(0)} of the ${WORKFORCE} — and the ${queue.toFixed(0)} waiting outside are not a disequilibrium: they are what the wage is buying.`
  );
</script>

<div class="fig" id="queue-figure">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="row">
    <div class="seg employed" style:width={`${employed}%`}>
      <span>{employed.toFixed(0)} employed</span>
    </div>
    <div class="seg queue" style:width={`${queue}%`}>
      <span>{queue.toFixed(0)} queueing at the same wage</span>
    </div>
  </div>
  <p class="note">
    Cut the wage and the queue shrinks, but so does the effort each
    employee buys — and the firm is not trying to clear this market. It is
    trying to buy effort cheaply, and the unemployed are part of the price.
  </p>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .row { display: flex; height: 44px; border-radius: 4px; overflow: hidden; }
  .seg { display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.75rem; color: white; white-space: nowrap; overflow: hidden; }
  .seg.employed { background: var(--primary); }
  .seg.queue { background: var(--pink); opacity: 0.85; }
  .note { font-family: var(--font-main); font-size: 0.9rem; color: #5a6672; margin: 0.6rem 0 0 0; }
</style>