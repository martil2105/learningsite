<script>
  /*
    The readout every figure in the article shares: how many of each planted
    group made it into the 50 alerts, and how many alerts went to everyone
    else. A reader learns to read it once and then reads it forty times.
  */
  import { PLANTED } from "../bank.js";

  let { c, compact = false } = $props();

  let chips = $derived([
    { cls: "ring", label: "mule ring", n: c.ring, of: PLANTED.mules },
    { cls: "struct", label: "structurers", n: c.struct, of: PLANTED.struct },
    { cls: "sales", label: "house sales", n: c.sales, of: PLANTED.extreme },
  ]);
</script>

<div class="catch-strip" class:compact>
  {#each chips as ch}
    <div class="chip {ch.cls}" data-n={ch.n} data-of={ch.of}>
      <span class="chip-label">{ch.label}</span>
      <span class="chip-value">{ch.n}<span class="of">/{ch.of}</span></span>
      <span class="chip-bar"><span class="chip-fill" style="width: {(100 * ch.n) / ch.of}%"></span></span>
    </div>
  {/each}
  <div class="chip other" data-n={c.other}>
    <span class="chip-label">everyone else</span>
    <span class="chip-value">{c.other}&nbsp;<span class="of">alerts</span></span>
    <span class="chip-bar"><span class="chip-fill" style="width: {Math.min(100, (100 * c.other) / 50)}%"></span></span>
  </div>
</div>

<style>
  .catch-strip {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    margin: 0.4rem 0 0.6rem 0;
  }
  @media screen and (max-width: 560px) {
    .catch-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  .chip {
    background: #fff;
    border: 1px solid #e0e5e8;
    border-radius: 6px;
    padding: 5px 8px 6px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .chip-label {
    font-family: var(--font-main);
    font-size: 0.72rem;
    color: #61707d;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chip-value {
    font-family: var(--font-mono);
    font-size: 1.05rem;
    color: var(--squid-ink);
  }
  .compact .chip-value {
    font-size: 0.95rem;
  }
  .of {
    font-size: 0.75rem;
    color: #8a94a2;
  }
  .chip-bar {
    display: block;
    height: 4px;
    background: #eef1f3;
    border-radius: 2px;
    overflow: hidden;
  }
  .chip-fill {
    display: block;
    height: 100%;
    transition: width 200ms ease;
  }
  .ring .chip-fill { background: #df2a5d; }
  .struct .chip-fill { background: #2074d5; }
  .sales .chip-fill { background: #2f7d32; }
  .other .chip-fill { background: #8a94a2; }
</style>
