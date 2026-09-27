/*
  Browser checks for mean-variance-optimisation at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/mean-variance-optimisation-shots node verify/check-browser.mjs

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
  check(`weights lab opens at 0.33 @${width}`, (await txt("#wl-sr .value")) === "0.33");
  const bars = await page.$$eval("#fig-weights rect", (rs) => ({ best: rs.filter((r) => r.classList.contains("best-bar")).length, est: rs.filter((r) => r.classList.contains("est-bar")).length }));
  check(`ten best and ten estimated bars @${width}`, bars.best === 10 && bars.est === 10);
  // best bars: the lowest three drawn below zero
  const below = await page.evaluate(() => {
    const svg = document.querySelector("#fig-weights svg");
    const zero = [...svg.querySelectorAll("line")].find((l) => l.getAttribute("stroke") === "#9aa0ab");
    const y0 = +zero.getAttribute("y1");
    return [...svg.querySelectorAll("rect.best-bar")].map((r) => +r.getAttribute("y") >= y0 - 0.01);
  });
  check(`best weights short the lowest three, in pixels @${width}`, below.slice(0, 3).every(Boolean) && !below.slice(3).some(Boolean), JSON.stringify(below));
  await page.click('#wl-mode button[data-value="means"]');
  const srM = await txt("#wl-sr .value");
  check(`means-only mode updates @${width}`, /^0\.\d\d$/.test(srM), srM);
  await setRange(page, "#wl-years", 100);
  check(`100 years moves the Sharpe up @${width}`, parseFloat(await txt("#wl-sr .value")) > 0.33);

  // mean blur: frequency doesn't change the width
  check(`blur opens at ±2.3% @${width}`, (await txt("#mb-se .value")) === "±2.3%");
  const bandW = async () => page.$eval("#fig-blur rect.se-band", (r) => +r.getAttribute("width"));
  const w12 = await bandW();
  await page.click('#mb-freq button[data-value="252"]');
  check(`daily data: same width @${width}`, Math.abs((await bandW()) - w12) < 1e-6 && (await txt("#mb-n .value")) === "12,600");
  check(`±1 point needs 256 years @${width}`, (await txt("#mb-need .value")) === "256");

  // cloud
  check(`cloud: a = 2.74 @${width}`, (await txt("#cc-a .value")) === "2.74");
  check(`cloud: average Sharpe 0.33 @${width}`, (await txt("#cc-sr .value")) === "0.33");
  const eqAxes = await page.evaluate(() => {
    // the ray at cos 0.8 must make a 36.87 degree angle on screen
    const l = document.querySelector("#fig-cloud line.ray");
    const dx = +l.getAttribute("x2") - +l.getAttribute("x1"), dy = +l.getAttribute("y1") - +l.getAttribute("y2");
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  });
  check(`cloud axes share units: the 0.8 line is at 36.9° @${width}`, Math.abs(eqAxes - 36.87) < 0.2, eqAxes.toFixed(2));
  // every green dot is below the ray, every grey one above
  const sides = await page.evaluate(() => {
    const svg = document.querySelector("#fig-cloud svg"), l = svg.querySelector("line.ray");
    const x1 = +l.getAttribute("x1"), y1 = +l.getAttribute("y1"), x2 = +l.getAttribute("x2"), y2 = +l.getAttribute("y2");
    let bad = 0;
    for (const c of svg.querySelectorAll("circle[opacity]")) {
      const cx = +c.getAttribute("cx"), cy = +c.getAttribute("cy");
      const cross = (x2 - x1) * (cy - y1) - (y2 - y1) * (cx - x1); // > 0: below the ray on screen
      const green = c.getAttribute("fill") === "var(--c3)";
      if (cx > x1 + 1 && Math.abs(cross) > 200 && green !== cross > 0) bad++;
    }
    return bad;
  });
  check(`green dots sit below the 0.8 line @${width}`, sides === 0, `${sides} on the wrong side`);

  // years chart
  check(`10 assets: 68 years @${width}`, (await txt("#yc-10 .value")) === "68");
  check(`25 assets: 174 years @${width}`, (await txt("#yc-25 .value")) === "174");
  check(`50 assets: 353 years @${width}`, (await txt("#yc-50 .value")) === "353");

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
