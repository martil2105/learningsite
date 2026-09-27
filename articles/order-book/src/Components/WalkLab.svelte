<script>
  import BookChart from "./BookChart.svelte";
  import Slider from "./Slider.svelte";
  import Segmented from "./Segmented.svelte";
  import Readout from "./Readout.svelte";
  import { book, walk, shareOfWalk, roundTrip, SHAPES, MID, BEST_ASK, LEVELS } from "../book.js";
  import { thousands } from "../format.js";

  let { width, shape = $bindable("flat"), q = $bindable(5000) } = $props();

  let res = $derived(walk(book(shape, 400).asks, q));
  let share = $derived(shareOfWalk("buy", res));
  let rt = $derived(roundTrip(shape, q));
  const dollars3 = (c) => "$" + (c / 100).toFixed(3);
  const cents = (c) => c.toFixed(c < 10 ? 2 : 1) + "¢";
  let wholeLevels = $derived(res.fills.every((f) => f.full));
</script>

<div class="controls">
  <Segmented label="Shape of the book" id="shape" bind:value={shape}
    options={Object.entries(SHAPES).map(([k, s]) => ({ value: k, label: s.label }))} />
  <Slider label="Market buy (shares)" id="q" min={100} max={15000} step={100} bind:value={q} format={thousands} width={260} />
</div>
<BookChart {width} {shape} buyQ={q} />
<div class="readouts" id="walk-readouts">
  <Readout id="r-levels" label="Price levels used" value={res.fills.length} />
  <Readout id="r-last" label="Last price hit" value={"$" + (res.last / 100).toFixed(2)} />
  <Readout id="r-avg" label="Average price" value={dollars3(res.avg)} />
  <Readout id="r-cost" label="Cost per share above mid" value={cents(res.avg - MID)} />
  <Readout id="r-share" label="Average, share of the way to last" value={res.fills.length > 1 ? (100 * share).toFixed(1) + "%" : "n/a"} color="var(--ink)" />
  <Readout id="r-rt" label="Buy and sell straight back" value={cents(rt) + " a share"} />
</div>
<p class="lab-note" id="lab-note">
  {#if res.fills.length < 2}
    The whole order fits at the best ask, so it doesn't walk at all.
  {:else if wholeLevels}
    This order clears whole levels, so the share sits on the rule for this shape.
  {:else}
    The last level is only partly used, which moves the share off the rule. Try a size that clears whole levels.
  {/if}
</p>

<style>
  .lab-note { font-size: 0.82rem; color: var(--muted); margin: 8px 0 0; }
</style>
