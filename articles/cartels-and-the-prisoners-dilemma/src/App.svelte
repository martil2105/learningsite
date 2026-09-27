<script>
  /* App.svelte for cartels-and-the-prisoners-dilemma */
  import Meta from "./Components/Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import TheQuestion from "./Components/TheQuestion.svelte";
  import TheAnswer from "./Components/TheAnswer.svelte";
  import MergerLab from "./Components/MergerLab.svelte";
  import FreeRideFigure from "./Components/FreeRideFigure.svelte";
  import ThresholdFigure from "./Components/ThresholdFigure.svelte";
  import WelfareFigure from "./Components/WelfareFigure.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import {
    A_DEFAULT as a,
    C_DEFAULT as c,
    piN,
    member,
    outsider,
    price,
    consumerSurplus,
    totalSurplus,
    kMin,
    maxOutsiders,
  } from "./cournot.js";

  const pi0Eq = katexify("\\pi(n) = \\frac{(a - c)^2}{(n + 1)^2}", true);
  const memEq = katexify("\\pi_{\\text{member}}(n, k) = \\frac{(a - c)^2}{k (n - k + 2)^2}", true);
  const outEq = katexify("\\pi_{\\text{outsider}}(n, k) = \\frac{(a - c)^2}{(n - k + 2)^2}", true);
  const ratioEq = katexify("\\pi_{\\text{outsider}} = k \\cdot \\pi_{\\text{member}}", true);
  const condEq = katexify("k (n - k + 2)^2 < (n + 1)^2", true);
  const mMaxEq = katexify("m_{\\text{max}} \\approx \\sqrt{n} - 2", true);

  // Every number in the prose comes from the model.
  const fmt = (v, d = 0) => v.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const pi5 = piN(5); // 225, each of five competing firms
  const loss = (k) => (100 * (1 - member(5, k) / pi5)).toFixed(0);
  const m3 = member(5, 3);
  const o3 = outsider(5, 3);
  const m4 = member(5, 4);
  const o4 = outsider(5, 4);
  const m5 = member(5, 5);
  const p1 = price(5, 1);
  const p4 = price(5, 4);
  const csLoss = consumerSurplus(5, 1) - consumerSurplus(5, 4);
  const profitGain = totalSurplus(5, 4) - consumerSurplus(5, 4) - (totalSurplus(5, 1) - consumerSurplus(5, 1));
  const dwl = totalSurplus(5, 1) - totalSurplus(5, 4);
  const k20 = kMin(20);
  const k100 = kMin(100);
  const m100 = maxOutsiders(100);
  const k1000 = kMin(1000);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's say we run one of five firms that all make the same product. Each
        week, every firm decides how much to make, and the price settles
        wherever buyers will take the lot. If we could agree with the other four to make less,
        the price would rise and we'd all share something close to a monopoly's
        profit. An agreement like that is called a
        <span class="bold">cartel</span>. Competition law forbids it in most
        places, but let's set the law aside for now and ask a simpler question:
        would it even pay?
      </p>
      <p>
        First courses usually tell the cartel story as a
        <span class="bold">prisoner's dilemma</span>, a game in which the
        players would all do better if they cooperated, but each one does
        better still by breaking ranks. Each member gains by quietly making more
        than its quota, even though they'd all do better if every member kept
        to it, and so cartels tend to fall apart. That story is right as far as it goes. In 1983, Stephen
        Salant, Sheldon Switzer and Robert Reynolds pointed out a problem that
        comes even before anyone cheats. In a simple model of competition, a cartel
        doesn't pay its members unless it includes almost every firm in the
        market.
      </p>
      <p>
        Why would joining forces backfire, and why is staying out so tempting?
        Before we build the model, let's have a guess. What do you think
        happens to the two firms below?
      </p>
    </section>

    <TheQuestion />

    <section class="body-text">
      <h3 class="body-header">How our firms compete</h3>
      <p>
        Let's set the model up properly. Each of our firms picks how much to
        make, taking everyone else's output as given, and the price is whatever
        sells the total. This is called <span class="bold">Cournot
        competition</span>. Demand is a straight line, P = a − Q, where Q is the
        total output, and every unit costs c to make. In our example,
        a = {a} and c = {c}.
      </p>
      <p>
        If n firms compete this way, each one makes q = (a − c)/(n + 1), and
        each earns a profit of
      </p>
      {@html pi0Eq}
      <p>
        With our five firms, that's {a - c}² ÷ 6² = {fmt(pi5)} each, the profit
        from the guess above.
      </p>
      <p>
        Now suppose k of our n firms form a cartel. They agree to set their
        output together, so as far as the market can tell, they're a single
        firm. That leaves n − k + 1 competitors: the cartel, plus the n − k
        firms that stayed out, which we'll call the
        <span class="bold">outsiders</span>.
      </p>
      <p>
        To see what the outsiders do, we need one more idea. Each firm's best
        output depends on how much the rest of the market makes, and the line
        that links the two is called its <span class="bold">reaction
        curve</span>. In our model it's q = (a − c − R)/2, where R is the total
        output of every other firm.
      </p>
    </section>

    <TheAnswer />

    <section class="body-text">
      <h3 class="body-header">What members and outsiders earn</h3>
      <p>
        The reaction curve slopes down, and that's the heart of the problem.
        When the cartel makes less, each outsider makes more, which holds back
        the rise in the price that the cartel was paying for.
      </p>
      <p>
        Because our cartel acts as one Cournot firm, it ends up making what one
        ordinary firm would make in a market of n − k + 1 firms. Its members
        split that one firm's profit equally, so each member earns
      </p>
      {@html memEq}
      <p>
        Each outsider is one of those n − k + 1 firms too, but it keeps its
        profit to itself:
      </p>
      {@html outEq}
      <p>
        If we put the two formulas side by side, we can see that the outsider's
        profit is the member's profit times k:
      </p>
      {@html ratioEq}
      <p>
        This holds for any market and any size of cartel, so an outsider always
        earns exactly k times what a member earns. The cartel makes one firm's
        profit and splits it k ways, while each outsider makes the same profit
        and keeps all of it. You can try it in the lab below: drag the two
        sliders and compare the member's card with the outsider's.
      </p>
    </section>

    <MergerLab />

    <section class="body-text">
      <h3 class="body-header">When does a cartel pay?</h3>
      <p>
        A cartel is only worth joining if each member's share beats what it
        earned under competition. If we compare the member's formula with π(n)
        and tidy up, that's the condition
      </p>
      {@html condEq}
      <p>
        Let's try it on our five-firm market. If you set the lab to five firms
        and drag the cartel from two firms up to five, you'll see the same
        numbers as the table below. A cartel of two leaves each member with
        {loss(2)}% less profit than before, and a cartel of three leaves each
        with {loss(3)}% less.
      </p>
      <p>
        A cartel of four sits right on the edge. Each member earns {fmt(m4)},
        the same as under competition, so the four firms have cut their output
        and gained nothing for it. Only when all five join, and the cartel
        becomes a monopoly, do the members earn more than before.
      </p>
    </section>

    <FreeRideFigure />

    <section class="body-text">
      <h3 class="body-header">Why every member would rather be outside</h3>
      <p>
        This brings us to the <span class="bold">free-rider problem</span>. A
        free rider gets the benefit of a group's effort without paying for it,
        and here the outsider is the free rider: the cartel cuts its output, and
        the outsider sells more at the higher price.
      </p>
      <p>
        Let's go back to our cartel of four. Each member earns {fmt(m4)}, while
        the one outsider earns {fmt(o4)}, four times as much. So each member
        would rather be the firm that stayed out. But if one of the four leaves,
        the cartel shrinks to three, and the table above shows what happens
        next. The three who stay earn {fmt(m3, 2)} each, while the firm that
        left earns {fmt(o3, 2)} as one of two outsiders.
      </p>
      <p>
        That's the dilemma in our title. All five of our firms would earn
        {fmt(m5)} each in a cartel of five, far more than the {fmt(pi5)} they
        earn competing. But if the other four hold together, the fifth earns
        {fmt(o4)} by staying out. Everyone would be better off in, and each
        firm is better off out, so a cartel that relies on firms choosing to
        join tends to come apart.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Bigger markets need bigger cartels</h3>
      <p>
        So how many firms can stay out before a cartel stops paying? If we call
        that number m, the condition above gives an answer that's close to
      </p>
      {@html mMaxEq}
      <p>
        It isn't exact, but it's never more than one firm out for the markets in
        the table below, and it tells you how the number grows. You can see
        it in the lab, too: with 20 firms, the banner doesn't turn
        blue until you drag the cartel up to {k20} members. In a market of
        100 firms, at most {m100} can stay out, so {k100} of the 100 have to
        join. In a market of 1,000 firms, the cartel needs {fmt(k1000)} of them.
      </p>
      <p>
        That was the point Salant, Switzer and Reynolds made. In our model, a
        cartel has to take in almost the whole market before it pays, so in a
        market with hundreds of sellers, it's hard to see one forming just
        because firms choose to join. Real cartels have other ways to hold
        together, and we'll come back to those below.
      </p>
    </section>

    <ThresholdFigure />

    <section class="body-text">
      <h3 class="body-header">Who pays for a cartel?</h3>
      <p>
        When a cartel does form, who pays for it? Let's compare our five
        competing firms with the cartel of four. The price rises from
        {fmt(p1)} to {fmt(p4)}, and consumers lose {fmt(csLoss, 2)} of
        <span class="bold">consumer surplus</span>, the value buyers get over
        and above what they pay.
      </p>
      <p>
        So where does that money go? The four members earn {fmt(m4)} each, just
        as before, so none of it reaches them. Between them, our firms earn
        {fmt(profitGain)} more than before, and all of it goes to the outsider,
        whose profit rises from {fmt(pi5)} to {fmt(o4)}. The other {fmt(dwl, 2)} goes to no one. It's a
        <span class="bold">deadweight loss</span>, the value of the sales that
        stop happening because the price is higher, measured against our five
        firms competing.
      </p>
    </section>

    <WelfareFigure />

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Our model is deliberately simple, and three of its simplifications
        matter for real cartels.
      </p>
      <p>
        First, our firms meet only once. Real firms compete week after week,
        and that changes the picture. When the game repeats, the threat of a
        price war can hold a cartel together, as long as the firms care enough
        about their future profits (Friedman, 1971). So our model shows why a
        cartel is fragile, not that it can't last.
      </p>
      <p>
        Second, all our firms have the same costs. If one firm can make the
        product much more cheaply than the rest, it often does better by
        competing hard than by holding back its output in a cartel.
      </p>
      <p>
        And finally, our firms choose quantities. If they chose prices instead,
        which is called <span class="bold">Bertrand competition</span>, a firm
        could take the whole market by pricing a little below the rest. Any
        price above cost would then be undercut straight away, unless the firms
        can't make enough to serve everyone.
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
