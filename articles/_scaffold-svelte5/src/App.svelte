<script>
  import Meta from "./Meta.svelte";
  import Logo from "./Components/Logo.svelte";
  import Title from "./Components/Title.svelte";
  import Lab from "./Components/Lab.svelte";
  import ScrollDemo from "./Components/ScrollDemo.svelte";
</script>

<Meta />
<Logo />
<Title />

<main>
  <Lab />
  <ScrollDemo />

  <section class="body-text">
    <h3 class="body-header">What is fixed and what is not</h3>
    <p>
      Only the ends of an article are fixed — masthead, title, intro at the top;
      conclusion and resources at the bottom. What goes between them is a
      decision this subject makes for itself, and
      <span class="mono">reference/choosing-the-shape.md</span> is where the menu
      and the record of what has already been built live.
    </p>
  </section>
</main>

<style>
  main {
    display: block;
  }
  /* global.css gives .body-text and .body-header 80% each on a phone, so a
     heading inside a section was indented to 64%. Inside a section it should
     line up with the paragraphs. */
  :global(.body-text .body-header) {
    max-width: 100%;
  }
  /* normalize.css lowercases <sub> and <sup>, which turned Z<sup>M</sup>
     into "Zm" and t<sub>V</sub> into "tv". They keep the case they're written in. */
  :global(sub),
  :global(sup) {
    text-transform: none;
  }
</style>
