<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import TwoTowns from "./Components/TwoTowns.svelte";
  import FlowCross from "./Components/FlowCross.svelte";
  import RatioLab from "./Components/RatioLab.svelte";
  import FreezeRun from "./Components/FreezeRun.svelte";
  import katexify from "./katexify.js";

  const law = katexify(`u_{t+1} = u_t + s\\,(1 - u_t) - f\\,u_t`, true);
  const steady = katexify(`u^{*} = \\frac{s}{s + f} = \\frac{1}{1 + f/s}`, true);
  const gap = katexify(`u_{t} - u^{*} = (1 - s - f)^{t}\\,(u_0 - u^{*}), \\qquad t_{1/2} = \\frac{\\ln \\tfrac12}{\\ln(1 - s - f)}`, true);
  const dur = katexify(`\\text{average spell} = \\frac{1}{f}, \\qquad \\Pr(\\text{out } k \\text{ months or more}) = (1 - f)^{k}`, true);
  const logs = katexify(`d \\ln u^{*} = (1 - u^{*})\\,(d \\ln s - d \\ln f)`, true);
  const sI = katexify(`s`);
  const fI = katexify(`f`);
</script>

<Meta />
<Logo />
<Title />

<main>
  <section class="body-text">
    <p>
      Here are two towns with exactly the same unemployment rate. In Eastport,
      6% of the labour force is out of work, and in Millbrook, 6% of the labour
      force is out of work too. If the unemployment rate is the number you
      follow, the two towns look identical.
    </p>
    <p>
      They aren't. The figure below sorts each town's unemployed by how long
      they've been looking for work, and the two pictures have almost nothing
      in common.
    </p>
  </section>

  <TwoTowns />

  <section class="body-text">
    <p>
      In Eastport, most people who lose a job find another within a couple of
      months, and almost nobody has been out of work for a year. In Millbrook,
      the average spell lasts more than ten months, and nearly a third of the
      unemployed have been looking for a year or more. Same rate, very
      different towns. To see how that can happen, we need to stop thinking of
      unemployment as a number and start thinking of it as a flow.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">A stock with two flows</h3>
    <p>
      Every month, some people who have jobs lose them, and some people who are
      unemployed find work. Let's write {@html sI} for the
      <span class="bold">separation rate</span>, the share of workers who lose or
      leave their job in a month, and {@html fI} for the
      <span class="bold">job-finding rate</span>, the share of the unemployed who
      find a job in a month. In Eastport those are 3% and 47%; in Millbrook
      they're 0.6% and 9.4%. The unemployment rate is a stock, like water in a
      bath, and those two rates are the tap and the drain.
    </p>
    <p>
      The figure below plots both flows against the unemployment rate, counted
      in people per 1,000 workers. The more people are unemployed, the more of
      them find jobs each month, so the drain rises with the rate. The tap falls
      a little, since there are fewer people in work to lose a job. Where the
      two lines cross, as many people leave unemployment as enter it, and the
      rate stops moving. Drag the rate and read the verdict, then switch towns.
    </p>
  </section>

  <FlowCross />

  <section class="body-text">
    <p>
      Millbrook's lines are much flatter, because far fewer people move in
      either direction, but they cross in exactly the same place, at 6%. That's
      the whole trick. The rate where the flows balance is called the
      <span class="bold">steady-state</span> rate, and it works out to
    </p>
    <p class="eq">{@html steady}</p>
    <p>
      The second way of writing it says something the first one hides: the
      steady-state rate depends only on the ratio {@html fI}&#8202;/&#8202;{@html sI},
      and not at all on how big the two flows are. Both towns have a ratio of
      47 to 3, so both sit at 6%, even though five times as many people pass
      through Eastport's unemployment every month.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">One ratio, many labour markets</h3>
    <p>
      So let's draw every possible labour market at once. In the plane below,
      the job-finding rate runs across and the separation rate runs up, and each
      grey ray from the corner is a set of labour markets with the same
      unemployment rate. Drag the point anywhere along a ray and the rate won't
      change, but everything else in the readouts will.
    </p>
  </section>

  <RatioLab />

  <section class="body-text">
    <p>
      Moving out along a ray means more churn: more people losing jobs, more
      people finding them, shorter spells, and a faster economy. Moving in
      towards the corner means less of all of that, and longer spells for the
      people who are unemployed. The unemployment rate can't see any of it.
    </p>
    <p>
      Now try the two presets for shocks to Eastport. Doubling layoffs and
      halving hiring are very different events, but they land on the same ray,
      because both halve the ratio {@html fI}&#8202;/&#8202;{@html sI}. Both
      give a steady-state rate of exactly 11.3%. Not approximately, but exactly,
      since the rate depends on nothing else.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Unemployment can double while layoffs fall</h3>
    <p>
      That has an uncomfortable consequence for the usual story about
      recessions, in which unemployment rises because firms lay people off. The
      figure below runs Eastport month by month after each of the two shocks.
      Press play, or step through the months.
    </p>
  </section>

  <FreezeRun />

  <section class="body-text">
    <p>
      When hiring halves, unemployment climbs from 6% towards 11.3%, almost
      doubling, and the number of people losing their jobs each month doesn't
      rise at all. It falls slightly, from 28.2 to 26.6 per 1,000 workers, just
      because fewer people have jobs to lose. When layoffs double instead, the
      same 11.3% arrives faster, and this time it comes with a jump in job
      losses, to 56.4 per 1,000 workers in the first month.
    </p>
    <p>
      So a rising unemployment rate with no rise in layoffs isn't a
      contradiction. It's what a hiring freeze looks like. For the United
      States, Robert Shimer estimated that since 1948 changes in the chance of
      finding a job have accounted for about three-quarters of the movements in
      the unemployment rate, and changes in the chance of losing one for about
      a quarter. Other researchers, including Michael Elsby, Ryan Michaels and
      Gary Solon, found that rising job losses matter more than that, especially
      at the start of recessions. Both sides use the same arithmetic, and it's
      the arithmetic in this article.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">How fast does the rate catch up?</h3>
    <p>
      There's one more thing the rate hides, which is how quickly it responds.
      Each month, the gap between the actual rate and the steady state shrinks
      by the fraction {@html sI} + {@html fI}, so the gap halves every
    </p>
    <p class="eq">{@html gap}</p>
    <p>
      months. In Eastport, where {@html sI} + {@html fI} is exactly one half,
      that's exactly one month, so the unemployment rate is always a close
      reading of this month's flows. In Millbrook, it's 6.6 months, so after a
      shock the rate is still catching up half a year later. The same lag shows
      in the run above: when layoffs double, the gap to 11.3% halves in 0.9
      months, and when hiring halves, in 2.3.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">The maths</h3>
    <p>
      With a fixed labour force, the unemployment rate moves by the inflow minus
      the outflow:
    </p>
    <p class="eq">{@html law}</p>
    <p>
      Setting the change to zero gives the steady state, which depends only on
      {@html fI}&#8202;/&#8202;{@html sI}. The distance from it shrinks
      geometrically, which gives the half-life above. If every unemployed person
      has the same chance {@html fI} of finding a job each month, spells are
      geometric, so
    </p>
    <p class="eq">{@html dur}</p>
    <p>
      and finally, in logs, a proportional rise in {@html sI} and a proportional
      fall in {@html fI} move the steady-state rate by the same amount:
    </p>
    <p class="eq">{@html logs}</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">What this costs you</h3>
    <p>
      Two numbers per town is a very small model of a labour market, and a few
      of the things it leaves out matter here.
    </p>
    <p>
      First, people also move in and out of the labour force, and in real data
      those flows are as large as the ones between work and unemployment, so a
      proper accounting uses three states rather than two. Second, everybody
      here has the same chance of finding a job however long they've been
      looking. In practice the chance falls the longer someone is unemployed,
      which makes long-term unemployment more common than these formulas say.
      Third, the flows are measured once a month, so someone who loses a job
      and finds another between two surveys never shows up at all, and
      correcting for that makes both measured rates larger. And finally, the
      steady state is where the rate is heading, not where it is. In a
      high-turnover labour market the two are close, but in a low-turnover one
      they can be months apart.
    </p>
    <p>
      None of that changes the main result, which is an identity of this model
      and holds for any two rates: the steady-state unemployment rate is a
      function of their ratio and nothing else.
    </p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Where this leaves the rate</h3>
    <p>
      The unemployment rate is a very useful number, and it's the right one for
      asking how many people are out of work right now. But it's a ratio of two
      flows, so it can't tell a churning labour market from a stagnant one, it
      can't tell a wave of layoffs from a hiring freeze, and it can't tell you
      whether the people counted in it have been looking for two months or two
      years. For any of those questions, you need the flows themselves.
    </p>
    <p>Thanks for reading!</p>
  </section>

  <section class="body-text">
    <h3 class="body-header">Sources and notes</h3>
    <p>
      The flow approach to unemployment is standard. The decomposition quoted
      above is from Robert Shimer, "Reassessing the ins and outs of
      unemployment", <i>Review of Economic Dynamics</i> 15(2), 2012, pages
      127–148, and the counterpoint from Michael W. L. Elsby, Ryan Michaels and
      Gary Solon, "The ins and outs of cyclical unemployment", <i>American
      Economic Journal: Macroeconomics</i> 1(1), 2009, pages 84–110.
    </p>
    <p>
      Eastport and Millbrook, their numbers, the figures and every value
      quoted are mine. Every number in this article is re-derived by
      <span class="mono">verify/check-numbers.mjs</span> from the same modules
      the page draws from, the closed forms are checked against a simulation of
      20,000 individual workers that shares no code with them, and the figures
      are checked in rendered pixels at 390px and 1280px. The page is built on
      the scaffold and design system of Amazon's
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
