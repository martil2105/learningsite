/*
  Browser checks for anarkulova-cederburg-odoherty-2022 at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/anarkulova-cederburg-odoherty-2022-shots node verify/check-browser.mjs

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

  const outside = await page.evaluate(() => {
    const bad = [];
    for (const s of document.querySelectorAll("svg")) {
      if (s.closest(".katex")) continue;
      const r = s.getBoundingClientRect();
      for (const el of s.querySelectorAll("path, circle, rect, line, text")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;
        if (b.left < r.left - 1.5 || b.right > r.right + 1.5 || b.top < r.top - 1.5 || b.bottom > r.bottom + 1.5)
          bad.push(`${s.getAttribute("class") || "svg"} ${el.tagName}.${el.getAttribute("class") || ""}`);
      }
    }
    return bad;
  });
  ok(at("nothing is drawn outside its svg"), outside.length === 0, outside.slice(0, 4).join("; "));
  const glued = await page.evaluate(() => {
    // the rendered text, laid out (flex items are separate lines), with maths and charts hidden
    const hide = [...document.querySelectorAll(".katex, svg")].filter((e) => !e.closest(".katex") || e.classList.contains("katex"));
    const was = hide.map((e) => e.style.display);
    hide.forEach((e) => (e.style.display = "none"));
    const t = document.body.innerText;
    hide.forEach((e, i) => (e.style.display = was[i]));
    return (t.match(/[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/) || [""])[0];
  });
  ok(at("no text glued to a number"), !glued, glued);
  const semis = await page.evaluate(() => [...document.querySelectorAll(".katex annotation")].map((a) => a.textContent).filter((t) => /(^|[^\\]);/.test(t)));
  ok(at("no KaTeX spacing command lost its backslash"), semis.length === 0, semis.slice(0, 2).join(" | "));

  // ---------------------------------------------------- this article's checks
  const width = vp.width;
  const check = (claim, cond, detail = "") => ok(at(claim), cond, detail);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) || "").trim();
  const clickSeg = async (id, v) => { await page.click(`#${id} button[data-value="${v}"]`); await settle(page); };
  const card = await page.evaluate(() => (document.querySelector("#paper") || {}).innerText || "");
  check(`the paper card cites JFE 143(1) @${width}`, /Journal of Financial Economics/.test(card) && /143\(1\), 409–433/.test(card));

  // ---- the markets lab
  check(`opens on a world whose luckiest market grew 7.8% @${width}`, (await txt("#ml-r-best .value")) === "7.8% a year");
  check(`truth at thirty years: 13.7% @${width}`, (await txt("#ml-r-truth .value")) === "13.7%");
  check(`luckiest record: 2.3% @${width}`, (await txt("#ml-r-bestp .value")) === "2.3%");
  check(`pooled: 12.2% @${width}`, (await txt("#ml-r-pool .value")) === "12.2%");
  const lab = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-markets svg.markets");
    const lastY = (d) => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); return n[n.length - 1]; };
    const lastX = (d) => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); return n[n.length - 2]; };
    const best = svg.querySelector("path.best-line").getAttribute("d");
    const others = [...svg.querySelectorAll("g.others path")].map((p) => p.getAttribute("d"));
    const right = Math.max(lastX(best), ...others.map(lastX));
    // the blue line ends highest among the lines that reach the right edge
    const endsHighest = others.filter((d) => Math.abs(lastX(d) - right) < 0.05).every((d) => lastY(d) >= lastY(best) - 0.01);
    const loss = document.querySelector("#fig-markets svg.loss-panel");
    const dot = loss.querySelector("circle.best-dot"), cx = +dot.getAttribute("cx"), cy = +dot.getAttribute("cy");
    const n = loss.querySelector("path.best-curve").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    let onCurve = 99; for (let i = 0; i + 1 < n.length; i += 2) if (Math.abs(n[i] - cx) < 0.02) onCurve = Math.abs(n[i + 1] - cy);
    const t = loss.querySelector("path.truth-curve").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    let below = true; for (let i = 0; i + 1 < n.length; i += 2) if (n[i + 1] < t[i + 1] - 0.01 && n[i] > t[0] + 1) below = false; // blue at or under black means lower chance? (y grows down)
    return { lines: others.length + 1, endsHighest, onCurve, blueUnder: below };
  });
  for (let i = 0; i < 3; i++) {
    const L = await lab();
    check(`world ${i + 1}: 39 lines, and the blue one ends highest @${width}`, L.lines === 39 && L.endsHighest);
    check(`world ${i + 1}: the blue dot sits on its curve @${width}`, L.onCurve < 0.02, L.onCurve.toFixed(3));
    check(`world ${i + 1}: the luckiest record's loss chance is under the truth at every horizon @${width}`, L.blueUnder);
    const before = await txt("#ml-r-best .value");
    await page.click("#ml-new"); await settle(page);
    check(`a new world changes the luckiest market @${width}`, (await txt("#ml-r-best .value")) !== before);
  }
  await setRange(page, "#ml-T", 10);
  check(`the horizon slider moves the truth readout (26.4% at ten) @${width}`, (await txt("#ml-r-truth .value")) === "26.4%");
  await setRange(page, "#ml-T", 30);

  // ---- the luck figure
  check(`39 markets, 130 years: 3.8 points @${width}`, (await txt("#lf-r-luck .value")) === "3.8 points");
  check(`a shift of about one sd @${width}`, (await txt("#lf-r-z .value")) === "1.03 sd");
  check(`13.7% against 1.7% @${width}`, (await txt("#lf-r-truth .value")) === "13.7%" && (await txt("#lf-r-seen .value")) === "1.7%");
  await clickSeg("lf-n", 1);
  const meet = await page.evaluate(() => {
    const a = document.querySelector("#fig-luck path.truth-curve").getAttribute("d"), b = document.querySelector("#fig-luck path.seen-curve").getAttribute("d");
    return a === b;
  });
  check(`one market: the two curves meet @${width}`, meet && (await txt("#lf-r-luck .value")) === "0.0 points");
  await clickSeg("lf-n", 100);
  check(`100 markets: 4.4 points @${width}`, (await txt("#lf-r-luck .value")) === "4.4 points");
  await clickSeg("lf-n", 39);
  await clickSeg("lf-Y", 180);
  check(`180 years: 3.2 points @${width}`, (await txt("#lf-r-luck .value")) === "3.2 points");
  await clickSeg("lf-Y", 130);

  if (SHOTS) {
    for (const id of await page.evaluate(() => [...document.querySelectorAll(".fin-card, #guess, #paper")].map((c) => c.id))) {
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
