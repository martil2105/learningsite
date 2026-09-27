<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import WedgeLab from "./Components/WedgeLab.svelte";
  import DriftFigure from "./Components/DriftFigure.svelte";
  import LafferFigure from "./Components/LafferFigure.svelte";
  import katexify from "./katexify.js";

  const wedgeEq = katexify(`p_c - p_p = t, \\qquad q = A - B\\,p_c = C + S\\,p_p`, true);
  const shareEq = katexify(`\\text{consumer share} = \\frac{S}{B + S}`, true);
  const dwlEq = katexify(`\\text{DWL} = \\tfrac{1}{2}\\,t^2\\,\\frac{B\\,S}{B + S}`, true);
  const peakEq = katexify(`t^* = \\frac{q_0\\,(B + S)}{2\\,B\\,S}`, true);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      A government wants a pound a unit from some market, and it has a
      bureaucratic choice to make: collect it from the sellers as they ship,
      or collect it from the buyers as they buy. Someone has to write the
      cheque, and the two options produce different paperwork, different
      compliance costs and, most people assume, different prices. In the
      textbook market they produce different — let's put a number on it —
      nothing at all.
    </p>
    <p>
      The market we'll use is the smallest one that can carry the argument:
      straight-line demand and supply, a per-unit tax, and a wedge between
      the price buyers pay and the price sellers keep:
    </p>
    <p class="eq">{@html wedgeEq}</p>
    <p>
      Our market has buyers paying 20 for 60 units when there's no tax. Keep
      that pair in mind, because the tax is going to move both of them, and
      the way they move is the whole subject.
    </p>
  </section>

  <WedgeLab />

  <section class="body-text">
    <h3 class="body-header">What the statute can't touch</h3>
    <p>
      Flip the toggle and watch what happens: a different curve moves, the
      diagram changes, and every number stays put. Buyers pay the same,
      sellers keep the same, the same trades happen. It has to be so — the
      statute changes who mails the cheque, and the wedge only cares about
      its size — but it's worth seeing that the invariance is exact, not
      approximate. The two routes were computed by shifting different curves
      through different algebra, and they agree to fourteen decimal places
      at every rate we tried.
    </p>
    <p>
      What the statute also can't touch is who bears the burden. With our
      slopes, buyers bear 40% of every unit and sellers 60%, at every rate
      the slider can reach. For the straight-line market the share has a
      clean exact form,
    </p>
    <p class="eq">{@html shareEq}</p>
    <p>
      which you can read as: the side whose curve is flatter — the side that
      can more easily walk away — bears less. Tax the side that cannot move
      and it bears everything. That's incidence: the law writes the cheque,
      and the elasticities cash it.
    </p>
  </section>
  <section class="body-text">
    <h3 class="body-header">The rule is a first-order rule</h3>
    <p>
      There's a catch hiding in that clean formula, and it's the catch most
      treatments skip. The share S/(B+S) is exact for a straight-line market
      at <em>every</em> rate. But straight lines are a special case, and in
      any other market the elasticity-ratio rule everyone quotes —
      <span class="mono">εs/(εs+εd)</span> — is only a first-order
      approximation: true for an infinitesimal tax, drifting away from the
      truth as the rate grows. Below, the dotted line is what the textbook
      formula promises and the dots are what bisecting the wedge actually
      delivers, in a market where both curves have constant elasticities.
    </p>
    <p>
      Two honest observations about the drift. It always points the same way
      in every case we tried, so the rule errs systematically, not randomly.
      And it is small exactly where policy lives: at rates under a few
      percent the textbook rule is fine, which is why it survives — the
      regions where it fails badly are the regions nobody should be taxing
      anyway.
    </p>
  </section>

  <DriftFigure />

  <section class="body-text">
    <h3 class="body-header">The rate that raises the most</h3>
    <p>
      Revenue against the rate is a parabola: nothing at a zero tax, nothing
      at a prohibitive one, and a peak in between. For the straight-line
      market the peak has an exact address,
    </p>
    <p class="eq">{@html peakEq}</p>
    <p>
      and the two facts waiting there are the part the incidence story never
      mentions. At the revenue-maximising rate, quantity is exactly half of
      what it was without the tax — half the trades that would have happened
      don't — and the deadweight loss is exactly half the revenue collected.
      Neither number depends on the elasticities at all; switch between the
      markets below and watch both readouts stay at 50.0%. Every pound the
      peak raises was bought with a pound of destroyed surplus, and the tax
      that costs the least per pound raised is always the small one, because
    </p>
    <p class="eq">{@html dwlEq}</p>
    <p>
      the loss grows with the <em>square</em> of the rate: doubling the rate
      quadruples the waste. Split one big tax into two small ones and you've
      burned less than half as much value to raise the same take.
    </p>
  </section>

  <LafferFigure />

  <section class="body-text">
    <h3 class="body-header">What this diagram costs you</h3>
    <p>
      First, statutory irrelevance assumes both sides face the same prices
      and behave on them. Tax <em>salience</em> breaks that: people respond
      to the tax they can see, and who presents the price changes behaviour,
      not just paperwork.
    </p>
    <p>
      Second, everything here is a competitive market with no market power.
      With a single seller the incidence arithmetic becomes pass-through,
      which can exceed 100% — see the markup article for that machinery.
    </p>
    <p>
      Third, "who cannot move" is a horizon question. The same base is
      nearly immobile this year and quite mobile over a decade, as capital
      walks and entries respond, so a short-run incidence answer is not a
      long-run one.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">In one sentence</h3>
    <p>
      The cheque is theatre; the elasticities set the split; the split rule
      is exactly true only in a straight line and only to first order
      elsewhere; and at the rate that raises the most money, half the trades
      are already gone and half the take is burning. Thanks for reading!
    </p>
  </section>

  <section class="body-text" id="resources">
    <h3 class="body-header">Sources and further reading</h3>
    <p>
      CORE Econ, <em>The Economy 2.0: Microeconomics</em> (2023), Unit 8 —
      the wedge and the elasticity rule. Theirs: the market and the
      burden-splitting rule. Harberger (1964) on measuring the triangle;
      Weyl and Fabinger (2013) on pass-through and incidence as first-order
      objects; Chetty, Looney and Kroft (2009) on salience — <strong>verify
      each before relying on it.</strong> Ours: the two-route invariance,
      the drift measurement, the half-and-half peak identity over 280,000
      random markets, and every number, all computed from
      <span class="mono">src/market.js</span> and asserted in
      <span class="mono">verify/check-numbers.mjs</span>.
    </p>
  </section>
</main>

<style>
  main {
    display: block;
  }
</style>