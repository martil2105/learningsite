/*
  Browser checks for samuelson-1963 at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/samuelson-1963-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8790";
const SHOTS = process.env.SHOTS || "";
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 },
];

let pass = 0;
const fails = [];
const ok = (claim, cond, detail = "") =>
  cond ? pass++ : fails.push(`${claim}${detail ? ` — ${detail}` : ""}`);
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const num = async (page, sel) =>
  parseFloat(((await page.locator(sel).first().textContent()) || "").replace(/[−–]/g, "-").replace(/[^\d.\-]/g, ""));
const settle = (page) => page.waitForTimeout(80);
async function setRange(page, sel, value) {
  await page.locator(sel).evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await settle(page);
}

if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const noise = [];
  page.on("pageerror", (e) => noise.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") noise.push(`console: ${m.text()}`); });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const at = (claim) => `${vp.name}: ${claim}`;

  // ---------------------------------------------------------- common checks
  const textLen = await page.evaluate(() => document.body.innerText.trim().length);
  ok(at("the page renders its text"), textLen > 2000, `${textLen} characters`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(at("the page does not scroll horizontally"), overflow <= 0, `${overflow}px too wide`);

  const svgs = await page.evaluate(() =>
    [...document.querySelectorAll("svg")].filter((s) => !s.closest(".katex")).map((s) => {
      const r = s.getBoundingClientRect();
      const p = s.parentElement.getBoundingClientRect();
      return { cls: String(s.parentElement.className || "svg").slice(0, 30), over: Math.max(0, Math.round(r.right - p.right), Math.round(p.left - r.left)), vb: s.hasAttribute("viewBox") };
    })
  );
  ok(at("every chart svg fits inside its parent"), svgs.every((s) => s.over <= 1), svgs.filter((s) => s.over > 1).map((s) => `${s.cls} +${s.over}px`).join("; "));
  ok(at("every chart svg has a viewBox"), svgs.every((s) => s.vb), `${svgs.filter((s) => !s.vb).length} without`);

  const geom = async () => page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("svg [d], svg circle, svg rect, svg line, svg text")) {
      const d = el.getAttribute("d");
      if (d && /NaN|undefined|Infinity/.test(d)) bad.push(`d=${d.slice(0, 30)}`);
      for (const a of ["cx", "cy", "x1", "y1", "x2", "y2", "x", "y", "r", "width", "height"]) {
        const v = el.getAttribute(a);
        if (v !== null && v !== "" && !/%$/.test(v) && !Number.isFinite(+v)) bad.push(`${el.tagName} ${a}=${v}`);
      }
    }
    return bad;
  });
  const g0 = await geom();
  ok(at("no NaN/undefined/Infinity in SVG geometry on load"), g0.length === 0, g0.slice(0, 3).join("; "));

  const hygiene = await page.evaluate(() => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll(".katex, svg, script, style").forEach((e) => e.remove());
    const t = clone.innerText;
    return {
      dollars: (t.match(/\$[^$\n]{0,40}[\\^_=][^$\n]{0,40}\$/) || [""])[0],
      backslash: (t.match(/\\[a-zA-Z]{3,}/) || [""])[0],
      bad: (t.match(/\bNaN\b|\bundefined\b|\bnull\b|\bInfinity\b/) || [""])[0],
      katex: document.querySelectorAll(".katex").length,
      katexErr: document.querySelectorAll(".katex-error").length,
      thanks: [...document.querySelectorAll("p")].some((p) => p.textContent.trim() === "Thanks for reading!"),
      title: (() => { const h = document.querySelector("#intro-hed"); if (!h) return -1; const r = h.getBoundingClientRect(); return Math.round(r.right - window.innerWidth); })(),
    };
  });
  ok(at("no raw $…$ LaTeX in the text"), !hygiene.dollars, hygiene.dollars);
  ok(at("no raw LaTeX commands in the text"), !hygiene.backslash, hygiene.backslash);
  ok(at("no NaN/undefined/null in the text"), !hygiene.bad, hygiene.bad);
  ok(at("KaTeX rendered, with no errors"), hygiene.katex > 0 && hygiene.katexErr === 0, `${hygiene.katex} rendered, ${hygiene.katexErr} errors`);
  ok(at('"Thanks for reading!" is a paragraph'), hygiene.thanks);
  ok(at("the title fits the viewport"), hygiene.title <= 0, `${hygiene.title}px over`);

  // ---------------------------------------------------- this article's checks
  const width = vp.width;
  const check = (claim, cond, detail = "") => ok(at(claim), cond, detail);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) || "").trim();
  const card = await page.evaluate(() => { const c = document.querySelector("#paper"); return c ? c.innerText : ""; });
  check(`the paper card cites Scientia 98 @${width}`, /Scientia/.test(card) && /98, 108–113/.test(card));

  // Bets lab: one bet, then a hundred, then shared.
  check(`one bet: $50 on average @${width}`, (await txt("#bl-r-mean .value")) === "$50");
  check(`one bet: half the time we lose @${width}`, (await txt("#bl-r-loss .value")) === "50%");
  await setRange(page, "#bl-n", 100);
  check(`a hundred: $5,000 on average @${width}`, (await txt("#bl-r-mean .value")) === "$5,000");
  check(`a hundred: 1 in 2,289 chance of losing @${width}`, (await txt("#bl-r-loss .value")) === "1 in 2,289", await txt("#bl-r-loss .value"));
  check(`a hundred: worst case −$10,000 @${width}`, (await txt("#bl-r-worst .value")) === "−$10,000");
  check(`a hundred: typical swing ±$1,500 @${width}`, (await txt("#bl-r-sd .value")) === "±$1,500");
  const bars = await page.evaluate(() => {
    const svg = document.querySelector("#fig-bets svg");
    const zx = +svg.querySelector("line.zero").getAttribute("x1");
    const rs = [...svg.querySelectorAll("rect.bar")];
    const mid = (r) => +r.getAttribute("x") + +r.getAttribute("width") / 2;
    return { n: rs.length, loss: rs.filter((r) => r.classList.contains("loss")).length,
      lossLeft: rs.filter((r) => r.classList.contains("loss")).every((r) => mid(r) < zx), gainRight: rs.filter((r) => r.classList.contains("gain")).every((r) => mid(r) > zx) };
  });
  check(`a hundred: 101 bars, 34 of them losing @${width}`, bars.n === 101 && bars.loss === 34, JSON.stringify(bars));
  check(`every pink bar is left of zero and every blue bar right of it @${width}`, bars.lossLeft && bars.gainRight);
  await page.click('#bl-hold button[data-value="share"]');
  await settle(page);
  check(`shared: $50 each on average @${width}`, (await txt("#bl-r-mean .value")) === "$50");
  check(`shared: worst case −$100 @${width}`, (await txt("#bl-r-worst .value")) === "−$100");
  check(`shared: typical swing ±$15 @${width}`, (await txt("#bl-r-sd .value")) === "±$15");
  check(`shared: the chance of losing doesn't change @${width}`, (await txt("#bl-r-loss .value")) === "1 in 2,289");

  // CARA lab.
  check(`cautious: one bet worth about −$10 @${width}`, (await txt("#cl-r-one .value")) === "−$9.97", await txt("#cl-r-one .value"));
  check(`cautious: a hundred worth about −$1,000 @${width}`, (await txt("#cl-r-hundred .value")) === "−$997", await txt("#cl-r-hundred .value"));
  check(`cautious: turns it down @${width}`, (await txt("#cl-r-verdict .value")) === "turns it down");
  const onLine = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-cara svg");
    const l = svg.querySelector("line.ce-line");
    const [x1, y1, x2, y2] = ["x1", "y1", "x2", "y2"].map((k) => +l.getAttribute(k));
    let worst = 0;
    for (const c of svg.querySelectorAll("circle.long-way")) {
      const px = +c.getAttribute("cx"), py = +c.getAttribute("cy");
      const d = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) / Math.hypot(x2 - x1, y2 - y1);
      worst = Math.max(worst, d);
    }
    return worst;
  });
  let d0 = await onLine();
  check(`cautious: every long-way circle sits on the line @${width}`, d0 < 0.5, d0.toFixed(3));
  await page.click('#cl-presets button:has-text("Keen")');
  await settle(page);
  check(`keen: one bet worth about $17 @${width}`, (await txt("#cl-r-one .value")) === "$17.33");
  check(`keen: a hundred about $1,700 @${width}`, (await txt("#cl-r-hundred .value")) === "$1,733");
  check(`keen: takes it @${width}`, (await txt("#cl-r-verdict .value")) === "takes it");
  d0 = await onLine();
  check(`keen: every long-way circle sits on the line @${width}`, d0 < 0.5, d0.toFixed(3));
  await page.click('#cl-presets button:has-text("On the fence")');
  await settle(page);
  check(`on the fence: one bet is worth nothing @${width}`, (await txt("#cl-r-one .value")) === "$0.00", await txt("#cl-r-one .value"));
  check(`on the fence: the cap is $144 @${width}`, (await txt("#cl-r-cap .value")) === "$144");
  const flat = await page.evaluate(() => { const l = document.querySelector("#fig-cara line.ce-line"); return Math.abs(+l.getAttribute("y1") - +l.getAttribute("y2")); });
  check(`on the fence: the line is flat along zero @${width}`, flat < 0.01, flat.toFixed(4));

  // Loss aversion.
  check(`2.25: one bet worth −$12.50 @${width}`, (await txt("#kf-r-one .value")) === "−$12.50", await txt("#kf-r-one .value"));
  check(`2.25: a hundred one at a time −$1,250 @${width}`, (await txt("#kf-r-seq .value")) === "−$1,250");
  check(`2.25: a hundred as a package about $5,000 @${width}`, (await txt("#kf-r-pkg .value")) === "$5,000");
  const zeroY = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-kink svg");
    const zl = [...svg.querySelectorAll("line")].find((l) => !l.classList.contains("lam-marker") && l.getAttribute("y1") === l.getAttribute("y2") && +l.getAttribute("stroke-width") === 1.2);
    return { zero: +zl.getAttribute("y1"), one: +svg.querySelector("circle.one-dot").getAttribute("cy"), pkg: +svg.querySelector("circle.pkg-dot").getAttribute("cy") };
  });
  let z = await zeroY();
  check(`2.25: the pink dot is below zero and the blue one above @${width}`, z.one > z.zero && z.pkg < z.zero, JSON.stringify(z));
  await setRange(page, "#kf-lambda", 1.9);
  z = await zeroY();
  check(`below 2: the pink dot crosses into positive territory @${width}`, z.one < z.zero, JSON.stringify(z));

  if (SHOTS) {
    for (const id of await page.evaluate(() => [...document.querySelectorAll(".fin-card")].map((c) => c.id))) {
      await page.locator("#" + id).screenshot({ path: `${SHOTS}/${vp.name}-${id}.png` });
    }
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
  }

  const g1 = await geom();
  ok(at("no NaN/undefined/Infinity in SVG geometry after the interactions"), g1.length === 0, g1.slice(0, 3).join("; "));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${vp.name}-full.png`, fullPage: true });
  ok(at("no page errors or console errors"), noise.length === 0, noise.slice(0, 3).join(" | "));
  await page.close();
}

await browser.close();
if (fails.length) {
  console.log(`\n${fails.length} FAILED of ${pass + fails.length}:`);
  for (const f of fails) console.log("  FAIL " + f);
  process.exit(1);
}
console.log(`\nALL ${pass} CHECKS PASS`);
