# Pass 1: finding the claim

Read this before any component exists, every article. Pass 1 decides what the
article is *about*; nothing later in the pipeline can rescue a pass 1 that only
decided what the article is *on*.

Do not open an output-format skill and do not write a component during this pass.

## The method

1. **Write the received account down as four or five flat claims** — what a
   textbook, a docs page, a good blog post, or the chapter in front of you says
   this subject does and why. State them plainly enough that a measurement could
   contradict them. Hedged claims cannot be wrong, which makes them useless here.
2. **Write `src/datasets.js` and the subject module**, then run throwaway probe
   scripts in node (`node --input-type=module`) that test *those specific
   claims* — not the subject in general.
3. **The gap is the article.** A received explanation is a compression, and the
   part worth writing is where the compression is lossy: which claim is only true
   in a regime nobody mentions, which one is exactly true for a different reason
   than the one given, which one is a memorised phrase. Every article's best
   paragraph so far came out of this step and none of them were looking for it.
4. **Record the claims and the verdicts in the article's `README.md`**, and assert
   each verdict in `verify/check-numbers.mjs`, so a verdict cannot quietly stop
   being true.

Three of the ten existing articles (`isolation-forest`, `shapley-values`,
`xgboost`) still carry the starter's README and have no written claim list. They
are the three built before this step existed; do not take them as precedent.

**Look for an identity.** The strongest articles in the project are the ones that
found something provable and put it on screen — SMOTE's convex-hull containment
over 1.26M trials, the linear autoencoder's subspace, PSI's chi-square law drawn
over 35,000 simulated months with nothing fitted. Both of PSI's identities came
out of throwaway probes rather than the plan, and both changed what the article
was about. Spend probe time hunting for one.

The economics line has turned this into a budgeted step rather than a hope. All
four of its articles found a wide-range identity the plan did not contain, and in
all four it became the best figure: `constrained-choice`'s log-odds slope,
`economic-rent`'s point–line duality, `nash-equilibrium`'s `1/q* = 1 + F/G`, and
`comparative-advantage`'s band, exactly as wide as the ratio of the two
opportunity costs, with a product of gains that no relative size can change.

## Prefer an institutional parameter to a behavioural one

When a subject needs a knob that interpolates between two regimes, and both an
institutional and a behavioural parameter would do it, reach for the
institutional one.

`nash-equilibrium` wanted a continuum between "the monitor cannot respond" and
"the monitor best-responds". The behavioural version is logit quantal response
with precision lambda — real, citable machinery that nests both ends exactly. It
was built and dropped: damped best-response iteration on it does not converge
cleanly in that game, and the comparative static came back non-monotone in
lambda, flipping sign between 1 and 3. That is a solver wandering between
equilibria, not a result, and no amount of figure polish would have made it one.

What replaced it was a mandated **minimum audit rate**, which regulators actually
impose. It nests both regimes exactly, needs no solver, and the boundary between
them turned out to have a closed form — so the figure gained a kink with a number
on it instead of a smooth curve with a fixed point behind it.

Institutional parameters tend to have three advantages: a referent the reader
already believes in, a closed form, and no numerical method standing between you
and the claim. Reach for a behavioural one when the behaviour *is* the subject.

## When the received claim ranges over a free parameter

"At any price between the two opportunity costs, both sides gain" is true, and
it is where `comparative-advantage` came from. A claim quantified over something
the reader is invited to pick (a price, a split, a threshold) is only as useful
as the answer to *what picks it*. Close the model so that something inside it
does the choosing, then measure where the choice lands. There, the market price
sat exactly on one end of the range across a whole band of sizes, so the side at
that end gained exactly nothing, and the band's width had a closed form. When the
received account says "any X in this range works", the article is usually the X
that actually occurs.

## Kinds of subject

Name the kind in the spec. It decides what "verified" means; everything else in
the pipeline is the same whichever one it is.

| Kind | The subject is | The probe is |
|---|---|---|
| **method** | an algorithm or estimator you can implement | implement it, generate from a known truth, measure |
| **result** | a theorem or distributional fact, usually from a paper | simulate the law and lay the exact form over it, fitting nothing |
| **concept** | an intuition or a pitfall | build the regime where it holds and the one where it inverts |
| **model** | a closed system with assumptions | plant the truth, recover it, then break one assumption at a time |
| **empirical** | a claim about the world | real data, so the work is provenance, not simulation |

**method.** Received account: what the docs say it does and why. Assert identities
to machine precision wherever the subject has a theorem in it, two independent
derivations of the same quantity, and held-out data for anything about
generalisation. The limits section is where domain knowledge shows: calibration,
where the stopping rule comes from, what the importances are biased toward.
Examples: everything in the catalogue except PSI.

**result.** Received account: what the result gets *cited* for, which is often not
what it says. Assert the simulated moments against the closed form, the tail rate
against the nominal one, and the statistic against an independent implementation.
The limits section is the conditions the result needs, and what happens just
outside them. Example: PSI — the chi-square law is Yurdakul & Naranjo (2020)
Theorem 3.3, and the article says so; the picture and the subtraction are the
contribution.

**concept.** Received account: the intuition people carry, usually stated with no
regime attached. Probe by building both regimes and finding the boundary, then
assert the boundary as a number in both directions, and the closed form where one
exists. The limits section owes an honest answer to how often the bad regime
turns up in practice. Candidates: Simpson's paradox, regression to the mean,
multiple testing, where the bootstrap fails, Berkson's paradox, selection.

**model.** Received account: the identifying assumption — stated once in every
treatment and then forgotten. This is the most natural lab in the catalogue,
because the hook is a slider on the assumption: plant a truth, let the estimator
recover it, then break the assumption and watch the estimate go wrong. Assert
that the estimator equals the planted truth to machine precision while the
assumption holds — that is a theorem, not a tolerance — and that the bias matches
its closed form once it does not. Which assumption is load-bearing and which is
decoration *is* the article, not an aside. Candidates: difference-in-differences,
instrumental variables, synthetic control, event studies, Cournot, auctions,
Diamond–Dybvig, the Roy model.

**empirical.** You cannot simulate this one, so the work moves to provenance, and
the existing machinery supports it least. Rules, if you take one on:

- one pinned file per series in the article's `data/`, committed;
- `data/SOURCES.md` giving series ID, provider, URL, retrieval date and sha256;
- a fetch script that rewrites the file and fails if a checksum moves without a
  deliberate bump — **revised series silently change published articles**, so the
  vintage is part of the claim;
- `check-numbers.mjs` derives every number in the prose from the committed file,
  exactly as it derives them from modules elsewhere;
- the limits section says what the data cannot answer.

Prefer series with stable citations (FRED, SSB, Eurostat, World Bank, Penn World
Table). Attempt this kind after the others, not first.

## When the subject arrives as a source

A paper, a chapter, a set of lecture notes. The container can render PDF pages;
`device_bash` cannot, so stage the file to read it. Sources live in `sources/`
and never reach `site/`.

**A source makes pass 1 easier, not harder.** You do not have to reconstruct the
received account — it is in front of you, with its own emphasis and its own
compressions. List its claims in your own words and probe those.

- **One idea, not the chapter.** A chapter holds ten ideas; an article holds one.
  Pick the one with a claim provable on screen and drop the rest — the reader is
  not owed the chapter's coverage. If you cannot say in one sentence which idea
  it is, there is no article yet.
- **Where textbooks compress:** the regularity condition in a footnote, the "it
  can be shown that", the exercise whose answer is the whole intuition, the
  asymptotic result used at n = 40, the worked example whose numbers were chosen
  to come out even. Those are the article.
- **Reproduce one number independently before committing to the angle.** If you
  cannot reproduce it, that is a finding — and it is either the article or the
  reason to drop the subject. Do not build on a number you took on trust.
- **Cite precisely** — theorem, equation or section number — and say plainly what
  is yours and what is theirs.
- **Reproduce nothing.** Not sentences, not figures, not worked examples, not
  exercise data. If their figure is the clearest possible picture of the idea,
  draw a different one from data you generated. Standard notation is standard;
  everything else you write.

## What pass 1 hands over

A one-page spec, written to the project, stating:

- the slug, the **kind**, the **shape** (`reference/choosing-the-shape.md`), and
  why this subject wants that shape — "the default" is not a reason;
- the angle, in one sentence, narrow;
- the primary interactive hook, and where the smaller interactions go;
- the claim list with each verdict, and the figure that carries each one;
- what is going into `check-numbers.mjs`;
- for a source: the citation, and what is yours versus theirs.

The spec is written for the builder, not the reader. Its angle and verdicts are
pitched sharply so they can be argued with, and none of its sentences belong in
the article: `elasticity` shipped its spec's "what the number actually is, is…"
and "the curve they silently assume" word for word. Pass 2 writes the prose from
the claims, in the voice of `reference/writing-the-prose.md`.
