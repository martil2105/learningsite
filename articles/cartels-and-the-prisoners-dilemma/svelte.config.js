/*
  Runes everywhere, on purpose.

  In mixed mode Svelte 5 still accepts `$:`, and `$:` is the reactivity model
  that produced this project's worst bug class: a `const` or `function` helper
  reading a `$:` variable is invisible to dirty tracking, so a chart drew half at
  the initial width and half at the measured one, with no error anywhere.
  `runes: true` makes that syntax a compile error instead of a silent option.
*/
export default {
  compilerOptions: { runes: true },
};
