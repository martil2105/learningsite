<script>
  /* App.svelte for gini-and-the-lorenz-curve */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import ThreeRoutes from "./Components/ThreeRoutes.svelte";
  import TwoPopulations from "./Components/TwoPopulations.svelte";
  import AtkinsonFigure from "./Components/AtkinsonFigure.svelte";
  import TopShareFigure from "./Components/TopShareFigure.svelte";
  import CapFigure from "./Components/CapFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import {
    SOC_P, SOC_Q, giniPQ, lorenzTwo, atkinsonTwo, epsTie,
    TOP_G, paretoAlpha, lognormalSigma, topPareto, topLognormalExact,
    BOOK, lamB, captureShift, captureSlice,
  } from "./inequality.js";

  const pairEq = katexify("G = \\frac{\\sum_{i=1}^n \\sum_{j=1}^n |x_i - x_j|}{2 n^2 \\mu}", true);
  const lorenzAreaEq = katexify("G = \\frac{A}{A + B} = 1 - 2 \\int_0^1 L(p) \\, dp", true);
  const lognormEq = katexify("G_{\\text{lognormal}} = 2\\Phi\\left(\\frac{\\sigma}{\\sqrt{2}}\\right) - 1", true);
  const atkinsonEq = katexify("A(\\varepsilon) = 1 - \\frac{1}{\\mu} \\left( \\frac{1}{n} \\sum_{i=1}^n x_i^{1-\\varepsilon} \\right)^{\\frac{1}{1-\\varepsilon}}", true);
  const arEq = katexify("AR = 2 \\cdot AUC - 1", true);

  const pc = (v, d = 0) => (100 * v).toFixed(d);
  const money = (k) => "£" + Math.round(k * 1000).toLocaleString("en-GB");

  // The two societies
  const botP = lorenzTwo(0.3, SOC_P);
  const botQ = lorenzTwo(0.3, SOC_Q);
  const topP = 1 - lorenzTwo(0.85, SOC_P);
  const topQ = 1 - lorenzTwo(0.85, SOC_Q);
  const ratio8 = atkinsonTwo(8, SOC_P) / atkinsonTwo(8, SOC_Q);

  // Pareto and lognormal with the same Gini
  const alpha = paretoAlpha(TOP_G);
  const sig = lognormalSigma(TOP_G);
  const par1 = topPareto(0.01, alpha);
  const ratio1 = par1 / topLognormalExact(0.01, sig);
  const ratio01 = topPareto(0.001, alpha) / topLognormalExact(0.001, sig);

  // The two scorecards, at the 10% cut-off
  const cutA = captureShift(0.1);
  const cutB = captureSlice(0.1);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we've been asked to compare two countries, and we're allowed
        one number each to describe how unequal their incomes are. Most of us
        would reach for the <span class="bold">Gini coefficient</span>, which
        runs from 0, when everyone earns the same, to 1, when one person earns
        everything. It turns up in development reports, statistics releases and
        newspaper tables, and that's no surprise, because a single number is easy
        to compare.
      </p>
      <p>
        Squeezing a whole distribution into one number has to lose something,
        though. In this article, we'll work out what the Gini actually measures,
        and then build two societies that share a Gini while their poorest
        people live quite differently. Finally, we'll take the same idea into a
        bank, where a Gini is used to grade credit scorecards, and find the same
        blind spot there.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the Gini measures</h3>
      <p>
        Most first courses introduce the Gini through a picture. We line
        everyone up from poorest to richest, and for each share p of the
        population, we plot the share of total income, L(p), that the poorest p
        of people receive. That's the <span class="bold">Lorenz curve</span>,
        which Max Lorenz drew in 1905. If everyone earned the same, it would be
        the 45-degree line, which we call the <span class="bold">line of
        equality</span>. The more unequal incomes are, the further the curve
        sags below it.
      </p>
      <p>
        Let's call the area between the line of equality and the Lorenz curve A,
        and the area under the Lorenz curve B. The Gini is A as a share of the
        whole triangle under the line:
      </p>
      {@html lorenzAreaEq}
      <p>
        That's a tidy definition, but it doesn't say much about people. Corrado
        Gini's own version, from 1912, does. Let's pick two people at random and
        note the gap between their incomes. If we average that gap over every
        possible pair and divide by twice the mean income μ, we get the Gini
        again:
      </p>
      {@html pairEq}
      <p>
        So a Gini of {TOP_G.toFixed(1)} means that two people picked at random
        differ, on average, by {pc(2 * TOP_G)}% of the mean income. There's a
        third route too. The Gini is twice the covariance between each person's
        income and their rank, divided by n times the mean, which makes it a
        measure of how closely income climbs with rank.
      </p>
      <p>
        Let's try all three on a small example. Type your own list of incomes
        into the box below, and you'll see the three routes land on the same
        number every time.
      </p>
    </section>

    <ThreeRoutes />

    <section class="body-text">
      <p>
        For a few smooth distributions, the Gini also has a closed form. A
        common model for incomes is the <span class="bold">lognormal
        distribution</span>, in which the logarithm of income follows a normal
        distribution with standard deviation σ. Its Gini is
      </p>
      {@html lognormEq}
      <p>
        where Φ is the cumulative distribution function of the standard normal.
        We'll meet this formula twice more: once when we look at top incomes,
        and once, a little unexpectedly, in a bank.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Same Gini, different societies</h3>
      <p>
        Now let's build two small societies. In society P,
        {pc(SOC_P.p)}% of people earn {money(SOC_P.a)} and the other
        {pc(1 - SOC_P.p)}% earn {money(SOC_P.b)}, so the inequality sits at the
        bottom. In society Q, {pc(SOC_Q.p)}% of people earn {money(SOC_Q.a)} and
        the top {pc(1 - SOC_Q.p)}% earn {money(SOC_Q.b)}, so the inequality sits
        at the top. We've chosen Q's top income so that both societies have the
        same Gini, {giniPQ.toFixed(4)}.
      </p>
    </section>

    <TwoPopulations />

    <section class="body-text">
      <p>
        Our two Lorenz curves cross. If you follow them from the left, you can
        see that P's curve starts lower, because its poorest 30% hold only {pc(botP, 1)}% of all income, against {pc(botQ, 1)}% in Q.
        Near the top it's the other way round. Q's richest 15% hold
        {pc(topQ, 1)}% of income, while P's hold {pc(topP, 1)}%. The two gaps
        from the line of equality add up to the same area, so the Gini calls it
        a draw.
      </p>
      <p>
        So which society is more unequal? That depends on what we're worried
        about. If it's the poorest people, P looks worse, and if it's how far the
        top pulls away from everyone else, Q does.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Choosing whose incomes count most</h3>
      <p>
        Anthony Atkinson made this precise in 1970. Suppose we only use
        inequality measures that look at incomes relative to the mean, treat
        everyone alike, and agree that moving money from a richer person to a
        poorer one makes things more equal. Atkinson showed that when one Lorenz
        curve lies wholly above another, every measure like that ranks the two
        the same way. When the curves cross, we can always find two such measures
        that disagree. So any ranking of P and Q rests on a choice about whose
        incomes we weight most, and it's better to make that choice in the open.
      </p>
      <p>
        His own answer was an index with a dial on it. The dial, ε ≥ 0, is
        called <span class="bold">inequality aversion</span>, and the higher we
        set it, the more weight the index puts on the lowest incomes:
      </p>
      {@html atkinsonEq}
      <p>
        The index has a friendly reading. An Atkinson index of 0.1 means that if
        incomes were shared out equally, we could reach the same level of
        welfare with 10% less income in total. Let's use it on our two
        societies. Drag ε in the figure below and watch the verdict.
      </p>
    </section>

    <AtkinsonFigure />

    <section class="body-text">
      <p>
        If you start with a small ε, you'll find that Q comes out as more
        unequal, because the index is then most sensitive to how far the top sits
        above the mean. As we raise ε, the weight
        shifts towards the bottom, and at ε = {epsTie.toFixed(4)} the two
        societies tie. Above that, P is the more unequal one, and by ε = 8 its
        index is {ratio8.toFixed(1)} times Q's.
      </p>
      <p>
        Neither answer is wrong. They're two different views about whose incomes
        matter most. The Gini makes a choice of its own, weighting each person by
        their rank, and for P and Q it happens to land on a tie.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What the Gini misses at the top</h3>
      <p>
        The Gini has a second blind spot, and it's at the very top. If we move a
        small amount of money from a richer person to a poorer one, without
        changing their order, the Gini falls by an amount proportional to how
        many places apart they are in the ranking. In the crowded middle of a distribution, a modest income gap can
        span a great many places. In the thin upper tail, even a large gap spans
        only a few, so the Gini pays relatively little attention to what happens
        among the very richest.
      </p>
      <p>
        Let's see how much that matters. We'll compare two distributions with the
        same Gini of {TOP_G.toFixed(1)}. One is a <span class="bold">Pareto
        distribution</span>, a power law with a long, heavy upper tail, here with
        shape α = {alpha.toFixed(2)}. The other is our lognormal from earlier,
        with σ = {sig.toFixed(2)}, and its upper tail is much thinner.
      </p>
    </section>

    <TopShareFigure />

    <section class="body-text">
      <p>
        As you read down the table, you'll see that the gap is modest for the
        top 10% and wider for each smaller, richer group.
        The Pareto's richest 1% hold {pc(par1, 1)}% of all income,
        {ratio1.toFixed(1)} times the lognormal's share, and its richest 0.1%
        hold {ratio01.toFixed(1)} times as much. So if someone asks us about top
        incomes, the Gini alone can't answer, and it's worth quoting the top
        shares alongside it.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The same idea in a bank</h3>
      <p>
        Now let's take all this into a bank. Say we've built a credit scorecard
        that gives every applicant a risk score. We sort our applicants from
        riskiest to safest, and for each share of applicants we might decline,
        we plot the share of all eventual defaulters we'd catch. That curve is
        the <span class="bold">cumulative accuracy profile</span>, or CAP. It's
        a Lorenz curve turned the other way up, with defaulters in place of
        income.
      </p>
      <p>
        A scorecard that couldn't tell anyone apart would give the diagonal, and
        a perfect one would catch every defaulter before declining anyone else.
        The <span class="bold">accuracy ratio</span> (AR) is the area between our
        CAP curve and the diagonal, as a share of the same area for the perfect
        scorecard. Engelmann, Hayden and Tasche showed in 2003 that it equals
      </p>
      {@html arEq}
      <p>
        where AUC is the area under the <span class="bold">ROC curve</span>, short
        for receiver operating characteristic. The ROC curve plots the share of
        defaulters we catch against the share of good borrowers we decline. The
        area under it is the probability that a randomly chosen defaulter gets a
        riskier score than a randomly chosen good borrower. This AR is the
        number banks report as a scorecard's Gini.
        Like the income Gini, it's twice the area between a curve and the
        diagonal, in this case the ROC curve.
      </p>
      <p>
        So two scorecards can share a Gini the way two societies can. Let's build
        a pair on a book of applicants where {pc(BOOK.pi)}% of them default. Our first scorecard, A, shifts every defaulter's score up by
        one standard deviation, so it separates them a little everywhere. Its
        Gini has a closed form, 2Φ(d/√2) − 1 for a shift of d, which is the
        lognormal formula again with d in place of σ. For our shift of 1, it
        comes to {lamB.toFixed(2)}.
      </p>
      <p>
        Our second scorecard, B, picks out {pc(lamB)}% of defaulters perfectly
        and can't tell the rest from good borrowers at all. A scorecard built
        like that has a Gini equal to the share it picks out, so B's Gini is
        {lamB.toFixed(2)} too. In the chart below, you can compare the two
        curves along the whole range of cut-offs, and the dashed line marks the
        riskiest 10%.
      </p>
    </section>

    <CapFigure />

    <section class="body-text">
      <p>
        If we decline the riskiest 10% of applicants, B catches {pc(cutB, 1)}% of
        all defaulters and A catches {pc(cutA, 1)}%, a gap of
        {pc(cutB - cutA, 1)} percentage points. B couldn't do any better than
        that. With {pc(BOOK.pi)}% of applicants defaulting, a group of 10% of
        applicants can contain at most {pc(0.1 / BOOK.pi)}% of all defaulters, and B's
        riskiest {pc(lamB * BOOK.pi, 1)}% of applicants are all defaulters.
      </p>
      <p>
        Further down the list, the order flips. Once B has used up the
        defaulters it can spot, it's no better than chance, and by the time
        we've declined half our applicants, A has caught more. The curves had to
        cross somewhere. Two different CAP curves on the same applicants with the
        same Gini enclose the same area, so neither can stay above the other all
        the way along.
      </p>
      <p>
        So a scorecard's Gini tells us how well it ranks applicants overall, but
        not how well it ranks them at the cut-off where we'll make decisions.
        For that, we need the capture rate and the default rate among the
        applicants we decline, measured at the cut-off itself.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Each of our examples is built to make one point cleanly, and three of
        the simplifications are worth knowing about.
      </p>
      <p>
        First, our two societies have only two incomes each, which makes the
        crossing easy to see and easy to check. Real income distributions are
        smooth, and a crossing between their Lorenz curves can be hard to spot by
        eye. That's one more reason to report a few percentile ratios, such as
        P90/P10 and P90/P50, and the top income shares alongside the Gini.
      </p>
      <p>
        Second, a pure Pareto and a pure lognormal are both idealisations, picked
        here to have the same Gini. How much top shares differ in real data
        depends on how heavy the real upper tail is. It also matters what we
        measure: income Ginis mostly sit between about 0.3 and 0.45, while
        wealth Ginis often exceed 0.75.
      </p>
      <p>
        And finally, our scorecards are stylised. A default rate of {pc(BOOK.pi)}% is far higher than most loan books
        see, and B is an extreme design that's perfect on a slice of the
        book and no better than chance on the rest. Real scorecards sit somewhere
        in between, so the size of the gap will differ from ours. The crossing
        won't go away, though, because two different CAP curves with the same
        Gini always cross. That's why we should compare scorecards at the
        cut-off we'll actually use.
      </p>
    </section>

    <Conclusion />
    <Resources />
  </main>
</div>

<style>
  .page-wrap {
    min-height: 100vh;
  }
  /* global.css gives .body-text and .body-header 80% each on a phone, so a
     heading inside a section was indented to 64%. Inside a section it should
     line up with the paragraphs. */
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  .content-container {
    max-width: 720px;
    margin: 0 auto;
    padding: 0 1rem 4rem 1rem;
  }
</style>
