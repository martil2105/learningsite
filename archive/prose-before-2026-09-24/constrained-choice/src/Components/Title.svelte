<section id="intro">
  <h1 id="intro-hed">Constrained choice</h1>
  <h1 class="intro-sub">
    A pay rise makes free time more expensive, and it also makes you richer.
    Every course says these two effects pull in opposite directions and that
    theory can't tell us which one wins. But for the utility function every
    course draws, theory says exactly which one wins: neither.
  </h1>
  <h3 id="intro__date">Martin Le, September 2026</h3>
</section>

<style>
  #intro {
    max-width: 680px;
    margin: 1rem auto;
    text-align: center;
    padding-top: 1rem;
  }

  /*
    Viewport-relative, and the coefficient is for THIS title. "Constrained
    choice" is seventeen characters including the space; the house default of
    9.2vw was sized for seven, and a heading overflows the SCREEN rather than
    any box, so nothing else would catch it. check-browser.mjs measures the
    rendered text with a Range at 390px.
  */
  #intro-hed {
    font-size: clamp(1.35rem, 5.6vw, 3.2rem);
    margin-top: 5px;
    margin-bottom: 0;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    max-width: 100%;
    margin: auto;
    color: var(--squid-ink);
  }

  .intro-sub {
    text-wrap: balance;
    font-size: 1.35rem;
    line-height: 1.55;
    color: var(--squid-ink);
    text-align: center;
    margin: 1rem auto;
    opacity: 0.8;
    padding: 1.5rem 1rem;
    font-family: var(--font-main);
  }

  #intro__date {
    font-size: 1.05rem;
    margin: 0;
    margin-top: 5px;
    padding-bottom: 1rem;
    color: black;
    font-family: var(--font-main);
  }

  @media screen and (max-width: 950px) {
    #intro-hed { letter-spacing: 0.5px; }
    .intro-sub { font-size: 1.12rem; padding: 1rem 0.5rem; }
  }
</style>
