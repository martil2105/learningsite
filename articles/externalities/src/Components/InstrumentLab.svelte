<script>
  /*
    The hook. Three instruments, one quantity. The toggle picks the
    instrument; the output line on the chart does not move; the money bar
    below changes only its label — the treasury's take, the polluters'
    grandfathered rent, or the payment a bargain extracts. Same 384, three
    pockets.
  */
  import { instruments, q0, qSocial, E } from "../externality.js";

  const money = instruments();
  const INST = [
    {
      key: "tax",
      label: `a tax of ${E}`,
      name: "tax revenue",
      amount: money.taxRevenue,
      pocket: `The plant pays ${E} a unit in tax, ${money.taxRevenue} in all, and the government keeps it.`,
    },
    {
      key: "quota",
      label: `a quota of ${qSocial}`,
      name: "quota rent",
      amount: money.quotaRent,
      pocket: `The cap lifts the price ${E} above the plant's cost, so the plant keeps ${money.quotaRent} of extra margin.`,
    },
    {
      key: "bargain",
      label: "a deal with the town",
      name: "payment",
      amount: money.bargainPayment,
      pocket: `The town holds the rights and charges the plant ${E} a unit for the damage, ${money.bargainPayment} in all.`,
    },
  ];

  let sel = $state(0);
  let inst = $derived(INST[sel]);
</script>

<div class="fig" id="instrument-lab">
  <p class="fig-title">Three ways to bring the plant down to the best output</p>

  <div class="controls">
    <div class="presets" role="group" aria-label="Choose an instrument">
      {#each INST as i, k}
        <button class="pick" class:active={sel === k} onclick={() => (sel = k)}>{i.label}</button>
      {/each}
    </div>
  </div>

  <div class="bars">
    <div class="bar-row">
      <span class="bar-name">output</span>
      <div class="bar-track">
        <div class="bar out" style:width={`${(money.quantity / (q0 * 1.05)) * 100}%`}></div>
        <span class="bar-mark laissez" style:left={`${(q0 / (q0 * 1.05)) * 100}%`}></span>
        <span class="bar-value">{money.quantity} units</span>
      </div>
    </div>
    <div class="bar-row">
      <span class="bar-name">{inst.name}</span>
      <div class="bar-track">
        <div class="bar money" style:width={`${(inst.amount / 420) * 100}%`}></div>
        <span class="bar-value">{inst.amount}</span>
      </div>
    </div>
  </div>
  <p class="pocket">{inst.pocket}</p>
  <p class="caption">
    Switch between the buttons and watch the bars. The grey mark on the output
    bar shows you where the market would stop on its own.
  </p>
</div>

<style>
  .fig { max-width: 620px; margin: 1.5rem auto; padding: 0 1rem; }
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
  .bar.money { background: #df2a5d; opacity: 0.8; }
  .bar-mark { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #8a94a2; }
  .bar-value { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-family: var(--font-mono); font-size: 0.72rem; color: white; mix-blend-mode: normal; }
  .pocket { font-family: var(--font-main); font-size: 0.9rem; color: var(--squidink); margin: 0.7rem 0 0 0; }
  .caption { font-family: var(--font-main); font-size: 0.88rem; line-height: 1.5; color: #5a6672; margin: 0.4rem 0 0 0; }
</style>