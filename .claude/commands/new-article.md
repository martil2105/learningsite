---
description: Design and build an interactive visual essay from a topic or a source
argument-hint: [topic, or a file in sources/]
---

Build a new interactive visual essay about: $ARGUMENTS

Follow CLAUDE.md. This command covers passes 1 and 2 — design and build. Run
`/finish-article <slug>` afterwards, in a fresh session, for verification and
review.

If the argument is a paper, a chapter or a set of lecture notes rather than a
topic and no study note for it exists in the project, consider `/read-source`
first: one cheap session, and it decides whether there is an article here at all.
If a note does exist, read it — then re-derive its verdicts rather than inheriting
them.

**Before writing any code, state five things:**

1. the slug
2. the **kind** — method, result, concept, model or empirical
   (`reference/pass-1-design.md`). It decides what "verified" means here.
3. the **shape** — which structure in `reference/choosing-the-shape.md` this
   subject wants, and why. "The default" is not a reason: seven of the ten
   existing articles share one skeleton, and that is copying rather than seven
   independent decisions.
4. the primary interactive hook, and where the smaller interactions go
5. the closest analog among our own articles **by shape**, and why

If the subject admits several genuinely different narrow angles, ask which one
before committing. Narrow and deep beats a survey — and a chapter holds ten ideas
where an article holds one.

**Pass 1 — design.** Follow `reference/pass-1-design.md`: the received account
written down as four or five flat claims, then `src/datasets.js` and the subject
module, then throwaway probe scripts in node (`node --input-type=module`) that
test *those specific claims*, and a deliberate hunt for an identity worth putting
on screen. Do not open an output-format skill and do not write a component during
this pass.

The gap between the received account and the measurement is the article. Report
the claim list and the verdicts before building anything: they go in the article's
`README.md`, each one becomes an assertion in `check-numbers.mjs`, and the
one-page spec goes to the project.

**Pass 2 — build.** Scaffold by the selective-copy recipe in
`reference/scaffolding.md` — never `cp -r`, since nothing on this mount can be
deleted afterwards. Read `reference/house-idioms.md` before the first component.

**Read `reference/writing-the-prose.md` in full before writing the first
sentence of prose.** It is the house voice, and it is not optional: a patient
guide working through the idea with the reader, "we" to narrate (18 or more per
1,000 words) and "you" to instruct, contractions, short sentences (16–20 words
on average, none over 35), dashes rarely (never more than one pair in a
paragraph), captions that say what to look at, and
comparative-advantage's page furniture (the `#intro` title block, sentence-case
headings, "What this costs you" as one paragraph per point, a conclusion in
paragraphs ending "Thanks for reading!", sources ending with the CC BY-SA line).
`articles/cost-curves` is the model to copy the furniture from. Write every word
of prose from scratch, never lift it from the spec, and if there is a source,
reproduce nothing from it.

Finish the pass with `./verify/ship.sh` green, which includes the prose gate
(`scripts/check-prose.mjs`): an article that fails it doesn't build, and
`scripts/build-site.sh` won't publish it either. Then summarise the angle, the
numbers behind each claim, and what still needs verifying.
