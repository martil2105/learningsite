<section id="intro">
  <h1 id="intro-hed">Measuring GDP</h1>
  <h1 class="intro-sub">
    GDP is usually written as C + I + G + X − M, and the minus sign in front of
    imports is often read as imports making a country poorer. As we'll see,
    it's a correction rather than a cost: an import changes GDP only through the
    home production it replaces, and the trade line in a GDP release can't tell
    you how much that was.
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
    Sized for THIS title: "Measuring GDP" is thirteen characters of uppercase
    Inter Heavy and fits one line on a phone at 7vw. check-browser.mjs measures
    the widest rendered line with a Range at 390px.
  */
  #intro-hed {
    font-size: clamp(1.6rem, 7vw, 3.2rem);
    line-height: 1.12;
    margin: 5px auto 0 auto;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    max-width: 100%;
    text-wrap: balance;
    color: var(--squid-ink);
  }

  .intro-sub {
    text-wrap: balance;
    font-family: var(--font-main);
    font-size: 1.3rem;
    line-height: 1.55;
    font-weight: 400;
    max-width: 640px;
    margin: 1.1rem auto 0 auto;
  }

  #intro__date {
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: 0.9rem;
    color: #8a94a2;
    margin-top: 1.2rem;
  }

  @media screen and (max-width: 620px) {
    #intro-hed {
      letter-spacing: 0.6px;
    }

    .intro-sub {
      font-size: 1.08rem;
    }
  }
</style>
