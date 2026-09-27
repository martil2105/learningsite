/*
  Browser checks for monopolistic-competition at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/monopolistic-competition-shots node verify/check-browser.mjs

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
  const metric = (label) => page.evaluate((l) => {
    const box = [...document.querySelectorAll(".metric-box")].find((b) => b.querySelector(".metric-label")?.textContent.includes(l));
    return box ? box.querySelector(".metric-val").textContent.trim() : "";
  }, label);

  // OneFirm: at equal prices the share is 1/n and the elasticity is sigma - (sigma-1)/n
  await setRange(page, "#p-slider", 1.35);
  await setRange(page, "#sigma-slider", 4);
  for (const [n, eps, share] of [[2, "2.500", "50.0%"], [5, "3.400", "20.0%"], [20, "3.850", "5.0%"]]) {
    await setRange(page, "#n-slider", n);
    const e = await metric("Elasticity"), s = await metric("Share of spending");
    ok(at(`one café among ${n} at equal prices: elasticity ${eps}, share ${share}`), e === eps && s === share, `${e}, ${s}`);
  }
  await setRange(page, "#p-slider", 2.0);
  const eHigh = parseFloat(await metric("Elasticity"));
  ok(at("raising this café's price moves its elasticity towards sigma"), eHigh > 3.85 && eHigh < 4, String(eHigh));

  // ElasticityFigure: the curve redraws with sigma
  const d1 = await page.locator("#elasticity-sigma-slider").evaluate((el) => el.closest(".card").querySelector("svg path")?.getAttribute("d"));
  await setRange(page, "#elasticity-sigma-slider", 6);
  const d2 = await page.locator("#elasticity-sigma-slider").evaluate((el) => el.closest(".card").querySelector("svg path")?.getAttribute("d"));
  ok(at("the elasticity figure redraws when sigma moves"), d1 && d2 && d1 !== d2);

  // VarietyLab: n = (E/f + sigma - 1)/sigma, planner E/(f sigma), excess (sigma-1)/sigma
  const lab = page.locator("#lab-e-slider").locator("xpath=ancestor::div[contains(@class,'card')][1]");
  const nums = async () => (await lab.locator(".p-num").allTextContents()).map((t) => parseFloat(t.replace(/[^\d.\-]/g, "")));
  await setRange(page, "#lab-s-slider", 4); await setRange(page, "#lab-f-slider", 5); await setRange(page, "#lab-e-slider", 1000);
  let v = await nums();
  ok(at("the lab at E = 1000, f = 5, sigma = 4 gives 50.75 market and 50.00 planner varieties"), near(v[0], 50.75, 0.005) && near(v[1], 50, 0.005), v.slice(0, 2).join(", "));
  await setRange(page, "#lab-e-slider", 100);
  v = await nums();
  ok(at("and at E = 100, 5.75 and 5.00: the gap stays at 0.75"), near(v[0], 5.75, 0.005) && near(v[1], 5, 0.005), v.slice(0, 2).join(", "));
  ok(at("output per firm at E = 100 is 12.39 against 15"), near(v[2], 12.39, 0.005) && near(v[3], 15, 0.005), v.slice(2, 4).join(", "));

  // ScaleFigure: the first and last rows
  const rows = await page.locator("table.data-table tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent.trim())));
  ok(at("the scale table starts at 12.391 per firm and ends at 15.000"), rows[0][2] === "12.391" && rows[rows.length - 1][2] === "15.000", `${rows[0][2]} … ${rows[rows.length - 1][2]}`);

  // ExcessCapacityFigure: average cost falls at every drawn point
  const falling = await page.locator(".card", { hasText: "Average cost with a fixed cost" }).evaluate((card) => {
    const d = card.querySelector("svg path").getAttribute("d");
    const ys = d.split(/[ML]/).filter(Boolean).map((s) => +s.trim().split(/\s+/)[1]);
    return ys.every((y, i) => i === 0 || y >= ys[i - 1] - 1e-9); // screen y grows downward
  });
  ok(at("the average cost curve falls at every output"), falling);

  if (SHOTS) await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });

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
