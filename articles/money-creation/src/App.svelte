<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import BalanceSheets from "./Components/BalanceSheets.svelte";
  import InStepLab from "./Components/InStepLab.svelte";
  import MultiplierLab from "./Components/MultiplierLab.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import { drain, inStepLoans, multiplier, measured, qe } from "./banks.js";
  import { BANKS, LOAN, AGG, CURRENCY_RATIO, RESERVE_RATIO, INJECTION, QE_PURCHASE } from "./datasets.js";

  const flows = katexify(`\\Delta R_i = s_i \\sum_j L_j - L_i`, true);
  const drainF = katexify(`L_j = \\varphi\\,\\frac{s_j}{s_i}\\,L_i \\;\\;(j \\ne i) \\quad\\Longrightarrow\\quad \\Delta R_i = -(1 - s_i)(1 - \\varphi)\\,L_i`, true);
  const system = katexify(`\\sum_i \\Delta R_i = 0, \\qquad \\Delta D = \\sum_i L_i`, true);
  const mult = katexify(`\\frac{M}{B} = \\frac{C + D}{C + R} = \\frac{1 + c}{c + r}, \\qquad c = \\frac{C}{D},\\; r = \\frac{R}{D}`, true);
  const rounds = katexify(`\\Delta M = \\Delta B\\,(1 + q + q^2 + \\cdots) = \\frac{\\Delta B}{1 - q} = \\frac{1 + c}{c + r}\\,\\Delta B, \\qquad q = \\frac{1 - r}{1 + c}`, true);
  const phiI = katexify(`\\varphi`);

  // Every figure in the prose comes from the model the figures draw.
  const eur = (v) => `€${Math.round(v).toLocaleString("en-GB")}`;
  const pct = (v) => `${Math.round(100 * v)}%`;
  const [anchor, birch, cedar] = BANKS;
  const follow = inStepLoans(0, 1, LOAN);
  const lentInStep = follow.reduce((a, v) => a + v, 0);
  const m = multiplier(CURRENCY_RATIO, RESERVE_RATIO);
  const eased = qe(AGG, QE_PURCHASE);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Where does the money for a bank loan come from? If we ask a banker, we'll
        usually hear that a bank lends out its depositors' money, so it needs
        deposits before it can lend. If we ask a textbook where money comes
        from, we'll often get a second story. The central bank supplies reserves,
        and banks lend them out again and again until each euro of reserves has
        become several euros of money. That process is called the
        <span class="bold">money multiplier</span>.
      </p>
      <p>
        Both stories describe something real, but not quite the thing they're
        usually taken to describe. The quickest way to see why is to follow a
        single loan through the books. Our example is an island with three
        banks, called {anchor.name}, {birch.name} and {cedar.name}, which hold
        half, {pct(birch.share)} and {pct(cedar.share)} of the island's deposits.
        There's also a central bank, where each of our banks keeps an account.
        The balance in that account is called
        <span class="bold">reserves</span>, and it's what banks use to pay each
        other. You can step through the story below one move at a time.
      </p>
    </section>

    <BalanceSheets />

    <section class="body-text">
      <h3 class="body-header">Where the loan's money comes from</h3>
      <p>
        Let's start with the first move. When Anchor lends {eur(LOAN)} to a
        bakery, it doesn't take {eur(LOAN)} from anyone's account. Instead, it
        writes two entries at once: a {eur(LOAN)} loan among its assets, and a
        {eur(LOAN)} deposit for the bakery among its liabilities. That's all a
        loan is. Nobody else's deposit is smaller, so our island has {eur(LOAN)}
        more money than it did a moment ago. In other words, money held in bank
        accounts is created when banks lend, and it disappears again when loans
        are repaid.
      </p>
      <p>
        Next, let's watch the bakery spend the money. Its suppliers bank all over the island,
        and since Anchor holds half the deposits, about half the payments come
        back to Anchor and half go to Birch and Cedar. Every payment that leaves
        Anchor has to be settled in reserves, so Anchor loses
        {eur(-drain(anchor.share, 0, LOAN))} of reserves. In our example, that's
        every reserve it had.
      </p>
      <p>
        That's the banker's story, and from where the banker sits, it's
        completely right. A bank that lends alone loses most of the loan in
        reserves, and it has to replace them by attracting deposits or by
        borrowing. So from the inside, it looks as if deposits have to come
        first.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Lending in step</h3>
      <p>
        Now let's take the last two steps. Birch and Cedar lend too,
        {eur(follow[1])} and {eur(follow[2])}, in proportion to their size, and
        their borrowers spend the money the same way the bakery did. This time,
        payments flow in every direction, and they cancel. If you step to the
        end, you'll see that every bank finishes with exactly the reserves it
        started with, and our island has
        {eur(lentInStep)} more deposits, the same {eur(lentInStep)} that was
        lent.
      </p>
      <p>
        So we've found that whether a loan drains a bank's reserves depends on
        what the other banks are doing. Let's turn that into a control in the
        lab below. Anchor lends
        {eur(LOAN)}, and the first slider sets how far Birch and Cedar lend in
        step with it, from not at all to fully in proportion to their size. The
        second slider changes how big Anchor is.
      </p>
    </section>

    <InStepLab />

    <section class="body-text">
      <p>
        As you drag the first slider, you'll see Anchor's loss shrink along a
        straight line. Alone, it loses (1&nbsp;−&nbsp;its share) of the loan,
        which is {eur(-drain(anchor.share, 0, LOAN))} at half the market and
        {eur(-drain(0.1, 0, LOAN))} if it holds a tenth. Fully in step, it loses
        nothing at all. In between, it loses exactly
        (1&nbsp;−&nbsp;its share) × (1&nbsp;−&nbsp;how far the others follow) ×
        the loan.
      </p>
      <p>
        The second panel shows us where those reserves go. Every euro Anchor
        loses, some other bank gains, because reserves only move between banks.
        Our banking system as a whole can't lose them by lending.
      </p>
      <p>
        John Maynard Keynes made this point in 1930, in <i>A Treatise on
        Money</i>. He wrote that "there is no limit to the amount of bank money
        which the banks can safely create provided that they move forward in
        step". That's not a loophole. It's why our banking system doesn't need
        deposits in order to lend: the loans create the deposits, and when the
        banks move together, the reserves they pay out to each other come
        straight back.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">So what does limit lending?</h3>
      <p>
        If deposits don't limit how much our banks lend, something else must.
        In practice, it's a list of prices and rules rather than a quantity.
      </p>
      <p>
        Suppose one of our banks loses reserves. It can borrow them from other
        banks or from the central bank, at close to the central bank's interest
        rate. So the
        interest rate is the price of lending out of step. Deposits are usually a
        cheaper way of holding on to reserves, which is why banks compete for
        them. It's also why the banker's story is really about cost rather than
        about a hard limit.
      </p>
      <p>
        Beyond that, banks need enough capital to absorb losses on their loans,
        and they need borrowers who want to borrow at the rates on offer. In the
        United States, the Federal Reserve set reserve requirements to zero in
        March 2020, so the requirement that the textbook story leans on doesn't
        exist there at all.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The multiplier is a ratio</h3>
      <p>
        That brings us back to the textbook. The money multiplier is usually
        written as a formula linking broad money, <i>M</i>, to the
        <span class="bold">monetary base</span>, <i>B</i>. Broad money is cash
        held by the public plus deposits, and the base is cash plus reserves. If
        the public holds a fraction <i>c</i> of its deposits in cash, and banks
        hold a fraction <i>r</i> as reserves, then
      </p>
      {@html mult}
      <p>
        If we set both fractions at a tenth, that's {m.toFixed(1)}. And this isn't a
        theory, it's an identity. It's true of any set of balance sheets at any
        moment, because <i>c</i> and <i>r</i> are defined from the same numbers
        as <i>M</i> and <i>B</i>. The textbook story adds a causal claim on top:
        the central bank sets <i>B</i>, and banks then lend until <i>r</i> is
        back at its required minimum. The lab below runs that story next to one
        where reserves are already plentiful, so we can check the ratio in both.
      </p>
    </section>

    <MultiplierLab />

    <section class="body-text">
      <p>
        In the first panel, the central bank adds {eur(INJECTION)} of reserves.
        Our banks lend out every euro above the required tenth, round after
        round, while the public holds cash equal to a tenth of its deposits. If
        you drag the round, you'll see money grow towards
        {eur(m * INJECTION)}, which is {m.toFixed(1)} times the new reserves. The
        ratio stays at {m.toFixed(1)}, because the banks end up holding the
        required reserves again.
      </p>
      <p>
        In the second panel, reserves are already plentiful, as they have been in
        most large economies since the central banks' asset purchases after 2008.
        Here the central bank buys {eur(QE_PURCHASE)} of bonds from a pension
        fund, which is called <span class="bold">quantitative easing</span>. The
        fund's bank credits the fund with a {eur(QE_PURCHASE)} deposit and
        receives {eur(QE_PURCHASE)} of reserves, and that's all that happens. So
        money rises by {eur(QE_PURCHASE)}, not by the {eur(m * QE_PURCHASE)} the
        multiplier would predict, and the measured ratio falls from
        {m.toFixed(1)} to {measured(eased).toFixed(2)}.
      </p>
      <p>
        As the last column of the table shows us, the identity still holds
        exactly. It's just that our banks are now holding far more reserves per euro of
        deposits than any requirement asks for.
      </p>
      <p>
        So the multiplier is never wrong as arithmetic. What it can't tell us is
        which way the causation runs. Let's say banks lend when it's profitable,
        and the central bank supplies reserves at its chosen interest rate. Then
        the causation mostly runs from loans to deposits to reserves, which is
        the opposite way from the textbook story.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The maths</h3>
      <p>
        Let's write the settlement down in general. Say bank <i>i</i> holds a
        share <i>s<sub>i</sub></i> of deposits and lends <i>L<sub>i</sub></i>,
        and every euro spent lands at bank <i>j</i> with probability
        <i>s<sub>j</sub></i>. Then bank <i>i</i>'s net reserve flow is
      </p>
      {@html flows}
      <p>
        If the other banks lend a fraction {@html phiI} of what would keep them
        in proportion to bank <i>i</i>, this simplifies to
      </p>
      {@html drainF}
      <p>If we sum over all the banks, we get</p>
      {@html system}
      <p>
        So the system's reserves never change, and its deposits rise by what it
        lends.
      </p>
      <p>
        In the textbook process, each round lends out a fraction
        <i>q</i> = (1&nbsp;−&nbsp;<i>r</i>) / (1&nbsp;+&nbsp;<i>c</i>) of what
        the previous round lent, because the rest leaves as cash or is held
        against the new deposits. The geometric series then sums to the ratio we
        saw above:
      </p>
      {@html rounds}
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Our three banks on an island leave out a lot of real banking, and four of
        the omissions matter here.
      </p>
      <p>
        First, in our model payments land at each bank in proportion to its
        size, and real payments don't. A bank whose customers mostly pay each other keeps more of its own loans,
        and one whose borrowers pay a single large supplier elsewhere keeps less.
      </p>
      <p>
        Second, people withdraw some of their money as cash, which drains
        reserves from the whole system, not just from one bank.
      </p>
      <p>
        Third, not all lending is done by banks. When a pension fund or a bond
        investor lends, existing deposits change hands and no new money is
        created.
      </p>
      <p>
        And finally, the textbook process isn't imaginary. Where reserves are
        scarce and a requirement binds, banks really do have to hold reserves
        against new deposits. Even then, though, central banks have generally
        supplied the reserves needed at their target interest rate, rather than
        fixing the quantity and letting the rate go wherever it goes.
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
