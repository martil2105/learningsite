/*
  Browser checks for perfect-competition at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/perfect-competition-shots node verify/check-browser.mjs

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
  // TheFirm: at p = 24.0 the firm makes a loss, at p = 30 a profit of (20²)/4 − 50 = 50
  await setRange(page, "#firm-p-slider", 30);
  const prof30 = await page.evaluate(() => [...document.querySelectorAll(".readout-item")].find((e) => /Profit \(π\)/.test(e.textContent))?.querySelector(".val")?.textContent);
  ok(at("at a price of 30 the firm's profit reads +50.00"), prof30 && prof30.replace(/\s/g, "") === "+50.00", prof30);
  await setRange(page, "#firm-p-slider", 24);
  const prof24 = await page.evaluate(() => [...document.querySelectorAll(".readout-item")].find((e) => /Profit \(π\)/.test(e.textContent))?.querySelector(".val")?.textContent);
  ok(at("at a price of 24 the firm makes a loss"), prof24 && /^-/.test(prof24.trim()), prof24);

  // EntryRun: step to the end and try one more
  const run = page.locator("#entry-run");
  await setRange(page, "#scrubber-slider", 49);
  await run.locator("button", { hasText: "Admit 1 firm" }).click(); await settle(page);
  ok(at("admitting firms stops at 50 with the price at 24.2857"), (await num(page, "#sim-n-val")) === 50 && near(await num(page, "#sim-p-val"), 24.2857, 0.00006));
  ok(at("each of the 50 firms keeps a profit of 1.0204"), near(await num(page, "#sim-profit-val"), 1.0204, 0.00006));
  await run.locator("button", { hasText: "Admit 1 firm" }).click(); await settle(page);
  const refusal = (await page.locator("#refusal-alert").textContent()) || "";
  ok(at("the 51st firm is refused with a loss of 0.41"), /Firm 51 stays out/.test(refusal) && /-0\.41/.test(refusal), refusal.trim());
  ok(at("and the count stays at 50"), (await num(page, "#sim-n-val")) === 50);
  const priceDot = await run.evaluate((el) => {
    const dot = el.querySelector("circle.active-price").getBoundingClientRect();
    const line = [...el.querySelectorAll("line")].find((l) => l.getAttribute("stroke") === "#df2a5d").getBoundingClientRect();
    return (dot.top + dot.height / 2) - line.top;
  });
  ok(at("on screen, the price dot at n = 50 sits above the dashed lowest-AC line"), priceDot < -0.3, `${priceDot.toFixed(1)}px`);
  await run.locator("button", { hasText: "Reset" }).click(); await settle(page);
  ok(at("reset goes back to one firm"), (await num(page, "#sim-n-val")) === 1);

  // TheLastFirm: computed rows, the last profitable one highlighted
  const rows = await page.locator("table.run-table tbody tr").evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent.trim())));
  ok(at("the run table covers firms 48 to 52"), rows.map((r) => r[0]).join(",") === "48,49,50,51,52", rows.map((r) => r[0]).join(","));
  ok(at("profit turns negative at the 51st firm"), rows[2][2].startsWith("+") && rows[3][2].startsWith("−"), `${rows[2][2]} / ${rows[3][2]}`);

  // Sawtooth: both zoom levels draw a curve with real teeth
  for (const label of ["Small markets", "Large markets"]) {
    await page.locator("#sawtooth-figure button", { hasText: label }).click(); await settle(page);
    const d = await page.locator("#sawtooth-figure path.sawtooth").getAttribute("d");
    ok(at(`the sawtooth is drawn for ${label.toLowerCase()}`), d && d.split("L").length > 50);
  }

  // Welfare: the free-entry count is never above the planner's and at most one below
  const gap = await page.locator("#welfare-figure").evaluate((el) => {
    const ys = (p) => p.getAttribute("d").split(/[ML]/).filter(Boolean).map((s) => +s.trim().split(/\s+/)[1]);
    const e = ys(el.querySelector("path.entry-step")), w = ys(el.querySelector("path.welfare-step"));
    return e.map((v, i) => v - w[i]); // svg y grows downward: entry below planner = positive
  });
  const step = await page.locator("#welfare-figure svg").evaluate((svg) => svg.viewBox.baseVal.height);
  ok(at("free entry is never above the planner's count"), gap.every((g) => g >= -0.05));
  ok(at("and the two lines differ somewhere"), gap.some((g) => g > 0.05));

  if (SHOTS) {
    await page.locator("#entry-run").screenshot({ path: `${SHOTS}/${vp.name}-lab.png` });
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
