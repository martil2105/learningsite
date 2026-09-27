<section id="intro">
  <h1 id="intro-hed">Article scaffold</h1>
  <h1 class="intro-sub">
    Plumbing only: a measured figure that scales, one manipulable object, a
    scroll section and rendered maths — enough for the checks to have something
    real to fail on. Replace all of it.
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
    Never a fixed font-size here. The house default of 9.2vw was sized for a
    seven-letter word and gives a long title a horizontally scrolling phone — and
    a heading overflows the SCREEN rather than any box, so nothing else catches
    it. Clamp, wrap, and measure the rendered LINES with a Range in
    check-browser.mjs; the element box is only the container width.
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
