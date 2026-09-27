<script>
  /* Title.svelte */
</script>

<section id="intro">
  <h1 id="intro-hed">Cartels and the prisoner's dilemma</h1>
  <h1 class="intro-sub">
    When a few firms agree to make less, the price goes up. As we'll see, the
    firms that stay out of the agreement gain the most, and the members can
    end up earning less than before.
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
    Viewport-relative, sized for THIS title: "Cartels and the prisoner's
    dilemma" is 34 characters in uppercase Inter Heavy, too long for one line
    on a phone at a readable size, so it is sized to break into two balanced
    lines ("Cartels and the / prisoner's dilemma") at 390px and at 1280px.
    check-browser.mjs measures the widest rendered line at 390px.
  */
  #intro-hed {
    font-size: clamp(1.4rem, 5.8vw, 2.7rem);
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
