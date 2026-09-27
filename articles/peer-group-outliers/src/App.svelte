<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import CatchStrip from "./Components/CatchStrip.svelte";
  import PipelineSwitch from "./Components/PipelineSwitch.svelte";
  import SeriesFigure from "./Components/SeriesFigure.svelte";
  import MatrixFigure from "./Components/MatrixFigure.svelte";
  import FeatureBars from "./Components/FeatureBars.svelte";
  import FeatureShape from "./Components/FeatureShape.svelte";
  import RingLab from "./Components/RingLab.svelte";
  import KCriteria from "./Components/KCriteria.svelte";
  import SeedStrip from "./Components/SeedStrip.svelte";
  import WhyThisCustomer from "./Components/WhyThisCustomer.svelte";
  import SurrogateTree from "./Components/SurrogateTree.svelte";
  import P from "./precomputed.js";
  import * as F from "./figures.js";
  import katexify from "./katexify.js";

  const objective = katexify(`\\min_{C_1,\\dots,C_k}\\ \\sum_{j=1}^{k}\\ \\sum_{i \\in C_j} \\lVert x_i - \\mu_j \\rVert^2`, true);
  const huygens = katexify(`\\underbrace{\\sum_i \\lVert x_i - \\bar x \\rVert^2}_{\\text{total}} = \\underbrace{\\sum_j \\sum_{i \\in C_j} \\lVert x_i - \\mu_j \\rVert^2}_{\\text{within (inertia)}} + \\underbrace{\\sum_j n_j \\lVert \\mu_j - \\bar x \\rVert^2}_{\\text{between}}`, true);
  const split = katexify(`\\Delta I = \\frac{n\\,m}{n + m}\\,\\lVert \\mu_R - \\mu_0 \\rVert^2`, true);
  const terms = katexify(`d_i^2 = \\lVert x_i - \\mu_{c(i)} \\rVert^2 = \\sum_{f=1}^{p} (x_{if} - \\mu_{c(i)f})^2`, true);
  const dummy = katexify(`z = \\frac{1 - p}{\\sqrt{p(1-p)}} = \\sqrt{\\frac{1-p}{p}}, \\qquad d^2(a, b) = \\frac{1}{p_a(1-p_a)} + \\frac{1}{p_b(1-p_b)}`, true);
  const meanImp = katexify(`\\operatorname{sd}_{\\text{after}} = \\sqrt{1 - q}\\ \\operatorname{sd}_{\\text{observed}}`, true);
  const logGap = katexify(`\\log(x + c) - \\log(0 + c) = \\log\\!\\Big(1 + \\frac{x}{c}\\Big)`, true);
  const quota = katexify(`\\text{alerts in cluster } j = \\lceil p\\, n_j \\rceil, \\qquad \\frac{1}{n_j}\\sum_{i \\in C_j} \\Big(\\frac{d_i}{r_j}\\Big)^2 = 1`, true);
  const shap = katexify(`\\phi_f = (x_{if} - \\mu_{c(i)f})^2`, true);
  const counter = katexify(`\\text{feature } f \\text{ alone can clear the alert} \\iff (x_{if} - \\mu_{c(i)f})^2 \\ \\ge\\ d_i^2 - t^2`, true);
  const rule3 = katexify(`(1 - \\pi)^n \\le 0.05 \\iff n \\ge \\frac{\\ln 0.05}{\\ln(1 - \\pi)} \\approx \\frac{3}{\\pi}`, true);
  const pInline = katexify(`p`);
  const kInline = katexify(`k`);
  const dInline = katexify(`d^2`);
  const tInline = katexify(`t`);
  const nm = katexify(`n\\,m/(n+m)`);

  const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Let's say we're the team that monitors transactions at a bank, and we look after its private customers:
      ordinary people with salaries, pensions, student loans and the occasional big purchase. We can't
      investigate everybody, so each month our investigators get a short list of customers to look at, and
      it's our job to choose who goes on it. A common way to do that is to sort customers into
      <span class="bold">peer groups</span>, groups of people whose accounts behave alike, and then flag
      whoever sits furthest from their peers.
    </p>
    <p>
      K-means is the usual tool for the sorting. It's simple, it's fast, and a distance to the middle of a peer
      group sounds like a natural measure of "unusual". We'll follow one bank through the whole pipeline, from
      the raw monthly data to the sentence we write for the investigator. At every step we'll ask the same
      question: does this choice change who ends up on the list? It usually does, so this is written as a
      field guide. You can read it in order, or jump to the part you need, and in most figures you can
      change the choice yourself and see what happens.
    </p>
  </section>

  <nav class="body-text contents" aria-label="Contents">
    <p class="contents-label">In this guide</p>
    <ol>
      <li><a href="#part-data">The input data</a></li>
      <li><a href="#part-prep">Preprocessing</a></li>
      <li><a href="#part-fit">Fitting and choosing k</a></li>
      <li><a href="#part-score">Scoring and thresholds</a></li>
      <li><a href="#part-test">Testing the detector</a></li>
      <li><a href="#part-explain">Explaining an alert</a></li>
    </ol>
  </nav>

  <section class="body-text">
    <h3 class="body-header">Our bank</h3>
    <p>
      Our bank is made up, and so is every customer in it. It has 5,000 ordinary private customers in five
      segments: students (13.8% of them), salaried people (51.1%), pensioners (19.3%), high earners (10.0%) and
      the self-employed (5.1%). For each customer we have six numbers a month: money in, money out, the number
      of transactions, cash paid in, money sent abroad, and the number of different people who sent them
      money.
    </p>
    <p>
      We've also hidden three groups among them, and we'll use them all the way through to see what the
      model can find. There's a <span class="bold">mule ring</span> of 20 accounts that receive money from
      many different senders (about 26 a month), pass almost all of it straight on and send 60% of it abroad.
      There are 10 <span class="bold">structurers</span>, who look like salaried customers except that they
      pay in about 38,000 kroner in cash every month. And there are 5 <span class="bold">house sales</span>:
      perfectly legitimate customers who receive a few million kroner once. That makes 5,035 customers, and our
      investigators have room for 1% of them, which is 50 alerts.
    </p>
    <p>
      Every figure in this guide ends with the same strip of four numbers, so you only have to learn to read
      it once. It shows how many of the ring, the structurers and the house sales made it onto the list of
      50, and how many alerts went to everybody else.
      A good detector fills the first two and puts the house sales on the list too, because they really are
      unusual and an investigator can clear them quickly. Here's our starting model, which takes logs of the
      six numbers, standardises them, and runs k-means with five peer groups.
    </p>
  </section>

  <div class="fig" id="baseline">
    <p class="fig-title">What our starting model puts on the list of 50</p>
    <CatchStrip c={F.baseline} />
    <p class="caption">
      You'll see this strip under every figure. The coloured bars fill as more of each planted group is
      caught, and the grey one counts alerts that went to ordinary customers.
    </p>
  </div>

  <section class="body-text">
    <p>
      It catches all five house sales and 13 of the 20 mules, and none of the structurers. We'll change one
      choice at a time and watch those numbers move. Unless a section says otherwise, the numbers come from
      one month of our bank, and each k-means fit keeps the best of ten random starts from a fixed seed, so
      they're reproducible. Where a claim needs more than one month, we'll say how many we tried.
    </p>
  </section>

  <!-- ============================================================ PART I -->
  <section class="body-text part" id="part-data">
    <h2 class="part-header">I. The input data</h2>
    <p>
      Before any clustering happens, somebody decides what a row is, who's in the table and what goes in each
      column. Those decisions shape the peer groups more than anything we do later, so that's where we'll
      start.
    </p>
    <h3 class="body-header">What a row is, and who's in the table</h3>
    <p>
      Our row is one customer in one month. That already rules out anything that happens across months, such
      as money that arrives on the 30th and leaves on the 2nd, and we'll come back to that when we look at
      aggregation windows.
    </p>
    <p>
      Who's in the table matters just as much. Every bank has dormant accounts, where almost nothing happens:
      an interest payment, perhaps, or a stray refund. Let's add 400 of them, 7.4% of the table, and see
      what happens. Switch between the two populations below, and try each value of k.
    </p>
  </section>

  <PipelineSwitch id="scope" title="The same model with and without 400 dormant accounts" {...F.scope} optionLabel="population" />

  <section class="body-text">
    <p>
      The dormant accounts don't get flagged. Instead, they get a cluster of their own, exactly 400 strong, at
      every k we tried. They also change the scaling for everyone else. On a log scale, a dormant account's
      money in sits about ten units below everybody else's, so the spread of that feature grows from 0.689 to
      2.389, a factor of 3.47. Once we divide by that spread, every active customer is squeezed towards the
      middle, and at k = 3 and k = 5 none of the five house sales is flagged any more.
    </p>
    <p>
      So the first test on any peer-group model is a scope test. Write down which accounts are in the
      population, why, and what happens to the alert list if the borderline ones are added or removed.
    </p>

    <h3 class="body-header">The shape of each feature</h3>
    <p>
      Next, let's look at the six columns one at a time. Pick a feature below, and switch between the values
      as recorded and their logarithms. You'll find that no two of them have the same shape.
    </p>
  </section>

  <FeatureShape />

  <section class="body-text">
    <p>
      Three things stand out, and each one comes back later. First, money in has a very <span class="bold">heavy
      tail</span>. Its mean is 51,437 kroner and its median is 38,346, and the five house sales alone account
      for 84.9% of its sum of squares around the mean. A z-score divides by the standard deviation, and that
      standard deviation is mostly the house sales, so the median customer ends up at a z-score of −0.125.
      Taking logs fixes most of this: the skew of money in drops from 25.72 to 0.29.
    </p>
    <p>
      Second, two features are mostly zeros. Only 10.9% of our customers pay in any cash in a month, and only
      15.3% send money abroad. Features like this are called <span class="bold">zero-inflated</span>, and
      they have a habit of deciding what the clusters are, as we'll see in the section on inertia.
    </p>
    <p>
      Third, some features are counts. The number of different senders takes only 30 distinct values in our
      month, and most customers have one or two. That means lots of exact ties, which matters for ranks and
      for anything that cuts the data at a percentile.
    </p>

    <h3 class="body-header">How long a window?</h3>
    <p>
      A month is a choice too. Let's compare our one-month rows with an average over three months. For each,
      we'll compare this period's alert list with the next period's, where "next" means the next month or the
      next three months.
    </p>
  </section>

  <PipelineSwitch id="window" title="One month versus a three-month average" {...F.windowFig} optionLabel="window" />

  <section class="body-text">
    <p>
      With one month, only about half of the alert list carries over to the next month, and at k = 8 the
      overlap is 0.39. With three-month averages it's about 0.6 at every k we tried, and the ring does better
      at k = 5, rising from 13 to 18. Longer windows smooth out the noise. They also dilute anything that
      happens once, so a longer window is a choice about which behaviour we're looking for, not just a way to
      reduce noise.
    </p>
    <p>
      One trap is worth naming. If we slide a three-month window forward one month at a time, two of its three
      months are shared with the previous window, and the overlap between consecutive lists rises to
      0.67–0.69. Part of that stability is bookkeeping rather than behaviour, so when we measure stability we
      should compare periods that don't overlap.
    </p>

    <h3 class="body-header">Missing values</h3>
    <p>
      Real data has gaps. Let's say the sender count is missing for about 15% of our customers. We'll try the
      usual fixes: fill the gap with the median or the mean, fill it with zero, fill it with the median and
      add a column that flags the gap, or drop the incomplete rows altogether. We'll also try two ways of
      being missing. In the first, the gaps fall at random, which statisticians call
      <span class="bold">missing completely at random</span>. In the second, they come from an old system
      that happens to hold half of the ring's accounts. You can switch between the fixes, and between the two
      reasons for the gaps.
    </p>
  </section>

  <PipelineSwitch id="missing" title="Five ways to fill a missing sender count, at k = 5" {...F.missing} optionLabel="fill with" kLabel="who's missing" />

  <section class="body-text">
    <p>
      Whichever fix we choose, not one mule with a missing sender count is ever flagged. That's 0 of 3 when
      the gaps are random and 0 of 10 when they come from the old system, and it held in all six other months
      we tried. The reason is simple once we see it: the ring's evidence is its sender count, and every
      imputation replaces that evidence with an ordinary value. Dropping the rows is no better, because a
      customer who isn't in the table is never scored at all.
    </p>
    <p>
      There's also a quieter effect. If a fraction {@html katexify(`q`)} of a feature is filled with the mean,
      the filled column's standard deviation shrinks by a factor of exactly the square root of
      1 − {@html katexify(`q`)}:
    </p>
    <p class="eq">{@html meanImp}</p>
    <p>
      With 15.1% missing, that factor is 0.922. After standardising, every customer who does have a value
      moves about 8.5% further from the centre on that feature, so imputation changes the weight of a feature
      as well as its values. The practical test is to ask which features carry each typology we care about,
      and then check how often those particular features are missing, and for whom.
    </p>

    <h3 class="body-header">Categorical attributes</h3>
    <p>
      Many banks add attributes such as product type or country of address. A common recipe is to turn each
      category into a 0/1 column, called <span class="bold">one-hot encoding</span>, and standardise it like
      everything else. Let's add a "foreign address" flag that 2.72% of our customers have. We've made it
      completely random, so it tells us nothing about risk.
    </p>
  </section>

  <PipelineSwitch id="category" title="Adding a yes/no attribute that has nothing to do with risk" {...F.category} optionLabel="features" />

  <section class="body-text">
    <p>
      At every k, the 137 flag holders get a cluster of their own, and they take 4, 9 and 12 of our 50
      alerts at k = 3, 5 and 8. About 45% of the alert list changes, all because of a column with no
      information in it. It happened in all six other months we tried as well.
    </p>
    <p>
      The reason is that standardising a rare 0/1 column gives the rare value a huge score. A flag held by a
      share {@html pInline} of customers becomes the value below for the holders, which is 5.98 here, while
      everyone else gets −0.17. The squared distance between two customers in different categories
      {@html katexify(`a`)} and {@html katexify(`b`)} depends only on how rare those categories are:
    </p>
    <p class="eq">{@html dummy}</p>
  </section>

  <MatrixFigure id="product-distance" title="Squared distance between customers who differ only in product" labels={F.productLabels} sets={F.productSets} scaleMax={70}>
    <p class="caption">Each cell compares two customers who are identical except for their product. If you switch to the unscaled columns, you'll see every pair at the same distance.</p>
  </MatrixFigure>

  <section class="body-text">
    <p>
      With four products held by about 60%, 31%, 7% and 2% of customers, moving between the two common ones
      costs 8.86, while moving between the two rare ones costs 65.00. So in a standardised one-hot encoding,
      <span class="bold">rarity becomes distance</span>, and being unusual in a category counts for more than
      being unusual in behaviour. If a category belongs in the model at all, it usually belongs as a way of
      splitting the population into separate peer groups, not as a column in the distance.
    </p>

    <h3 class="body-header">Data quality: own-account transfers and seasons</h3>
    <p>
      Two data-quality questions come up in every review. The first is whether transfers between a customer's
      own accounts are netted out. If they're left in, money in and money out both rise, which can look like
      money passing straight through. Let's leave them in for 5.4% of our customers.
    </p>
  </section>

  <PipelineSwitch id="internal" title="Own-account transfers netted out, or left in" {...F.internal} optionLabel="transfers" />

  <section class="body-text">
    <p>
      In our month the damage is small: those customers take between 2 and 4 of the 50 alerts, because on a
      log scale a proportional bump in two correlated features doesn't move anybody very far. It's still worth
      testing, because a model built on gross amounts or on a pass-through ratio would react much more.
    </p>
    <p>
      The second question is seasonality. Let's pretend next month is December and everyone's money in and
      money out rise by 30%. If we keep this month's scaling and centroids, the alert list overlaps with an
      ordinary month's by only 0.69 at k = 3, and high earners take 19 alerts instead of 13. If we refit
      everything on December's own data, the list doesn't change at all, because a log followed by a z-score
      cancels any change that multiplies everyone by the same amount.
    </p>
    <p>
      That second result cuts both ways. Refitting absorbs a seasonal shift, and it would absorb a real
      bank-wide change just as happily. So whichever we choose, we should monitor the inputs over time, for
      example with the <a href="../population-stability-index/">population stability index</a>, and decide
      in advance how often the scaling and the centroids are refitted.
    </p>
  </section>

  <!-- ============================================================ PART II -->
  <section class="body-text part" id="part-prep">
    <h2 class="part-header">II. Preprocessing</h2>
    <p>
      K-means only ever sees distances, so every preprocessing step is really a decision about what "far"
      means. Let's go through them in the order a pipeline usually applies them: transform, cap, scale, and
      then decide which features go in at all.
    </p>
    <h3 class="body-header">Transforms decide what we can see</h3>
    <p>
      Here are five versions of the same six features: the values as recorded, the same values capped at
      their 99th percentile, log(1 + x), log(x + 10,000), and ranks mapped onto a bell curve. Each one is then
      standardised. Try each transform at a few values of k.
    </p>
  </section>

  <PipelineSwitch id="transforms" title="The same customers under five transforms" {...F.transforms} optionLabel="transform" initial="logZ" initialK={3} />

  <section class="body-text">
    <p>
      No transform catches everything. At k = 3 the values as recorded catch 9 structurers but only 1 house
      sale. Log(1 + x) catches all the house sales and the whole ring but no structurers, and capping catches
      the ring and nothing else. You'll see the same pattern if you switch to k = 5 or 8. The lists don't just differ at the margins, either. At k = 5 the alert lists
      from the four standard transforms overlap by between 0.15 and 0.37, which means that most of the 50
      names change when we change the transform.
    </p>
    <p>
      Why does the log hide the structurers? Because of the zeros. On a log scale the step from no cash to
      3,000 kroner is 8.007 units, while the step from 3,000 to 38,000 is only 2.539. So paying in any cash at
      all looks about three times as unusual as paying in thirteen times more. In z-scores, a customer with no
      cash sits at −0.35, one with 3,000 kroner at 2.74 and a structurer at 3.72, which is barely further out
      than an ordinary cash user.
    </p>
    <p>
      The "1" in log(1 + x) is a choice we didn't know we were making. With an offset {@html katexify(`c`)},
      the step up from zero is exactly this:
    </p>
    <p class="eq">{@html logGap}</p>
    <p>
      If we raise the offset to 10,000, the step from 0 to 3,000 shrinks to 0.262, and all 10 structurers
      are caught at k = 3. The chart below moves the offset through five values.
    </p>
  </section>

  <SeriesFigure id="offset" title="What the offset in log(x + c) does to the list, at k = 3" xs={F.offsets} xAsIndex={true}
    xLabel="offset c" yLabel="caught" yMax={20}
    series={[
      { name: "mule ring (of 20)", cls: "ring", colour: "#df2a5d", ys: F.offsets.map((c) => P.II1.offsets[c][3].ring) },
      { name: "structurers (of 10)", cls: "struct", colour: "#2074d5", ys: F.offsets.map((c) => P.II1.offsets[c][3].struct) },
    ]}
    initial={10000}>
    <p class="caption">As you drag along the offsets, you'll see the structurers appear once the offset is comparable to the amounts they pay in.</p>
  </SeriesFigure>

  <section class="body-text">
    <p>
      So a transform is a choice about which typology we can detect, and it should be tested that way: plant
      the cases we care about and run each candidate transform, as we're doing here. It also shows up in the
      overlap between alert lists, which we can draw as a matrix.
    </p>
  </section>

  <MatrixFigure id="transform-overlap" title="How much the alert lists overlap between transforms, at k = 5" labels={F.transformLabels} sets={{ overlap: P.II1.J5.J }}>
    <p class="caption">Each cell is the share of names two lists have in common, out of all the names on either list.</p>
  </MatrixFigure>

  <section class="body-text">
    <h3 class="body-header">Capping and cut-offs</h3>
    <p>
      Capping, also called <span class="bold">winsorising</span>, replaces every value above a chosen
      percentile with the percentile itself. It's usually described as housekeeping. Let's sweep the cap from
      none at all down to the 95th percentile, on the values as recorded and on their logs.
    </p>
  </section>

  <PipelineSwitch id="caps" title="Where we put the cap, on the raw values and on the logs" {...F.caps} optionLabel="cap" kLabel="data, k" />

  <section class="body-text">
    <p>
      On the values as recorded, a cap at the 99.9th percentile helps: at k = 3 all five house sales are
      caught, because they no longer have enough weight to claim a cluster of their own. Tighten the cap to
      the 99.5th percentile and the structurers disappear, and at the 95th the ring goes too. At k = 5, a cap
      at the 99th percentile takes the ring from 13 to 0.
    </p>
    <p>
      The mechanism is exact rather than statistical. Every customer above the cap gets the same value, so a
      cap ties together everyone in the tail. At the 99th percentile, 51 customers share the top value of cash,
      and all 10 structurers are among them. Once they're tied, no model can tell them apart, so any typology
      rarer than the tail we cap away is gone for good.
    </p>
    <p>
      A cap based on the mean plus three standard deviations has an extra problem: the outliers set it. With
      the house sales in the data, that cap on money in is 365,168 kroner, and 10 customers are above it.
      Without them it would be 169,894, with 113 customers above it. Percentile caps don't have this problem,
      and they have a useful property: capping before or after a log gives the same result, because the log
      doesn't change the order of the values. Standardising and then clipping at 3, on the other hand, isn't
      the same as clipping at the mean plus 3 standard deviations and then standardising. In our data the two
      differ by up to 4.78 standard deviations for a single customer.
    </p>

    <h3 class="body-header">Scaling</h3>
    <p>
      After the transform, each feature is rescaled so that no single unit dominates. Let's try four scalers:
      the z-score (subtract the mean, divide by the standard deviation), the
      <span class="bold">robust scaler</span> (subtract the median, divide by the interquartile range),
      min–max (squeeze everything into 0 to 1), and ranks.
    </p>
  </section>

  <PipelineSwitch id="scalers" title="Four scalers, on the raw values and on the logs" {...F.scalers} optionLabel="scaler" />

  <section class="body-text">
    <p>
      The robust scaler is often recommended for heavy tails, and here it fails in an instructive way. Cash
      and money sent abroad are zero for more than three quarters of our customers, so their interquartile
      range is exactly zero. A popular implementation, scikit-learn's, then divides by 1 instead, which leaves
      those two features in kroner while everything else is divided by thousands. On the raw values the
      model catches all 10 structurers and none of the ring, because cash now outweighs every other feature.
    </p>
    <p>
      Min–max has the opposite problem: its range is set by the most extreme customer. On the raw values, 99%
      of our customers are squeezed into the first 5.9% of the money-in axis, because a house sale defines the
      maximum.
    </p>
    <p>
      It's also worth being precise about what the z-score promises. After it, every feature has a sum of
      squares of exactly N, so with six features the total inertia at k = 1 is exactly 6 × 5,035 = 30,210.
      "Every feature counts equally" means every feature has the same variance, and nothing more. Two
      features that measure the same thing still count twice, which is what we'll look at next.
    </p>

    <h3 class="body-header">Correlation and hidden weights</h3>
    <p>
      Here's the correlation matrix of our six logged, standardised features. You can read each cell as how closely two features move together.
    </p>
  </section>

  <MatrixFigure id="correlation" title="Correlation between the six features, after logs and z-scores" labels={F.featureLabels} sets={F.corrSets}>
    <p class="caption">If you look at the top-left pair, you'll see that money in and money out move together almost perfectly.</p>
  </MatrixFigure>

  <section class="body-text">
    <p>
      Money in and money out correlate at 0.9883, because most people spend what they earn. So "how much money
      moves through the account" enters the distance twice, and everything else once. One way to see how many
      independent directions the data really has is the <span class="bold">participation ratio</span> of the
      correlation matrix's eigenvalues, which comes out at 4.04 here. That's four effective features, not six.
    </p>
    <p>
      We can test how much the implicit weights matter by counting a feature more than once. Switch between
      the options below.
    </p>
  </section>

  <PipelineSwitch id="duplicates" title="Counting one feature twice" {...F.dups} optionLabel="features" />

  <section class="body-text">
    <p>
      Counting one feature twice changes between 28% and 48% of the alert list. Counting the sender count
      three times catches the whole ring at k = 5, which is a reminder that the weights are ours to choose.
      Nobody picks them on purpose, though. They fall out of which columns happened to be in the table.
    </p>

    <h3 class="body-header">PCA and whitening</h3>
    <p>
      A common fix for correlated features is <span class="bold">principal component analysis</span>, or PCA,
      which rotates the data onto uncorrelated directions and keeps the ones with the most variance. A usual
      rule is to keep enough components for about 90% of the variance. Let's try keeping between two and all
      six.
    </p>
  </section>

  <PipelineSwitch id="pca" title="Keeping the first few principal components (share of variance kept)" {...F.pca} optionLabel="components" initial="4" initialK={5} />

  <section class="body-text">
    <p>
      Keeping four components keeps 89.5% of the variance and takes the ring from 13 to 6 at k = 5. The chart
      below shows why: it splits the ring's average position, and the structurers', into the six components.
    </p>
  </section>

  <FeatureBars id="pca-offset" title="Where each planted group differs from the average customer, by component" labels={F.pcLabels} sets={F.pcSets} format={(v) => pct(v, 1)}>
    <p class="caption">You can switch between the two groups. A bar is that component's share of the group's squared distance from the average customer.</p>
  </FeatureBars>

  <section class="body-text">
    <p>
      18.9% of the ring's difference from an average customer lies in the fifth component, which a 90% rule
      would throw away. Variance measures how much ordinary customers differ from each other, and a typology is
      often a direction ordinary customers don't vary in. That's also the flaw in the opposite fix,
      <span class="bold">whitening</span>, which rescales every component to the same variance. The sixth
      component here has a variance of only 0.012, and it's almost exactly money in minus money out. Whitening
      stretches it by a factor of about nine. As a result, a global Mahalanobis distance favours customers whose
      outflow is a slightly unusual fraction of their inflow. On average, its 50 alerts pass on a share of their
      money that's 0.159 away from the typical 0.93, against 0.074 for everybody.
    </p>

    <h3 class="body-header">Irrelevant features</h3>
    <p>
      What if we add features that carry no information at all? Let's add between 0 and 20 columns of pure
      noise.
    </p>
  </section>

  <SeriesFigure id="noise" title="Ring members caught as we add columns of pure noise" xs={F.noiseXs} xAsIndex={true} xLabel="noise columns added" yLabel="ring caught" yMax={20}
    series={[
      { name: "k = 3", cls: "k3", colour: "#2074d5", ys: P.II6.rows.map((r) => r[3].ring) },
      { name: "k = 5", cls: "k5", colour: "#df2a5d", ys: P.II6.rows.map((r) => r[5].ring) },
    ]}>
    <p class="caption">As you drag to add noise, both lines fall, because the noise drowns out the six real features.</p>
  </SeriesFigure>

  <section class="body-text">
    <p>
      Each noise column adds about the same amount to every customer's squared distance, so the real
      differences get relatively smaller. We can measure this with the ratio of the 99th percentile of
      distances to the median. At k = 3 it falls from 2.90 with no noise to 1.41 with 20 noise columns, and at k = 5
      the ring falls from 13 to 4. So a feature that "might be useful" isn't free, and every feature in the
      model should have a reason to be there.
    </p>

    <h3 class="body-header">The feature that should have helped</h3>
    <p>
      Here's the most surprising result in this part. Our mules send 60% of their inflow abroad, and only 28
      ordinary customers send that large a share. So let's add "share of money in sent abroad" as a seventh
      feature. It's the best single description of the ring we have.
    </p>
  </section>

  <PipelineSwitch id="ratio" title="Adding the feature that best describes the ring" {...F.ratio} optionLabel="features" initial="with" initialK={5} />

  <section class="body-text">
    <p>
      It makes things worse. At k = 5 the ring falls from 13 to 3, and at k = 8 from 12 to 3. The new feature
      makes the ring very easy to describe, so k-means gives it a centroid: all 20 mules end up in one
      cluster of 168, and a centroid sitting right next to them makes them look ordinary. That's the central
      mechanism of this whole guide, and we'll look at it properly in part IV. For now it's enough to see that
      a feature can be good for describing a group and bad for flagging it.
    </p>

    <h3 class="body-header">Order of operations</h3>
    <p>
      To finish this part, let's write the pipeline down in order, because the order matters. We impute, then
      cap, then transform, then scale, and every one of those steps is fitted on a reference month and then
      applied, unchanged, to the month we're scoring. Refitting any of them on the scoring month changes what
      "unusual" means from one month to the next, as the December example showed. Some steps can swap
      places safely: a percentile cap gives the same answer before or after the log. Others can't, and
      clipping at a number of standard deviations depends on whether we standardise first. So it's worth
      writing the order into the model documentation.
    </p>
  </section>

  <!-- ============================================================ PART III -->
  <section class="body-text part" id="part-fit">
    <h2 class="part-header">III. Fitting and choosing k</h2>
    <p>
      K-means looks for {@html kInline} centroids that make the total squared distance from each customer to
      their nearest centroid as small as possible:
    </p>
    <p class="eq">{@html objective}</p>
    <p>
      It does that with Lloyd's algorithm, which alternates between assigning every customer to their nearest
      centroid and moving every centroid to the mean of its customers. Our
      <a href="../k-means/">article on k-means</a> walks through how that works and where it goes wrong. Here
      we'll look at what the fit tells us about our peer groups, and at the choices that come with it.
    </p>

    <h3 class="body-header">What inertia is, and what it splits into</h3>
    <p>
      The quantity k-means minimises is called <span class="bold">inertia</span>. It's one part of an exact
      identity: the total spread of the data around its mean splits into the spread inside the clusters,
      which is the inertia, and the spread between the clusters.
    </p>
    <p class="eq">{@html huygens}</p>
    <p>
      For our starting model the total is 30,210, of which 13,149.45 is within the clusters and 17,060.55 is
      between them. The identity holds feature by feature too, so for each feature we can ask what share of
      its spread is explained by the peer groups. That share is the feature's
      {@html katexify(`R^2`)}, and it tells us what the peer groups are really made of.
    </p>
  </section>

  <FeatureBars id="r-squared" title="How much of each feature the peer groups explain (R²)" labels={F.featureLabels} sets={F.r2Sets} initial="k = 5" setLabel="clusters">
    <p class="caption">Try a few values of k. A long bar means the peer groups are largely defined by that feature.</p>
  </FeatureBars>

  <section class="body-text">
    <p>
      At k = 5, the peer groups explain 95.8% of the variation in cash and 81.6% of the variation in money sent
      abroad, but only 15.4% of the variation in the number of senders. In other words, our peer groups are
      mostly "people who use cash" and "people who send money abroad". Those two features are the
      zero-inflated ones, and the jump from zero to anything is the biggest gap in the data. The feature that
      describes the ring hardly shapes the groups at all. That's worth knowing before we call these groups
      peers, and it's a good first check for any peer-group model.
    </p>

    <h3 class="body-header">Who owns the inertia</h3>
    <p>
      Inertia is a sum of squares, so a few extreme customers can own a lot of it. With the values as recorded,
      the five house sales hold 20.3% of the total inertia at k = 1, and the 50 most extreme customers hold
      41.3%. After logs they hold 1.1% and 5.6%. K-means puts its centroids wherever they remove the most
      inertia, so this tells us in advance where the centroids will go: without logs, one of them goes to the
      house sales.
    </p>

    <h3 class="body-header">Seeds and restarts</h3>
    <p>
      K-means starts from randomly chosen centroids and stops at the first arrangement it can't improve, so
      different starts can end in different places. Most libraries run a few starts and keep the best. Let's
      fit the same month with 40 different seeds, with one start and with ten. You can switch between the two, and between three values of k.
    </p>
  </section>

  <SeedStrip />

  <section class="body-text">
    <p>
      With one start at k = 8, the 40 seeds end in 37 different local optima, and the ring is caught anywhere
      from 0 to 20 times. Two seeds' alert lists overlap by only 0.18 in the worst case. Ten starts fix k = 5 and
      almost fix k = 8, but not k = 10, where the ring is caught 17 times by most seeds and not at all by some.
      So the seed is a model parameter. We should fix it, record it, and test how much the alert list depends
      on it.
    </p>

    <h3 class="body-header">Choosing k</h3>
    <p>
      There are several standard ways to choose k. The <span class="bold">elbow</span> looks for the bend in
      the inertia curve. The <span class="bold">Calinski–Harabasz</span> index compares the spread between
      clusters with the spread inside them. The <span class="bold">Davies–Bouldin</span> index averages how
      much each cluster overlaps its most similar neighbour. The <span class="bold">silhouette</span> compares
      each customer's distance to their own cluster with their distance to the next one. And the
      <span class="bold">gap statistic</span> compares our inertia with the inertia of data spread evenly over
      the same box. If you drag k below, you can watch all five, and the strip underneath.
    </p>
  </section>

  <KCriteria />

  <section class="body-text">
    <p>
      The elbow is sharpest at k = 2, Calinski–Harabasz and the silhouette pick 4, Davies–Bouldin picks 7, and
      the gap statistic says there are no clusters worth finding at all and picks 1. Meanwhile the ring is
      caught completely at k = 3, 12 times at k = 4, and barely at all from k = 10 up.
    </p>
    <p>
      None of the five criteria is wrong. They're answering a different question from ours: they ask how well
      k clusters describe the customers, and we want to know how well k clusters expose the customers who
      don't fit. So for a detector, k should be chosen, or at least checked, with the planted-case tests from
      part V, alongside whichever criterion we prefer.
    </p>
  </section>

  <!-- ============================================================ PART IV -->
  <section class="body-text part" id="part-score">
    <h2 class="part-header">IV. Scoring and thresholds</h2>
    <p>
      Once the peer groups exist, we need a score and a cut-off. The usual score is the distance from each
      customer to their own centroid, and the usual cut-off is "the top 1%". This is where the most important
      property of k-means as a detector shows up, so let's start there.
    </p>

    <h3 class="body-header">The ring gets its own centroid</h3>
    <p>
      The lab below draws a fresh month of our bank in just two of its features, money in and the number of
      different senders, and clusters it live. The pink dots are a mule ring, the circled dots are the 50
      alerts and the crosses are centroids. Start with a ring of 20 at k = 5, then drag the ring size up and
      down, and then do the same with k.
    </p>
  </section>

  <RingLab />

  <section class="body-text">
    <p>
      As the ring grows, its members stop being flagged. A lone mule is a long way from every centroid, so
      it's always on the list. A big ring is different, because k-means is trying to minimise the total
      squared distance, and a tight group far from everyone else contributes a lot of it. At some size it pays
      k-means to put a centroid right in the middle of the ring, and at that point every mule is close to its
      own centroid and looks perfectly ordinary.
    </p>
    <p>
      There's an exact rule for when that pays. Suppose a cluster of {@html katexify(`n`)} ordinary customers
      with mean {@html katexify(`\\mu_0`)} has absorbed a ring of {@html katexify(`m`)} customers with mean
      {@html katexify(`\\mu_R`)}. Giving the ring a centroid of its own lowers the inertia by
    </p>
    <p class="eq">{@html split}</p>
    <p>
      This is the same quantity that Ward's method of clustering uses. It grows with the ring's size and with
      the square of its distance from everyone else, and k-means will spend a centroid on the ring as soon as
      it beats what that centroid could save anywhere else. As k rises, each extra centroid saves less, so a
      smaller ring is enough. In our data that saving is 903 at k = 8 and 370 at k = 12. A rough estimate of
      the ring size that pays for a centroid comes out at about 49 mules and about 23 mules respectively.
    </p>
    <p>
      The chart below shows the same effect with all six features, averaged over 12 months each.
    </p>
  </section>

  <SeriesFigure id="ring-size" title="Share of the ring among the 50 alerts, by ring size and k" xs={F.ringSizes} xAsIndex={true}
    xLabel="mules in the ring" yLabel="% caught" yMax={100} series={F.ringSeries} yFormat={(v) => `${Math.round(v)}%`} initial={20}>
    <p class="caption">As you drag along the ring sizes, you'll see that every line ends lower than it starts, and the lines for larger k fall sooner.</p>
  </SeriesFigure>

  <section class="body-text">
    <p>
      At k = 8, a lone mule is flagged every time, a ring of 20 is flagged 76% of the time and a ring of 40
      only 23% of the time. At k = 12, a ring of 20 is down to 10%. We've already seen two more versions of the
      same thing. Under raw z-scores the five house sales get a cluster of exactly 5 at every k we tried, and
      the ratio feature handed the ring a cluster of its own.
    </p>
    <p>
      The ring doesn't even need a centroid all to itself. It can also pull a nearby centroid towards itself,
      for example the one for self-employed customers, who also have many senders. The mules then share a
      cluster with a few hundred ordinary customers, and the shared centroid sits close enough to hide them.
      Either way, the consequence for anti-money-laundering work is uncomfortable. Coordinated behaviour,
      where many accounts act alike, is exactly what we most want to find, and distance to a k-means centroid
      rewards it. Part V has two fixes.
    </p>

    <h3 class="body-header">Four ways to turn distances into alerts</h3>
    <p>
      There's more than one way to go from distances to a list of 50. We can take the 50 largest distances
      overall, or the top 1% of each cluster. We can divide each distance by its cluster's typical radius
      first, so that a spread-out cluster doesn't hog the list. Or we can flag every member of an unusually
      small cluster, which sounds like a direct answer to the ring problem.
    </p>
  </section>

  <PipelineSwitch id="rules" title="Four rules for picking the alerts" {...F.rules} optionLabel="rule" initialK={5} />

  <section class="body-text">
    <p>
      The two rules that sound fairest have the same flaw, and it follows directly from how they're defined:
    </p>
    <p class="eq">{@html quota}</p>
    <p>
      The top 1% of each cluster gives every cluster its quota, whatever the cluster contains, so a cluster
      made entirely of mules gets the same share of alerts as a cluster of pensioners. Dividing by the
      cluster's radius {@html katexify(`r_j`)} makes the average squared score exactly 1 in every cluster, so
      a cluster that is the ring looks exactly as normal as any other. At k = 5 both catch 3 of the ring,
      against 13 for the global rule. The small-cluster rule catches nobody, because no cluster in our month is
      smaller than 1% of the customers.
    </p>
    <p>
      The global rule has its own bias, though. It sends alerts to whichever segments are most spread out.
    </p>
  </section>

  <FeatureBars id="segments" title="Who gets the alerts under the global rule, at k = 5" labels={F.segLabels} sets={F.segSets} max={0.6} format={(v) => pct(v, 1)}>
    <p class="caption">If you switch between the two sets of bars, you can compare each segment's share of customers with its share of alerts.</p>
  </FeatureBars>

  <section class="body-text">
    <p>
      Salaried customers are more than half of the bank and get no alerts at all, while the self-employed are
      5.1% of the bank and get 36% of the alerts. None of the rules is fair in every sense, so the useful
      question is which kind of fairness the business needs, and then to write it down and test it.
    </p>

    <h3 class="body-header">Which distance?</h3>
    <p>
      K-means is built around squared Euclidean distance, but once the clusters exist we could score customers
      with any distance. Let's keep the clustering fixed and try six.
    </p>
  </section>

  <PipelineSwitch id="distances" title="Six distances on the same clusters" {...F.distances} optionLabel="distance" />

  <section class="body-text">
    <p>
      The lists overlap with the Euclidean one by between 0.41 and 0.64 for Manhattan, Chebyshev and a global
      Mahalanobis distance. Chebyshev, which looks only at a customer's single most extreme feature, catches
      the whole ring at k = 5, because the ring is extreme in one feature. Cosine distance catches nothing we
      planted, and that's by design. It compares the shape of a customer's activity rather than its size, so
      a customer who does ten times as much of everything is at cosine distance zero from their former self.
    </p>
    <p>
      The one that sounds best is the per-cluster Mahalanobis distance, which accounts for each cluster's own
      shape. In our data it can't even be computed for 48% of customers at k = 3 and 65% at k = 5. The
      clusters built around "no cash" have a cash column that is zero for every member, so their covariance
      matrix can't be inverted. That happened in all six other months we tried, too.
    </p>

    <h3 class="body-header">Is there a principled cut-off?</h3>
    <p>
      If each cluster were a round Gaussian cloud, a customer's squared distance divided by the cluster's
      variance would follow a chi-square distribution, and we could cut at its 99th percentile to flag 1%. In
      our data, that cut-off flags between 4.8% and 5.8% of customers, depending on k. Even with each cluster's
      full covariance, where it's defined, it flags about 3% to 4%. Transaction data has heavy tails, so the
      theoretical cut-off isn't calibrated. In practice the budget is set by how many cases the investigators
      can work, and the statistics decide the order.
    </p>

    <h3 class="body-header">The budget, and what's below it</h3>
    <p>
      That leaves the customers below the line. The standard check is
      <span class="bold">below-the-line testing</span>: take a random sample of customers who weren't alerted,
      investigate them, and see whether anything was missed. It's worth knowing how big that sample has to be.
      If we find nothing in {@html katexify(`n`)} cases, we can say with 95% confidence that the miss rate
      {@html katexify(`\\pi`)} is below the value where
    </p>
    <p class="eq">{@html rule3}</p>
    <p>
      This is known as the <span class="bold">rule of three</span>. To show that fewer than 1 in 1,000
      customers below the line should have been alerted, we need 2,995 clean cases. A sample of 100 can only
      rule out a miss rate of about 3%.
    </p>
  </section>

  <!-- ============================================================ PART V -->
  <section class="body-text part" id="part-test">
    <h2 class="part-header">V. Testing the detector</h2>
    <p>
      We now have a pipeline and a list. This part collects the tests we'd run on it as validators, including
      several we've already used along the way. Most of them work without any labels, which matters, because
      in anti-money-laundering work we almost never know for sure who was missed.
    </p>

    <h3 class="body-header">Planted cases and dose–response</h3>
    <p>
      The most useful test is the one we've been running all along: plant customers with a known typology and
      see whether they're caught. It's even more informative to vary the strength of the typology and find the
      point where the model starts to see it. Here are the structurers again, with their monthly cash deposits
      set anywhere from 5,000 to 160,000 kroner.
    </p>
  </section>

  <SeriesFigure id="dose-cash" title="Structurers caught, by how much cash they pay in each month (k = 3)" xs={F.doseXs} xAsIndex={true}
    xLabel="cash per month (kroner)" yLabel="caught" yMax={10} series={F.doseSeries} initial={40000}>
    <p class="caption">Drag along the amounts, and you can compare the four transforms at each one.</p>
  </SeriesFigure>

  <section class="body-text">
    <p>
      On the values as recorded, the model starts to catch structurers at about 20,000 kroner a month, and
      log(x + 10,000) catches 8 of the 10 at that amount. Under log(1 + x), not one structurer is caught at any
      amount, even at 160,000 kroner a month, because the zeros dominate the scale of that feature. A test like
      this turns "the model can detect structuring" into a statement with a number in it. Here's the same test
      for the ring, varying how many different senders each mule has.
    </p>
  </section>

  <SeriesFigure id="dose-senders" title="Mules caught, by their number of senders per month" xs={F.sendersXs} xAsIndex={true}
    xLabel="senders per mule per month" yLabel="caught" yMax={20} series={F.sendersSeries} initial={22}>
    <p class="caption">As you drag along the sender counts, you'll see that the larger k is, the more senders a mule needs before it's caught.</p>
  </SeriesFigure>

  <section class="body-text">
    <p>
      With k = 3, mules with about 15 senders a month are mostly caught. With k = 8 they need about 30, because
      with more centroids available the ring is more likely to get one.
    </p>

    <h3 class="body-header">Benchmarks the model has to beat</h3>
    <p>
      A model should also be compared with simpler alternatives. Here are nine detectors on the same logged,
      standardised features. There's k-means with 1, 3, 5 and 8 clusters and a global Mahalanobis distance.
      There's a set of one-feature rules, which flag whoever has the largest z-score on any single feature.
      And there's the distance to the 5th and the 30th nearest neighbour, and an
      <a href="../isolation-forest/">isolation forest</a>. Pick a detector and compare its strip with the
      others.
    </p>
  </section>

  <PipelineSwitch id="benchmarks" title="Nine detectors on the same customers" {...F.bench} optionLabel="detector" initial="maxz" showTable={true} />

  <section class="body-text">
    <p>
      The simple one-feature rules catch 20 of the ring, 9 structurers and all 5 house sales, which is more
      than any k-means setting. In all six other months we tried, they caught more planted customers than the
      best of k = 3, 5 and 8. That isn't a general law, because our typologies are each extreme in one
      feature, but it's the benchmark a peer-group model has to beat before its extra complexity is worth
      having.
    </p>
    <p>
      Two other results stand out. The 5th-nearest-neighbour distance catches none of the ring, for the same
      reason as k-means: inside a ring of 20, every mule's five nearest neighbours are other mules. And
      clustering makes the structurers harder to rank. For structurers, the area under the ROC curve falls
      from 0.951 with no clustering (k = 1) to 0.617 with k = 3. The clusters are built on cash use, so the
      structurers end up among the cash users.
    </p>
    <p>
      Notice the AUCs for the ring, too. They're 0.99 or higher for almost every detector, including ones that
      catch 12 mules and ones that catch 20. The <span class="bold">AUC</span> summarises the whole ranking,
      while our investigators only ever see the top 1% of it, so for a detector with a small budget it's the
      catches at the budget that matter.
    </p>

    <h3 class="body-header">How similar are two sets of peer groups?</h3>
    <p>
      When two versions of a model disagree, it helps to measure how different their peer groups are. Cluster
      numbers are arbitrary, so we can't just compare labels. The
      <span class="bold">adjusted Rand index</span> (ARI) counts pairs of customers that are grouped together
      in both versions, or apart in both, and scales the result so that 1 means identical and 0 means no more
      agreement than chance. <span class="bold">Normalised mutual information</span> (NMI) asks how much
      knowing one set of groups tells us about the other. Relabelling the clusters leaves both scores
      unchanged.
    </p>
  </section>

  <MatrixFigure id="similarity" title="How similar the peer groups are under five preprocessing choices, at k = 5" labels={F.simLabels} sets={F.simSets}>
    <p class="caption">You can switch between the two measures. The pale cells are pairs of choices that produce very different peer groups.</p>
  </MatrixFigure>

  <section class="body-text">
    <p>
      Apart from the two log-based versions, which share an ARI of 0.69, the preprocessing choices produce
      quite different peer groups, with ARIs between 0.11 and 0.47. So a customer's peer group is as much a
      product of preprocessing as of their behaviour.
    </p>

    <h3 class="body-header">Are the clusters stable?</h3>
    <p>
      A standard stability test is Hennig's <span class="bold">clusterwise bootstrap</span>: refit the model on
      resampled data many times and record, for each original cluster, how well its best match in the new fit
      overlaps with it. An average Jaccard similarity above about 0.75 is usually read as a stable cluster.
    </p>
  </section>

  <FeatureBars id="hennig" title="Bootstrap stability of each cluster (30 resamples)" labels={F.henLabels(8)} sets={{ "k = 8": P.V4.hen[8].jac }} refLine={0.75} refLabel="0.75">
    <p class="caption">Each bar is one cluster at k = 8, and the line marks the usual threshold for a stable cluster, so you can see which one falls short.</p>
  </FeatureBars>

  <section class="body-text">
    <p>
      Every cluster at k = 3 and k = 5 scores between 0.87 and 0.99, and at k = 8 all but one are above 0.75.
      By this test our clusters are stable. Yet we've already seen that the alert list changes with the seed,
      the month and the preprocessing. A stable clustering and a stable alert list are different properties,
      and the alerts live out in the tails, where the clusters are least certain. So we should test the
      stability of the alerts directly.
    </p>

    <h3 class="body-header">Next month</h3>
    <p>
      Let's refit the model on the next month of the same customers, who haven't changed their habits. Before
      we can compare the two, we have to match up the clusters, because cluster 1 this month needn't be cluster
      1 next month. Without matching, only 38.2%, 3.0% and 9.3% of customers keep their cluster number at k = 3,
      5 and 8. After matching clusters by their overlap, 94.9%, 88.9% and 79.2% keep their peer group, and the
      ARI between the two months falls from 0.824 to 0.732 to 0.577 as k grows.
    </p>
    <p>
      Who changes peer group? Mostly the customers who were almost equally close to two centroids. The chart
      below sorts customers by that margin, the distance to their second-nearest centroid minus the distance to
      their nearest, and shows how many in each tenth change group.
    </p>
  </section>

  <FeatureBars id="margins" title="Customers who change peer group next month, by how close they were to a boundary" labels={F.decileLabels} sets={{ "k = 5": P.V5.deciles }} max={0.5} format={(v) => pct(v, 1)}>
    <p class="caption">The top bar is the tenth of customers closest to a boundary between two peer groups, and you can see the share fall as the margin grows.</p>
  </FeatureBars>

  <section class="body-text">
    <p>
      Of the customers closest to a boundary, 45.1% change group, against 0.4% of the clearest. That margin is
      cheap to compute and worth reporting with every alert, because a customer near a boundary is being
      compared with a different set of peers each month.
    </p>
    <p>
      The alert list is less stable than the ranking behind it. The rank correlation between this month's
      scores and next month's is between 0.69 and 0.79, but the top 1% overlaps by only 0.43 to 0.54. A cut-off
      in the tail amplifies small changes, whether or not the model is refitted: keeping this month's model and
      rescoring next month moves the overlap by only a few hundredths.
    </p>

    <h3 class="body-header">Persistence</h3>
    <p>
      That churn suggests a simple improvement: alert only on customers who are unusual in at least two of
      three months. Our house sales are one-offs, while the ring and the structurers carry on every month.
    </p>
  </section>

  <PipelineSwitch id="persistence" title="Alerting on customers who stand out repeatedly (model kept fixed for three months)" {...F.persistence} optionLabel="alerted" />

  <section class="body-text">
    <p>
      At k = 3, the three monthly lists name 75 different customers. The 32 who appear only once include all
      five house sales, and the 43 who appear at least twice include the whole ring. A persistence rule is
      cheap, it cuts one-off events, and it's easy to explain. What it can't do is recover a typology the model
      misses in every month, like the structurers here.
    </p>

    <h3 class="body-header">Fixes for the ring problem</h3>
    <p>
      The masking in part IV has a known fix. Chawla and Gionis's <span class="bold">k-means--</span> leaves the
      {@html katexify(`l`)} most distant customers out every time it updates the centroids, so a group of
      outliers can't pull a centroid towards itself. A simpler version fits once, drops the most extreme 2%,
      refits on the rest and then scores everybody. Here are both, averaged over 12 months each.
    </p>
  </section>

  <FeatureBars id="remedies" title="Share of the ring among the 50 alerts, with and without the fixes" labels={F.remedyLabels} sets={F.remedySets} format={(v) => pct(v)}>
    <p class="caption">If you switch between the three methods, you can compare the bars row by row.</p>
  </FeatureBars>

  <section class="body-text">
    <p>
      With k-means-- and 50 customers left out, a ring of 20 at k = 12 is caught 65% of the time instead of
      10%. A ring of 40 at k = 8 is caught 66% of the time instead of 23%. Trimming and refitting does
      about as well when the masking is mild, and much less well when it's strong, because by then the
      first fit has already hidden the ring, so the ring isn't among the customers it trims. Neither fix helps much
      once a ring is large relative to the budget: a ring of 40 at k = 12 is still caught only 17% of the time.
    </p>

    <h3 class="body-header">A validation checklist</h3>
    <p>
      Here's everything in one place. Each test says what it catches and where in this guide we tried it.
    </p>
  </section>

  <div class="fig" id="checklist">
    <p class="fig-title">Tests for a k-means peer-group detector</p>
    <table class="data-table checklist">
      <thead><tr><th>test</th><th>what it catches</th><th>section</th></tr></thead>
      <tbody>
        <tr><td>Population scope</td><td>dormant or borderline accounts reshaping clusters and scaling</td><td>I</td></tr>
        <tr><td>Features against typologies</td><td>a typology whose key feature is missing, capped or diluted</td><td>I, II</td></tr>
        <tr><td>Missingness by feature and by group</td><td>evidence replaced by an imputed ordinary value</td><td>I</td></tr>
        <tr><td>Categorical encoding</td><td>rare categories turning into distance</td><td>I</td></tr>
        <tr><td>Preprocessing grid</td><td>transform, offset, cap, scaler and feature set changing the list</td><td>II</td></tr>
        <tr><td>Feature weights and correlation</td><td>duplicated information counted twice</td><td>II</td></tr>
        <tr><td>Inertia split by feature</td><td>peer groups built on zeros rather than behaviour</td><td>III</td></tr>
        <tr><td>Seeds and restarts</td><td>an alert list that depends on the random start</td><td>III</td></tr>
        <tr><td>k against planted cases</td><td>a k chosen for description rather than detection</td><td>III, V</td></tr>
        <tr><td>Masking</td><td>groups that act alike getting their own centroid</td><td>IV</td></tr>
        <tr><td>Score rule and distance</td><td>quotas, normalisation and singular covariances</td><td>IV</td></tr>
        <tr><td>Cut-off calibration and below the line</td><td>theoretical thresholds that don't hold; unmeasured misses</td><td>IV</td></tr>
        <tr><td>Dose–response</td><td>how strong a typology must be to be seen</td><td>V</td></tr>
        <tr><td>Benchmarks</td><td>simpler rules that do as well or better</td><td>V</td></tr>
        <tr><td>Cluster and alert stability</td><td>label switching, boundary customers, churn at the cut-off</td><td>V</td></tr>
        <tr><td>Monitoring</td><td>input drift, cluster sizes, centroid movement over time</td><td>I, V</td></tr>
        <tr><td>Explanations</td><td>reasons an investigator can check and act on</td><td>VI</td></tr>
      </tbody>
    </table>
  </div>

  <!-- ============================================================ PART VI -->
  <section class="body-text part" id="part-explain">
    <h2 class="part-header">VI. Explaining an alert</h2>
    <p>
      An alert reaches an investigator as a name and, ideally, a reason. The good news is that k-means distances
      are about as easy to explain as scores get.
    </p>

    <h3 class="body-header">Why this customer?</h3>
    <p>
      A customer's squared distance to their centroid is a sum of one term per feature:
    </p>
    <p class="eq">{@html terms}</p>
    <p>
      So we can say exactly how much of the distance each feature contributes. Pick an alert below to see its
      terms, alongside the customer's own values and their peer group's centroid in kroner. You'll see that the bars add up to the whole distance.
    </p>
  </section>

  <WhyThisCustomer />

  <section class="body-text">
    <p>
      Among our 50 alerts at k = 5, the number of senders is the biggest term for 26 of them, money in for 8 and
      cash for 7. For 30 of the 50, one feature makes up more than half of the distance, and for 15 it makes up
      more than 80%. Most alerts, in other words, have one main reason, which is also a hint that the
      one-feature rules from part V would find many of them.
    </p>

    <h3 class="body-header">Shapley values are the terms</h3>
    <p>
      It's common to reach for <a href="../shapley-values/">Shapley values</a> to explain a score. For
      {@html dInline} with the centroid as the baseline, we don't need to: if the customer's peer group is held
      fixed, each feature's Shapley value is exactly its own term.
    </p>
    <p class="eq">{@html shap}</p>
    <p>
      That's because the terms simply add up, so there are no interactions to share out. The picture changes if
      the model re-assigns a partly changed customer to a new nearest centroid, which is what a model that
      rescores would do. Then the Shapley values differ from the terms for 12 of our 50 alerts, and the top
      reason changes for 2 of them. You can see one of those, the cash user, by switching the bars to Shapley
      values in the card above.
    </p>

    <h3 class="body-header">The peer average is not an average</h3>
    <p>
      The card above shows each peer group's centroid in kroner, and it's worth being careful about what that
      number is. The centroid lives on the log scale, so turning it back into kroner gives something close to a
      geometric mean, which is smaller than the ordinary average. In our five peer groups, the ordinary average
      of money in is between 1.05 and 1.26 times what the back-transformed centroid says.
    </p>
  </section>

  <div class="fig" id="peer-average">
    <p class="fig-title">Money in for each peer group: the back-transformed centroid and the ordinary average</p>
    <table class="data-table">
      <thead><tr><th>group</th><th>customers</th><th>centroid</th><th>average</th><th>median</th><th>ratio</th></tr></thead>
      <tbody>
        {#each P.VI.geo as g, i}
          <tr><td>{i + 1}</td><td>{g.n.toLocaleString("en-GB")}</td><td>{g.centroid.toLocaleString("en-GB")}</td><td>{g.arithmetic.toLocaleString("en-GB")}</td><td>{g.median.toLocaleString("en-GB")}</td><td>{g.ratio.toFixed(2)}</td></tr>
        {/each}
      </tbody>
    </table>
    <p class="caption">If you compare the last column across groups, you'll see that the more spread out a group is, the more its centroid understates the average.</p>
  </div>

  <section class="body-text">
    <p>
      For zero-inflated features the gap can be enormous. In the card for the big sender abroad, the peer
      group's centroid for money sent abroad is 2 kroner, because most of the group sends nothing. If an
      investigator reads that as "peers send about 2 kroner abroad", they'll misjudge the customer. It's safer
      to show the median and the share of peers with any activity at all.
    </p>

    <h3 class="body-header">What would clear the alert?</h3>
    <p>
      A <span class="bold">counterfactual</span> answers the question "what would have to be different for this
      customer not to be flagged?". For distances there are two easy versions. Moving a customer straight
      towards their centroid clears the alert once their distance shrinks below the threshold {@html tInline},
      so an alert clears at the fraction {@html katexify(`t/d`)} of its current distance. And a single feature
      can clear the alert on its own exactly when
    </p>
    <p class="eq">{@html counter}</p>
    <p>
      In our month, 44 of the 50 alerts could be cleared by changing just one feature. The ring member in the
      card above would need 22.8 senders a month instead of 41, when the peer group's centroid is about 2.
      That's a useful sentence for an investigator, because it says both what is unusual and by how much.
    </p>

    <h3 class="body-header">Why this peer group?</h3>
    <p>
      The other half of an explanation is the peer group itself. Each customer belongs to the nearest centroid,
      and the margin to the second-nearest one, which we met in part V, says how firmly. To describe the groups
      in plain terms, we can fit a small decision tree that predicts each customer's group from their values in
      kroner.
    </p>
  </section>

  <SurrogateTree />

  <section class="body-text">
    <p>
      A tree with two levels of questions agrees with k-means for 72.3% of our customers, and it never predicts
      one of the five groups at all. With three levels it agrees for 82.4%. So a short set of rules is a helpful
      description of the peer groups, but it isn't the model, and its agreement rate should be quoted whenever
      the rules are.
    </p>

    <h3 class="body-header">Which features matter?</h3>
    <p>
      Finally, a model review usually asks for a global feature importance. There are at least four reasonable
      ways to measure it. The first is the share of each feature explained by the peer groups, the
      {@html katexify(`R^2`)} from part III. The second is each feature's average share of the alerts' squared
      distances. The third is how much of the alert list changes when we shuffle one feature, and the fourth is
      how much changes when we drop it and refit. You can switch between all four below.
    </p>
  </section>

  <FeatureBars id="importance" title="Four measures of feature importance for the same model" labels={F.featureLabels} sets={F.importanceSets}>
    <p class="caption">As you switch between the four measures, you'll see the order of the bars change.</p>
  </FeatureBars>

  <section class="body-text">
    <p>
      They disagree. The peer groups are built mostly on cash and money sent abroad, while the alerts are driven
      mostly by the number of senders. Shuffling puts senders first and cash second, and dropping and refitting
      puts money sent abroad level with senders. Each measure answers a different question: what defines the
      groups, what drives the alerts, what the fitted model relies on, and what the pipeline would do without a
      feature. A model document should say which question it's answering.
    </p>
  </section>

  <!-- ============================================================ COSTS -->
  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      It's worth being fair to k-means before listing its problems. It's cheap to fit, it's easy to rerun
      exactly, its scores can be explained feature by feature without any approximation, and it compares each
      customer with people like them rather than with one fixed rule for everybody. Those are real advantages
      in a regulated setting. The costs are these.
    </p>
    <p>
      First, it rewards customers who act alike. A ring that's big enough, or distinctive enough, gets a
      centroid of its own and disappears from the list, and coordinated behaviour is exactly what we most want
      to catch.
    </p>
    <p>
      Second, every preprocessing step is a weight we chose, often without meaning to. The transform, the
      offset, the cap, the scaler, the feature list and even the population decide which typologies are
      visible.
    </p>
    <p>
      Third, the clusters tend to form around zeros and rare categories rather than around behaviour, so the
      "peer groups" may not be groups of peers.
    </p>
    <p>
      Fourth, a row is a single period, so anything that happens across periods, or across accounts, is
      invisible unless we build it into the features.
    </p>
    <p>
      And finally, simpler detectors can do as well or better, so a peer-group model needs benchmarks it might
      lose to, and should be kept only if it wins.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Conclusion</h3>
    <p>
      We started with a model that sounded reasonable at every step, and we've seen that almost every step
      changes who ends up on the list. None of that makes k-means a bad choice for peer groups. It means the
      choices are the model, as much as the algorithm is, and each of them deserves a test with planted cases,
      a benchmark and a record of why it was made.
    </p>
    <p>
      If there's one thing to carry away, it's the ring. Distance to a centroid measures how unusual a customer
      is compared with their cluster, and k-means builds clusters around whatever is most worth describing,
      including a group of customers who all behave in the same unusual way. So whenever a peer-group model is
      used to look for organised activity, we should plant some and see whether it's found.
    </p>
    <p>Thanks for reading!</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Sources and notes</h3>
    <p>
      K-means as an objective and Lloyd's algorithm are from Lloyd, "Least squares quantization in PCM",
      <i>IEEE Transactions on Information Theory</i> 28(2), 1982, and the k-means++ starts from Arthur and
      Vassilvitskii, <i>Proceedings of SODA</i>, 2007. The split-gain formula is the merging cost in Ward,
      <i>Journal of the American Statistical Association</i> 58, 1963. The k-means-- algorithm is Chawla and
      Gionis, "k-means--: A unified approach to clustering and outlier detection", <i>SIAM International
      Conference on Data Mining</i>, 2013. Comparing customers with their peers for fraud detection goes back
      at least to Bolton and Hand's peer group analysis, "Unsupervised profiling methods for fraud detection",
      2001.
    </p>
    <p>
      The criteria for choosing k are Calinski and Harabasz (1974), Davies and Bouldin (1979), Rousseeuw's
      silhouette (1987), and the gap statistic of Tibshirani, Walther and Hastie (2001). The adjusted Rand index
      is Hubert and Arabie (1985), and the clusterwise bootstrap is Hennig, <i>Computational Statistics and
      Data Analysis</i> 52, 2007. The isolation forest is Liu, Ting and Zhou (2008), the rule of three is
      from Hanley and Lippman-Hand, <i>JAMA</i> 249, 1983, and Shapley values for model explanation follow
      Lundberg and Lee (2017). The robust scaler's treatment of a zero interquartile range is scikit-learn's.
    </p>
    <p>
      Our bank, its customers, the planted typologies, the tests and every number on this page are ours. None
      of it describes a real bank or a real model. The page is built on the scaffold and design system of
      Amazon's <a href="https://mlu-explain.github.io/">MLU-Explain</a>, used under CC BY-SA 4.0.
    </p>
  </section>
</main>

<style>
  main {
    padding-bottom: 4rem;
  }
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  :global(.part-header) {
    font-family: var(--font-heavy);
    font-size: 1.9rem;
    line-height: 1.25;
    color: var(--squid-ink);
    margin: 3.5rem 0 0.6rem 0;
    padding-top: 1.2rem;
    border-top: 2px solid #232f3e;
  }
  :global(.eq) {
    margin: 0.6rem 0;
  }
  /* KaTeX's hidden MathML copy is absolutely positioned; without this it
     escapes the scrolling display box and widens the page on a phone. */
  :global(.katex-display) {
    position: relative;
  }
  .contents {
    margin-top: 1.5rem;
    background: #fff;
    border: 1px solid #e0e5e8;
    border-radius: 8px;
    padding: 0.8rem 1.2rem;
  }
  .contents-label {
    font-family: var(--font-main);
    font-size: 0.8rem;
    color: #61707d;
    margin: 0;
  }
  .contents ol {
    margin: 0.3rem 0 0 0;
    padding-left: 1.3rem;
    list-style: upper-roman;
    font-size: 1rem;
    line-height: 1.7;
  }

  /* Figure furniture shared by every component on the page. */
  :global(.fig) {
    max-width: 720px;
    margin: 2rem auto;
    padding: 0 1rem;
    box-sizing: border-box;
  }
  :global(.svg-wrap) {
    width: 100%;
    min-width: 0;
  }
  :global(.svg-wrap svg) {
    display: block;
    max-width: 100%;
    height: auto;
  }
  :global(.fig-title) {
    font-family: var(--font-main);
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0 0 0.6rem 0;
    color: var(--squid-ink);
    text-align: center;
  }
  :global(.caption) {
    font-family: var(--font-main);
    font-size: 0.85rem;
    line-height: 1.45;
    color: #61707d;
    margin: 0.5rem 0 0 0;
  }
  :global(.caption p) {
    font-size: 0.85rem;
    color: #61707d;
    margin: 0;
  }
  :global(.pills) {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    align-items: center;
    margin: 0.25rem 0;
  }
  :global(.ctl-label) {
    font-family: var(--font-main);
    font-size: 0.74rem;
    color: #8a94a2;
    margin-right: 0.2rem;
  }
  :global(.pill) {
    font-family: var(--font-main);
    font-size: 0.8rem;
    padding: 0.22rem 0.6rem;
    border-radius: 999px;
    border: 1px solid #c9d0d6;
    background: #fff;
    color: var(--squid-ink);
    cursor: pointer;
  }
  :global(.pill.active) {
    background: var(--violet);
    border-color: var(--violet);
    color: #fff;
  }
  :global(.pill:focus-visible) {
    outline: 2px solid var(--violet);
    outline-offset: 2px;
  }
  :global(.readout) {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: #61707d;
    margin: 0.3rem 0;
  }
  :global(.readout b) {
    color: var(--squid-ink);
  }
  :global(.verdict) {
    font-family: var(--font-main);
    font-size: 0.9rem;
    line-height: 1.45;
    color: var(--squid-ink);
    background: #fff;
    border-left: 3px solid var(--violet);
    padding: 0.4rem 0.7rem;
    margin: 0.5rem 0;
  }
  :global(.legend) {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    font-family: var(--font-main);
    font-size: 0.78rem;
    color: #61707d;
    margin: 0.4rem 0;
  }
  :global(.legend b) {
    font-family: var(--font-mono);
    color: var(--squid-ink);
  }
  :global(.key) {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
  }
  :global(.swatch) {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background: #8a94a2;
  }
  :global(.swatch.dot) {
    border-radius: 50%;
  }
  :global(.slider) {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin: 0.3rem 0;
  }
  :global(.s-name) {
    font-family: var(--font-main);
    font-size: 0.85rem;
    color: var(--squid-ink);
  }
  :global(.s-name b) {
    font-family: var(--font-mono);
    float: right;
  }
  :global(.s-hint) {
    font-family: var(--font-main);
    font-size: 0.76rem;
    color: #8a94a2;
  }
  :global(input[type="range"]) {
    width: 100%;
    accent-color: var(--violet);
  }
  :global(.controls-bar) {
    background: var(--bg, #f1f3f3);
    padding: 0.2rem 0 0.4rem 0;
    margin-bottom: 0.5rem;
  }
  @media screen and (max-width: 700px) {
    :global(.controls-bar) {
      position: sticky;
      top: 0;
      z-index: 5;
      border-bottom: 1px solid #e3e7ea;
    }
  }
  :global(.data-table) {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-main);
    font-size: 0.8rem;
    margin: 0.4rem 0;
    background: #fff;
  }
  :global(.data-table th) {
    text-align: left;
    font-weight: 600;
    color: #61707d;
    border-bottom: 1px solid #d4dada;
    padding: 4px 6px;
  }
  :global(.data-table td) {
    border-bottom: 1px solid #eef1f3;
    padding: 4px 6px;
    color: var(--squid-ink);
  }
  :global(.data-table tr.sel td) {
    background: #f1eefd;
    font-weight: 600;
  }
  :global(.grid) {
    stroke: #eef1f3;
  }
  :global(.tick) {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #8a94a2;
  }
  :global(.axis-title) {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }
  :global(.curve) {
    fill: none;
    stroke-width: 2;
  }
  :global(.sel-line) {
    stroke: #232f3e;
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  :global(.row-label),
  :global(.col-label) {
    font-family: var(--font-main);
    font-size: 11px;
    fill: #61707d;
  }
  :global(.cell-value) {
    font-family: var(--font-mono);
    font-size: 10.5px;
  }
  :global(.bar-bg) {
    fill: #eef1f3;
  }
  :global(.bar) {
    fill: #2074d5;
  }
  :global(.bar-value) {
    font-family: var(--font-mono);
    font-size: 10.5px;
    fill: var(--squid-ink);
  }
  :global(.ref) {
    stroke: #df2a5d;
    stroke-width: 1.5;
    stroke-dasharray: 4 3;
  }
  :global(.ref-label) {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #df2a5d;
  }
</style>
