<script>
  /*
    The hook. Three instruments, one quantity. The toggle picks the
    instrument; the output line on the chart does not move; the money bar
    below changes only its label — the treasury's take, the polluters'
    grandfathered rent, or the payment a bargain extracts. Same 384, three
    pockets.
  */
  import { instruments, q0, qSocial, E } from "../externality.js";
  import { clampW } from "../chart.js";
  import { SERIES } from "../palette.js";

  const INST = [
    { key: "tax", label: "tax at e = 12", pocket: "the treasury's 384 of revenue" },
    { key: "quota", label: "quota at 32", pocket: "the polluters' 384 of rent" },
    { key: "bargain", label: "the town buys them down", pocket: "a payment of 384, either way" },
  ];

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));

  let sel = $state(0);
  let inst = $derived(INST[sel]);
  let money = $derived(instruments());

  let readout = $derived(
    `All three instruments land on exactly ${money.quantity} units of output — the same quantity as the optimum — and they all move the same ${money.taxRevenue.toFixed(0)} of money. What the choice changes is who holds it.`
  );
</script>

<div class="fig" id="instrument-lab">
  <div class="measure" bind:clientWidth={boxWidth}></div>

  <p class="fig-title">{readout}</p>

  <div class="controls">
    <div class="presets" role="group" aria-label="Choose an instrument">
      {#each INST as i, k}
        <button class="pick" class:active={sel === k} onclick={() => (sel = k)}>{i.label}</button>
      {/each}
    </div>
  </div>

  <div class="bars">
    <div class="bar-row">
      <span class="bar-name">output delivered</span>
      <div class="bar-track">
        <div class="bar out" style:width={`${(money.quantity / (q0 * 1.05)) * 100}%`}></div>
        <span class="bar-mark laissez" style:left={`${(q0 / (q0 * 1.05)) * 100}%`}></span>
        <span class="bar-value">{money.quantity} units</span>
      </div>
    </div>
    <div class="bar-row">
      <span class="bar-name">{inst.pocket.split(" ")[0]}…</span>
      <div class="bar-track">
        <div class="bar money" style:width={`${(money.taxRevenue / 420) * 100}%`}></div>
        <span class="bar-value">{money.taxRevenue.toFixed(0)} moved</span>
      </div>
    </div>
  </div>
  <p class="pocket">{inst.pocket} — and the quantity is {money.quantity} either way, exactly where the optimum sits ({qSocial}), {q0 - qSocial} units down from laissez-faire.</p>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
  .measure { width: 100%; height: 0; }
  .fig-title { font-family: var(--font-main); font-size: 0.95rem; margin: 0 0 0.6rem 0; color: var(--squidink); }
  .controls { display: flex; flex-wrap: wrap; gap: 6px 18px; margin: 0 0 0.8rem 0; }
  .presets { display: flex; flex-wrap: wrap; gap: 6px; }
  .pick { font-family: var(--font-mono); font-size: 0.78rem; padding: 5px 10px; border: 1px solid #c7cdd4; border-radius: 4px; background: white; color: var(--squidink); cursor: pointer; }
  .pick.active { border-color: var(--primary); color: var(--primary); font-weight: 600; }
  .bars { display: flex; flex-direction: column; gap: 10px; margin: 0.4rem 0 0 0; }
  .bar-row { display: flex; align-items: center; gap: 10px; }
  .bar-name { font-family: var(--font-mono); font-size: 0.72rem; color: #5a6672; width: 15ch; text-align: right; white-space: nowrap; }
  .bar-track { position: relative; flex: 1; height: 22px; background: #eef1f3; border-radius: 3px; }
  .bar { height: 100%; border-radius: 3px; }
  .bar.out { background: var(--primary); opacity: 0.8; }
  .bar.money { background: var(--pink); opacity: 0.8; }
  .bar-mark { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #8a94a2; }
  .bar-value { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-family: var(--font-mono); font-size: 0.72rem; color: white; mix-blend-mode: normal; }
  .pocket { font-family: var(--font-main); font-size: 0.9rem; color: #5a6672; margin: 0.6rem 0 0 0; }
</style>