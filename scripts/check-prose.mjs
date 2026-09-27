#!/usr/bin/env node
/*
  check-prose.mjs — the voice gate.

  usage:  node scripts/check-prose.mjs <article-dir> [--report]

  Reads every .svelte file under <article-dir>/src, pulls out the prose a reader
  sees (paragraphs, list items, headings, captions), and fails on the drift that
  reference/writing-the-prose.md describes. ship.sh runs it after the numbers, so
  an article that breaks the house voice fails the same way as one that gets a
  number wrong.

  It is a floor, not the review. It cannot tell whether a sentence is clear, only
  whether it has the fingerprints of the two voices this project keeps sliding
  into: the choppy one (fragments, dashes, aphorisms) and the academic one
  (no contractions, grand adjectives, "every textbook", Figure-N captions).
  Reading the rendered page end to end is still pass 4's job.

  Exemptions live in <article-dir>/verify/prose.json, never in this file:
    { "spelling": "american", "allow": ["silently"] }
  Every entry there needs a reason in the article's README.

  Sentences built inside <script> (template strings) are not seen. Keep prose in
  the markup where you can.
*/
import { readFileSync, existsSync } from "node:fs";
import { join, relative, dirname } from "node:path";

const dir = process.argv[2];
const REPORT = process.argv.includes("--report");
if (!dir || !existsSync(join(dir, "src"))) {
  console.error("usage: node scripts/check-prose.mjs <article-dir> [--report]");
  process.exit(2);
}
const cfgPath = join(dir, "verify", "prose.json");
const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")) : {};
const allow = new Set((cfg.allow || []).map((s) => s.toLowerCase()));
const american = cfg.spelling === "american";

// ---------------------------------------------------------------- extraction
// Only the components the page actually renders: follow the .svelte imports
// from src/App.svelte, so a leftover scaffold component that nothing imports
// cannot pass or fail the gate on the article's behalf.
const files = [];
(function follow(f) {
  if (files.includes(f) || !existsSync(f)) return;
  files.push(f);
  const src = readFileSync(f, "utf8");
  for (const m of src.matchAll(/import\s+\w+\s+from\s+["'](\.{1,2}\/[^"']+\.svelte)["']/g))
    follow(join(dirname(f), m[1]));
})(join(dir, "src", "App.svelte"));

// Replace every {…} with a placeholder, matching nested braces and skipping
// quoted strings, so an expression's own braces cannot end it early.
function stripExpressions(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "{") { out += s[i]; continue; }
    let depth = 0, j = i, q = null;
    for (; j < s.length; j++) {
      const c = s[j];
      if (q) { if (c === "\\") j++; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'" || c === "`") { q = c; continue; }
      if (c === "{") depth++;
      else if (c === "}" && --depth === 0) break;
    }
    const inner = s.slice(i + 1, j).trim();
    // block tags ({#if}, {:else}, {/each}, {@const}) carry no reader text
    out += /^[#:/]|^@const/.test(inner) ? " " : "X";
    i = j;
  }
  return out;
}

const decode = (t) =>
  t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
   .replace(/&gt;/g, ">").replace(/&#8217;|&rsquo;/g, "’").replace(/&#8212;|&mdash;/g, "—")
   .replace(/&#8211;|&ndash;/g, "–").replace(/&minus;/g, "−");

const LABEL = /readout|legend|label|panel-title|card-title|lab-title|kicker|verdict|question|pill|btn|button|tick|axis|stat|value|key|chip|tag|eq\b/;
const blocks = []; // { file, tag, cls, text }
for (const f of files) {
  let s = readFileSync(f, "utf8");
  s = s.replace(/<script[\s\S]*?<\/script>/g, "")
       .replace(/<style[\s\S]*?<\/style>/g, "")
       .replace(/<!--[\s\S]*?-->/g, "")
       .replace(/<svg[\s\S]*?<\/svg>/g, "");
  s = stripExpressions(s);
  const re = /<(p|li|h[1-6]|figcaption|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(s))) {
    const cls = (m[2].match(/class="([^"]*)"/) || [, ""])[1];
    const raw = m[3];
    const text = decode(raw.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (!text || text === "X") continue;
    blocks.push({ file: relative(dir, f), tag: m[1], cls, text, raw });
  }
}

// Titles of papers and books are quoted or italicised; they are somebody else's
// words, so the phrasing and spelling rules skip them.
const unquoted = (b) => decode(b.raw.replace(/<(em|i|cite)>[\s\S]*?<\/\1>/g, " ").replace(/<[^>]+>/g, ""))
  .replace(/“[^”]*”|"[^"]*"/g, " ").replace(/\s+/g, " ");
const isHeading = (b) => /^h[1-6]$/.test(b.tag);
const isLabel = (b) => LABEL.test(b.cls);
const isSource = (b) =>
  /\b(\d{4})\)?[.,]/.test(b.text) && /(Journal|Review|Econometrica|Press|Quarterly|Economics|pp\.|\d+\(\d+\)|CORE Econ)/.test(b.text) && b.tag === "li";
const prose = blocks.filter((b) => !isHeading(b) && !isLabel(b) && !isSource(b));
const allText = prose.map((b) => b.text).join(" \n");
const words = (allText.match(/[A-Za-z’'][A-Za-z’'-]*/g) || []).length;

// The scaffold, and an article in pass 2 with only placeholder text, have too
// little prose to judge. Say so rather than fail on a placeholder.
if (words < 300) {
  console.log(`\x1b[2m  prose gate: only ${words} words of prose so far, nothing to judge yet\x1b[0m`);
  process.exit(0);
}

// ---------------------------------------------------------------- the rules
const fails = [];
const warns = [];
const fail = (rule, msg, where = "") => fails.push(`${rule}: ${msg}${where ? `  [${where}]` : ""}`);
const warn = (rule, msg, where = "") => warns.push(`${rule}: ${msg}${where ? `  [${where}]` : ""}`);
const clip = (t, n = 90) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

// 1. "Thanks for reading!" is its own paragraph
if (!blocks.some((b) => b.tag === "p" && b.text === "Thanks for reading!"))
  fail("thanks", '"Thanks for reading!" must be a paragraph on its own');

// 2. dashes: at most one pair in a paragraph, and in few paragraphs at all
const dashCount = (t) => (t.match(/—|\s–\s/g) || []).length;
const dashed = prose.filter((b) => dashCount(b.text) > 0);
for (const b of prose)
  if (dashCount(b.text) > 2) fail("dashes", `more than one dash pair: "${clip(b.text)}"`, b.file);
const dashShare = prose.length ? dashed.length / prose.length : 0;
if (dashShare > 0.15)
  fail("dashes", `${dashed.length} of ${prose.length} paragraphs have a dash (limit 15%); use commas, a colon, brackets or a new sentence`);

// 3. contractions: the academic voice has none
const CONTR = /\b(it|that|there|here|what|who|let|we|you|they|I|isn|aren|wasn|weren|doesn|don|didn|can|won|wouldn|couldn|shouldn|hasn|haven|hadn)['’](s|t|ll|re|ve|d|m)\b/gi;
const contractions = (allText.match(CONTR) || []).length;
const cPerK = words ? (1000 * contractions) / words : 0;
if (words > 400 && cPerK < 5)
  fail("contractions", `${cPerK.toFixed(1)} per 1,000 words (floor 5; MLU-Explain runs about 12). Write "it's", "doesn't", "we'll" where a person would say them`);

// 4. words and phrases that belong to an op-ed, not a patient guide
const BANNED = [
  // grand adjectives and adverbs
  "startling", "decisive", "exquisite", "iconic", "wildly", "secretly", "silently",
  "aggressively", "fundamentally", "strikingly", "remarkably", "crucially", "profoundly",
  "bit-for-bit", "the core insight", "a dangerous pitfall", "inflict(?:s|ed|ing)?",
  "destroy(?:s|ed|ing)?", "destruction", "beautiful", "cherish(?:es|ed)?", "catastrophic",
  "exceptionally", "elegant", "stunning", "perverse(?!\\s+case)",
  // verification talk: that belongs in check-numbers.mjs, not in front of a reader
  "decimal places", "to the last (?:digit|decimal)", "behind this page", "rendered pixels",
  "worst gap", "(?:blind )?numerical search", "identical to \\d+ decimals",
  // internal notes that were never meant to ship
  "verify (?:each|all|them|these|both|the citations?)[^.]*before relying", "TODO", "TBD", "FIXME",
  // the aphorism closer
  "in one sentence",
  // sweeping claims about what everybody is taught
  "every (?:introductory |first |economics )?(?:textbook|course|curriculum)",
  "standard textbooks", "every(?:one|body) is taught", "textbooks have",
  // the reader in the third person, and articles that think they are chapters
  "the reader", "this chapter", "previous chapter", "next chapter", "companion essay",
  "(?:subsequent|following|later|earlier|coming) chapters?", "visual explainers series",
  // pointing at layout: the panels stack on a phone, so say "the first panel"
  "the (?:left|right)(?:-hand)? (?:panel|chart|plot|figure)", "on the (?:left|right)",
];
for (const b of blocks) {
  if (isSource(b)) continue;
  for (const w of BANNED) {
    const re = new RegExp(`\\b${w}\\b`, "i");
    const m = unquoted(b).match(re);
    if (m && !allow.has(m[0].toLowerCase())) fail("phrasing", `"${m[0]}" in "${clip(b.text)}"`, b.file);
  }
}

// 5. captions are sentences about the chart, not numbered exhibits
for (const b of blocks)
  if (/^Figure \d+\./.test(b.text)) fail("captions", `numbered-exhibit caption: "${clip(b.text, 60)}"`, b.file);

// 6. headings typed in capitals (use CSS if a heading should look like that)
for (const b of blocks.filter(isHeading)) {
  const letters = b.text.replace(/[^A-Za-z]/g, "");
  if (letters.length > 6 && letters === letters.toUpperCase() && !/MARTIN LE/.test(b.text))
    fail("headings", `typed in capitals: "${b.text}"`, b.file);
}

// 7. LaTeX typed straight into the markup ships as "$R^2 = 1.0$" with the dollar
//    signs showing. It needs {@html katexify(...)} or plain text.
for (const b of blocks) {
  const m = b.text.match(/\$[^$\n]*[\\^_=][^$\n]*\$/);
  if (m) fail("latex", `unrendered LaTeX "${clip(m[0], 40)}"; wrap it in katexify or write it as text`, b.file);
}

// 8. spelling: British unless the article says otherwise
if (!american) {
  const AM = /\b(\w+(?:iz(?:e|es|ed|ing|ation|ations))|analyz\w*|behavior\w*|colou?r(?<!colour)|center\w*|\w*meter(?:s)?|labor\b|favor\w*|modeling|neighbor\w*)\b/g;
  const OK = new Set(["size", "sizes", "sized", "sizing", "prize", "prizes", "seize", "parameter", "parameters", "diameter", "perimeter", "color", "colors"]);
  for (const b of prose) {
    for (const m of unquoted(b).matchAll(AM)) {
      const w = m[0].toLowerCase();
      if (OK.has(w) || /^(citizen|parameteriz)/.test(w)) continue;
      if (w === "color" || w === "colors") continue;
      fail("spelling", `American spelling "${m[0]}" (British everywhere except xgboost)`, b.file);
    }
  }
}

// 9. file paths and code names in reader-facing text. "Every number is ours" is
//    the whole of what a reader needs; src/market.js and check-numbers.mjs are not.
for (const b of blocks) {
  const m = b.text.match(/\b(?:src|verify|scripts|public)\/[\w./-]+|\b[\w-]+\.(?:mjs|js|svelte|json)\b|check-numbers|check-browser/);
  if (m) fail("paths", `file or script name in reader-facing text: "${m[0]}" in "${clip(b.text)}"`, b.file);
}

// 10. kickers and decks above the title ("Microeconomics · Part 07") are paper furniture
for (const b of blocks)
  if (/(^|\s)(kicker|dek|eyebrow)(\s|$)/.test(b.cls) || /\bPart \d+\b/.test(b.text) && /·/.test(b.text))
    fail("furniture", `a kicker or deck line: "${clip(b.text, 60)}"; the #intro block has a title, a subtitle and a date`, b.file);

// 11. "exactly" is for claims that are exact, and it stops meaning anything when
//     it is in every other paragraph.
const exactN = (allText.match(/\bexactly\b/gi) || []).length;
const exactK = words ? (1000 * exactN) / words : 0;
if (words > 400 && exactK > 8)
  fail("exactly", `"exactly" ${exactN} times (${exactK.toFixed(1)} per 1,000 words, limit 8); keep it where the exactness is the point`);

// 12. captions that repeat the paragraph beside them. A caption says what to look
//     at; the prose explains. Count the literal numbers a caption shares with any
//     one paragraph of body text.
const CAPTION = /caption|fig-title|figure-desc|head-sub|card-sub|strip-sub|col-desc|fig-sub|note|figcaption/;
const nums = (t) => new Set((t.match(/\d+(?:[.,]\d+)*/g) || []).filter((n) => !/^[0-9]$/.test(n) && !/^(19|20)\d\d$/.test(n)));
const caps = prose.filter((b) => CAPTION.test(b.cls) || b.tag === "figcaption");
const body = prose.filter((b) => !caps.includes(b));
for (const c of caps) {
  const cn = nums(c.text);
  if (cn.size < 3) continue;
  for (const p of body) {
    const shared = [...nums(p.text)].filter((n) => cn.has(n));
    if (shared.length >= 4) {
      fail("repeats", `a caption and a paragraph share ${shared.length} numbers (${shared.slice(0, 5).join(", ")}); cut the caption to what to look at: "${clip(c.text, 60)}"`, c.file);
      break;
    }
    if (shared.length === 3) { warn("repeats", `a caption and a paragraph share 3 numbers (${shared.join(", ")}): "${clip(c.text, 60)}"`, c.file); break; }
  }
}

// ---------------------------------------------------------------- soft signals
const sentences = prose.flatMap((b) => b.text.split(/(?<=[.!?:])\s+(?=[A-Z“"(])/)).filter((s) => s.split(" ").length > 2);
const lens = sentences.map((s) => s.split(/\s+/).length);
const meanLen = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
const WE = /\b(we|we['’]ll|we['’]ve|we['’]re|let['’]s|us|our)\b/gi;
const weK = words ? (1000 * (allText.match(WE) || []).length) / words : 0;
const youK = words ? (1000 * (allText.match(/\b(you|your)\b/gi) || []).length) / words : 0;
// "We" is the MLU-Explain voice: about 36 per 1,000 words in the originals. The
// floor is well under that; the warning is the target.
if (words > 400 && weK < 12) fail("narration", `"we/let's/our/us" ${weK.toFixed(1)} per 1,000 words (floor 12, target 18+, MLU-Explain about 36); narrate as a guide working through it with the reader`);
else if (words > 400 && weK < 18) warn("narration", `"we/let's/our/us" ${weK.toFixed(1)} per 1,000 words; the target is 18+ (MLU-Explain runs about 36)`);
if (words > 400 && youK < 2) fail("narration", `"you" ${youK.toFixed(1)} per 1,000 words (floor 2); tell the reader what to drag, click and look at`);
// MLU-Explain's mean sentence is about 18 words. Saying the "so" and "because"
// out loud is not a licence to chain four clauses into one sentence.
if (meanLen > 24) fail("sentences", `mean sentence is ${meanLen.toFixed(1)} words (limit 24, MLU-Explain about 18); split the long ones`);
else if (meanLen > 21) warn("sentences", `mean sentence is ${meanLen.toFixed(1)} words; MLU-Explain runs about 18`);
for (const s of sentences) {
  const n = s.split(/\s+/).length;
  if (n > 50) fail("sentences", `a ${n}-word sentence (limit 50): "${clip(s, 70)}"`);
  else if (n > 38) warn("sentences", `a ${n}-word sentence: "${clip(s, 70)}"`);
}
for (const b of prose) if ((b.text.match(/;/g) || []).length >= 2) warn("semicolons", `two or more semicolons in one paragraph reads as an aphorism list: "${clip(b.text, 60)}"`, b.file);
for (const b of prose) {
  const bolds = [...b.raw.matchAll(/<(strong|b)>([^<]*)<\/\1>|class="bold">([^<]*)</g)].map((m) => (m[2] || m[3] || "").trim());
  // a bold live value in a readout ("X" is an interpolation) is a label, not prose
  for (const t of bolds) if (!/X/.test(t) && (/^[−\-\d.,×% ]+$/.test(t) || /[=÷]/.test(t))) warn("bold", `bold on a number or formula rather than a term: "${t}"`, b.file);
}

// ---------------------------------------------------------------- output
const green = (s) => `\x1b[32m${s}\x1b[0m`, red = (s) => `\x1b[31m${s}\x1b[0m`, dim = (s) => `\x1b[2m${s}\x1b[0m`;
const summary = `${words} words in ${prose.length} paragraphs · contractions ${cPerK.toFixed(1)}/1k · dashes in ${dashed.length}/${prose.length} · we ${weK.toFixed(1)}/1k · you ${youK.toFixed(1)}/1k · exactly ${exactK.toFixed(1)}/1k · mean sentence ${meanLen.toFixed(1)}`;
if (REPORT || fails.length || warns.length) console.log(dim(`  prose  ${summary}`));
for (const w of warns) console.log(dim(`  warn   ${w}`));
for (const f of fails) console.log(red(`  FAIL   ${f}`));
if (fails.length) {
  console.log(red(`  prose gate: ${fails.length} failure(s). reference/writing-the-prose.md has the rules and the fixes.`));
  process.exit(1);
}
console.log(green(`  prose gate passed`) + (REPORT ? "" : dim(`  (${summary})`)));
