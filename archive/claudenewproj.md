# MLU-Explain Article Generator

## Goal
Given a machine learning / statistics topic, scaffold and build a new interactive
visual-essay article in the same style and tech stack as Amazon's MLU-Explain
project (https://mlu-explain.github.io/). Its source is cloned read-only at
reference/aws-mlu-explain/ for pattern reference only — never copy its prose or
component code verbatim into a new article.

## Tech stack (match exactly)
- Svelte 3 (`svelte@^3.0.0`) as the component framework
- Rollup 2 (`rollup@^2.41.4`) as the bundler, via `rollup-plugin-svelte`,
  `rollup-plugin-css-only`, `@rollup/plugin-node-resolve`, `@rollup/plugin-commonjs`,
  `rollup-plugin-terser` (prod minify), `rollup-plugin-livereload` (dev)
- D3, imported as individual modules rather than the full bundle:
  d3-array, d3-axis, d3-drag, d3-ease, d3-force, d3-format, d3-hierarchy,
  d3-interpolate, d3-random, d3-scale, d3-selection, d3-shape,
  d3-svg-annotation, d3-transition
- `layercake` as the Svelte charting scaffold on top of D3 (handles scales/layers)
- `katex` for inline math rendering
- `rough-notation` for hand-drawn annotation/highlight effects
- `intersection-observer`, `smoothscroll-polyfill`, `stickyfill` — polyfills for
  the scrollytelling / sticky-figure reading experience
- `svelte-drag` for draggable chart elements, `svelte-preprocess` for build preprocessing
- Dev server: `sirv-cli` (`npm run start` -> `sirv public -D -m 1`)

## Project layout (per article)
```
articles/<topic-slug>/
  package.json        # copy from reference/aws-mlu-explain/code/<closest-analog>/package.json,
                       # rename "name" / "description" / "author"
  rollup.config.js     # copy as-is from the closest analog article
  src/
    main.js
    App.svelte
    Components/
      <TopicSpecificChart>.svelte
      ...
    data/
      generate.js       # synthetic dataset generator for the topic
  public/
    index.html
    global.css          # pull shared design tokens from reference/aws-mlu-explain/css/
```

## Shared design system
Reuse the colors, type scale, and layout primitives in
`reference/aws-mlu-explain/css/` and the fonts in `reference/aws-mlu-explain/fonts/`
so every generated article stays visually consistent with the family.

## Editorial voice
MLU-Explain articles are short visual essays, not textbooks:
- Second person, conversational ("Try dragging the point below...")
- One clear interactive "hook" per article — a single manipulable object
  (a draggable line, a slider, a toggle) that makes the core idea click
- Sections build: motivation -> mechanism -> live interactive demo -> the math
  (rendered with KaTeX) -> a short wrap-up
- Every sentence and every topic-specific component is written fresh — the
  reference repo is a structural guide, not a source of copy-paste text.

## Choosing a structural analog
Before scaffolding, pick whichever existing article is the closest structural
cousin to the new topic, and read it (not copy it) for component patterns:
- Regression-flavored topics -> linear-regression
- Binary-classification topics -> logistic-regression
- Tree/ensemble topics -> decision-tree, random-forest
- Evaluation-metric topics -> precision-recall, roc-auc
- Model-selection / overfitting topics -> bias-variance, train-test-validation

## Workflow for a new article
1. Given the topic, decide the one interactive "hook" that best teaches it.
   State the plan before writing any code.
2. Pick the closest analog article and skim its `src/Components/` for the
   relevant interaction pattern (drag behavior, slider binding, scale setup).
3. Scaffold `articles/<slug>/` per the layout above.
4. Build the topic-specific Svelte components (chart + controls) using
   layercake/D3 and a synthetic data generator.
5. Write the article copy end-to-end, from scratch, in the voice above.
6. `npm install && npm run build` inside `articles/<slug>/`; fix any build
   errors before reporting done.
7. `npm run start` to preview locally and report the local URL.
