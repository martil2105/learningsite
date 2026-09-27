/*
  Browser checks for time-diversification at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/time-diversification-shots node verify/check-browser.mjs

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

  // The lab opens on the yearly ruler at thirty years, with the 1-in-20 tail.
  check(`lab opens: 14% behind @${width}`, (await txt("#hz-r-chance .value")) === "14%", await txt("#hz-r-chance .value"));
  check(`lab opens: 28 of 200 drawn paths behind @${width}`, (await txt("#hz-r-drawn .value")) === "28 of 200");
  check(`lab opens: median +4.0% a year @${width}`, (await txt("#hz-r-median .value")) === "+4.0% a year", await txt("#hz-r-median .value"));
  check(`lab opens: 1 in 20 about 2 points a year behind @${width}`, (await txt("#hz-r-tail .value")) === "−2.0% a year", await txt("#hz-r-tail .value"));
  await setRange(page, "#hz-T", 1);
  check(`one year: 1 in 20 about 29 points behind @${width}`, (await txt("#hz-r-tail .value")) === "−28.9% a year", await txt("#hz-r-tail .value"));
  check(`one year: 42% behind @${width}`, (await txt("#hz-r-chance .value")) === "42%");
  const chance1 = await txt("#hz-r-chance .value"), drawn1 = await txt("#hz-r-drawn .value");
  await page.click('#hz-view button[data-value="money"]');
  await settle(page);
  check(`money ruler at one year: 25% less than bonds @${width}`, (await txt("#hz-r-tail .value")) === "0.75×", await txt("#hz-r-tail .value"));
  check(`switching rulers leaves the chance and the count alone @${width}`, (await txt("#hz-r-chance .value")) === chance1 && (await txt("#hz-r-drawn .value")) === drawn1);
  await setRange(page, "#hz-T", 30);
  check(`money ruler at thirty years: median 3.32× @${width}`, (await txt("#hz-r-median .value")) === "3.32×", await txt("#hz-r-median .value"));
  check(`money ruler at thirty years: 1 in 20 at 0.55× @${width}`, (await txt("#hz-r-tail .value")) === "0.55×", await txt("#hz-r-tail .value"));
  // geometry: the white circle is the lowest point of the drawn pink line
  const bottomGeo = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-lab svg");
    const d = svg.querySelector("path.tail-line").getAttribute("d");
    const nums = d.match(/-?\d+(\.\d+)?/g).map(Number);
    let lowX = 0, lowY = -Infinity;
    for (let i = 0; i + 1 < nums.length; i += 2) if (nums[i + 1] > lowY) { lowY = nums[i + 1]; lowX = nums[i]; }
    const c = svg.querySelector("circle.tail-bottom");
    if (!c) return null;
    const cx = +c.getAttribute("cx"), cy = +c.getAttribute("cy");
    let near = null;
    for (let i = 0; i + 1 < nums.length; i += 2) if (!near || Math.abs(nums[i] - cx) < Math.abs(near[0] - cx)) near = [nums[i], nums[i + 1]];
    return { dy: Math.abs(cy - lowY), onLine: Math.abs(near[1] - cy), lowX, cx };
  });
  let bg = await bottomGeo();
  check(`1 in 20: the circle sits at the pink line's lowest point @${width}`, bg && bg.dy < 0.6 && bg.onLine < 0.6, JSON.stringify(bg));
  await page.click('#hz-tail button[data-value="100"]');
  await settle(page);
  bg = await bottomGeo();
  check(`1 in 100: the circle sits at the pink line's lowest point @${width}`, bg && bg.dy < 0.6 && bg.onLine < 0.6, JSON.stringify(bg));
  // geometry: the median line at thirty years sits at 3.32x on the axis
  const medGeo = await page.evaluate(() => {
    const svg = document.querySelector("#fig-lab svg");
    const nums = svg.querySelector("path.median-line").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    const marker = svg.querySelector("line.horizon-marker"), mx = +marker.getAttribute("x1");
    let best = null;
    for (let i = 0; i + 1 < nums.length; i += 2) if (!best || Math.abs(nums[i] - mx) < Math.abs(best[0] - mx)) best = [nums[i], nums[i + 1]];
    const line = svg.querySelector("line.shortfall-line"), y1 = +line.getAttribute("y1");
    return { atMarker: best[1], level: y1 };
  });
  check(`the median is above the level line at thirty years @${width}`, medGeo.atMarker < medGeo.level - 20, JSON.stringify(medGeo));
  // the drawn paths below the level line at thirty years, counted in pixels, match the readout
  const pixCount = await page.evaluate(() => {
    const svg = document.querySelector("#fig-lab svg");
    const mx = +svg.querySelector("line.horizon-marker").getAttribute("x1");
    const level = +svg.querySelector("line.shortfall-line").getAttribute("y1");
    let below = 0, seen = 0;
    for (const p of svg.querySelectorAll("g.paths path")) {
      const nums = p.getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
      for (let i = 0; i + 1 < nums.length; i += 2) if (Math.abs(nums[i] - mx) < 0.01) { seen++; if (nums[i + 1] > level) below++; break; }
    }
    return { below, seen };
  });
  check(`28 drawn paths sit below the level line at thirty years @${width}`, pixCount.below === 28, JSON.stringify(pixCount));

  // Odds and depth follows the lab's horizon (thirty years now).
  check(`odds panel: 14% behind at thirty years @${width}`, (await txt("#od-r-chance .value")) === "14%");
  check(`depth panel: 37% when behind @${width}`, (await txt("#od-r-depth .value")) === "37%");
  check(`depth panel: 5.1% over all outcomes @${width}`, (await txt("#od-r-es .value")) === "5.1%");
  const peakGeo = await page.evaluate(() => {
    const svg = document.querySelector("#fig-odds svg.depth-panel");
    const nums = svg.querySelector("path.es-line").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    let minY = Infinity; for (let i = 1; i < nums.length; i += 2) minY = Math.min(minY, nums[i]);
    return { minY, cy: +svg.querySelector("circle.es-peak").getAttribute("cy") };
  });
  check(`the dashed line's peak is marked @${width}`, Math.abs(peakGeo.minY - peakGeo.cy) < 0.6, JSON.stringify(peakGeo));
  await page.click('#od-sigma button[data-value="0.15"]');
  await settle(page);
  check(`calmer market: about 4% behind after thirty years @${width}`, (await txt("#od-r-chance .value")) === "4%", await txt("#od-r-chance .value"));
  await page.click('#od-sigma button[data-value="0.25"]');
  await settle(page);
  check(`rougher market: about 26% after thirty years @${width}`, (await txt("#od-r-chance .value")) === "26%");
  // the two panels share an x scale: the horizon markers line up
  const mk = await page.$$eval("#fig-odds line.t-marker", (ls) => ls.map((l) => l.getBoundingClientRect().left));
  check(`the two panels' markers line up @${width}`, mk.length === 2 && Math.abs(mk[0] - mk[1]) < 0.5, JSON.stringify(mk));

  // How long each bad outcome keeps getting worse.
  const labels = async () => page.$$eval("#fig-bottom text.bar-label", (ts) => ts.map((t) => t.textContent.trim()));
  let L = await labels();
  check(`6% premium: 1 in 20 worsens for 17 years, 49% behind @${width}`, L[1] === "17 years, 49% behind", L[1]);
  check(`6% premium: 1 in 100 for 34 years, 74% behind @${width}`, L[2] === "34 years, 74% behind", L[2]);
  const barRatio = await page.evaluate(() => {
    const r = (n) => document.querySelector(`#fig-bottom rect.bar-${n}`).getBoundingClientRect();
    const a = r(20), b = r(100);
    return (a.width) / (b.width);
  });
  check(`the bars are on a log scale @${width}`, Math.abs(barRatio - Math.log(16.9133) / Math.log(33.8266)) < 0.01, barRatio.toFixed(4));
  await page.click('#tb-premium button[data-value="0.04"]');
  await settle(page);
  L = await labels();
  check(`4% premium: 1 in 20 worsens for about 68 years @${width}`, L[1].startsWith("68 years"), L[1]);
  await page.click('#tb-premium button[data-value="0.08"]');
  await settle(page);
  L = await labels();
  check(`8% premium: 1 in 20 turns around after about 8 years @${width}`, L[1].startsWith("8 years"), L[1]);
  const labelFit = await page.evaluate(() => {
    const svg = document.querySelector("#fig-bottom svg").getBoundingClientRect();
    return [...document.querySelectorAll("#fig-bottom text")].every((t) => { const r = t.getBoundingClientRect(); return r.left >= svg.left - 1 && r.right <= svg.right + 1; });
  });
  check(`every bar label fits inside the chart @${width}`, labelFit);

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
