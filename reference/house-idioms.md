# House idioms

Read this before writing or editing any component. Every rule here was a real
bug in a shipped-looking article, and most of them do not throw — they render
something plausible.

## Svelte reactivity (runes)

New articles are Svelte 5 with `runes: true` in `svelte.config.js`, which makes
`$:` a compile error rather than a silent option. Declare both `$state` and
`$derived` with `let`.

**A plain function that reads reactive state is tracked.** This is the bug class
the migration removed, and the reason for it: under Svelte 3 a `const` or
`function` helper reading a `$:` variable was invisible to dirty tracking, so
attributes naming a reactive variable directly updated and the helper's output
did not — half a chart at the initial width, half at the measured one, no error
anywhere. Under runes the read inside the call is tracked. Do not port that
workaround forward, and do not write `$derived` wrappers around functions to
appease it.

- **`$state` for anything that changes, `$derived` for anything computed from
  it.** A plain `let` you assign to does not re-render; assigning to a `$derived`
  is a compile error.
- **Props are one destructuring.**
  `let { top = 0, value = $bindable(undefined), children } = $props();` — a prop
  the parent binds to must be `$bindable`, or the parent's `bind:` silently does
  nothing, which looks exactly like a broken component.
- **`<slot />` is gone.** Children arrive as a snippet: `{@render children?.()}`.
- **`on:click` is `onclick`.** Event handlers are plain props; `on:` does not
  compile under `runes: true`.
- **`$effect` is not `$:`.** It runs after mount and after any tracked read
  changes. Use it for observers, subscriptions and imperative DOM work — never to
  compute a value, and never to assign to state it also reads.
- **`bind:this` needs `$state()`** if anything reactive reads the node. A plain
  `let` is fine when only event handlers do.

These four are about the template, not the reactivity model, and hold on both
stacks:

**`{#if}` strips the leading whitespace of its body.** `{n}{#if n} bins{/if}`
renders `255bins`. This has happened in three articles in three different
shapes. Build any sentence containing a figure in the script block instead.

**Scoped CSS does not reach `{@html}` content.** Svelte scopes styles by
stamping a class on elements it compiles, so `.step-title` and `.step-content p`
must live in `public/assets/styles/global.css`, not in the component.

**Display maths overflows a phone, and only `global.css` can stop it.** KaTeX
sizes `.katex-display` from the formula, so one fraction with a superscript in
it made the document 67px wider than a 390px viewport — and because the maths
arrives through `{@html}`, no component's scoped rule can touch it. The fix
belongs in `global.css` and is to scroll rather than shrink:
`.katex-display { overflow-x: auto; overflow-y: hidden; }`, with a slightly
smaller font under 520px. Worth adding before the first display equation, not
after the check finds it.

**A KaTeX spacing command needs two backslashes inside a JS template literal.**
The formulas passed to `katexify` are template literals, where `\;` with one
backslash is an escape that silently resolves to a bare `;`. KaTeX then renders
a literal semicolon beside the operator, and nothing warns. Write `\\;` (and
`\\,`, `\\!`, `\\:`) exactly as the other commands are written. It appeared in two
of the Stage 1 macro drafts and was caught only by the browser check described
in `verifying-an-article.md`, which reads each formula's `<annotation>` and fails
on a `;` not preceded by a backslash; the scaffold's `check-browser.mjs` carries
it now. The same doubling applies to a row break. LaTeX's `\\` between the rows of a
`cases` or `aligned` is written with four backslashes in the JS string, and
`\\[6pt]` (a row break with extra space) with four backslashes before the bracket. With
two, the rows run together. Look at the rendered formula, not the source.

**KaTeX's hidden MathML escapes the scrolling display box.** `.katex-display`
scrolls sideways on a phone, but its `.katex-mathml` copy is absolutely
positioned, and without a positioned ancestor it is laid out against the page
instead, which made `peer-group-outliers` 22px wider than a 390px viewport with
every formula looking fine. Give `.katex-display` `position: relative` (now in
the scaffold's `global.css`).

**A leading space inside a `<span>` after an expression is dropped.**
`{n}<span class="of"> alerts</span>` rendered "5alerts", which the glued-text
check caught. Put the space outside the span as `&nbsp;`, or build the string in
the script block.

**Initialising `$state` from a prop copies it once.** For a pill or slider whose
default comes from a prop, keep the user's choice separately and derive the
value: `let user = $state(null); let key = $derived(user ?? initial ?? first)`,
with `onclick={() => (user = o.key)}`. A range input binds through a function
binding, `bind:value={() => sel, (v) => (userIdx = +v)}`. This keeps the default
live and the compiler quiet.

**`bind:this` inside `{#if width > 0}` is undefined at `onMount`.** Attach
reactively, or better, skip `d3-drag` entirely: `on:pointerdown` /
`on:pointermove` / `on:pointerup` (`onpointerdown` … under runes) with
`setPointerCapture` and `touch-action: none` avoids the timing problem and
handles touch for free.

**Do not write self-referential clamps** like `$: p.x = clamp(p.x)`. Clamp at
the point of assignment.

### a11y warnings

**The codes are snake_case now.** `a11y_no_noninteractive_tabindex`, not
`a11y-no-noninteractive-tabindex` — so a `svelte-ignore` comment copied from a
Svelte 3 article silently stops suppressing anything, and `ship.sh` fails the
build.

**A wrapper with `role="application"`, `tabindex` and a `keydown` earns two
warnings, not one** — `a11y_no_noninteractive_tabindex` and
`a11y_no_noninteractive_element_interactions`. The role is still correct; ignore
both deliberately rather than removing it.

**Pointer handlers go on that same wrapper, never on the `<svg>`.** On the svg
they earn `a11y_no_static_element_interactions`, and `touch-action: none` belongs
wherever the handlers are. Keep `bind:this` on the svg: the coordinate maths
needs its rect.

### Editing one of the ten Svelte 3 articles

They stay on Svelte 3 + Rollup 2 and their rules are the inverse of the above:
`$:` for derived values, `export let` for props, `<slot />`, `on:click`, and —
the one that matters — **a `const` or `function` helper that reads a `$:`
variable is invisible to dirty tracking**:

```js
$: band = plotW / SLOTS.length;
const slotX = (i) => margin.left + band * i + band / 2;   // WRONG — never recomputed
$: slotX = (i) => margin.left + band * i + band / 2;      // right
```

Grep those articles for `^  const .* =>` and `^  function ` and check whether the
body reads a `$:` variable. a11y ignore codes there are hyphenated.

## Measuring and sizing

**The measuring div must be the first child of the box you are sizing.** As a
flex *sibling* of the card it reports its own negotiated width, every panel is
laid out for the wrong box, and the symptom shows up nowhere near the cause — a
three-across row silently becomes a column, or the document comes out wider
than the viewport with `overflow-x: hidden` hiding it.

**`bind:clientWidth` fires before layout and a sticky panel can report zero.**
A scale whose range is then `[6, width - 6]` runs backwards and the first
symptom is a console error nobody reads. Clamp once, use the clamped value
everywhere:

```js
let boxWidth = 320;                 // the bind target, and only that
$: BW = Math.max(260, boxWidth);    // what every scale and layout uses
```

**`bind:clientWidth` on a padded box includes the padding.** Measure a
zero-height `width: 100%` child instead.

**Bind the width on the box the SVG sits in, not on the card around it.**
`cost-curves`, `perfect-competition` and `monopolistic-competition` bound
`clientWidth` on a `.card` with 24px of padding and 3px borders, so every chart
was drawn 48px wider than its `.svg-wrap` and clipped on the right at both
viewports. Put `bind:clientWidth={boxWidth}` on the `.svg-wrap` itself (or on a
zero-height child of it).

**When panels stack on a phone, the controls go first and stick.** A lab whose
two panels sit side by side on a desktop becomes a column on a phone, and a
slider placed under the column scrolls away from the panel it moves.
`comparative-advantage` puts the slider, the presets and the price strip in a
`.controls-bar` above the panels, with `position: sticky; top: 0` under 700px
and an opaque background, and `check-browser.mjs` scrolls to the last panel and
asserts the slider is still inside the viewport. The bar is not measured, so
none of the width rules here change.

**Splitting a row exactly in half is a knife-edge.** `(w - gap) / 2` asked for
604px of a 603px row and `flex-wrap` dropped a whole panel below the fold with
every check still green. Use `Math.floor((w - gaps - 2) / n)`, and assert the
panels share a bounding-rect `top`.

**Every measured SVG needs a `viewBox`.** `width={measured}` plus
`max-width: 100%` does not scale the drawing, it clips it. Initialise the width
*small* (320, not 600) so a stale value is narrow rather than cropped. If the
SVG takes pointer input, convert client pixels back to user units, because the
viewBox may be scaling:

```js
const s = rect.width / BW;
const userY = (event.clientY - rect.top) / s;
```

## Drawing

**No HTML elements inside an SVG `<text>`.** `<text>Price (p<sub>i</sub>)</text>`
compiles, and then Svelte 5 walks a DOM the browser built differently from its
template, throws `TypeError: Illegal invocation` on load, and renders nothing at
all. `monopolistic-competition` shipped as a blank page that way. Use a
`<tspan baseline-shift="sub">` or a Unicode subscript (pᵢ, qᵢ) inside SVG, and
keep `<sub>`, `<sup>`, `<em>` for HTML.

**No `{` or `}` inside text that isn't an expression.** Svelte evaluates every
`{…}` in the markup. Raw LaTeX such as `$k^*(q) = \sqrt{w/r}$` in a paragraph
became a call to an undefined `w`, and `cost-curves` rendered blank. Maths goes
through `{@html katexify(...)}`, always.

**Labels near the right edge anchor to the end.** On a 390px phone, a label
drawn with `text-anchor="start"` a few pixels right of a point near the right
edge is cut off by the SVG ("SRMC = LRMC = 23…"). Anchor it `end` and put it to
the left of the point, or shorten it.

**Equal aspect whenever the argument is about distance.** kNN, k-means, SVM
margins, any decision boundary. `src/plot.js` `fitEqual` letterboxes the extent
into the box and returns `invX`/`invY` for pointer input. Stretch one axis and
the picture shows a geometry the algorithm is not using.

**Panels compared by their slopes share one fixed scale.** A frontier panel
fitted to its own data draws every frontier from corner to corner, and two
economies with opportunity costs of 2 and 4.5 then look identical.
`Frontier.svelte` in `comparative-advantage` fixes the domain once for the whole
family and lets the smaller economy look small.

**Any helper producing geometry in data units takes the plot transform
explicitly.** A version that silently defaults to identity is how a whole
Voronoi layer got drawn in the top-left corner of four charts, looking like a
deliberate inset. `polygonPath(poly, plot)`, never `polygonPath(poly)`.

**Clip lines to the plot, not to "a big number".** An outer `<svg>` clips
visually, so a ray drawn as ±1e6·u looks perfect and still widens the document.
`clipRayThroughOrigin` in the autoencoders article solves the ray-box
intersection; copy it.

**Draw only inside the window — enforce it at the source.** Sample the data by
rejection inside the chart extent rather than clipping afterwards. It removes a
whole family of overflow bugs and, where the variable is circular (time of day,
angle), it is also the only honest treatment: a Gaussian tail reaching hour −3.4
is a broken coordinate system, not an early-morning transaction. Check that no
component's *core* is being truncated — a mode 1.4σ from the edge is a
different distribution from the one your comments describe.

**Regions: contour the log ratio, clamp the border.** Contouring `pA - pB`
spends its resolution where both are tiny and picks up slivers;
`log(pA) - log(pB)` has the same zero set and stays smooth. Force the outermost
ring of grid samples below the threshold, or a region running off the edge
produces an *open* chain that a fill closes with a chord straight across the
chart. Assert every ring's first point equals its last.

**An `<svg><text>` does not wrap.** A panel title longer than a phone is
clipped with no error and no overflow. Titles go in HTML above the SVG; only
short axis labels go inside it. The same holds for a readout placed *below* the
rows of a diagram: a one-line verdict set as `<text>` ran the full width of the
chart and came to rest on top of the axis and its tick labels. Any sentence goes
in HTML — above or below the `<svg>`, never inside it — and only then does the
bottom margin arithmetic have one job.

**Bar labels go above the bar, not inside or beside it.** A label placed inside
a bar long enough to hold it and beside a short one was cut off on a 390px phone
as soon as a control lengthened the bars (`time-diversification`'s tail chart at
an 8% premium). A label on its own line above each bar, anchored at the bar's
start, fits at every length; give the rows the height for it.

**Labels that cross their own line need a halo.**

```css
stroke: #fff; stroke-width: 3px; paint-order: stroke;
```

**Anchor a reference-line label at the end where the curve is not.** A curve
that converges to the value it is being compared against will sit under a
label anchored at that end.

**Budget the bottom margin for ticks *and* the axis title.** A title at
`height - 3` collides with ticks at `height - 15`, and the collision is
invisible when the title is one letter. Prefer `neighbours, k` to `k`.

**Give every drawn series its own class.** Two curves both marked `class="curve"`
are indistinguishable to a selector, and the check written against them picked
the first — see the selector rule in `verifying-an-article.md`. `class="curve sg"`
and `class="curve ces"` costs nothing at the point of drawing and is the
difference between a check that defends the figure and one that contradicts it.

**Highlight ties.** Two rows printing `2.4%` with only one highlighted is a
chart contradicting its own labels. Compare within the printed precision.

**`<sub>` and `<sup>` are lowercased by `normalize.css`.** The MLU copy sets
`text-transform: lowercase` on both, so `t<sub>V</sub>` rendered as "tv",
`x<sub>DS</sub>` as "xds" and `Z<sup>M</sup>` as "Zm" in three shipped articles,
and every check passed. The scaffold's `App.svelte` now resets it with
`:global(sub), :global(sup) { text-transform: none; }`; an article built before
24 September needs that rule added, or its capitals put through `katexify`.

**`--pink` is not a variable in `global.css`.** Two articles drew a curve, a
gap line and a money bar in `var(--pink)`, which resolves to nothing, so they
were invisible. Series 2 is the literal `#df2a5d` below, and the prose calls it
pink, not red or orange.

## Palette

Validated as an all-pairs categorical set against `--paper #f1f3f3` and white:

| Colour | Role |
|---|---|
| `#2074d5` | series 1 |
| `#df2a5d` | series 2 |
| `#2f7d32` | series 3 — worst pair, ΔE 8.3 deutan against `#df2a5d` |
| `#8a94a2` | the background class; deliberately not a hue |

- `--seablue #005276` fails the lightness band and chroma floor. Not for marks.
- `--violet #7c5aed` is ΔE 3.6 from `--sky` under deuteranopia. Interface accent
  only — active pill, focus ring, step border — never beside a mark.
- `#9aa5b1` (used by earlier articles) is 2.5:1 on a white card, below the
  contrast floor. `#8a94a2` clears 3:1 with the most distance from `--sky`.
- Single-hue sequential on violet, passing the ordinal checks:
  `#a79eea, #8c82d2, #7366b9, #5b4ba1, #45308a, #311072`
- **As lines, the ramp's lightest stop is too light.** `#a79eea` is 2.4:1 on a
  white card, under the 3:1 floor for a mark. For a family of three curves
  (`samuelson-merton-1969`'s wealth levels) use `#8c82d2, #5b4ba1, #311072`:
  3.4:1 at the light end and ΔE ≥ 15 between neighbours under every
  simulation. The validator's lightness band is for categorical sets and fails
  the dark end; ignore it for an ordinal ramp.

**Three categorical colours is the hard ceiling.** More levels must not be
coloured by category — use small multiples, or let another channel carry it
(in `k-means` the Voronoi cells carry the clustering and the points stay ink).

**Never a dual-axis chart.** Series in different units get their own labelled
axes or their own panels. `dividend-discount-model` first drew a running total as a
share of the price on a right-hand axis over bars in dollars; it is now a second
panel under the bars, sharing the x scale.

An article built outside this scaffold (the five finance articles were built in
the cloud first) arrives with its own colour tokens. Map them onto the three
series colours, grey and ink before it ships: those five had an orange, a
second green and a violet mark, and every sentence that named a colour had to
change with them. Three quantities on one set of degree ticks let a
reader read 10⁻⁶ as seventy degrees.

Run the validator on existing colours too, not just new ones:
`node scripts/validate_palette.js "<hex,hex,...>" --mode light --surface "#ffffff" --pairs all`

## Masthead and copy-paste

`#intro-hed` is `clamp(1.85rem, 9.2vw, 4rem)`. A fixed size chosen for a
seven-letter title gives a twelve-letter one a horizontally scrolling page, and
nothing catches it because the heading overflows the *screen*, not a box. In a
generator, that is a latent bug in every title you have not written yet.

Grep the new article for the previous article's name before finishing.
`shapley-values` shipped with `<title>XGBoost · Martin Le</title>`; nothing
renders it, so it is invisible until the page is scraped. `verify/ship.sh`
checks this now.

## Environment

- `device_bash` **cannot delete files**, and the permission request has been
  refused by the classifier. Any recipe ending in `rm` is a recipe that gets
  stuck — scaffold by selective copy instead.
- `sed -i ''` is BSD. The VM is Linux with GNU sed, which reads the empty
  string as the script. Use `sed -i 's/…/…/'` or python for anything structured.
- **Always `<<'EOF'`**, never `<<EOF`. An unquoted heredoc expands backticks in
  the payload as command substitutions; a markdown block containing
  `npm i -D @fontsource/...` once executed a real install.
- Writes to the mounted folder are not always visible to the next command.
  `sync; sleep 1` between a build and anything that reads its output.
- `pkill -f "http.server 87"` matches the shell running it and kills your own
  command. Use `fuser -k <port>/tcp`.
- **Svelte 5 + Vite:** `npm install` pulls 54 packages and `npm run build` takes
  about 0.3s. Svelte 3 + Rollup 2: ~134–147 packages, deprecation warnings only,
  and ~4s. On the new stack `npm run dev` is `vite build --watch` and serves
  nothing, because the VM's dev server is not reachable from the host anyway;
  the loop that matters is `./verify/ship.sh`.
- **`emptyOutDir` must be `false` in `vite.config.js`.** Vite's prepare-out-dir
  step unlinks the previous output before writing and deletes are refused on this
  mount, so the FIRST build succeeds with nothing to remove and every build after
  it dies with `EPERM: operation not permitted, unlink public/build/bundle.css`.
  Rollup 2 never hit this because it overwrote in place. The output filenames are
  fixed, so overwriting is all that was ever wanted.
- **`npm install` prints `npm warn cleanup ... EPERM ... rmdir` here.** Same
  cause: it cannot remove the optional platform-specific packages it downloaded
  and then decided not to keep. Harmless, and not worth chasing.
- **Playwright is a GLOBAL install in the container, and an ESM `import` does not
  consult global module paths.** Extract the tarball under the container home and
  link the modules beside it — `ln -sfn "$(npm root -g)" node_modules` — or
  `check-browser.mjs` dies with ERR_MODULE_NOT_FOUND before a single check runs.
  `ship.sh` prints the whole recipe.
- **An element screenshot can catch a CSS transition mid-flight.** A 200ms
  opacity fade between scroll steps makes the wrong step look active in a still
  image. Re-shoot before believing a bug that only a transition could explain.
- Node 22 / npm 10 both fine. Plain Svelte SVG (`scaleLinear` + `{#each}`) works
  well; LayerCake is not needed on either stack.
- **The Vite articles' `node_modules` can end up holding only the darwin native
  bindings** (as both did on 16 September 2026, presumably after an `npm install`
  on the Mac), and then `vite build` in the Linux VM dies with
  `Cannot find module '@rolldown/binding-linux-arm64-gnu'`. Don't install into
  the article's `node_modules`, which the Mac uses too. Install the two Linux
  bindings once, outside the mount, at the versions the article pins, and point
  `NODE_PATH` at them:

  ```bash
  npm install --no-save --no-package-lock --prefix "$HOME/nodebind" \
    @rolldown/binding-linux-arm64-gnu@<rolldown version> \
    lightningcss-linux-arm64-gnu@<lightningcss version>
  NODE_PATH="$HOME/nodebind/node_modules" ./verify/ship.sh
  ```

  Both loaders use CommonJS `require`, which honours `NODE_PATH`.
- **`/tmp` in the VM outlives a session, and its files can belong to another
  uid.** A fixed log path such as `/tmp/<slug>-numbers.log` then fails with
  "Permission denied" and cannot be removed. The Vite articles' `ship.sh` (and the
  scaffold's) now writes that log with `mktemp`; the Svelte 3 copies still use the
  fixed path and will hit this the same way.
- **A plain `git status` leaves `.git/index.lock` behind** (the repository is
  `learningsite/` itself since 27 September 2026; before that it was `site/`).
  Git refreshes the index opportunistically, cannot unlink its lock on this
  mount unless Martin has granted delete permission for the session,
  and every later `git add` or `commit` on the Mac then fails with "index.lock:
  File exists". Read-only git here is `git --no-optional-locks status`; if a
  lock is left anyway, `mv -n` it into `_to_delete/` (a rename is allowed where
  a delete is not).
- **`device_commit_files` can deliver a stale copy of a file you overwrote.**
  Copying a revised file over its earlier version under
  `/mnt/user-data/outputs/` and committing it again reported `written` and put
  the *previous* content on the Mac; the outputs mount kept the old mtime, and
  the transfer appears to key on it. Commit each revision from a fresh path
  (`outputs/<slug>-sync-2/...`), and `md5sum` the device copy after every
  commit rather than trusting the report.
- **When the VM's shell won't start at all** ("Workspace unavailable"), build in
  the cloud container instead: stage `articles/_scaffold-svelte5/` (plumbing,
  fonts, KaTeX fonts, `package-lock.json`), `npm install` there, write and verify
  every article in the container, then commit `src/`, `verify/`, `public/` and
  the configs back with `device_commit_files` (50 files a call, from fresh
  `outputs/` paths each time) and copy `public/` into `site/<slug>/` the same way.
  Nothing on the Mac needs `node_modules` until the next `build-site.sh`, which
  installs its own. The one step that cannot be done from the container is
  `git push`: it has no credentials for the repository.
- **A fresh `npm install` run inside the VM brings its own Linux bindings.** It
  cannot delete the other platforms' packages either, so every platform's
  binding ends up present and `vite build` works without `NODE_PATH`. The
  workaround above is only for a `node_modules` that was installed on the Mac.
- **Never rename a common word as plain text.** A rename of `width` to `W` once
  turned `stroke-width` into `stroke-W`, `max-width` into `max-W`, an SVG
  `width={…}` attribute into `W={…}` and `rect.width` into `rect.W` across four
  components in `k-means` and `lightgbm`. SVG and CSS ignore names they do not
  know and `rect.W` is just `undefined`, so nothing errored and the build stayed
  clean. Rename identifiers with word boundaries in script code only, then grep
  for `-W\b`, `\bW=` and `\.W\b`.

## Copying node_modules between articles

**`cp -r` dereferences the `.bin` symlinks; `cp -R` preserves them.** A
`node_modules` copied with `cp -r` from another article gets `.bin/vite` as a
regular file, whose `import('../dist/node/cli.js')` then resolves to
`node_modules/dist/node/cli.js` and dies with ERR_MODULE_NOT_FOUND. Also copy
the platform bindings a Mac build needs (`@rolldown/binding-darwin-arm64`,
`lightningcss-darwin-arm64`) from an article whose `node_modules` was
installed on this machine — a container-installed one holds only the Linux
set.

## A rect between two curves in screen space

**A shaded band between two curves is drawn from the SMALLER y with the
height `y(low value) − y(high value)`.** The scale runs upward, so the value
that is numerically larger sits HIGHER — at a smaller y — and
`y(high) − y(low)` is negative, which `Math.max(0, …)` silently turns into a
zero-height rectangle that looks like a missing fill rather than a bug. It
happened in `economic-rent`'s rent shading and passed every numeric check,
because the numbers were right and only the rectangle was upside down.

## Floating-point arithmetic traps

- **Reciprocal slopes in double precision: `1/B + 1/S` is not bit-identical to `(B+S)/(B*S)`.**
  With `B = 3` and `S = 2`, `1/B + 1/S` evaluates to `0.8333333333333334` in IEEE-754 doubles, while `5/6` and `(B+S)/(B*S)` evaluate to `0.8333333333333333` — one bit short. Any assertion comparing `k === 5/6` will fail on a mathematically correct implementation unless computed as `(B + S) / (B * S)`. Always compute combined slope constants as `(B + S) / (B * S)` identically across all modules and tests.

## Game Solvers and Best-Response Iteration

- **Simultaneous best-response iteration diverges for $n \ge 5$.**
  In Cournot and common-pool games with linear downward slopes, updating all $n$ players' quantities simultaneously has an eigenvalue of $-(n-1)/2$. For $n \ge 3$ it oscillates; for $n \ge 5$ it diverges exponentially, masquerading as an incorrect formula or non-existent equilibrium.
  Always use **sequential (Gauss–Seidel) best response**: update one player at a time in a fixed order, evaluating each player's best response against every rival's already-updated quantity. Sequential iteration converges monotonically and stably for all $n$.

## Palette: Single-Hue Sequential Ramp for Families of Curves

- **Families of curves must not use categorical colours.**
  When rendering a family of curves (such as short-run average cost curves for varying plant sizes $k$, or income distributions across deciles), do not cycle categorical colours (keep the hard ceiling of three categorical colours). Use a **single-hue sequential ramp** — for example, violet `#7c5aed` at stepping opacities (`0.18`, `0.35`, `0.65`, `1.0`) or lightness steps — or small multiples. Reserve distinct saturated colours exclusively for active selections, envelopes, or comparison targets.

## Charts with a very wide range

Three rules from `cost-of-leverage` and `lifecycle-leverage`, whose lines run
from 77% to 4,299% of savings, or leave a chart's window altogether.

- **A line that leaves the window is clipped or hidden, not just drawn.** A path
  that runs past the y-scale draws over the axis labels and the title. Give the
  plot area a `clipPath`, or draw only the points inside the window, and say in
  the caption or a readout what the reader can no longer see.
- **A long axis title beside four-digit tick labels collides with them.** "Share
  of savings in stocks (%)" beside ticks like "4,000%" overlaps at 390px. Put the
  unit in the tick labels, and use a short label above the axis for the quantity.
- **A path's numbers are printed to two decimals, so a browser check that reads
  them back cannot land exactly on the ends.** `levPct` in
  `lifecycle-leverage` returned NaN at desktop width because the first x of the
  path was 0.004px inside the first age. Clamp the reading to the path's first
  and last x before interpolating.

## Tick labels and linked sliders

Three rules from Stage 1 of the finance slate (30 September 2026).

- **A tick label shows the tick's value at the precision printed.** A scatter in
  `etf-premiums` put ticks at half its window (±2.5%) and printed them with no
  decimals, so a tick drawn at 2.5% read "3%". No check failed, because the
  checks read the outer ticks to build the scale. Put ticks on a round step
  (whole percentages here) or print enough decimals.
- **Two sliders bound to one state have the same range.** `market-making`'s first
  figure went to 50% and the lab bound to the same state stopped at 40%, so at
  50% the lab's slider sat at its end while the lab ran at 50%. Give linked
  sliders the same min, max and step, or keep separate state for each figure
  (as `etf-premiums` does, where one figure needs 100% and the other can't use it).
- **An edge tick label needs half its width in the margin.** "+1.50%" at the
  right-hand tick of `etf-premiums`' band chart ran past its svg at 1280px and the
  "nothing drawn outside its svg" check caught it. Widen the right margin or
  shorten the edge labels ("+1.5%").
