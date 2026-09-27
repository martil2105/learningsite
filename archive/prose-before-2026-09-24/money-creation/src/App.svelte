<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import BalanceSheets from "./Components/BalanceSheets.svelte";
  import InStepLab from "./Components/InStepLab.svelte";
  import MultiplierLab from "./Components/MultiplierLab.svelte";
  import katexify from "./katexify.js";

  const flows = katexify(`\\Delta R_i = s_i \\sum_j L_j - L_i`, true);
  const drainF = katexify(`L_j = \\varphi\\,\\frac{s_j}{s_i}\\,L_i \\;\\;(j \\ne i) \\quad\\Longrightarrow\\quad \\Delta R_i = -(1 - s_i)(1 - \\varphi)\\,L_i`, true);
  const system = katexify(`\\sum_i \\Delta R_i = 0, \\qquad \\Delta D = \\sum_i L_i`, true);
  const mult = katexify(`\\frac{M}{B} = \\frac{C + D}{C + R} = \\frac{1 + c}{c + r}, \\qquad c = \\frac{C}{D},\\; r = \\frac{R}{D}`, true);
  const rounds = katexify(`\\Delta M = \\Delta B\\,(1 + q + q^2 + \\cdots) = \\frac{\\Delta B}{1 - q} = \\frac{1 + c}{c + r}\\,\\Delta B, \\qquad q = \\frac{1 - r}{1 + c}`, true);
  const phiI = katexify(`\\varphi`);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Ask a banker where the money for a loan comes from and you'll usually get
      the answer that a bank lends out its depositors' money, and so needs
      deposits before it can lend. Ask a textbook where money comes from and
      you'll often get a second story: the central bank supplies reserves, and
      banks lend them out again and again until each euro of reserves has become
      several euros of money, a process called the
      <span class="bold">money multiplier</span>.
    </p>
    <p>
      Both stories describe something real, but not the thing they're usually
      taken to describe. The quickest way to see why is to follow a single loan
      through the books. Let's take an island with three banks, called Anchor,
      Birch and Cedar, holding half, 30% and 20% of the island's deposits, and
      a central bank where each of them keeps an account. The balance in that
      account is called <span class="bold">reserves</span>, and it's what banks
      use to pay each other.
    </p>
  </section>

  <BalanceSheets />

  <section class="body-text">
    <h3 class="body-header">Where the loan's money comes from</h3>
    <p>
      Step through the first move. When Anchor lends €100 to a bakery, it
      doesn't take €100 from anyone's account. It writes two entries at once, a
      €100 loan among its assets and a €100 deposit for the bakery among its
      liabilities, and that's all a loan is. Nobody else's deposit is smaller,
      so the island has €100 more money than it did a moment ago. Money held in
      bank accounts is created when banks lend, and destroyed when loans are
      repaid.
    </p>
    <p>
      Then the bakery spends the money. Its suppliers bank all over the island,
      and since Anchor holds half the deposits, about half the payments come
      back to Anchor and half go to Birch and Cedar. Every payment that leaves
      Anchor has to be settled in reserves, so Anchor loses €50 of reserves,
      which in this example is every reserve it had. That's the banker's story,
      and it's completely right from where the banker sits. A bank that lends
      alone loses most of the loan in reserves and has to replace them, by
      attracting deposits or by borrowing, so from the inside it looks as if
      deposits have to come first.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Lending in step</h3>
    <p>
      Now take the last two steps. Birch and Cedar lend too, €60 and €40, in
      proportion to their size, and their borrowers spend the money the same way
      the bakery did. Payments now flow in every direction, and they cancel.
      Every bank ends with exactly the reserves it started with, and there are
      €200 more deposits on the island, which is exactly the €200 that was lent.
    </p>
    <p>
      So whether a loan drains a bank's reserves depends on what the other
      banks are doing. The lab below makes that the control. Anchor lends €100,
      and the slider sets how far Birch and Cedar lend in step with it, from not
      at all to fully in proportion to their size. You can also change how big
      Anchor is.
    </p>
  </section>

  <InStepLab />

  <section class="body-text">
    <p>
      Anchor's loss is a straight line in the slider. Alone, it loses
      (1&nbsp;−&nbsp;its share) of the loan, which is €50 at half the market and
      €90 if it holds a tenth. Fully in step, it loses nothing at all. In between,
      it loses exactly (1&nbsp;−&nbsp;its share) × (1&nbsp;−&nbsp;how far the
      others follow) × the loan, and the second panel shows that every euro
      Anchor loses, some other bank gains. Reserves only move between banks; the
      system as a whole can't lose them by lending.
    </p>
    <p>
      John Maynard Keynes made this point in 1930 in <i>A Treatise on Money</i>,
      where he wrote that "there is no limit to the amount of bank money which
      the banks can safely create provided that they move forward in step".
      That's not a loophole. It's why the banking system doesn't need deposits in order to
      lend: the loans create the deposits, and when the banks move together, the
      reserves they pay out to each other come straight back.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">So what does limit lending?</h3>
    <p>
      If deposits don't, something else must, and in practice it's a list of
      prices and rules rather than a quantity. A bank that loses reserves can
      borrow them from other banks or the central bank at close to the central
      bank's interest rate, so the interest rate is the price of lending out of
      step. Deposits are usually a cheaper way of holding on to reserves, which
      is why banks compete for them, and why the banker's story is really about
      cost rather than about a hard limit. Beyond that, banks need enough
      capital to absorb losses on their loans, and borrowers who want to borrow
      at the rates on offer. In the United States, the Federal Reserve set
      reserve requirements to zero in March 2020, so the requirement that the
      textbook story leans on doesn't exist there at all.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The multiplier is a ratio</h3>
    <p>
      That brings us back to the textbook. The money multiplier is usually
      written as a formula linking broad money, <i>M</i>, which is cash held by
      the public plus deposits, to the <span class="bold">monetary base</span>,
      <i>B</i>, which is cash plus reserves. If the public holds a fraction
      <i>c</i> of its deposits in cash, and banks hold a fraction <i>r</i> as
      reserves, then
    </p>
    <p class="eq">{@html mult}</p>
    <p>
      With both fractions at a tenth, that's 5.5. And this isn't a theory: it's
      an identity, true of any set of balance sheets at any moment, because
      <i>c</i> and <i>r</i> are defined from the same numbers as <i>M</i> and
      <i>B</i>. The textbook story adds a causal claim on top, that the central
      bank sets <i>B</i> and banks then lend until <i>r</i> is back at its
      required minimum. The lab below runs that story next to one where reserves
      are already plentiful, and checks the ratio in both.
    </p>
  </section>

  <MultiplierLab />

  <section class="body-text">
    <p>
      In the first panel, the central bank adds €100 of reserves and banks lend
      out every euro above the required tenth, round after round, while the
      public keeps a tenth of its money in cash. Money grows towards €550,
      exactly 5.5 times the new reserves, and the ratio stays at 5.5 because the
      banks end up holding exactly the required reserves again.
    </p>
    <p>
      In the second panel, reserves are already plentiful, as they have been in
      most large economies since the central banks' asset purchases after 2008.
      The central bank buys €500 of bonds from a pension fund, which is called
      <span class="bold">quantitative easing</span>. The fund's bank credits the
      fund with a €500 deposit and receives €500 of reserves, and that's all
      that happens. Money rises by €500, not by the €2,750 the multiplier would
      predict, and the measured ratio falls from 5.5 to 2.29. The identity still
      holds exactly, as the last column shows, because banks are now holding
      far more reserves per euro of deposits than any requirement asks for.
    </p>
    <p>
      So the multiplier is never wrong as arithmetic. What it can't tell you is
      which way the causation runs, and in a system where banks lend when it's
      profitable and the central bank supplies reserves at its chosen interest
      rate, it mostly runs from loans to deposits to reserves, the opposite way
      from the textbook story.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The maths</h3>
    <p>
      With bank <i>i</i> holding a share <i>s<sub>i</sub></i> of deposits and
      lending <i>L<sub>i</sub></i>, and every euro spent landing at bank
      <i>j</i> with probability <i>s<sub>j</sub></i>, bank <i>i</i>'s net reserve
      flow is
    </p>
    <p class="eq">{@html flows}</p>
    <p>
      If the other banks lend a fraction {@html phiI} of what would keep them in
      proportion to bank <i>i</i>, this simplifies to
    </p>
    <p class="eq">{@html drainF}</p>
    <p>and summing over banks gives</p>
    <p class="eq">{@html system}</p>
    <p>
      so the system's reserves never change and its deposits rise by exactly
      what it lends. In the textbook process, each round lends out a fraction
      <i>q</i> = (1&nbsp;−&nbsp;<i>r</i>)&#8202;/&#8202;(1&nbsp;+&nbsp;<i>c</i>)
      of what the previous round lent, because the rest leaves as cash or is
      held against the new deposits, and the geometric series sums to the ratio
      above:
    </p>
    <p class="eq">{@html rounds}</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      Three banks on an island leave out a lot of real banking, and a few of the
      omissions matter here.
    </p>
    <p>
      First, payments don't land at banks exactly in proportion to their size.
      A bank whose customers mostly pay each other keeps more of its own loans,
      and one whose borrowers pay a single large supplier elsewhere keeps less.
      Second, people withdraw some of their money as cash, which drains reserves
      from the whole system, not just from one bank. Third, not all lending is
      done by banks. When a pension fund or a bond investor lends, existing
      deposits change hands and no new money is created. And finally, the
      textbook process isn't imaginary. Where reserves are scarce and a
      requirement binds, banks really do have to hold reserves against new
      deposits, but even then central banks have generally supplied the
      reserves needed at their target interest rate rather than fixing the
      quantity and letting the rate go wherever it goes.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Where this leaves the two stories</h3>
    <p>
      The banker is right that a bank lending alone loses most of its loan in
      reserves, exactly (1&nbsp;−&nbsp;its share) of it, and has to find them
      somewhere. The textbook is right that money divided by the monetary base
      equals (1&nbsp;+&nbsp;<i>c</i>)&#8202;/&#8202;(<i>c</i>&nbsp;+&nbsp;<i>r</i>).
      Neither is a statement about the banking system as a whole, where loans
      create deposits, banks lending in step lose no reserves at all, and the
      multiplier holds just as exactly when the arrow runs from loans to
      reserves as when it runs the other way.
    </p>
    <p>Thanks for reading!</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Sources and notes</h3>
    <p>
      The account of money creation here follows Michael McLeay, Amar Radia and
      Ryland Thomas, "Money creation in the modern economy", <i>Bank of England
      Quarterly Bulletin</i> 2014 Q1. The point about banks moving forward in
      step is from John Maynard Keynes, <i>A Treatise on Money</i> (1930),
      volume 1, page 23 of the edition in his Collected Writings. The
      Federal Reserve's reduction of reserve requirement ratios to zero took
      effect on 26 March 2020.
    </p>
    <p>
      The three banks, their balance sheets, the in-step formula as stated here
      and every value quoted are mine. Every number in this article is re-derived
      by <span class="mono">verify/check-numbers.mjs</span> from the same modules
      the page draws from, the in-step formula is checked against the full
      settlement computed bank by bank, and the figures are checked in rendered
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

  .eq {
    margin: 0.6rem 0;
  }

  .mono {
    font-family: var(--font-mono);
    font-size: 0.9em;
  }
</style>
