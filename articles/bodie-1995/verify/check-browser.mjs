/*
  Browser checks for bodie-1995 at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/bodie-1995-shots node verify/check-browser.mjs

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
  const card = await page.evaluate(() => (document.querySelector("#paper") || {}).innerText || "");
  check(`the paper card cites FAJ 51(3) @${width}`, /Financial Analysts Journal/.test(card) && /51\(3\), 18–22/.test(card));

  // the guess
  check(`the answer is hidden until a guess @${width}`, (await page.locator("#guess-answer").count()) === 0);
  await page.click('#guess button[data-g="one"]');
  await settle(page);
  const ans = await txt("#guess-answer");
  check(`a wrong guess gets the answer @${width}`, ans.startsWith("It's the other way round") && /five times/.test(ans), ans);

  // the lab
  check(`opens at one year: about 8.0% @${width}`, (await txt("#pl-r-cost .value")) === "8.0%");
  check(`opens at one year: 42% chance @${width}`, (await txt("#pl-r-chance .value")) === "42%");
  await setRange(page, "#pl-T", 10);
  check(`ten years: 24.8% @${width}`, (await txt("#pl-r-cost .value")) === "24.8%");
  await setRange(page, "#pl-T", 30);
  check(`thirty years: 41.6% @${width}`, (await txt("#pl-r-cost .value")) === "41.6%");
  check(`thirty years: 14% chance @${width}`, (await txt("#pl-r-chance .value")) === "14%");
  const dots = async () => page.evaluate(() => ({
    cost: +document.querySelector("#fig-put circle.cost-dot").getAttribute("cy"),
    chance: +document.querySelector("#fig-put circle.chance-dot").getAttribute("cy"),
    costD: document.querySelector("#fig-put path.cost-line").getAttribute("d"),
    chanceD: document.querySelector("#fig-put path.chance-line").getAttribute("d"),
  }));
  const before = await dots();
  await setRange(page, "#pl-premium", 0.1);
  const after = await dots();
  check(`the premium leaves the cost curve and its dot where they were @${width}`, before.costD === after.costD && before.cost === after.cost);
  check(`and moves the chance curve @${width}`, before.chanceD !== after.chanceD && after.chance > before.chance + 10, `${before.chance} -> ${after.chance}`);
  check(`10% premium: about 1% chance @${width}`, (await txt("#pl-r-chance .value")) === "1%");
  await setRange(page, "#pl-premium", 0);
  check(`no premium: 71% chance @${width}`, (await txt("#pl-r-chance .value")) === "71%");
  check(`and still 41.6% @${width}`, (await txt("#pl-r-cost .value")) === "41.6%");
  await setRange(page, "#pl-premium", 0.06);
  await page.click('#pl-sigma button[data-value="0.15"]');
  await settle(page);
  check(`15% volatility: 31.9% @${width}`, (await txt("#pl-r-cost .value")) === "31.9%");
  await page.click('#pl-sigma button[data-value="0.25"]');
  await settle(page);
  check(`25% volatility: 50.6% @${width}`, (await txt("#pl-r-cost .value")) === "50.6%");
  await page.click('#pl-sigma button[data-value="0.2"]');
  await settle(page);
  const mk = await page.$$eval("#fig-put line.t-marker", (ls) => ls.map((l) => l.getBoundingClientRect().left));
  check(`the two panels' markers line up @${width}`, mk.length === 2 && Math.abs(mk[0] - mk[1]) < 0.5);
  // the dot sits on its curve
  const onCurve = await page.evaluate(() => {
    const svg = document.querySelector("#fig-put svg.cost-panel");
    const c = svg.querySelector("circle.cost-dot"), cx = +c.getAttribute("cx"), cy = +c.getAttribute("cy");
    const nums = svg.querySelector("path.cost-line").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    let best = null; for (let i = 0; i + 1 < nums.length; i += 2) if (!best || Math.abs(nums[i] - cx) < Math.abs(best[0] - cx)) best = [nums[i], nums[i + 1]];
    return Math.abs(best[1] - cy);
  });
  check(`the cost dot sits on the blue curve @${width}`, onCurve < 0.6, onCurve.toFixed(3));

  // price against payout (follows the lab's horizon: thirty years)
  check(`thirty years: price 41.6% @${width}`, (await txt("#pg-r-cost .value")) === "41.6%");
  check(`thirty years: expected payout 5.1% @${width}`, (await txt("#pg-r-pay .value")) === "5.1%");
  check(`thirty years: 8.2 times @${width}`, (await txt("#pg-r-ratio .value")) === "8.2×");
  await page.click('#pg-premium button[data-value="0"]');
  await settle(page);
  const same = await page.evaluate(() => {
    const a = document.querySelector("#fig-gap path.price-line").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    const b = document.querySelector("#fig-gap path.payout-line").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    let worst = 0; for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]));
    return { worst, n: a.length === b.length };
  });
  check(`no premium: the pink line lands on the blue one @${width}`, same.n && same.worst < 0.02, JSON.stringify(same));
  check(`no premium: price ÷ payout is 1.0 @${width}`, (await txt("#pg-r-ratio .value")) === "1.0×");
  await setRange(page, "#pl-T", 1);
  await page.click('#pg-premium button[data-value="0.06"]');
  await settle(page);
  check(`one year: about 1.5 times @${width}`, (await txt("#pg-r-ratio .value")) === "1.5×");
  check(`one year: payout 5.5% @${width}`, (await txt("#pg-r-pay .value")) === "5.5%");

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
