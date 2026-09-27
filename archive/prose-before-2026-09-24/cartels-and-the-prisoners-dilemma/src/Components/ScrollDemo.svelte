<script>
  /*
    A scroll section, side by side on desktop and stacked on mobile.

    Not the starter's centre-scroll pattern — a text card floating over a sticky
    chart covered the chart in both articles that used it.

    .step-title and .step-content p live in public/assets/styles/global.css, not
    in this component: Svelte scopes styles by stamping a class on the elements it
    compiles, so scoped CSS never reaches {@html} content or, here, markup whose
    classes are shared with every other article's steps.
  */
  import Scrolly from "./Scrolly.svelte";
  import { SERIES, BACKGROUND_CLASS } from "../palette.js";

  let step = $state(0);

  const STEPS = [
    { title: "One", body: "The first step is in view, so the figure shows one mark." },
    { title: "Two", body: "Scrolling here adds the second, and the first stays put." },
    { title: "Three", body: "By the third the figure is complete and the section ends." },
  ];

  let shown = $derived((step ?? 0) + 1);
</script>

<section class="scrolly">
  <div class="sticky">
    <p class="fig-title">Marks in view: {shown}</p>
    <svg viewBox="0 0 240 120" width="240" height="120" aria-label="{shown} marks">
      {#each STEPS as _, i}
        <circle
          cx={40 + i * 80}
          cy="60"
          r="18"
          fill={i < shown ? SERIES[i] : "none"}
          stroke={i < shown ? "none" : BACKGROUND_CLASS}
          stroke-dasharray="3 3"
        />
      {/each}
    </svg>
  </div>

  <div class="steps">
    <Scrolly bind:value={step} top={80} bottom={80}>
      {#each STEPS as s, i}
        <div class="step" class:active={step === i}>
          <div class="step-title">{s.title}</div>
          <div class="step-content"><p>{s.body}</p></div>
        </div>
      {/each}
    </Scrolly>
  </div>
</section>

<style>
  .scrolly {
    display: flex;
    gap: 2rem;
    max-width: 1080px;
    margin: 2rem auto;
    padding: 0 1rem;
    align-items: flex-start;
  }

  .sticky {
    position: sticky;
    top: 25vh;
    flex: 0 0 260px;
  }

  .steps {
    flex: 1 1 auto;
    min-width: 0;
  }

  .step {
    margin: 0 0 60vh 0;
    opacity: 0.35;
    transition: opacity 200ms ease;
  }

  .step:last-child {
    margin-bottom: 20vh;
  }

  .step.active {
    opacity: 1;
  }

  .fig-title {
    font-family: var(--font-main);
    font-size: 0.95rem;
    margin: 0 0 0.4rem 0;
  }

  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  @media screen and (max-width: 780px) {
    .scrolly {
      flex-direction: column;
      gap: 1rem;
    }

    .sticky {
      flex: none;
      width: 100%;
      top: 0;
    }
  }
</style>
