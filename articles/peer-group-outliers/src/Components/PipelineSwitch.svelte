<script>
  /*
    One preprocessing (or scoring) choice at a time. The pills pick the
    setting, the k pills pick the number of clusters, the catch strip shows
    what the 50 alerts caught, and the table underneath shows every setting at
    this k so the reader can compare without clicking through all of them.

    options: [{ key, label, note? }]      note: a terse string shown under the strip
    get(key, k) -> { ring, struct, sales, other }
    extra(key, k) -> optional terse readout, e.g. "overlap with the default 0.54"
  */
  import CatchStrip from "./CatchStrip.svelte";

  let {
    id, title, options, ks = null, get, extra = null,
    initial = null, initialK = null, optionLabel = "setting", kLabel = "clusters k",
    showTable = true, ksLabel = null, children,
  } = $props();

  let userKey = $state(null), userK = $state(null);
  let key = $derived(userKey ?? initial ?? options[0].key);
  let k = $derived(userK ?? initialK ?? (ks ? ks[0] : null));
  let cur = $derived(get(key, k));
  let note = $derived(extra ? extra(key, k) : "");
  let rows = $derived(options.map((o) => ({ ...o, c: get(o.key, k) })));
</script>

<div class="fig pipeline-switch" {id}>
  <p class="fig-title">{title}</p>
  <div class="pills" role="group" aria-label={optionLabel}>
    <span class="ctl-label">{optionLabel}</span>
    {#each options as o}
      <button class="pill opt" class:active={key === o.key} data-key={o.key} onclick={() => (userKey = o.key)}>{o.label}</button>
    {/each}
  </div>
  {#if ks}
    <div class="pills" role="group" aria-label={kLabel}>
      <span class="ctl-label">{kLabel}</span>
      {#each ks as kk}
        <button class="pill kpill" class:active={k === kk} data-k={kk} onclick={() => (userK = kk)}>{ksLabel ? ksLabel[kk] : kk}</button>
      {/each}
    </div>
  {/if}
  <CatchStrip c={cur} />
  {#if note}<p class="readout switch-note">{note}</p>{/if}
  {#if showTable}
    <table class="data-table">
      <thead>
        <tr><th>{optionLabel}</th><th>ring</th><th>struct.</th><th>sales</th><th>others</th></tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr class:sel={r.key === key}>
            <td>{r.label}</td><td>{r.c.ring}</td><td>{r.c.struct}</td><td>{r.c.sales}</td><td>{r.c.other}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
  {#if children}<div class="caption">{@render children()}</div>{/if}
</div>
