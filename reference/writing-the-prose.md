# Writing the prose

Read this before writing any article prose in pass 2 or 3, in pass 4's voice
pass, and before any edit that rewords existing prose. **Natural, smooth prose is
a priority on the same footing as correct numbers**: `ship.sh` runs a prose gate
and fails on it, and pass 4 ends with a read of the rendered page for voice.

The rules come from three voice passes. The first, on 15–16 September 2026, fixed
all twelve published articles after Martin found the prose choppy; the pre-pass
text is in `archive/prose-before-2026-09-15/`. The second, on 22 September, fixed
`economic-rent`, `supply-and-demand`, `elasticity` and `surplus-and-efficiency`,
which had drifted the other way, into an academic voice; their pre-pass text is in
`archive/prose-before-2026-09-22/`. The third, later on 22 September, measured the
first five economics articles against the MLU-Explain originals, found that they
followed the rules and still didn't sound like MLU, and fixed articles 1–10; see
"The third way it drifts" below.

## What was wrong

The first drafts were accurate and hard to read, for the same few reasons in
every article:

- **Fragments standing in for sentences.** "Two months, at the same channel."
  "Same population. Same model. Same month."
- **Stacked short declaratives with the logic left out.** "The wage is not in
  it. It cancelled." The reader had to supply every *so* and *because*.
- **A dash aside in most paragraphs**, often two pairs, so the main clause
  arrived in pieces.
- **Aphorism as a closer** ("A million months of data buys nothing") and
  sweeping *nobody/everybody* framing that the article did not literally mean.

## The second way it drifts: the academic voice

Three articles built quickly on 17 September passed every check and read like a
journal article or an op-ed. The handoff had pointed at this file; nothing
checked it. The fingerprints:

- **No contractions at all** (0–2 per 1,000 words, against about 12 in the
  MLU-Explain originals and 15–28 in our rewritten articles). This alone makes a
  page sound stiff.
- **The strawman opener.** "Every economics curriculum introduces…", then "That
  framing is fundamentally misleading", then the reveal. Most first courses
  already teach the point being "revealed", so this is unfair as well as
  grating.
- **Grand vocabulary:** startling, decisive, exquisite, iconic, wildly,
  secretly, silently, aggressively, inflicts, "destroys £293 of surplus".
- **The reader in the third person**, and articles that call themselves
  "chapters" or cite a "companion essay" that doesn't exist.
- **Captions that repeat the paragraph beside them**, number for number, and
  numbered "Figure 3." exhibits that the prose then cites by number.
- **Verification leaking into the prose:** "(< 1px)", "bit-for-bit identical",
  "a blind numerical search finds the maximum at exactly 60". That's for
  `check-numbers.mjs`, not the reader.
- **Sentences lifted from the spec.** The spec's angle is a pitch, written
  sharply so it can be argued with. `elasticity` shipped "What the number
  actually is, is…" and "the curve they silently assume" from its spec.
- **Page furniture from a paper:** a kicker line above the title, all-caps
  slogan headings with colons ("THE R² PARADOX: HIGH FIT MEANS ZERO
  IDENTIFICATION"), a "Scope and limitations" box, a bullet-list conclusion.

## The third way it drifts: correct, but not MLU

After the second pass, articles 1–5 had no fragments, no op-ed words and plenty of
contractions, and still read as a careful lecture rather than as MLU-Explain. A
side-by-side count against five originals (bias-variance, decision-tree,
double-descent, random-forest, train-test-validation) showed where:

| per 1,000 words | MLU-Explain | our five, after pass 2 |
|---|---|---|
| "we / let's / our / us" | about 36 | 5–14 |
| mean sentence length | about 18 words | 19–25 words |
| sentences over 35 words | about 2 per 1,000 | up to 6 per 1,000 |
| "exactly" | rare | up to 14 |

The fingerprints:

- **Too little "we".** MLU narrates the whole article as a shared walk ("Let's
  pretend we're farmers…", "our model", "our job is done"). Ours said "the Valley"
  and "the market" and left the reader watching from outside.
- **Long sentences doing the joining.** Rule 3 (say the *so* and *because*) was met
  by chaining four clauses into one 45-word sentence. Say the link, then stop.
- **Captions that re-explain the paragraph.** Figure descriptions and captions
  carried the same numbers as the body section after them, and conclusions
  recapped them a third time.
- **The checks talking to the reader.** "The checks behind this page try 100,000
  random pairs", "in rendered pixels at 390px", "computed from `src/market.js` and
  asserted in `verify/check-numbers.mjs`", and in two articles a note to ourselves,
  "verify each before relying on it", shipped in the sources.
- **"Exactly" in every other paragraph.** True, and so frequent it stopped marking
  anything.
- **Stock phrases copied between articles.** Articles 1 and 2 opened with the same
  sentence ("Most first courses in economics have a lesson about…", "…before we
  start poking at it"). Read one after the other, they sounded templated.

## The voice

The register is MLU-Explain's: a patient guide working through the idea with the
reader. Match the register, never the wording — no sentence, heading or closing
paragraph of theirs is reused, per the non-negotiables.

The tone is calm and friendly. Martin chose, on 22 September, to push towards
MLU's amount of "we" and its short sentences, but not towards its jokes: an
occasional light moment or exclamation mark is welcome where it's natural, and
humour for its own sake, aphorisms and arch asides are not.

**Numbers to aim at**, per 1,000 words of body prose, as `check-prose.mjs
--report` prints them:

| | floor (gate fails) | target |
|---|---|---|
| "we / let's / our / us" | 12 | 18 or more (MLU runs about 36) |
| "you" | 2 | 3–6 |
| contractions | 5 | 12–20 |
| mean sentence length | at most 24 words | 16–20 words |
| any one sentence | at most 50 words | under 35 |
| "exactly" | at most 8 | 0–5 |
| paragraphs with a dash | at most 15% | none |

1. **Narrate as "we", all the way through.** "Let's take one bin…", "as we'll
   see…", "if we solve for…", "our market", "let's put a ceiling at £12". Open
   the article with *us* in a situation ("Let's say we run a factory", "Let's
   picture the cafés on a busy street"), and keep coming back to "we" in every
   section, not only the first. The model belongs to us: "our market", "our
   firm", not "the market". Use **"you"** for instructions and for what the
   reader sees in an interactive: "Drag the slider…", "if you drag the floor to
   zero, you'll see…".
2. **Complete sentences, mostly short.** Aim for 12–22 words and vary them. A
   short sentence is fine when it's a whole sentence and earns its emphasis ("It
   stops."). Anything over 35 words is probably two sentences.
3. **Say the logical link out loud**: so, because, which means, in other words,
   as a result, however, on the other hand, that's why, it turns out. Say it and
   then end the sentence; don't use the link as a reason to keep going.
4. **Signpost.** Open a section by saying what it will do ("Now for the second
   setting."), and turn a bare heading into the reader's question where it helps
   ("Why does this happen?", "So what does move it?"). Not in every paragraph.
5. **Name a term in bold, then define it in the same sentence**: "we get a curve
   called an **indifference curve**", "known as **CES**, short for constant
   elasticity of substitution". Check that every abbreviation the article uses is
   defined somewhere before its first use; MRS and CES were not.
6. **Dashes: at most one pair per paragraph, usually none.** Use commas,
   parentheses, a colon or a new sentence instead.
7. **Contractions are fine** (it's, doesn't, we'll). Friendly and plain; no
   aphorisms, no arch asides.
8. **Enumerate lists of caveats** ("First, … Second, … And finally, …") rather
   than running five assumptions together in one paragraph.
9. **End the conclusion with "Thanks for reading!"** as its own paragraph, before
   the footnote or sources.
10. **Be fair to what the article argues against.** Say what first courses teach
    at the strength they teach it ("Most courses also point out that elasticity
    changes along a demand curve, and it's worth taking that further"), never
    "every textbook gets this wrong".
11. **Plain words over grand ones.** "Loses £293 of surplus", not "destroys";
    "surprising", not "startling". Save "exactly" for claims that are exact,
    where it's a hedge the checks defend.
12. **Tell the reader what to do and what to look at.** At least one "drag…",
    "switch…" or "notice…" near each interactive, in the prose or the figure
    text.
13. **Captions say what to look at; the prose explains.** A figure description
    is one or two sentences of instruction ("Drag the price. The pink dot is
    where…"). It doesn't carry the numbers the next paragraph gives, and the
    conclusion doesn't repeat them a third time. If a caption and a paragraph
    share four literal numbers, the gate fails.
14. **The checks never talk to the reader.** No sample sizes of the checks ("over
    280,000 random markets"), no tolerances ("to fourteen decimal places", "worst
    gap 1e-12", "in rendered pixels"), no file or script names, and no notes to
    ourselves. If a claim rests on a simulation, say so in words ("if we try
    random pairs like that, …") and let `check-numbers.mjs` hold the count.
15. **Every article starts from its own situation.** Don't reuse another
    article's opening sentence, transition or stock phrase. Before writing an
    opening, read the openings of the two articles either side of it in
    `site/articles.json`.
16. **Conclusions are two or three short paragraphs of meaning**, not a
    numbered recap of every result with its numbers.

## Page furniture

Match `comparative-advantage`, the article that got this right:

- the `#intro` title block: `h1#intro-hed` (the title, sentence case, upper-cased
  by CSS), `h1.intro-sub` (one or two sentences in the voice), and
  `h3#intro__date`. No kicker above the title;
- prose in `section.body-text`, headed by `h3.body-header` headings in sentence
  case, some of them questions;
- figure titles in sentence case, and captions that are sentences about what to
  look at. No "Figure 3." prefixes, so the prose says "the chart above", never
  "Figure 3";
- the costs as enumerated paragraphs under "What this costs you", and the
  conclusion as ordinary paragraphs ending with "Thanks for reading!";
- sources that say plainly what is ours and what is theirs, and end with the
  CC BY-SA line for the MLU-Explain scaffold;
- the house fonts: don't redefine `--font-main` in an article's `:root`;
- figure and card titles in sentence case with no `text-transform: uppercase`
  (terse labels and readout tags may stay small caps);
- `App.svelte` carries `:global(.body-text .body-header) { max-width: 100%; }`,
  because `global.css` gives both 80% on a phone and a heading inside a section
  was indented to 64%;
- the sources end "…and every number on this page are ours. The page is built on
  the scaffold and design system of Amazon's MLU-Explain, used under CC BY-SA
  4.0." Nothing about how the numbers were checked.

## The gate

`scripts/check-prose.mjs`, run by `ship.sh` after the numbers and by
`build-site.sh` before anything is published, reads the
components the page actually imports and fails on:

- "Thanks for reading!" missing as a paragraph of its own;
- more than one dash pair in a paragraph, or dashes in more than 15% of them;
- fewer than 5 contractions per 1,000 words;
- fewer than 12 "we / let's / our / us" or 2 "you" per 1,000 words;
- a mean sentence over 24 words, or any sentence over 50;
- "exactly" more than 8 times per 1,000 words;
- a caption and a body paragraph that share four or more literal numbers;
- file and script names in reader text (`src/…`, `verify/…`, `*.mjs`,
  `check-numbers`), and notes to ourselves ("verify … before relying", TODO);
- verification talk ("decimal places", "behind this page", "rendered pixels",
  "worst gap"), "In one sentence", "subsequent chapters", "Visual Explainers
  Series";
- the grand words, sweeping phrases, "the reader", "this chapter" and
  left/right layout pointers listed in the script;
- kicker and deck lines above the title;
- "Figure N." captions, headings typed in capitals, American spellings;
- LaTeX typed straight into the markup (`$R^2$` ships with the dollar signs
  showing: use `katexify` or plain text). In Svelte this is worse than ugly:
  `$\sqrt{w/r}$` makes Svelte evaluate `{w/r}`, and `cost-curves` shipped as a
  blank page because of it.

It warns, without failing, on "we" under 18 per 1,000, a mean sentence over 21
words, sentences over 38 words, two or more semicolons in a paragraph, a caption
sharing three numbers with a paragraph, and bold used on a number instead of a
term. Exemptions go in
`verify/prose.json` (`{"spelling": "american", "allow": ["silently"]}`) with the
reason in the README. The gate is a floor: it finds fingerprints, and pass 4
still reads the page.


## What a voice pass must not change

- Every number, every `{expression}`, every hedge ("about", "exactly", "at
  most"), every claim, the maths, the variable names and the section order.
  `check-numbers.mjs` asserts the claims, not the wording, so a reworded sentence
  that quietly changes a claim passes every check. Re-read the claim, not the
  diff.
- The article's spelling: British everywhere except `xgboost`, which is American.
- **Labels stay terse.** Button labels, slider labels, readouts, legends, card
  footers and axis titles are not prose and are not rewritten into sentences.
- **Headings, figure titles and button labels can be selectors.** Before
  rewording one, grep the article's `verify/check-browser.mjs` for its text.
  `dbscan-hdbscan` located two sections by heading text and timed out after the
  pass; `population-stability-index` scrolls to the heading starting "A
  magnitude"; `constrained-choice` clicks the preset buttons by label.

## Things a rewrite tends to get wrong

- **Pointing at layout.** "The right-hand chart" is wrong on a phone, where the
  two panels stack. Say "the second chart". The gate's pattern is blunt, so "on
  the right day" fails too (it did in `var-backtesting`'s first draft). Reword
  ("on the day it mattered") rather than weakening the pattern, since a real
  pointer is the costlier miss.
- **Counting sections.** "The frozen error from two sections ago" was four
  sections back. Refer to a section by what it is about ("the section on PSI's
  sampling distribution"), which survives reordering.
- **Starting a sentence with a figure.** "36 different months are plotted
  below" reads badly and cannot be spelled out without a helper. Put the number
  later: "The chart below plots 36 different months".
- **Joining a list to an interpolated number.** "PSI reads 0.002, 0.075 or
  0.214, or 0.016 if…" has two *or*s. Read the rendered page, not the source.
- **Numbered figure references.** Once captions lose their "Figure 5." prefix,
  "as shown in Figure 5" points at nothing. Say "the chart above" or name it.
- **Formulas that name symbols nobody defined.** `d`, `k`, `N`, `B`, `TS*` and
  `B_lo` appeared in figure text before (or without) a definition. Define a
  symbol where it first appears, in words, or leave the formula out of the
  caption.
- **Inherited slips.** A careful reread finds things the original got wrong:
  "moves the substitution effect by six of eight free hours" (it takes six of
  the eight hours away); "your own payoffs … determine what makes *them* willing
  to mix" (they pin down the mix the *other* player needs to keep *you* willing).
  Fix them, and say so in the handover.
- **Expect inherited slips, because they're common.** On 24 September, the voice
  pass on articles 11–23 found a claim the model contradicts in more than half
  of them:
  - a Pigouvian fee that's right only in the open-access limit;
  - "the other side's patience pays you", when it's the other side's
    *impatience*;
  - a defector's gain given as ×k, when it's ×2.25;
  - a formula headed as exact that the checks hold only "to within one";
  - "a tenth of its money in cash", when the model's c is cash over deposits.

  Checks assert numbers, not sentences, so read every sentence that states a
  result against the module that computes it.
- **Titles are in sentence case, names included only when they're names.** It's
  "Gini and the Lorenz curve", but "Cartels and the prisoner's dilemma".

## Before and after

> Two months, at the same channel. In one, the share of thin-file applicants
> rises from 37% to 52%; in the other it falls to 22%.

> Let's compare two months at the same channel. In one, the share of thin-file
> applicants rises from 37% to 52%, and in the other, it falls to 22%.

---

> …a noisy month cannot read low to make up for one that read high — the noise
> all points the same way. … — simulated, not predicted. Same population. Same
> model. Same month.

> …a noisy month can't read low to make up for one that read high, so all of the
> noise points in the same direction. … These figures are simulated, not
> predicted, and they all come from the same population, the same model and the
> same month.

---

> The wage is not in it. It cancelled.

> With it, the solution is f* = (1 − α)T, and the wage doesn't appear in that
> solution at all, because it cancelled out.

---

> That framing is fundamentally misleading. Elasticity is not a property of a
> good at all. … The very same good is deeply inelastic at low prices and
> aggressively elastic at high prices.

> Most courses also point out that elasticity changes as we move along a demand
> curve, and it's worth taking that point further than they usually do. … so the
> same good is very inelastic at low prices and very elastic at high ones.

---

> When you add the two channels together, a startling regularity emerges: … The
> triangle costs d². The misallocation costs d(1 − d). Their sum is identically d.

> Something surprising happens when we add the two losses together. … In words,
> the triangle costs d² of the total surplus and the misallocation costs
> d(1 − d), so in any linear market with random rationing, the two together
> come to exactly d, the cut itself.

---

> The arithmetic doesn't care that Balanced looks reasonable. Reasonable isn't a
> price.

> So it doesn't matter that Balanced looks like a sensible compromise, because
> the price makes the choice, and at 20 machine-days there's no price at which
> Balanced comes out cheapest.

---

> When supply meets demand in a competitive market, the quantity traded makes
> the total surplus as large as it can be.

> Let's start with a competitive market, where supply meets demand. The quantity
> traded there makes the total surplus as large as it can be.

---

> This isn't a quirk of our numbers. … The checks behind this page try 100,000
> random pairs like that, and the more productive economy gains exactly nothing
> in every one of them.

> This isn't a quirk of our numbers. … If we try random pairs like that, the more
> productive economy gains nothing in every one of them, and the section on the
> maths shows us why.

---

> The cheque is theatre; the elasticities set the split; the split rule is
> exactly true only in a straight line and only to first order elsewhere; and at
> the rate that raises the most money, half the trades are already gone and half
> the take is burning. Thanks for reading!

> Who hands over the money doesn't change who pays. In a competitive market, the
> burden goes to whichever side finds it harder to walk away, …
>
> Thanks for reading!

---

> Figure 4. The tangency offset. When $k = 100$ (the plant that serves the
> minimum of the long-run curve), tangency occurs at the bottom of the short-run
> curve. … A small plant ($k = 25$) touches the envelope at $q = 8.55$, well below
> its own cheapest scale of $11.60$ (ratio $0.7368$); …

> At k = 100 the two dots meet at the bottom of the U. Any other plant pulls them
> apart: the pink dot moves left of the blue one for a smaller plant, and right
> of it for a bigger one.

## Before calling the prose done

Read the rendered page top to bottom as a reader, not the source, and ask:

1. Does every section have "we" in it, and does the opening put *us* in a
   situation?
2. Is there a sentence over 35 words? Split it.
3. Does any caption give numbers that the next paragraph gives again? Cut the
   caption to what to look at.
4. Does "exactly" appear where nothing is exact, or twice in a paragraph?
5. Is any symbol, abbreviation or colour named before it's defined, and does the
   colour named in the prose match the colour on screen? (`cost-curves` called a
   pink dot orange.)
6. Does anything describe how we checked the page rather than what it shows?
7. Does the opening, or any transition, match another article's?
8. Then run `node ../../scripts/check-prose.mjs . --report` and read the numbers
   against the targets in "The voice".

## Mechanics

- A sentence containing a figure is still built in the script block when it sits
  inside `{#if}` or `{#each}` (see `house-idioms.md`); rewording it means editing
  the template string, and the same whitespace rule applies.
- Replace prose by exact, whitespace-tolerant match with every edit checked before
  anything is written, so a failed match aborts the whole batch rather than half
  of it. Then run `./verify/ship.sh -m '<a phrase from the new text>'` and the
  browser checks, and read the rendered text end to end.
