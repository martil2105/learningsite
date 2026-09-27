/*
  Browser checks for dividend-discount-model at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/dividend-discount-model-shots node verify/check-browser.mjs

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
  check(`stream opens at $33.33 @${width}`, (await txt("#st-price .value")) === "$33.33");
  check(`stream: yield 3.00% @${width}`, (await txt("#st-yield .value")) === "3.00%");
  check(`stream: half after year 24.6 @${width}`, (await txt("#st-half .value")) === "24.6");
  check(`stream: 75.4% after year 10 @${width}`, (await txt("#st-after10 .value")) === "75.4%");
  check(`stream: duration 33.3 @${width}`, (await txt("#st-dur .value")) === "33.3");
  // geometry: the cumulative line crosses 50% at the dashed half-way line
  const geo = await page.evaluate(() => {
    const svg = document.querySelector("#fig-stream svg.cum-chart");
    const nums = svg.querySelector("path.cum-line").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    const pts = []; for (let i = 0; i < nums.length; i += 2) pts.push([nums[i], nums[i + 1]]);
    // the marker is drawn in the upper panel; both panels share one x scale
    const hl = +document.querySelector("#fig-stream svg.stream-chart line.half-line").getAttribute("x1");
    // y of 0% and 100% from the lower panel's own axis labels
    const labs = [...svg.querySelectorAll("text.tick-label")].filter((t) => /%$/.test(t.textContent));
    const y0 = +labs.find((t) => t.textContent === "0%").getAttribute("y") - 4, y100 = +labs.find((t) => t.textContent === "100%").getAttribute("y") - 4;
    const yHalf = (y0 + y100) / 2;
    let cross = null;
    for (let i = 1; i < pts.length; i++) if ((pts[i - 1][1] - yHalf) * (pts[i][1] - yHalf) <= 0) { const f = (yHalf - pts[i - 1][1]) / (pts[i][1] - pts[i - 1][1]); cross = pts[i - 1][0] + f * (pts[i][0] - pts[i - 1][0]); break; }
    return { dx: Math.abs(cross - hl) };
  });
  check(`cumulative line crosses 50% at the half-way marker @${width}`, geo.dx < 4, `dx ${geo.dx.toFixed(2)}px`);
  // g = 6.5%
  await setRange(page, "#s-g", 0.065);
  check(`g 6.5%: price $66.67 @${width}`, (await txt("#st-price .value")) === "$66.67");
  check(`g 6.5%: half after about year 50 @${width}`, Math.abs(parseFloat(await txt("#st-half .value")) - 50) < 1);
  // g can't reach r
  await setRange(page, "#s-g", 0.1);
  await setRange(page, "#s-r", 0.06);
  const pr = parseFloat((await txt("#st-price .value")).slice(1));
  check(`growth held below the discount rate @${width}`, Number.isFinite(pr) && pr > 0, String(pr));

  // gap curve
  check(`gap opens at $33.33 @${width}`, (await txt("#gc-price .value")) === "$33.33");
  check(`+1 point: −25.0% @${width}`, (await txt("#gc-up .value")) === "−25.0%");
  check(`−1 point: +50.0% @${width}`, (await txt("#gc-down .value")) === "+50.0%");
  check(`duration guess ∓33.3% @${width}`, (await txt("#gc-tan .value")) === "∓33.3%");
  const tangentOk = await page.evaluate(() => {
    const svg = document.querySelector("#fig-gap svg");
    const l = svg.querySelector("line.tangent"), c = svg.querySelector("circle.pt-now");
    const x1 = +l.getAttribute("x1"), y1 = +l.getAttribute("y1"), x2 = +l.getAttribute("x2"), y2 = +l.getAttribute("y2");
    const cx = +c.getAttribute("cx"), cy = +c.getAttribute("cy");
    const yAt = y1 + ((cx - x1) * (y2 - y1)) / (x2 - x1);
    return Math.abs(yAt - cy) < 0.5;
  });
  check(`tangent passes through the current point @${width}`, tangentOk);
  await setRange(page, "#gap", 0.06);
  check(`6% gap: −14.3% @${width}`, (await txt("#gc-up .value")) === "−14.3%");
  await setRange(page, "#gap", 0.02);
  check(`2% gap: −33.3% @${width}`, (await txt("#gc-up .value")) === "−33.3%");

  // two stages
  check(`two-stage opens at 75.3% terminal @${width}`, (await txt("#ts-share .value")) === "75.3%");
  await setRange(page, "#ts-n", 20);
  check(`20 forecast years: 64.2% terminal @${width}`, (await txt("#ts-share .value")) === "64.2%");
  const splitOk = await page.evaluate(() => {
    const svg = document.querySelector("#fig-twostage svg.split-bar");
    const rects = svg.querySelectorAll("rect");
    const a = +rects[0].getAttribute("width"), b = +rects[1].getAttribute("width");
    return Math.abs(b / (a + b) - 0.6424) < 0.002;
  });
  check(`split bar drawn at the stated share @${width}`, splitOk);

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
