/*
  Browser checks for diversification at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/diversification-shots node verify/check-browser.mjs

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
  check(`curve opens at 10 stocks, 21.2% @${width}`, (await txt("#rc-vol .value")) === "21.2%");
  check(`floor 17.9% @${width}`, (await txt("#rc-floor .value")) === "17.9%");
  check(`90% removed @${width}`, (await txt("#rc-removed .value")) === "90.0%");
  // geometry: marker sits on the curve, and the floor line at the floor
  const geo = await page.evaluate(() => {
    const svg = document.querySelector("#fig-curve svg");
    const labs = [...svg.querySelectorAll(".axis-y text.tick-label")];
    const y0 = +labs.find((t) => t.textContent === "0%").getAttribute("y") - 4, y60 = +labs.find((t) => t.textContent === "60%").getAttribute("y") - 4;
    const toVal = (py) => (0.6 * (y0 - py)) / (y0 - y60);
    return { marker: toVal(+svg.querySelector("circle.n-marker").getAttribute("cy")), floor: toVal(+svg.querySelector("line.floor-line").getAttribute("y1")) };
  });
  check(`marker drawn at 21.2% @${width}`, Math.abs(geo.marker - 0.2117) < 0.002, geo.marker.toFixed(4));
  check(`floor drawn at 17.9% @${width}`, Math.abs(geo.floor - 0.1789) < 0.002, geo.floor.toFixed(4));
  await setRange(page, "#rc-n", 20);
  check(`20 stocks remove 95% @${width}`, (await txt("#rc-removed .value")) === "95.0%");
  await setRange(page, "#rc-rho", 0.6);
  check(`share removed doesn't depend on correlation @${width}`, (await txt("#rc-removed .value")) === "95.0%");
  await setRange(page, "#rc-rho", 0.2);
  await setRange(page, "#rc-n", 10);

  // grid
  check(`grid opens at 36 cells @${width}`, (await txt("#cg-cells .value")) === "36: 6 variances, 30 covariances");
  const cells = await page.$$eval("#fig-grid rect", (rs) => ({ v: rs.filter((r) => r.classList.contains("var-cell")).length, c: rs.filter((r) => r.classList.contains("cov-cell")).length }));
  check(`grid draws 6 variance and 30 covariance cells @${width}`, cells.v === 6 && cells.c === 30, JSON.stringify(cells));
  await setRange(page, "#cg-n", 10);
  check(`grid at 10 stocks gives the curve's 21.2% @${width}`, (await txt("#cg-vol .value")) === "21.2%");

  // universe
  check(`universe: portfolio ×7.36 @${width}`, (await txt("#uf-port .value")) === "×7.36");
  check(`universe: middle stock ×1.03 @${width}`, (await txt("#uf-median .value")) === "×1.03");
  check(`universe: 16.5% ahead @${width}`, (await txt("#uf-ahead .value")) === "16.5%");
  check(`universe: formula 16.4% @${width}`, (await txt("#uf-formula .value")) === "16.4%");
  const green = await page.$$eval("#fig-universe path[stroke='var(--c3)']", (ps) => ps.length);
  check(`some drawn stocks are green, not most @${width}`, green > 0 && green < 40, String(green));
  await page.click("#uf-seed");
  const a2 = parseFloat(await txt("#uf-ahead .value"));
  check(`another universe: share ahead stays near 16% @${width}`, Math.abs(a2 - 16.4) < 4, String(a2));

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
