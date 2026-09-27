<script>
  /*
    The investigator's card for one alert. Each feature's bar is its share of
    the squared distance to the peer group's centroid, and the bars add up to
    the whole. The peer column is the centroid turned back into kroner, which
    is a geometric-type average rather than the arithmetic one. The last line is
    the smallest single change that would take the customer out of the 50.
  */
  import P from "../precomputed.js";
  import { FEATURES, FEATURE_LABELS } from "../bank.js";
  import { clampW } from "../chart.js";

  const EX = P.VI.examples;
  const TAGS = { ring: "a ring member", sale: "a house sale", cash: "a cash user", abroad: "a big sender abroad" };
  let ei = $state(0);
  let mode = $state("terms");
  let e = $derived(EX[ei]);
  let vals = $derived(mode === "terms" ? e.terms : e.shapReassign);
  let d2 = $derived(e.terms.reduce((s, v) => s + v, 0));
  let t2 = P.VI.t * P.VI.t;
  let vmax = $derived(Math.max(...e.terms, ...e.shapReassign.map(Math.abs)));

  let boxWidth = $state(320);
  let W = $derived(clampW(boxWidth));
  let narrow = $derived(W < 520);
  const n = (v) => v.toLocaleString("en-GB");
  let fixes = $derived(
    e.fix.map((v, j) => (v === null ? null : `${FEATURE_LABELS[FEATURES[j]]} from ${n(e.raw[j])} to ${n(Math.round(v * 10) / 10)}`)).filter(Boolean)
  );
  let cf = $derived(
    fixes.length
      ? `One change on its own would clear this alert: ${fixes.join(", or ")}.`
      : `No single feature can clear this alert; it takes a change in more than one.`
  );
  let head = $derived(`squared distance ${d2.toFixed(2)} against a threshold of ${t2.toFixed(2)} (the 50th largest)`);
</script>

<div class="fig why-customer" id="why-customer">
  <p class="fig-title">Why this customer? One alert, feature by feature</p>
  <div class="pills">
    <span class="ctl-label">alert</span>
    {#each EX as x, i}
      <button class="pill ex" class:active={ei === i} data-tag={x.tag} onclick={() => (ei = i)}>{TAGS[x.tag]}</button>
    {/each}
  </div>
  <div class="pills">
    <span class="ctl-label">bars show</span>
    <button class="pill mode" class:active={mode === "terms"} onclick={() => (mode = "terms")}>distance terms</button>
    <button class="pill mode" class:active={mode === "shap"} data-mode="shap" onclick={() => (mode = "shap")}>Shapley, re-assigning</button>
  </div>
  <div class="svg-wrap" bind:clientWidth={boxWidth}>
    <table class="data-table why-table">
      <thead><tr><th>feature</th><th>this customer</th><th>{narrow ? "peers" : "peer centroid"}</th><th class="bar-col">share of d²</th></tr></thead>
      <tbody>
        {#each FEATURES as f, j}
          <tr>
            <td>{FEATURE_LABELS[f]}</td>
            <td class="num">{n(e.raw[j])}</td>
            <td class="num">{n(e.peer[j])}</td>
            <td class="bar-col">
              <span class="tbar" style="width: {Math.max(0, (100 * Math.abs(vals[j])) / vmax)}%" class:neg={vals[j] < 0} data-v={vals[j]}></span>
              <span class="tval">{vals[j].toFixed(2)}</span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="readout why-head">{head}</p>
  <p class="verdict why-cf">{cf}</p>
</div>

<style>
  .why-table td.num { font-family: var(--font-mono); text-align: right; }
  .bar-col { width: 38%; white-space: nowrap; }
  .tbar { display: inline-block; height: 10px; background: #2074d5; border-radius: 2px; vertical-align: middle; max-width: 62%; }
  .tbar.neg { background: #df2a5d; }
  .tval { font-family: var(--font-mono); font-size: 0.78rem; margin-left: 4px; }
</style>
