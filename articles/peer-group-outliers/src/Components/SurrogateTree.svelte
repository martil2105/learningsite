<script>
  /*
    A decision tree fitted to predict each customer's peer group from their
    features in kroner, so the groups can be described in rules. Pick a depth
    to read its rules; the bars show how often a tree of each depth agrees with
    k-means.
  */
  import P from "../precomputed.js";
  import { FEATURES, FEATURE_LABELS } from "../bank.js";

  let depth = $state(2);
  let rules = $derived(P.VI.trees[depth]);
  const n = (v) => v.toLocaleString("en-GB");
  const cond = ([q, op, s]) => `${FEATURE_LABELS[FEATURES[q]]} ${op === "<" ? "under" : "at least"} ${n(s)}`;
  let lines = $derived(rules.map((r) => ({ text: r.conds.map(cond).join(" and "), leaf: r.leaf, n: r.n })));
  let missing = $derived([0, 1, 2, 3, 4].filter((c) => !rules.some((r) => r.leaf === c)));
</script>

<div class="fig surrogate-tree" id="surrogate-tree">
  <p class="fig-title">Describing the five peer groups with a small decision tree</p>
  <div class="pills">
    <span class="ctl-label">tree depth</span>
    {#each [1, 2, 3] as d}
      <button class="pill depth" class:active={depth === d} onclick={() => (depth = d)}>{d}</button>
    {/each}
  </div>
  <ol class="rule-list">
    {#each lines as l}
      <li class="rule-label"><span class="rule-if">{l.text}</span> → <b>group {l.leaf + 1}</b> <span class="rule-n">({n(l.n)} customers)</span></li>
    {/each}
  </ol>
  <p class="readout tree-fid">agrees with k-means for {(P.VI.fidelity[depth - 1] * 100).toFixed(1)}% of customers{missing.length ? ` · never predicts group ${missing.map((c) => c + 1).join(" or ")}` : ""}</p>
  <div class="fid-bars">
    {#each P.VI.fidelity as f, i}
      <div class="fid-row" class:sel={i + 1 === depth}>
        <span class="fid-label">depth {i + 1}</span>
        <span class="fid-bar"><span style="width: {f * 100}%"></span></span>
        <span class="fid-val">{(f * 100).toFixed(1)}%</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .rule-list { font-family: var(--font-main); font-size: 0.86rem; line-height: 1.45; padding-left: 1.3rem; margin: 0.4rem 0; }
  .rule-n { color: #8a94a2; font-size: 0.8rem; }
  .fid-bars { display: flex; flex-direction: column; gap: 4px; margin-top: 0.4rem; }
  .fid-row { display: grid; grid-template-columns: 70px 1fr 56px; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 0.78rem; }
  .fid-bar { background: #eef1f3; height: 10px; border-radius: 2px; overflow: hidden; }
  .fid-bar span { display: block; height: 100%; background: #8a94a2; }
  .fid-row.sel .fid-bar span { background: #2074d5; }
</style>
