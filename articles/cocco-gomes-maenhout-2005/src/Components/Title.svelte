<script>
  /* Title.svelte */
</script>

<section id="intro">
  <h1 id="intro-hed">Cocco, Gomes and Maenhout’s life-cycle portfolio</h1>
  <h1 class="intro-sub">
    How much of our savings should we hold in stocks at 25, when our pay is
    risky and we can't borrow? In 2005 three economists solved a whole working
    life on a computer. Let's solve a small one of our own, and see what the
    limit on borrowing costs.
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
  #intro-hed {
    font-size: clamp(1.4rem, 6vw, 2.8rem);
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
    #intro-hed { letter-spacing: 0.6px; }
    .intro-sub { font-size: 1.08rem; }
  }
</style>
