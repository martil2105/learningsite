---
description: Verify a built article — checks, browser pass, screenshots, the editorial review, and the loop back into reference/
argument-hint: [slug]
---

Verify and finish: articles/$ARGUMENTS

This is passes 3 and 4. Read `reference/verifying-an-article.md` first.

**Pass 3 — verify.**

1. `cd articles/$ARGUMENTS && ./verify/ship.sh`. It refuses build warnings,
   proves the build actually ran, runs `check-numbers` and the prose gate, and
   produces a tarball it has proved holds the current bundle. Fix anything it
   reports.
2. Stage that one tarball, extract it, serve it, run `verify/check-browser.mjs` at
   390px and 1280px with `SHOTS=` set. The script prints the exact commands.
3. Fix what fails. When a check's own expectation is what is wrong, say so and fix
   the check — but only after establishing which of the two is wrong.

Every article needs one geometry assertion specific to its own claim, in rendered
pixels. If `check-browser.mjs` is still only the copied generic checks, add it.

**Pass 4 — review.** Then look at the screenshots — cropped, three or four, not
the full page. Every bug that mattered in this project was invisible to every
assertion.

Run the final read-through in `reference/verifying-an-article.md`: does the demo
exercise the idea it sells, is the quantity on the chart the quantity the claim is
about, is the baseline given its best case, does every sentence describing a chart
match what the chart draws, and are the citations ones you have actually read.
Where a paragraph describes a shape, replace the description with a number the
chart is drawn from.

**Then the voice pass.** It isn't optional, and the prose gate passing isn't
enough. Read `reference/writing-the-prose.md`, pull the text a reader sees from
the rendered page (every paragraph, caption and figure note, in page order),
and read it top to bottom as a reader. Rewrite whatever doesn't sound like a
patient guide talking, then work through the checklist "Before calling the
prose done" at the end of that file. While you read, check every sentence that
states a result against the module that computes it: the checks assert numbers,
not sentences, and the voice pass of 24 September found a wrong claim in more
than half of the thirteen articles it read. Finish with
`node ../../scripts/check-prose.mjs . --report` and compare the numbers against
the targets in "The voice".

**Then close the loop.** An article is not finished until these four are done:

1. The article's `README.md` carries the claim list with each verdict. Three
   articles still ship the starter's README; do not add a fourth.
2. **Anything you learned that is not about this subject goes into `reference/`** —
   a component rule into `house-idioms.md`, a checking rule into
   `verifying-an-article.md`, a scaffold change into `scaffolding.md`. Per-article
   build notes accumulate nothing on their own. The reference files are the
   accumulator and they are only as good as this step.
3. A row in the table in `reference/choosing-the-shape.md`: slug, kind, shape,
   hook.
4. An entry in `site/articles.json`, which is what publishes it
   (`reference/publishing.md`). The blurb is the article's actual claim in one
   or two sentences, not a topic description, and on the economics spine the
   entry also has a bridge. Both are written in the house voice, like the rest
   of the page.

Report the angle, the numbers behind each claim, anything you softened because a
check refused it, and what you promoted into `reference/`.
