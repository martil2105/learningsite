/*
  Browser checks for order-book at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/order-book-shots node verify/check-browser.mjs

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
  // figure 1: labels and the empty mid
  const f1 = await page.$("#fig-book svg");
  check(`figure 1 labels best bid and best ask @${width}`, /best bid \$99\.99/.test(await f1.textContent()) && /best ask \$100\.01/.test(await f1.textContent()));

  // lab opening state: flat, 5,000 shares
  check(`lab opens at 10 levels @${width}`, (await txt("#r-levels .value")) === "10");
  check(`lab opens with last $100.10 @${width}`, (await txt("#r-last .value")) === "$100.10");
  check(`lab opens with average $100.055 @${width}`, (await txt("#r-avg .value")) === "$100.055");
  check(`lab opens half way @${width}`, (await txt("#r-share .value")) === "50.0%");
  check(`lab round trip 11 cents @${width}`, (await txt("#r-rt .value")).startsWith("11.0¢"));

  // geometry: the dark bars sum to the order, and the average line sits at the stated price
  const geo = await page.evaluate(() => {
    const svg = document.querySelector("#fig-walk svg.book-chart");
    const taken = [...svg.querySelectorAll("rect.ask-taken")];
    const qty = taken.reduce((a, r) => a + +r.dataset.qty, 0);
    const prices = [...svg.querySelectorAll("rect.ask")].map((r) => [+r.dataset.price, r.getBoundingClientRect()]);
    const avgLine = svg.querySelector(".avg-marker line").getBoundingClientRect();
    // interpolate the x of $100.055 from the bar centres of $100.05 and $100.06
    const c = (p) => { const b = prices.find(([q]) => q === p)[1]; return b.left + b.width / 2; };
    const expected = (c(10005) + c(10006)) / 2;
    return { qty, bars: taken.length, dx: Math.abs(avgLine.left + avgLine.width / 2 - expected) };
  });
  check(`dark bars add up to 5,000 shares over 10 levels @${width}`, geo.qty === 5000 && geo.bars === 10, JSON.stringify(geo));
  check(`average line drawn at $100.055 in pixels @${width}`, geo.dx < 1.5, `off by ${geo.dx.toFixed(2)}px`);

  // switch to the linear book and 5,500 shares
  await page.click('#shape button[data-value="v"]');
  await page.$eval("#q", (el) => { el.value = "5500"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  check(`linear 5,500: average $100.070 @${width}`, (await txt("#r-avg .value")) === "$100.070");
  check(`linear 5,500: two thirds @${width}`, (await txt("#r-share .value")) === "66.7%");
  check(`linear 5,500: whole-level note @${width}`, /clears whole levels/.test(await txt("#lab-note")));
  await page.$eval("#q", (el) => { el.value = "5000"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  check(`linear 5,000: partial-level note @${width}`, /partly used/.test(await txt("#lab-note")));
  // large order walks off a narrow chart and says so
  await page.click('#shape button[data-value="flat"]');
  await page.$eval("#q", (el) => { el.value = "15000"; el.dispatchEvent(new Event("input", { bubbles: true })); });
  const lastLabel = await page.$eval("#fig-walk svg", (s) => s.textContent);
  check(`flat 15,000: last price shown @${width}`, /last \$100\.30/.test(lastLabel));

  // growth chart: slopes of the drawn lines in pixels are 1, 1/2, 1/3
  const slopes = await page.evaluate(() => {
    const out = {};
    for (const p of document.querySelectorAll("path.growth-line")) {
      const nums = p.getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
      const [x0, y0] = [nums[0], nums[1]], [x1, y1] = [nums[nums.length - 2], nums[nums.length - 1]];
      out[p.dataset.shape] = (y0 - y1) / (x1 - x0);
    }
    return out;
  });
  // x spans 2 decades over the plot width, y spans log10(300) decades over its height: convert
  const ratio = slopes.v / slopes.flat, ratio2 = slopes.steep / slopes.flat;
  check(`growth lines have slopes in ratio 1 : 1/2 : 1/3 @${width}`, Math.abs(ratio - 0.5) < 0.01 && Math.abs(ratio2 - 1 / 3) < 0.01, `${ratio.toFixed(3)} ${ratio2.toFixed(3)}`);
  check(`doubling readouts @${width}`, (await txt("#g-flat .value")).startsWith("×2.00") && (await txt("#g-v .value")).startsWith("×1.41") && (await txt("#g-steep .value")).startsWith("×1.26"));

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
