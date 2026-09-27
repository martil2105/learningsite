<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import TwoTowns from "./Components/TwoTowns.svelte";
  import FlowCross from "./Components/FlowCross.svelte";
  import RatioLab from "./Components/RatioLab.svelte";
  import FreezeRun from "./Components/FreezeRun.svelte";
  import Conclusion from "./Components/Conclusion.svelte";
  import Resources from "./Components/Resources.svelte";
  import katexify from "./katexify.js";
  import { steady, halfLife, shockRun } from "./flows.js";
  import { TOWN_A, TOWN_B, FREEZE, LAYOFFS, RUN_MONTHS } from "./datasets.js";

  const law = katexify(`u_{t+1} = u_t + s\\,(1 - u_t) - f\\,u_t`, true);
  const steadyEq = katexify(`u^{*} = \\frac{s}{s + f} = \\frac{1}{1 + f/s}`, true);
  const gap = katexify(`u_{t} - u^{*} = (1 - s - f)^{t}\\,(u_0 - u^{*}), \\qquad t_{1/2} = \\frac{\\ln \\tfrac12}{\\ln(1 - s - f)}`, true);
  const dur = katexify(`\\text{average spell} = \\frac{1}{f}, \\qquad \\Pr(\\text{out } k \\text{ months or more}) = (1 - f)^{k}`, true);
  const logs = katexify(`d \\ln u^{*} = (1 - u^{*})\\,(d \\ln s - d \\ln f)`, true);
  const sI = katexify(`s`);
  const fI = katexify(`f`);
  const tHalf = katexify(`t_{1/2}`);
  const tI = katexify(`t`);

  // Every figure in the prose comes from the model the charts draw.
  const A = TOWN_A, B = TOWN_B;
  const pct = (v, d = 0) => `${(100 * v).toFixed(d)}%`;
  const uTown = pct(steady(A.s, A.f));
  const uShock = pct(steady(FREEZE.s, FREEZE.f), 1);
  const freeze = shockRun(A, FREEZE, RUN_MONTHS);
  const layoffs = shockRun(A, LAYOFFS, RUN_MONTHS);
  const perK = (v) => (1000 * v).toFixed(1);
  const hl = (s, f) => halfLife(s, f).toFixed(1);
</script>

<Meta />

<div class="page-wrap">
  <Logo />
  <Title />

  <main class="content-container">
    <section class="body-text">
      <p>
        Let's visit two towns, Eastport and Millbrook, that have exactly the same
        unemployment rate. In each of them, {uTown} of the labour force is out of
        work. If the unemployment rate is the number we follow, our two towns
        look identical.
      </p>
      <p>
        They aren't. The chart below sorts each town's unemployed by how long
        they've been looking for work, and you'll see that the two pictures have
        almost nothing in common.
      </p>
    </section>

    <TwoTowns />

    <section class="body-text">
      <p>
        In Eastport, most people who lose a job find another within a couple of
        months, and almost nobody has been out of work for a year. In Millbrook,
        the average spell lasts more than ten months, and nearly a third of the
        unemployed have been looking for a year or more. So our towns share a
        rate and not much else. To see how that can happen, we need to stop
        thinking of unemployment as a number and start thinking of it as a flow.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">A stock with two flows</h3>
      <p>
        Every month, some people who have jobs lose them, and some people who are
        unemployed find work. Let's write {@html sI} for the
        <span class="bold">separation rate</span>, the share of workers who lose
        or leave their job in a month, and {@html fI} for the
        <span class="bold">job-finding rate</span>, the share of the unemployed
        who find a job in a month. In Eastport, {@html sI} is {pct(A.s)} and
        {@html fI} is {pct(A.f)}, and in Millbrook they're {pct(B.s, 1)} and
        {pct(B.f, 1)}. We can think of the unemployment rate as a stock, like the
        water in a bath, with our two rates as the tap and the drain.
      </p>
      <p>
        The chart below plots both flows against the unemployment rate, counted
        in people per 1,000 workers. The more people are unemployed, the more of
        them find jobs each month, so the drain rises with the rate. The tap
        falls a little, because there are fewer people in work to lose a job.
        Where the two lines cross, as many people leave unemployment as enter it,
        and the rate stops moving. Drag the rate and read the verdict at the top,
        then switch towns.
      </p>
    </section>

    <FlowCross />

    <section class="body-text">
      <p>
        If you switch to Millbrook, you'll see that its lines are much flatter,
        because far fewer people move in either direction. But they cross in the same place,
        at {uTown}. We call the rate where the flows balance the
        <span class="bold">steady-state</span> rate, and it works out to
      </p>
      {@html steadyEq}
      <p>
        Writing it the second way shows us something the first way hides. The
        steady-state rate depends only on the ratio {@html fI} / {@html sI},
        and not at all on how big the two flows are. Both our towns have a ratio
        of {Math.round(100 * A.f)} to {Math.round(100 * A.s)}, so both sit at
        {uTown}, even though five times as many people pass through Eastport's
        unemployment every month.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">One ratio, many labour markets</h3>
      <p>
        So let's draw every possible labour market at once. In the plane below,
        the job-finding rate runs across and the separation rate runs up. Each
        grey ray from the corner is a set of labour markets with the same
        unemployment rate. If you drag the point along a ray, the rate won't
        change, but everything else in the readouts will.
      </p>
    </section>

    <RatioLab />

    <section class="body-text">
      <p>
        Moving out along a ray means more churn: more people losing jobs, more
        people finding them, shorter spells, and a rate that catches up faster
        after a shock. Moving in towards the corner means less of all of that,
        and longer spells for the people who are unemployed. Our unemployment
        rate can't see any of it.
      </p>
      <p>
        Now let's try the two presets for shocks to Eastport. Doubling layoffs
        and halving hiring are very different events, but you'll see that they
        land on the same ray, because both halve the ratio {@html fI} / {@html sI}.
        So they give exactly the same steady-state rate, {uShock}, and not just
        approximately the same, because the rate depends on nothing but the
        ratio.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">Unemployment can nearly double while layoffs fall</h3>
      <p>
        That has an uncomfortable consequence for the usual story about
        recessions, in which unemployment rises because firms lay people off.
        The chart below runs Eastport month by month after each of our two
        shocks. Press play, or step through the months, and keep an eye on the
        second panel as you go.
      </p>
    </section>

    <FreezeRun />

    <section class="body-text">
      <p>
        When hiring halves, unemployment climbs from {uTown} towards {uShock}, so
        it almost doubles. Yet the number of people losing their jobs each month
        doesn't rise at all. It falls slightly, from {perK(freeze[0].losers)} to
        {perK(freeze[RUN_MONTHS].losers)} per 1,000 workers, just because fewer
        people have jobs to lose. When layoffs double instead, we reach the same
        {uShock} faster, and this time it comes with a jump in job losses, to
        {perK(layoffs[1].losers)} per 1,000 workers in the first month.
      </p>
      <p>
        So a rising unemployment rate with no rise in layoffs isn't a
        contradiction. It's what a hiring freeze looks like. How much of a real
        recession works like this? For the United States, Robert Shimer
        estimated that since 1948, changes in the chance of finding a job have
        accounted for about three-quarters of the movements in the unemployment
        rate. Changes in the chance of losing one accounted for about a quarter.
        Other researchers, including Michael Elsby, Ryan Michaels and Gary
        Solon, found that rising job losses matter more than that, especially at
        the start of recessions. Both sides use the same arithmetic, and it's
        the arithmetic we've been using in our two towns.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">How fast does the rate catch up?</h3>
      <p>
        There's one more thing the rate hides, and that's how quickly it
        responds. Each month, the gap between the actual rate and the steady
        state shrinks by the fraction {@html sI} + {@html fI}. So here's the gap
        after {@html tI} months, and the number of months, {@html tHalf}, that it
        takes to halve:
      </p>
      {@html gap}
      <p>
        In Eastport, {@html sI} + {@html fI} is one half, so the gap halves in
        exactly one month. That's why Eastport's unemployment rate is always a
        close reading of this month's flows. In Millbrook, it takes
        {hl(B.s, B.f)} months, so after a shock the rate is still catching up
        half a year later. We saw the same lag in the run above: when layoffs
        double, the gap to {uShock} halves in {hl(LAYOFFS.s, LAYOFFS.f)} months,
        and when hiring halves, it takes {hl(FREEZE.s, FREEZE.f)}.
      </p>
    </section>

    <section class="body-text">
      <h3 class="body-header">The maths</h3>
      <p>
        Let's put the pieces together. With a fixed labour force, the
        unemployment rate moves by the inflow minus the outflow:
      </p>
      {@html law}
      <p>
        If we set the change to zero, we get the steady state, which depends only
        on {@html fI} / {@html sI}. The distance from it shrinks
        geometrically, and that gives us the half-life above. If every
        unemployed person has the same chance {@html fI} of finding a job each
        month, the length of a spell is geometric too, so
      </p>
      {@html dur}
      <p>
        And finally, in logs, a proportional rise in {@html sI} and a
        proportional fall in {@html fI} move the steady-state rate by the same
        amount:
      </p>
      {@html logs}
    </section>

    <section class="body-text">
      <h3 class="body-header">What this costs you</h3>
      <p>
        Two numbers per town is a very small model of a labour market, and four
        of the things it leaves out matter here.
      </p>
      <p>
        First, people also move in and out of the labour force. In real data,
        those flows are as large as the ones between work and unemployment, so a
        proper accounting uses three states rather than two.
      </p>
      <p>
        Second, everybody in our towns has the same chance of finding a job,
        however long they've been looking. In practice, the chance falls the
        longer someone is unemployed, which makes long-term unemployment more
        common than our formulas say.
      </p>
      <p>
        Third, the flows are measured once a month. Someone who loses a job and
        finds another between two surveys never shows up at all, and correcting
        for that makes both measured rates larger.
      </p>
      <p>
        And finally, the steady state is where the rate is heading, not where it
        is. In a high-turnover labour market the two are close, but in a
        low-turnover one they can be months apart.
      </p>
      <p>
        None of that changes our main result, which is an identity of this model
        and holds for any two rates: the steady-state unemployment rate depends
        on their ratio and nothing else.
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
