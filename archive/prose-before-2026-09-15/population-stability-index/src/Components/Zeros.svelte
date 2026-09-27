<script>
  /*
    The second free parameter. Worth being honest about: on a continuous score
    with quantile bins, an empty bin is rare, and the article says so rather
    than pretending otherwise. Where it bites is the other place PSI is run -
    per characteristic, on categories, where a zero can be structural.
  */
  import { PRE, num, int, pct, psiFmt } from "../experiments.js";
  import { SIGNAL, MARK, FLOOR, TICK, LABEL } from "../palette.js";

  const Z = PRE.zeros;
  const E = PRE.emptyEps;
  const risk = PRE.emptyRisk;
  const byB = (B) => risk.filter((r) => r.B === B && r.label === "-20 points");
  const newLevel = Z.levels.find((l) => l.isNew);
  const eps4 = Z.byEps.find((r) => r.eps === 1e-4).psi;
  const eps2 = Z.byEps.find((r) => r.eps === 1e-2).psi;
  const eps8 = Z.byEps.find((r) => r.eps === 1e-8).psi;
  const r180 = Z.rareEmpty.find((r) => r.N === 180);
</script>

<h2 class="sub-header">Zeros</h2>

<p class="body-text">
  A bin with nothing in it makes the logarithm infinite, so every implementation
  substitutes a small number and moves on. The usual value is
  <span class="mono">0.0001</span>. It is not a rounding convenience: the term
  diverges as the share goes to zero, so the substitute sets the size of the
  answer.
</p>

<p class="body-text">
  Start with the honest part, because it cuts against the complaint. On a
  continuous score with quantile bins, empty bins barely happen. At ten bins a
  {int(180)}-application window with a twenty-point shift produces one in
  {pct(byB(10).find((r) => r.N === 180).p, 1)} of months. You have to go to
  {int(50)} bins before it is common:
</p>

<div class="tablewrap">
  <table class="t">
    <thead>
      <tr><th>applications</th>{#each [10, 20, 50] as B}<th class="r">{B} bins</th>{/each}</tr>
    </thead>
    <tbody>
      {#each [100, 180, 300, 1000, 5000] as N}
        <tr>
          <td class="mono">{int(N)}</td>
          {#each [10, 20, 50] as B}
            <td class="r mono" class:hot={byB(B).find((r) => r.N === N).p > 0.05}>{pct(byB(B).find((r) => r.N === N).p, 1)}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="cap">Chance that at least one bin comes out empty, on a population that really has moved twenty points.</p>
</div>

<p class="body-text">
  When it does happen, though, the substitute is the whole answer. One empty bin
  out of {E.B} on {int(E.N)} applications, against a true divergence of
  {psiFmt(E.truePsi)}:
</p>

<div class="epsrow">
  {#each E.rows as r}
    <div class="ep">
      <div class="ek">ε = {r.eps.toExponential(0)}</div>
      <div class="ev">{num(r.psi, 3)}</div>
    </div>
  {/each}
  <div class="ep merged">
    <div class="ek">merge it instead</div>
    <div class="ev">{num(E.merged.psi, 3)}</div>
  </div>
</div>

<p class="body-text">
  Amber, red, or nearly four times red, from a constant chosen by whoever wrote
  the function.
</p>

<h2 class="sub-header">Where the zero is not bad luck</h2>

<p class="body-text">
  PSI is not only run on the score. The same formula goes over every input
  characteristic, one at a time, and there the bins are categories rather than
  quantiles — which changes the problem completely. A rare category can be empty
  by chance: a level holding {pct(0.008, 1)} of applications is missing entirely
  from a {int(180)}-application window {pct(r180.pRarest, 0)} of the time. And a
  <em>new</em> category has an expected share of exactly zero, which no
  substitution on the actual side can repair.
</p>

<p class="body-text">
  Here is a residential-status characteristic in the month a product change
  introduced one new code, {pct(Z.share, 1)} of applications. Nothing else about
  the characteristic moved at all — the other six levels keep their development
  shares exactly, and their contribution to PSI is
  {psiFmt(Z.withoutNew)}.
</p>

<div class="tablewrap">
  <table class="t">
    <thead>
      <tr><th>residential status</th><th class="r">development</th><th class="r">this month</th></tr>
    </thead>
    <tbody>
      {#each Z.levels as l}
        <tr class:isnew={l.isNew}>
          <td>{l.code}{l.isNew ? " — new this month" : ""}</td>
          <td class="r mono">{l.expected === 0 ? "—" : pct(l.expected, 1)}</td>
          <td class="r mono">{pct(l.actual, 1)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<div class="epsrow">
  {#each Z.byEps as r}
    <div class="ep">
      <div class="ek">ε = {r.eps.toExponential(0)}</div>
      <div class="ev">{num(r.psi, 3)}</div>
    </div>
  {/each}
  <div class="ep merged">
    <div class="ek">fold it into "other"</div>
    <div class="ev">{num(Z.merged, 3)}</div>
  </div>
</div>

<p class="body-text">
  The same month, the same characteristic, the same single change: PSI
  {num(eps2, 3)}, {num(eps4, 3)} or {num(eps8, 3)}, and
  {num(Z.merged, 3)} if the new level is folded into "other" and the report says
  so. A hundredfold range, decided by a constant that is not in the
  documentation, on a characteristic where the only thing that happened is that
  a code was added.
</p>

<p class="body-text">
  There is a right answer here and it is not a smaller epsilon. A level that did
  not exist at development time is not a distribution shift, it is a
  <span class="bold">mapping change</span>, and the honest treatment is to say
  so in words, map it to an existing level for the purpose of the comparison,
  and note the mapping in the pack. Every choice except that one is a number
  whose size was set by a default argument.
</p>

<style>
  .sub-header {
    max-width: 600px; margin: 2rem auto 0.4rem auto; text-align: left;
    font-size: 1.28rem; line-height: 1.4; font-family: var(--font-heavy); color: var(--squid-ink);
  }
  .mono { font-family: var(--font-mono, monospace); font-size: 0.95em; }
  .tablewrap { max-width: 600px; margin: 1.1rem auto; overflow-x: auto; }
  .t { border-collapse: collapse; width: 100%; font-family: var(--font-main); font-size: 0.86rem; }
  .t th { text-align: left; font-weight: 700; font-size: 0.7rem; color: #718096; border-bottom: 1px solid #cbd5e0; padding: 0.3rem 0.5rem 0.3rem 0; }
  .t td { padding: 0.26rem 0.5rem 0.26rem 0; color: var(--squid-ink); border-bottom: 1px solid #eef1f5; }
  .t .r { text-align: right; padding-right: 0; }
  .t .mono { font-family: var(--font-mono, monospace); font-size: 0.94em; }
  .t .hot { color: #df2a5d; font-weight: 600; }
  .t tr.isnew td { background: rgba(223, 42, 93, 0.07); }
  .cap { font-family: var(--font-main); font-size: 0.72rem; color: #718096; margin: 0.35rem 0 0 0; line-height: 1.45; }

  .epsrow {
    max-width: 640px; margin: 1rem auto; display: flex; flex-wrap: wrap;
    gap: 0.4rem; justify-content: center; padding: 0 0.75rem;
  }
  .ep {
    border: 1px solid #e2e8f0; border-radius: 4px; padding: 0.35rem 0.55rem;
    background: var(--white); text-align: center; min-width: 74px;
  }
  .ep.merged { border-color: #2074d5; }
  .ek { font-family: var(--font-mono, monospace); font-size: 0.66rem; color: #718096; white-space: nowrap; }
  .ev { font-family: var(--font-heavy); font-size: 1.05rem; color: var(--squid-ink); }
  .ep.merged .ev { color: #2074d5; }

  @media screen and (max-width: 950px) {
    .sub-header { max-width: 80%; font-size: 1.18rem; }
    .tablewrap { max-width: 84%; }
    .epsrow { padding: 0 0.5rem; }
  }
</style>
