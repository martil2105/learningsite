/*
  Browser checks for volatility-drag at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/volatility-drag-shots node verify/check-browser.mjs

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
  // zigzag at ±2%: index about -1.2%, 3x about -10.2%, -3x the same
  await setRange(page, "#zz-x", 0.02);
  const zi = await txt("#zz-r-index .value"), z3 = await txt("#zz-r-fund .value");
  check(`zigzag ±2%: index −1.2% @${width}`, zi === "−1.2%", zi);
  check(`zigzag ±2%: 3× fund −10.3% @${width}`, z3 === "−10.3%", z3);
  await page.click('#zz-L button[data-value="-3"]');
  check(`zigzag ±2%: −3× fund lands in the same place @${width}`, (await txt("#zz-r-fund .value")) === z3);

  // lab opening state
  check(`lab opens flat @${width}`, (await txt("#lab-r-index .value")) === "0.0%");
  const f = await txt("#lab-r-fund .value"), p = await txt("#lab-r-pred .value");
  check(`lab opening fund about −10% @${width}`, f === "−10.4%", f);
  check(`lab opening rule agrees to a tenth @${width}`, p === "−10.4%", p);
  // geometry: the fund path ends on the rule's circle, within a few pixels
  const geo = await page.evaluate(() => {
    const svg = document.querySelector("#fig-lab svg");
    const pth = svg.querySelector("path.lab-fund");
    const d = pth.getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    const endY = d[d.length - 1];
    const c = svg.querySelector("circle.lab-pred");
    return { dy: Math.abs(+c.getAttribute("cy") - endY) };
  });
  check(`fund path ends on the rule's circle @${width}`, geo.dy < 3, `dy ${geo.dy.toFixed(2)}px`);
  // new year keeps the two numbers and the fund near the circle
  await page.click("#lab-seed");
  const f2 = await txt("#lab-r-fund .value"), p2 = await txt("#lab-r-pred .value");
  const num = (s) => parseFloat(s.replace("−", "-"));
  check(`another year: fund stays within half a point of the rule @${width}`, Math.abs(num(f2) - num(p2)) <= 0.5, `${f2} vs ${p2}`);
  // trend example
  await setRange(page, "#lab-target", 0.3);
  await setRange(page, "#lab-vol", 0.15);
  const t = num(await txt("#lab-r-pred .value"));
  check(`trend +30% at 15%: rule near +105% @${width}`, Math.abs(t - 105) < 3, String(t));
  check(`the region map dot follows the lab @${width}`, await page.evaluate(() => !!document.querySelector("#fig-map circle.region-point")));
  // the dot sits in the green part for this trend
  const inRed = await page.evaluate(() => {
    const svg = document.querySelector("#fig-map svg");
    const c = svg.querySelector("circle.region-point");
    const p = svg.querySelector("path.trail-region");
    const pt = svg.createSVGPoint(); pt.x = +c.getAttribute("cx"); pt.y = +c.getAttribute("cy");
    return p.isPointInFill(pt);
  });
  check(`trend year sits outside the red wedge @${width}`, !inRed);
  await setRange(page, "#lab-target", 0);
  const inRed2 = await page.evaluate(() => {
    const svg = document.querySelector("#fig-map svg");
    const c = svg.querySelector("circle.region-point");
    const pt = svg.createSVGPoint(); pt.x = +c.getAttribute("cx"); pt.y = +c.getAttribute("cy");
    return svg.querySelector("path.trail-region").isPointInFill(pt);
  });
  check(`flat year sits inside the red wedge @${width}`, inRed2);
  // parabola pairs are horizontal
  const pairsFlat = await page.$$eval("#fig-parabola line.pair", (ls) => ls.every((l) => Math.abs(+l.getAttribute("y1") - +l.getAttribute("y2")) < 0.01));
  check(`parabola pairs are level @${width}`, pairsFlat);

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
