# Hybrid workflow: Opus 5 for judgement, Gemini 3.8 Flash for bulk

Opt-in. Read this only when asked for the cheap or hybrid workflow; the default
is the four passes in CLAUDE.md, all on one model.

## What it is actually saving

| | Input / Mtok | Output / Mtok |
|---|---|---|
| Claude Opus 5 | $5 | $25 |
| Gemini 3.8 Flash | $0.75 | $3.75 |

About 6.7× on both sides, with a 1M-token context and image input. But on a Max
plan the currency is the seat allowance, not dollars, and the real saving is not
the price per token — it is **context that never enters the Opus session at
all**. Anything Opus reads is re-sent with every subsequent request for the rest
of that session, so a one-off 25k-token read costs 25k tokens once and then
again, at the cached rate, on every tool call after it.

The worked example is the screenshots. Seven full-page shots at the sizes used
in the SMOTE build come to roughly 25k tokens, and looking at them is
non-negotiable — every bug that mattered in this project was invisible to every
assertion. Delegated, Flash reads thirteen of them, returns ~500 tokens of
findings, and Opus opens three crops: on the order of 25k tokens down to 3k, with
the quality gate intact.

## Before it works: the egress problem

Neither the Cowork VM nor the cloud container can reach
`generativelanguage.googleapis.com` — both sit behind an egress allowlist that
does not include it. Check with:

```bash
./scripts/ask-gemini.sh --check
```

Two ways round it:

1. **Add the host to the account's egress allowlist.** Then `ask-gemini.sh`
   works in-session and Claude can do the handoffs itself. This is the version
   worth having.
2. **Run the script from your own terminal on the Mac**, outside the Cowork VM,
   with `GEMINI_API_KEY` set, and paste the result back. Works today; it makes
   you the router, which is fine for the batch passes below because each is one
   command producing a short answer.

## Division of labour

**Send to Flash — bulk in, short answer out, and always behind a gate:**

- **Screenshot triage.** The highest-value delegation, because it removes the
  single most expensive thing Opus reads while keeping the check that catches
  what assertions cannot. `scripts/prompts/shot-triage.txt` is the prompt.
- **Reference reconnaissance.** "Across these nine Svelte articles' components,
  which implements a draggable point on a scatter, and how is the drag
  attached?" A 1M context swallows the lot and returns four lines. Opus never
  opens the files.
- **Consistency sweep.** The article's prose plus the README claims table plus
  the check output: does any sentence contradict a number, is any figure
  referenced but absent, is the terminology the same throughout, are there
  repeated words. It finds candidates; Opus decides.
- **Mechanical multi-file edits.** Apply a CSS convention across eight
  components, rename a prop everywhere. Safe because `./verify/ship.sh` and the
  62 assertions behind it will fail loudly if it went wrong.
- **Unstructured log triage.** Only when grep genuinely cannot do it — grep is
  free.

**Never send to Flash:**

- **The angle, and the claims list.** Pass 1 is the whole article; a cheaper
  model picking the angle is a cheaper article.
- **The generative model.** Getting the data wrong invalidates every number
  downstream, and the failure is silent.
- **Prose in the article's voice.** It will flatten it, and you will not notice
  in a diff.
- **Adjudicating prose against a chart.** The "bulge" paragraph in the SMOTE
  build was a sentence describing a shape that was not in the picture. Flash may
  well flag that as a candidate — let it — but deciding what the sentence should
  say instead is the job you are paying Opus for.
- **Deciding whether a failing check or the code is wrong.** Getting this
  backwards writes the bug into the test suite.

## The passes, with the handoffs marked

1. **Design — Opus.** Claims list, generative model, probe scripts, the spine.
   No delegation. This is the pass that decides whether the article is worth
   reading.
2. **Build — Opus or Sonnet, with Flash for recon.** Before writing a component
   whose interaction you have not built before, send the reconnaissance question
   rather than reading four components.
3. **Verify — Sonnet or Haiku, with Flash for triage.** `./verify/ship.sh`, the
   browser checks, then hand every screenshot to Flash and open only what it
   flags. Then the consistency sweep.
4. **Review — Opus.** Read the prose against the flagged crops, run the final
   read-through in `reference/verifying-an-article.md`, decide every claim.

## Rules that make delegation safe

- **Nothing Flash touched counts until `./verify/ship.sh` is green.** The check
  suite is what makes a cheap model editing files a low-risk act. Without it,
  it is just a cheap model editing files.
- **Verify its hits, do not trust them.** It reports candidates. Two of the
  three real problems found by eye in the SMOTE build were semantic — a
  paragraph disagreeing with a picture — and a confident wrong answer about
  those is worse than no answer.
- **Never let it write a number into the prose.** Every figure in an article
  comes from `experiments.js` at render time, so there is nothing for it to
  paraphrase and get subtly wrong.
- **Keep the prompts in `scripts/prompts/`,** not inline, so the same triage
  runs the same way on every article and can be improved once.
