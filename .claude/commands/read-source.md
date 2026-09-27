---
description: Read a paper, chapter or set of lecture notes and write a study note to the project
argument-hint: [file in sources/, or a citation]
---

Read the source and write a study note. This is the cheap tier — one session, no
components, no article. Most sources should stop here.

Source: $ARGUMENTS

Put the file in `sources/` if it is not there already. `device_bash` cannot render
a PDF: stage it into the container and read it there.

Read the "When the subject arrives as a source" section of
`reference/pass-1-design.md` first. Then read the source properly — not the
abstract, not the introduction and the conclusion.

Write the note to the project at `<slug>-source-note.md`:

1. **What it claims** — four or five flat claims in your own words, each stated
   plainly enough that a measurement could contradict it, each with the theorem,
   equation or section number it comes from.
2. **The load-bearing step.** Which lemma, assumption or approximation the result
   actually rests on, and what breaks without it. Name it even when the source
   buries it in a regularity condition or an "it can be shown that".
3. **Cited for versus shows.** What the result gets used for in practice, and
   whether it supports that use. This gap is where the articles come from.
4. **One number reproduced.** Take the central quantity, implement it yourself in
   node from the description alone, and report your value against theirs. If they
   disagree, say which you trust and why. If you cannot reproduce it, that is the
   most important line in the note.
5. **Candidate angles** — for each, the claim it would put on screen, and whether
   that claim is *provable on screen*: something a reader watches happen and a
   check can assert. Judge that honestly; "would make a nice figure" is not it.
6. **Verdict.** Is there an article here? If so, which angle and which kind. If
   not, say so plainly — that is a good outcome, and it cost one session instead
   of four.

Quote nothing. Do not scaffold, do not write components, do not open an
output-format skill. If the verdict is yes, this note is the input to
`/new-article`, which redoes pass 1 properly against it rather than inheriting it.
