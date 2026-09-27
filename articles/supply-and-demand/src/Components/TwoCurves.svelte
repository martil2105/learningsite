<script>
  /*
    TwoCurves.svelte
    Setup band: two curves, one crossing, shift buttons that move one curve
    and walk the crossing along the other.
  */
  import { A, B, C, S, p0, q0, clearMarket } from "../market.js";
  import MarketPanel from "./MarketPanel.svelte";

  let shiftD = $state(0);
  let shiftS = $state(0);
  let trail = $state([{ p: p0, q: q0, type: "base" }]);

  let curMkt = $derived({
    A: A + shiftD,
    B,
    C: C + shiftS,
    S
  });

  let curEq = $derived(clearMarket(shiftD, shiftS));

  function setShift(dVal, sVal, label) {
    shiftD = dVal;
    shiftS = sVal;
    const eq = clearMarket(dVal, sVal);
    trail = [...trail, { p: eq.p, q: eq.q, label }];
  }

  function reset() {
    shiftD = 0;
    shiftS = 0;
    trail = [{ p: p0, q: q0, label: "Initial" }];
  }
</script>

<div class="figure-wrap" id="two-curves">
  <div class="card-header">
    <h3 class="figure-title">Moving one curve at a time</h3>
    <p class="figure-desc">
      Before we look at a whole cloud of transactions, let's watch a single crossing move. Use the buttons to shift one curve: when only demand shifts, the crossing slides along the fixed supply curve, and when only supply shifts, it slides along the fixed demand curve.
    </p>
  </div>

  <div class="controls-bar">
    <button class="pill" class:active={shiftD === 24 && shiftS === 0} onclick={() => setShift(24, 0, "Demand shift")}>
      Shift demand (+24)
    </button>
    <button class="pill" class:active={shiftD === -24 && shiftS === 0} onclick={() => setShift(-24, 0, "Demand drop")}>
      Shift demand (−24)
    </button>
    <button class="pill" class:active={shiftS === 20 && shiftD === 0} onclick={() => setShift(0, 20, "Supply shift")}>
      Shift supply (+20)
    </button>
    <button class="pill" class:active={shiftS === -20 && shiftD === 0} onclick={() => setShift(0, -20, "Supply drop")}>
      Shift supply (−20)
    </button>
    <button class="pill reset" onclick={reset}>Reset</button>
  </div>

  <div class="panel-container">
    <MarketPanel
      mkt={curMkt}
      showTrueCurves={true}
      showCrossing={true}
      crossing={curEq}
      ariaLabel="Supply and demand curve shifting demonstration"
    >
      {#snippet children({ x, y })}
        <!-- Trail of previous crossings -->
        {#each trail as pt}
          <circle class="crossing-trail" cx={x(pt.q)} cy={y(pt.p)} r="4" fill="#7c5aed" fill-opacity="0.6" stroke="#fff" stroke-width="1" />
        {/each}
        <circle class="crossing-live" cx={x(curEq.q)} cy={y(curEq.p)} r="6" fill="#7c5aed" stroke="#fff" stroke-width="2" />
      {/snippet}
    </MarketPanel>
  </div>

  <div class="figure-caption">
    <p>
      Current equilibrium: price <strong>p = {curEq.p.toFixed(1)}</strong>, quantity <strong>q = {curEq.q.toFixed(1)}</strong>.
      {#if shiftD !== 0 && shiftS === 0}
        Supply stood still, so the crossing moved along the supply curve.
      {:else if shiftS !== 0 && shiftD === 0}
        Demand stood still, so the crossing moved along the demand curve.
      {:else}
        Both curves are at their base position (p₀ = 20, q₀ = 60).
      {/if}
    </p>
  </div>
</div>

<style>
  .figure-wrap {
    background: #ffffff;
    border: 3px solid var(--squidink, #232f3e);
    padding: 1.5rem;
    margin: 2.5rem 0;
  }
  .card-header {
    margin-bottom: 1rem;
  }
  .figure-title {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 0;
    margin: 0 0 0.5rem 0;
    color: var(--squidink, #232f3e);
  }
  .figure-desc {
    font-size: 0.95rem;
    line-height: 1.5;
    margin: 0;
    color: var(--squidink, #232f3e);
    opacity: 0.85;
  }
  .controls-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.2rem;
  }
  .pill {
    background: transparent;
    border: 2px solid var(--squidink, #232f3e);
    color: var(--squidink, #232f3e);
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 120ms ease;
  }
  .pill:hover,
  .pill.active {
    background: var(--squidink, #232f3e);
    color: #ffffff;
  }
  .pill.reset {
    border-color: #8a94a2;
    color: #555;
    margin-left: auto;
  }
  .panel-container {
    background: var(--paper, #f1f3f3);
    border: 1px solid #e5e9e9;
    padding: 0.75rem 0.5rem 0.25rem 0.5rem;
  }
  .figure-caption {
    margin-top: 1rem;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--squidink, #232f3e);
  }
  .crossing-live {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.25));
  }
</style>
