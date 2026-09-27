/*
  Browser checks for cost-curves at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/cost-curves-shots node verify/check-browser.mjs

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
  // CostSplit: total cost at q = 30 with k = 100 is 100 + 100 + 27000/100 = 470
  await setRange(page, "#cost-q-slider", 30);
  const tc = await page.evaluate(() => [...document.querySelectorAll(".readout-item")].find((e) => /Total cost/.test(e.textContent))?.querySelector(".val")?.textContent);
  ok(at("the cost split reads a total cost of 470.0 at q = 30"), tc && tc.trim() === "470.0", tc);

  // AverageAndMarginal: the crossing dot is drawn, and the constant-MC toggle removes it
  ok(at("average and marginal cost cross at a drawn dot"), (await page.locator("circle.crossing").count()) === 1);
  await page.locator("button.toggle-btn").click(); await settle(page);
  ok(at("with constant marginal cost there is no crossing and a falling AC curve"),
     (await page.locator("circle.crossing").count()) === 0 && (await page.locator("path.srac-flat").count()) === 1);
  await page.locator("button.toggle-btn").click(); await settle(page);

  // Envelope: the plant buttons reveal 1 to 6 short-run curves
  const pills = page.locator("button.pill-btn");
  await pills.first().click(); await settle(page);
  const one = await page.locator(".card path.srac.faint").evaluateAll((els) => els.filter((e) => !e.closest("#plant-lab")).length);
  await pills.last().click(); await settle(page);
  const six = await page.locator(".card path.srac.faint").evaluateAll((els) => els.filter((e) => !e.closest("#plant-lab")).length);
  ok(at("the envelope buttons show one curve, then six"), one === 1 && six === 6, `${one}, ${six}`);

  // PlantLab: readouts and the two dots, in rendered pixels
  const lab = page.locator("#plant-lab");
  const dots = async () => lab.evaluate((el) => {
    const t = el.querySelector("circle.tangency").getBoundingClientRect();
    const m = el.querySelector("circle.srmin").getBoundingClientRect();
    return { dx: (t.left + t.width / 2) - (m.left + m.width / 2) };
  });
  for (const [k, qt, qm, ratio, side] of [[25, 8.55, 11.6, 0.7368, -1], [100, 21.54, 21.54, 1, 0], [400, 54.29, 46.42, 1.1696, 1]]) {
    await lab.locator("button.btn-preset", { hasText: new RegExp(`^\\s*k = ${k}\\s*$`) }).click(); await settle(page);
    const a = await num(page, "#readout-q-tan"), b = await num(page, "#readout-q-min"), c = await num(page, "#readout-ratio");
    ok(at(`plant lab at k = ${k} reads ${qt}, ${qm} and ${ratio}`), near(a, qt, 0.006) && near(b, qm, 0.006) && near(c, ratio, 0.00006), `${a}, ${b}, ${c}`);
    const { dx } = await dots();
    const right = side === 0 ? Math.abs(dx) < 1 : side < 0 ? dx < -2 : dx > 2;
    ok(at(`at k = ${k} the pink dot is ${side === 0 ? "on" : side < 0 ? "left of" : "right of"} the blue one on screen`), right, `dx ${dx.toFixed(2)}px`);
  }
  await setRange(page, "#k-slider", 205);
  ok(at("the plant slider moves the ratio readout"), near(await num(page, "#readout-ratio"), Math.pow(410 / 305, 1 / 3), 0.00006));

  // MarginalCross: at each preset the marginal curves cross at the target output
  for (const q of [15, 50]) {
    await page.locator("button.btn-tab", { hasText: `q = ${q}` }).click(); await settle(page);
    const sub = await page.locator(".card-sub", { hasText: "the best plant has" }).textContent();
    ok(at(`built for q = ${q}, the marginal costs cross at q = ${q}.0`), sub.includes(`crosses the long-run one (dark) at q = ${q}.0`), sub.replace(/\s+/g, " ").slice(0, 120));
  }

  // PenaltyFigure: the table is computed and second order
  const pens = await page.locator("#penalty-figure tbody tr td:nth-child(2)").allTextContents();
  ok(at("the penalty table reads 0.0043%, 0.1043%, 0.3982%, 1.4602%, 7.3008%"), pens.map((t) => t.trim()).join(",") === "0.0043%,0.1043%,0.3982%,1.4602%,7.3008%", pens.join(","));

  if (SHOTS) {
    await page.locator("#plant-lab").screenshot({ path: `${SHOTS}/${vp.name}-lab.png` });
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
