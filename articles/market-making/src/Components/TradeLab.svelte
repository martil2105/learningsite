<script>
  /*
    The hook: one day of trades, stepped by the reader. The market maker's ask
    (pink) and bid (blue) before each trade, the stock's true value (dashed),
    and each trade as a dot at the price it paid. Informed traders are ringed:
    we can see who knew, and the market maker can't. The readouts keep score
    against the true value, and the three scores always add up to zero.
  */
  import { linear } from "../scale.js";
  import AxisX from "./AxisX.svelte";
  import AxisY from "./AxisY.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { day, bid, ask, seedOf } from "../gm.js";
  import { pct } from "../format.js";

  let { width, mu = $bindable(0.1) } = $props();

  const N = 300;
  const H = 280;
  const m = { top: 12, right: 14, bottom: 44, left: 56 };
  let shown = $state(0);
  let dayNo = $state(1);
  let truth = $state("high");
  let high = $derived(truth === "high");
  let d = $derived(day(seedOf(dayNo), mu, high, N));
  let x = $derived(linear([0, N], [m.left, width - m.right]));
  const y = linear([9880, 10120], [H - m.bottom, m.top]);

  let done = $derived(d.trades.slice(0, shown));
  // quotes[i] is the quote in force before trade i + 1, for i = 0 … N
  let quotes = $derived.by(() => {
    const q = d.trades.map((t) => ({ k: t.k, bid: t.bid, ask: t.ask }));
    q.push({ k: d.kEnd, bid: bid(d.kEnd, mu), ask: ask(d.kEnd, mu) });
    return q;
  });
  let bidNow = $derived(quotes[shown].bid);
  let askNow = $derived(quotes[shown].ask);
  let last = $derived(shown > 0 ? d.trades[shown - 1] : { mm: 0, inf: 0, unf: 0 });

  const line = (key) => {
    let s = "";
    for (let i = 0; i <= shown; i++) s += `${i ? "L" : "M"}${x(i).toFixed(2)},${y(quotes[i][key]).toFixed(2)}`;
    return s;
  };
  let askPath = $derived(line("ask"));
  let bidPath = $derived(line("bid"));

  const money = (c) => "$" + (c / 100).toFixed(2);
  const signed = (c) => (Math.abs(c) < 0.5 ? "$0.00" : (c > 0 ? "+" : "−") + "$" + (Math.abs(c) / 100).toFixed(2));
  const step = (n) => (shown = Math.min(N, shown + n));
  const restart = () => (shown = 0);
  const another = () => { dayNo += 1; shown = 0; };
</script>

<div class="controls">
  <Segmented label="What the stock is really worth" id="tl-v" bind:value={truth} options={[{ value: "high", label: "$101" }, { value: "low", label: "$99" }]} />
  <Slider label="Share of traders who know" id="tl-mu" min={0.01} max={0.5} step={0.01} bind:value={mu} format={(v) => pct(+v, 0)} width={220} />
</div>
<div class="buttons" id="tl-buttons">
  <button type="button" data-b="one" onclick={() => step(1)} disabled={shown >= N}>One trade</button>
  <button type="button" data-b="ten" onclick={() => step(10)} disabled={shown >= N}>Ten more</button>
  <button type="button" data-b="all" onclick={() => step(N)} disabled={shown >= N}>Run to {N}</button>
  <button type="button" data-b="restart" onclick={restart}>Start again</button>
  <button type="button" data-b="another" onclick={another}>Another day</button>
</div>

<svg {width} height={H} viewBox="0 0 {width} {H}" role="img" aria-label="The market maker's bid and ask, trade by trade" class="trade-panel" data-shown={shown}>
  <AxisY scale={y} ticks={[9900, 9950, 10000, 10050, 10100]} x0={m.left} x1={width - m.right} format={(v) => "$" + (v / 100).toFixed(v % 100 ? 1 : 0)} />
  <AxisX scale={x} ticks={[0, 50, 100, 150, 200, 250, 300]} y={H - m.bottom} title="trades" />
  <line class="truth" x1={m.left} x2={width - m.right} y1={y(d.V)} y2={y(d.V)} stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="6 4" />
  {#if shown > 0}
    <path class="ask-line" d={askPath} fill="none" stroke="var(--c2)" stroke-width="2" />
    <path class="bid-line" d={bidPath} fill="none" stroke="var(--c1)" stroke-width="2" />
    {#each done as t (t.t)}
      <circle class="trade {t.buy ? 'buy' : 'sell'} {t.informed ? 'informed' : 'random'}" cx={x(t.t - 0.5)} cy={y(t.price)} r={t.informed ? 3.6 : 2.2}
        fill={t.buy ? "var(--c2)" : "var(--c1)"} stroke={t.informed ? "var(--ink)" : "none"} stroke-width="1.4" />
    {/each}
  {:else}
    <line class="ask-start" x1={x(0)} x2={x(6)} y1={y(askNow)} y2={y(askNow)} stroke="var(--c2)" stroke-width="2" />
    <line class="bid-start" x1={x(0)} x2={x(6)} y1={y(bidNow)} y2={y(bidNow)} stroke="var(--c1)" stroke-width="2" />
  {/if}
</svg>
<p class="legend">
  <span class="key"><span class="swatch" style="background:var(--c2)"></span>ask</span>
  <span class="key"><span class="swatch" style="background:var(--c1)"></span>bid</span>
  <span class="key"><span class="swatch dashed"></span>what it's really worth</span>
  <span class="key"><span class="ring"></span>a trader who knew</span>
</p>

<div class="readouts">
  <Readout id="tl-r-day" label="Day" value={String(dayNo)} />
  <Readout id="tl-r-n" label="Trades so far" value={String(shown)} />
  <Readout id="tl-r-bid" label="Bid" value={money(bidNow)} color="var(--c1)" />
  <Readout id="tl-r-ask" label="Ask" value={money(askNow)} color="var(--c2)" />
  <Readout id="tl-r-spread" label="Spread" value={(askNow - bidNow).toFixed(1) + "¢"} />
  <Readout id="tl-r-unf" label="Traders who didn't know" value={signed(last.unf)} />
  <Readout id="tl-r-inf" label="Traders who knew" value={signed(last.inf)} />
  <Readout id="tl-r-mm" label="The market maker" value={signed(last.mm)} />
</div>

<style>
  .buttons { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 0.8rem 0; }
  .buttons button { font: inherit; font-size: 0.82rem; border: 1px solid #cfd3db; background: white; color: var(--ink-soft); padding: 5px 12px; border-radius: 999px; cursor: pointer; }
  .buttons button:disabled { opacity: 0.45; cursor: default; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 0.8rem; color: var(--muted); margin: 0.4rem 0 0; }
  .key { display: inline-flex; align-items: center; gap: 6px; }
  .swatch { display: inline-block; width: 16px; height: 3px; }
  .swatch.dashed { background: repeating-linear-gradient(90deg, var(--ink) 0 5px, transparent 5px 8px); }
  .ring { display: inline-block; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--ink); background: var(--c2); }
</style>
