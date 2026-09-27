<script>
  /*
    Site mark. Deliberately not the MLU-Explain robot or wordmark: this article
    borrows their scaffold and design system under CC BY-SA and credits them in
    the conclusion and references, but it is not published by them.

    To rename the site, change SITE_NAME. The link is relative, so it resolves
    to the index page one level up wherever the site is hosted.
  */
  export const SITE_NAME = "Martin Le";
</script>

<div id="site-mark">
  <a href="../" aria-label="{SITE_NAME} — all articles">
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
      <rect
        x="5.5"
        y="5.5"
        width="21"
        height="21"
        fill="none"
        stroke="var(--squidink)"
        stroke-width="2.5"
      />
      <line x1="18" y1="5.5" x2="18" y2="26.5" stroke="var(--primary)" stroke-width="2.5" />
      <line x1="5.5" y1="17" x2="18" y2="17" stroke="var(--primary)" stroke-width="2.5" />
    </svg>
    <h2 class="wordmark">{SITE_NAME}</h2>
  </a>
</div>

<style>
  #site-mark {
    display: flex;
    justify-content: center;
    padding-bottom: 0;
  }

  #site-mark > a {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    text-decoration: none;
    padding-top: 0.75rem;
    padding-bottom: 1rem;
  }

  #site-mark > a:hover .wordmark {
    color: var(--primary);
  }

  .wordmark {
    font-family: var(--font-heavy);
    font-size: 17px;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--squidink);
    margin: 0;
    transition: color 150ms ease;
  }
</style>
