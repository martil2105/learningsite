<section id="intro">
  <h1 id="intro-hed">Population Stability Index</h1>
  <h1 class="intro-sub">
    A PSI reading of 0.05 can mean a population that didn't move at all, or one
    that has quietly cost you eight percent of your approvals. As we'll see,
    which of those it is depends on a number that isn't in the formula.
  </h1>
  <h3 id="intro__date">Martin Le, September 2026</h3>
</section>

<style>
  #intro {
    max-width: 680px;
    margin: 1rem auto;
    text-align: center;
    padding: 1rem 1rem 0 1rem;
  }

  /*
    Twenty-six characters. The house default of 9.2vw was sized for a
    seven-letter word and would give this one a horizontally scrolling phone,
    and a heading overflows the SCREEN rather than any box, so nothing else
    catches it. This wraps instead - two lines on a laptop, three on a phone -
    and verify/check-browser.mjs measures every rendered LINE with a Range
    rather than the element, since the element box is just the container.
  */
  #intro-hed {
    font-size: clamp(1.55rem, 6.6vw, 2.9rem);
    line-height: 1.1;
    margin: 5px auto 0 auto;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    max-width: 100%;
    text-wrap: balance;
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
    padding: 1.5rem 0.25rem;
    font-family: var(--font-main);
  }

  #intro__date {
    font-size: 1.05rem;
    margin: 5px 0 0 0;
    padding-bottom: 1rem;
    color: black;
    font-family: var(--font-main);
  }

  @media screen and (max-width: 950px) {
    #intro-hed { letter-spacing: 0.4px; }
    .intro-sub { font-size: 1.12rem; padding: 1rem 0.25rem; }
  }
</style>
