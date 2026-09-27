<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import LedgerFigure from "./Components/LedgerFigure.svelte";
  import EventQuiz from "./Components/EventQuiz.svelte";
  import ChainFigure from "./Components/ChainFigure.svelte";
  import ImportLab from "./Components/ImportLab.svelte";
  import ReleaseTable from "./Components/ReleaseTable.svelte";
  import katexify from "./katexify.js";

  const identity = katexify(`Y = C + I + G + X - M`, true);
  const va = katexify(`\\text{VA}_i = S_i - Z_i - Z^{M}_i`, true);
  const sumVa = katexify(`\\sum_i \\text{VA}_i = \\sum_i S_i - \\sum_i Z_i - Z^{M} = F - Z^{M}`, true);
  const spend = katexify(`C + I + G + X = F + M^{F}, \\qquad M = M^{F} + Z^{M}`, true);
  const same = katexify(`C + I + G + X - M = F + M^{F} - M^{F} - Z^{M} = F - Z^{M} = \\sum_i \\text{VA}_i`, true);
  const byUse = katexify(`Y = (C - M_C) + (I - M_I) + (G - M_G) + (X - M_X)`, true);
  const lab = katexify(`\\Delta Y = -\\,d \\, B \\, \\delta, \\qquad \\Delta(X - M) = -B + d\\,B\\,(1-\\delta)`, true);
  const salesId = katexify(`\\sum_i S_i = \\sum_i n_i \\, \\text{VA}_i`, true);
  const chainId = katexify(`\\sum_{j=1}^{k} \\frac{j}{k}\\,Y = \\frac{k+1}{2}\\,Y`, true);
  const delta = katexify(`\\delta`);
  const nI = katexify(`n_i`);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Let's imagine a small island with three firms that between them make
      bread from scratch. A farm grows wheat and sells it to a mill for €30. The
      mill grinds it into flour and sells the flour to a bakery for €50, and the
      bakery bakes loaves and sells them to the island's households for €100.
      That's the whole economy, and one year of it fits in a table with three
      rows.
    </p>
    <p>
      <span class="bold">Gross domestic product</span>, or GDP, is the value of
      everything an economy produces in a year, and there are three standard
      ways of measuring it. The first adds up what each firm adds to the things
      it buys, which is called its <span class="bold">value added</span>: the
      farm adds €30, the mill €20 and the bakery €50. The second adds up
      spending by the people who use things up rather than turning them into
      something else, which here means households spending €100 on bread. The
      third adds up the incomes that production pays out: €67 of wages and €33
      of profits. All three come to €100.
    </p>
  </section>

  <div class="fig-wrap">
    <LedgerFigure caption="The base year: one ledger, three ways of adding it up" />
  </div>

  <section class="body-text">
    <p>
      The spending approach is usually written as a formula, and it's one of
      the most quoted lines in economics:
    </p>
    <p class="eq">{@html identity}</p>
    <p>
      Here <i>Y</i> is GDP, <i>C</i> is household consumption, <i>I</i> is
      investment, <i>G</i> is government purchases, <i>X</i> is exports and
      <i>M</i> is imports. It's the minus sign in front of <i>M</i> that this
      article is about, because it's very often read as saying that imports make
      a country poorer, and that a rise in imports is a drag on growth. So
      before we look at why it's there, here's a test.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Which of these lowers GDP?</h3>
    <p>
      Four things could happen on the island this year. For each one, decide
      whether it lowers the island's GDP or leaves it alone, and the ledger will
      redraw with that event applied.
    </p>
  </section>

  <EventQuiz />

  <section class="body-text">
    <p>
      Only the imported flour lowers GDP, and it's worth going through why the
      other three don't.
    </p>
    <p>
      When households buy €40 of imported bicycles, their spending rises from
      €100 to €140, and imports rise from nothing to €40. The minus sign takes
      back exactly what the bikes added, so the formula gives €100 again. That's
      the right answer, because the island didn't make anything new: the value
      added column, which never mentions imports at all, hasn't moved. So the
      bicycles are subtracted, but only after they've been counted once in
      consumption, and the two cancel.
    </p>
    <p>
      The imported flour is different. The bakery still sells €100 of bread, but
      now €50 of that price pays a mill abroad, and the island's own mill and
      farm have nothing left to do. GDP falls by €50, which is the €20 the mill
      used to add plus the €30 the farm used to add. The import didn't cause the
      loss by being subtracted. It replaced production that used to happen on
      the island, and the loss is that production.
    </p>
    <p>
      The merger changes how many times things are sold without changing what's
      made, and we'll come back to it in the next section. And the unsold bread
      is counted as <span class="bold">inventory investment</span>, meaning
      output added to a firm's stock. Households spend €80 instead of €100, but
      the €20 of bread in the storeroom counts in <i>I</i>, so GDP stays at
      €100. GDP counts what was made in the year, whether or not it was sold.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Why not just add up sales?</h3>
    <p>
      The island's firms sell €180 of goods between them, but GDP is only €100.
      Adding up sales counts the wheat three times, once when the farm sells
      it, again inside the flour, and again inside the bread. That's called
      <span class="bold">double counting</span>, and every introduction to GDP
      warns against it.
    </p>
    <p>
      What's less often said is that the size of the overcount has nothing to
      do with how much the economy makes. Each euro of value added is counted
      once for every sale it passes through on its way to a household, so the
      farm's €30 is counted three times, the mill's €20 twice and the bakery's
      €50 once, and 90 + 40 + 50 is 180. When the mill buys the bakery, the flour
      stops being sold, the overcount shrinks, and total sales fall to €130 while
      GDP stays at €100. The figure below makes the same point with a chain of
      identical firms. Add firms, and sales grow without limit while the bread
      at the end stays at €100.
    </p>
  </section>

  <ChainFigure />

  <section class="body-text">
    <p>
      With <i>k</i> firms that each add the same value, total sales are
      (<i>k</i> + 1)&#8202;/&#8202;2 times GDP. So a statistic built from sales
      would say that an economy of small, specialised firms produces more than
      the same economy run by one big firm, and that's the reason GDP is built
      from value added, or equivalently from final spending, instead.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What the minus sign is for</h3>
    <p>
      The spending approach has a practical problem. When a household buys a
      loaf, the statistician sees €100 of consumption, but part of that €100 may
      have paid for foreign flour, and the same goes for a bicycle bought in a
      local shop that was made abroad. Consumption, investment, government
      purchases and exports are all measured at what buyers pay, so all four
      include some imports. Subtracting <i>M</i> once, at the end, removes all
      of that foreign content in one go.
    </p>
    <p>
      That's why the minus sign can't make imports a drag on GDP by itself. An
      import is either sold to a final user, in which case it's already inside
      <i>C</i>, <i>I</i>, <i>G</i> or <i>X</i> and the subtraction simply cancels
      it, or it's used up by a firm, in which case it's inside the price of
      something the firm sells, and the subtraction removes it from there. In
      both cases the import itself nets out to zero. What can change GDP is what
      the import does to the island's own production, and the formula has no
      way of telling you that.
    </p>
    <p>
      In other words, we could just as well allocate imports to the spending
      that contains them and write GDP as a sum of
      <span class="bold">domestic content</span>, the part of each kind of
      spending that pays for home production:
    </p>
    <p class="eq">{@html byUse}</p>
    <p>
      Written this way, there's no separate trade line to be a drag on anything.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Bicycles instead of bread</h3>
    <p>
      So whether an import lowers GDP depends entirely on what it replaces. Let's
      make that the control. Households spend €40 on imported bicycles again,
      but this time some of the money would otherwise have gone on bread. The
      slider sets that share: at 0% the bikes are an extra purchase, and at 100%
      households buy €40 less bread to pay for them. The chart shows what each
      line of the island's GDP release would say.
    </p>
  </section>

  <ImportLab />

  <section class="body-text">
    <p>
      The net-exports line is flat. Whatever share of the money comes out of
      bread, the release says that trade subtracted €40 from GDP, because
      imports rose by €40. But GDP's actual change runs all the way from €0 to
      −€40, and the difference is carried by the consumption line, which rises
      by less as more of the bike money comes out of bread. At 60%, for example,
      consumption rises by €16, net exports fall by €40, and GDP falls by €24,
      which is exactly the bread the island no longer bakes.
    </p>
    <p>
      If you tick the box for imported flour, the GDP line gets half as steep,
      because half of every euro spent on bread was already going abroad. Now a
      60% share costs the island only €12 of production, and even the net-exports
      line starts to slope, since buying less bread also means importing less
      flour. So the trade line isn't even a fixed −€40 in general. It's the
      difference between two import flows, and neither of them says what
      happened to production.
    </p>
    <p>
      The second table does. If every kind of spending is counted net of its
      own imports, as in the domestic-content formula above, the consumption
      line equals the change in GDP exactly and the trade line reads zero,
      because the island doesn't export anything. That's the version of the
      release that answers the question people are usually asking.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Reading a GDP release</h3>
    <p>
      Real releases are published in the first form, and the difference shows
      up most in unusual quarters. Suppose firms expect a new tariff and import
      €40 of goods early to put into stock. The release shows net exports
      subtracting €40 and inventories adding €40, and headlines tend to report
      the first number. Counted net of their own imports, both lines are zero,
      which is the honest summary of a quarter in which nothing extra was made
      and nothing was lost.
    </p>
  </section>

  <ReleaseTable />

  <section class="body-text">
    <p>
      Statisticians know all of this, and the point is often made in their own
      publications. A 2018 post on the St. Louis Fed's FRED blog is titled "Do
      imports subtract from GDP?" and answers that buying imports has no direct
      effect on it. Work at the San Francisco Fed traced about 11% of American
      consumer spending to imports, once the local costs of selling imported
      goods are separated out, which is a reminder of how much of the price of
      an "imported" product pays for home production.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The maths</h3>
    <p>
      Let's write <i>S<sub>i</sub></i> for firm <i>i</i>'s sales,
      <i>Z<sub>i</sub></i> for the inputs it buys from other firms on the island,
      and <i>Z<sup>M</sup><sub>i</sub></i> for the inputs it buys from abroad.
      Its value added is
    </p>
    <p class="eq">{@html va}</p>
    <p>
      Summed over firms, every domestic input purchase cancels against another
      firm's sale, which leaves the sales to final users, <i>F</i>, minus the
      imported inputs:
    </p>
    <p class="eq">{@html sumVa}</p>
    <p>
      Final spending is the final sales of domestic firms plus the imports sold
      straight to final users, <i>M<sup>F</sup></i>, and total imports are those
      plus the imported inputs:
    </p>
    <p class="eq">{@html spend}</p>
    <p>So the spending formula and the value added sum are the same number:</p>
    <p class="eq">{@html same}</p>
    <p>
      Income gives the same total again because profit is defined as what's left
      of value added after wages. None of this is a theory about the economy;
      it's bookkeeping, which is why the three approaches agree in every one of
      the sixteen combinations of the four events above.
    </p>
    <p>
      The sales identity is just as mechanical. If each euro of firm
      <i>i</i>'s value added passes through {@html nI} sales on its way to a
      final user,
    </p>
    <p class="eq">{@html salesId}</p>
    <p>and for a chain of <i>k</i> equal firms that's</p>
    <p class="eq">{@html chainId}</p>
    <p>
      In the lab, with <i>B</i> = €40 of bicycles, a share <i>d</i> of it taken
      from bread, and {@html delta} the domestic content of a euro of bread (1
      with home-made flour, ½ with imported flour), the change in GDP and the
      change in net exports are
    </p>
    <p class="eq">{@html lab}</p>
    <p>
      The first depends on <i>d</i>, which the accounts never observe. The second
      is −<i>B</i> whenever the bread is all home-made, whatever <i>d</i> is.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      An island with three firms leaves out most of what makes real national
      accounts hard, and a few of the omissions matter for the argument.
    </p>
    <p>
      First, everything here is in euros of the same year. Real GDP is measured
      at constant prices, and in chain-weighted accounts like America's the
      components measured that way don't add up to the total, so statisticians
      publish specially constructed contributions to growth instead. Those are
      still built from the same five lines, trade included.
      Second, the counterfactual is the whole question. The accounts record that
      imports rose; whether they replaced home production, filled a gap nobody
      else could, or went into stock is a claim about behaviour, and answering
      it needs a model of demand, not a better table. Third, counting spending
      net of its own imports needs to know how much foreign content is inside
      each kind of spending, which statisticians estimate from input–output
      tables that arrive years late. And finally, in real data the three
      approaches don't agree exactly, because they're measured from different
      surveys, and the gap between them is published as a
      <span class="bold">statistical discrepancy</span>.
    </p>
    <p>
      None of that rescues the reading of the minus sign as a cost. It's a
      correction for foreign content that the other four terms already counted,
      so an import that replaces nothing leaves GDP where it was.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Where this leaves the formula</h3>
    <p>
      The three ways of measuring GDP agree because they're three ways of adding
      up the same ledger, and adding up sales overcounts by an amount that
      depends on how firms are organised rather than on what they make. The
      spending formula is correct, but its minus sign is doing bookkeeping, not
      economics. An import changes GDP only through the home production it
      displaces, anywhere from none of its value to all of it, and the trade
      line in a GDP release reads the same across that whole range.
    </p>
    <p>
      So when a release says that trade subtracted a point from growth, the
      useful question is what the imports replaced, and the answer is in the
      other lines of the table, not in that one.
    </p>
    <p>Thanks for reading!</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Sources and notes</h3>
    <p>
      The three approaches to GDP, value added and double counting are covered
      in every introductory macroeconomics text. The point that imports enter
      GDP only as a correction is made in "Do imports subtract from GDP?", FRED
      Blog, Federal Reserve Bank of St. Louis, 13 September 2018. The import
      content of consumer spending is from Galina Hale, Bart Hobijn, Fernanda
      Nechio and Doris Wilson, "How much do we spend on imports?", FRBSF
      Economic Letter 2019-01, 7 January 2019.
    </p>
    <p>
      The island, its ledger, the four events, the chain identity as stated here
      and the lab are mine. Every number in this article is re-derived by
      <span class="mono">verify/check-numbers.mjs</span> from the same modules
      the page draws from, the three approaches are computed from the ledger by
      three readers that share no code, and the figures are checked in rendered
      pixels at 390px and 1280px. The page is built on the scaffold and design
      system of Amazon's
      <a href="https://mlu-explain.github.io/">MLU-Explain</a>, used under CC
      BY-SA 4.0.
    </p>
  </section>
</main>

<style>
  main {
    padding-bottom: 4rem;
  }

  .fig-wrap {
    max-width: 620px;
    margin: 1.5rem auto;
    padding: 0.9rem 16px;
    background: #fff;
    border: 1px solid #e3e7ea;
    border-radius: 6px;
  }

  @media screen and (max-width: 660px) {
    .fig-wrap {
      margin: 1.5rem 1rem;
    }
  }

  .eq {
    margin: 0.6rem 0;
  }

  .mono {
    font-family: var(--font-mono);
    font-size: 0.9em;
  }
</style>
