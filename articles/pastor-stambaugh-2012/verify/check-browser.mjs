/*
  Browser checks for pastor-stambaugh-2012 at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/pastor-stambaugh-2012-shots node verify/check-browser.mjs

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
  check(`the paper card cites JF 67(2) @${width}`, /Journal of Finance/.test(card) && /67\(2\), 431–478/.test(card));

  // ---- the forecast lab: the readout's count of escapes equals the drawn count
  const escapes = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-forecast svg.forecast-lab");
    const mk = svg.querySelector("line.horizon-marker"), xk = +mk.getAttribute("x1");
    const pts = (d) => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); const o = []; for (let i = 0; i + 1 < n.length; i += 2) o.push([n[i], n[i + 1]]); return o; };
    const band = pts(svg.querySelector("path.band-naive").getAttribute("d")).filter(([x]) => Math.abs(x - xk) < 0.02).map(([, y]) => y);
    const full = pts(svg.querySelector("path.band-full").getAttribute("d")).filter(([x]) => Math.abs(x - xk) < 0.02).map(([, y]) => y);
    const paths = [...svg.querySelectorAll("g.paths path")].map((p) => pts(p.getAttribute("d")));
    const count = (b) => {
      const top = Math.min(...b), bot = Math.max(...b);
      let out = 100 - paths.length; // a path clipped away entirely is outside any band
      for (const p of paths) { const v = p.find(([x]) => Math.abs(x - xk) < 0.02); if (!v || v[1] < top - 0.01 || v[1] > bot + 0.01) out++; }
      return out;
    };
    return { naive: count(band), full: count(full), nb: band.length, nf: full.length };
  });
  check(`the lab opens at a century of data, thirty years ahead: 1.30× @${width}`, (await txt("#fl-r-ratio .value")) === "1.30×");
  check(`and on a history close to the truth @${width}`, (await txt("#fl-r-est .value")) === "3.7% a year");
  for (let i = 0; i < 4; i++) {
    const e = await escapes();
    const rn = parseInt(await txt("#fl-r-out-naive .value")), rf = parseInt(await txt("#fl-r-out-full .value"));
    check(`history ${i + 1}: blue-band escapes drawn = readout @${width}`, e.nb >= 2 && e.naive === rn, `${e.naive} drawn vs ${rn}`);
    check(`history ${i + 1}: pink-band escapes drawn = readout @${width}`, e.nf >= 2 && e.full === rf, `${e.full} drawn vs ${rf}`);
    check(`history ${i + 1}: the pink band never misses more than the blue @${width}`, rf <= rn);
    const before = await txt("#fl-r-est .value");
    await page.click("#fl-new"); await settle(page);
    check(`drawing another history changes the estimate @${width}`, (await txt("#fl-r-est .value")) !== before);
  }
  await clickSeg("fl-N", 206);
  check(`206 years, thirty ahead: 1.15× @${width}`, (await txt("#fl-r-ratio .value")) === "1.15×");
  await setRange(page, "#fl-k", 50);
  check(`206 years, fifty ahead: 1.24× (the paper's example) @${width}`, (await txt("#fl-r-ratio .value")) === "1.24×");
  await clickSeg("fl-N", 50);
  check(`fifty years of data, fifty ahead: 2.00× @${width}`, (await txt("#fl-r-ratio .value")) === "2.00×");
  const e2 = await escapes();
  check(`and the drawn escapes still match at the far end @${width}`, e2.naive === parseInt(await txt("#fl-r-out-naive .value")));

  // ---- two variances
  check(`world at thirty years: 0.59 @${width}`, (await txt("#tv-r-world .value")) === "0.59");
  check(`investor, persistence known: 0.66 @${width}`, (await txt("#tv-r-investor .value")) === "0.66");
  const bars = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-two svg.pieces");
    const z = +svg.querySelector("line.zero").getAttribute("x1");
    return [...svg.querySelectorAll("rect.piece-bar")].map((r) => ({ cls: r.getAttribute("class"), x: +r.getAttribute("x"), w: +r.getAttribute("width"), fill: r.getAttribute("fill"), z }));
  });
  const b0 = await bars();
  const rev = b0.find((b) => b.cls.includes("reversion"));
  check(`mean reversion is the one bar left of zero, in pink @${width}`, rev && Math.abs(rev.x + rev.w - rev.z) < 0.01 && rev.fill === "var(--c2)" && b0.filter((b) => !b.cls.includes("reversion")).every((b) => Math.abs(b.x - b.z) < 0.01));
  const labels = await page.$$eval("#fig-two text.piece-label", (ts) => ts.map((t) => t.textContent));
  check(`the bar labels say −0.81 and a total of 0.66 @${width}`, labels.some((l) => l === "Mean reversion: −0.81") && labels.some((l) => l === "Total: 0.66"), labels.join(" | "));
  const onLine = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-two svg.two-variances");
    const c = svg.querySelector("circle.investor-dot"), cx = +c.getAttribute("cx"), cy = +c.getAttribute("cy");
    const n = svg.querySelector("path.investor-line").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    for (let i = 0; i + 1 < n.length; i += 2) if (Math.abs(n[i] - cx) < 0.02) return Math.abs(n[i + 1] - cy);
    return 99;
  });
  check(`the investor's dot sits on her line @${width}`, (await onLine()) < 0.02);
  await clickSeg("tv-doubt", "unsure");
  check(`unsure: 0.81 at thirty @${width}`, (await txt("#tv-r-investor .value")) === "0.81");
  check(`and the world doesn't move @${width}`, (await txt("#tv-r-world .value")) === "0.59");
  await setRange(page, "#tv-k", 50);
  check(`unsure: 0.87 at fifty @${width}`, (await txt("#tv-r-investor .value")) === "0.87");
  await clickSeg("tv-rev", "weak");
  check(`weak and unsure: 1.18 at fifty @${width}`, (await txt("#tv-r-investor .value")) === "1.18");
  check(`the dot still sits on the line @${width}`, (await onLine()) < 0.02);
  const above = await page.evaluate(() => {
    const svg = document.querySelector("#fig-two svg.two-variances");
    return +svg.querySelector("circle.investor-dot").getAttribute("cy") < +svg.querySelector("line.one-line").getAttribute("y1");
  });
  check(`and it's above the one-year line @${width}`, above);
  await setRange(page, "#tv-k", 30);
  check(`weak and unsure: 1.06 at thirty @${width}`, (await txt("#tv-r-investor .value")) === "1.06");

  // ---- persistence: the reversion control is shared, the doubt isn't
  const pOn = async () => (await page.$eval('#pf-rev button[data-value="weak"]', (b) => b.classList.contains("on")));
  check(`the persistence chart follows the mean reversion switch @${width}`, await pOn());
  await clickSeg("pf-rev", "moderate");
  check(`and switching it there switches the chart above @${width}`, await page.$eval('#tv-rev button[data-value="moderate"]', (b) => b.classList.contains("on")));
  check(`persistence known: 0.66 @${width}`, (await txt("#pf-r-mid .value")) === "0.66");
  check(`averaged over 0.66 to 1: 0.81 @${width}`, (await txt("#pf-r-avg .value")) === "0.81");
  const jensen = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-persistence svg.persistence");
    const avg = svg.querySelector("line.avg-line"), dot = svg.querySelector("circle.mid-dot");
    const x0 = +avg.getAttribute("x1"), x1 = +avg.getAttribute("x2"), ya = +avg.getAttribute("y1");
    const n = svg.querySelector("path.curve").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    const ys = []; for (let i = 0; i + 1 < n.length; i += 2) if (n[i] >= x0 && n[i] <= x1) ys.push(n[i + 1]);
    const mean = ys.reduce((s, v) => s + v, 0) / ys.length;
    const band = svg.querySelector("rect.doubt-band");
    return { gap: +dot.getAttribute("cy") - ya, mean, ya, bandOk: Math.abs(+band.getAttribute("x") - x0) < 0.01 };
  });
  const j1 = await jensen();
  check(`the pink line is the curve's average over the band, in pixels @${width}`, Math.abs(j1.mean - j1.ya) < 1.5 && j1.bandOk, `${j1.mean.toFixed(2)} vs ${j1.ya.toFixed(2)}`);
  check(`and it sits well above the dot @${width}`, j1.gap > 15, `${j1.gap.toFixed(1)}px`);
  await clickSeg("pf-doubt", "fair");
  const j2 = await jensen();
  check(`the narrow range sits only just above the dot @${width}`, j2.gap > 0 && j2.gap < 8, `${j2.gap.toFixed(1)}px`);
  await clickSeg("pf-doubt", "known");
  check(`known: no band and no average line @${width}`, (await page.locator("#fig-persistence rect.doubt-band").count()) === 0 && (await page.locator("#fig-persistence line.avg-line").count()) === 0);
  await clickSeg("pf-doubt", "unsure");

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
