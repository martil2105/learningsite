/*
  Browser checks for merton-share at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/merton-share-shots node verify/check-browser.mjs

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

  const outside = await page.evaluate(() => {
    const bad = [];
    for (const s of document.querySelectorAll("svg")) {
      if (s.closest(".katex")) continue;
      const r = s.getBoundingClientRect();
      for (const el of s.querySelectorAll("path, circle, rect, line, text")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;
        if (b.left < r.left - 1.5 || b.right > r.right + 1.5 || b.top < r.top - 1.5 || b.bottom > r.bottom + 1.5)
          bad.push(`${s.getAttribute("class") || "svg"} ${el.tagName}.${el.getAttribute("class") || ""}`);
      }
    }
    return bad;
  });
  ok(at("nothing is drawn outside its svg"), outside.length === 0, outside.slice(0, 4).join("; "));
  const glued = await page.evaluate(() => {
    // the rendered text, laid out (flex items are separate lines), with maths and charts hidden
    const hide = [...document.querySelectorAll(".katex, svg")].filter((e) => !e.closest(".katex") || e.classList.contains("katex"));
    const was = hide.map((e) => e.style.display);
    hide.forEach((e) => (e.style.display = "none"));
    const t = document.body.innerText;
    hide.forEach((e, i) => (e.style.display = was[i]));
    return (t.match(/[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/) || [""])[0];
  });
  ok(at("no text glued to a number"), !glued, glued);
  const semis = await page.evaluate(() => [...document.querySelectorAll(".katex annotation")].map((a) => a.textContent).filter((t) => /(^|[^\\]);/.test(t)));
  ok(at("no KaTeX spacing command lost its backslash"), semis.length === 0, semis.slice(0, 2).join(" | "));

  // ---------------------------------------------------- this article's checks
  const width = vp.width;
  const check = (claim, cond, detail = "") => ok(at(claim), cond, detail);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) || "").trim();
  const clickSeg = async (id, v) => { await page.click(`#${id} button[data-value="${v}"]`); await settle(page); };

  // ---- the share lab: the dot is the curve's highest point, in pixels
  const peak = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-share svg.share-lab");
    const dot = svg.querySelector("circle.star-dot");
    const n = svg.querySelector("path.gain-curve").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    let minY = Infinity, xAtMin = 0; for (let i = 0; i + 1 < n.length; i += 2) if (n[i + 1] < minY) { minY = n[i + 1]; xAtMin = n[i]; }
    return dot ? { dy: +dot.getAttribute("cy") - minY, dx: Math.abs(+dot.getAttribute("cx") - xAtMin), cx: +dot.getAttribute("cx"), step: (n[2] - n[0]) } : null;
  });
  check(`gamma 2: 77% @${width}`, (await txt("#sl-r-share .value")) === "77%");
  check(`worth +1.93% a year @${width}`, (await txt("#sl-r-best .value")) === "+1.93% a year");
  check(`all in stocks: +1.76%, keeps 91% @${width}`, (await txt("#sl-r-full .value")) === "+1.76% a year" && (await txt("#sl-r-kept .value")) === "91% of the best");
  let pk = await peak();
  check(`the dot sits at the curve's highest point @${width}`, pk && pk.dy <= 0.02 && pk.dx <= pk.step + 0.01, JSON.stringify(pk));
  await clickSeg("sl-gamma", 1);
  check(`gamma 1: 154% @${width}`, (await txt("#sl-r-share .value")) === "154%");
  pk = await peak();
  const borrow = await page.evaluate(() => +document.querySelector("#fig-share rect.borrow-zone").getAttribute("x"));
  check(`and the peak is inside the borrowing zone @${width}`, pk && pk.cx > borrow && pk.dy <= 0.02);
  await clickSeg("sl-gamma", 4);
  check(`gamma 4: 39% @${width}`, (await txt("#sl-r-share .value")) === "39%");
  await clickSeg("sl-gamma", 8);
  check(`gamma 8: 19% @${width}`, (await txt("#sl-r-share .value")) === "19%");
  await clickSeg("sl-gamma", 2);
  await setRange(page, "#sl-premium", 0.034);
  check(`the log premium typed in: 52% @${width}`, (await txt("#sl-r-share .value")) === "52%");
  pk = await peak();
  check(`and the dot follows the peak @${width}`, pk && pk.dy <= 0.02);
  await setRange(page, "#sl-premium", 0.05);
  check(`back to 77% @${width}`, (await txt("#sl-r-share .value")) === "77%");
  // the premium line is the curve's tangent at zero: they start together
  const start = await page.evaluate(() => {
    const a = document.querySelector("#fig-share path.gain-curve").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    const b = document.querySelector("#fig-share path.premium-line").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  });
  check(`the curve and the premium line start at the same point @${width}`, start < 0.02);

  // ---- the estimate figure
  check(`a century: ±28% and 87% @${width}`, (await txt("#ef-r-se .value")) === "±28%" && (await txt("#ef-r-theory .value")) === "87%");
  const drawn = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-estimate svg.shares");
    const z = svg.querySelector("rect.better-zone"), x0 = +z.getAttribute("x"), x1 = x0 + +z.getAttribute("width");
    const dots = [...svg.querySelectorAll("circle.dot")];
    const pink = dots.filter((d) => d.classList.contains("worse"));
    const wrong = dots.filter((d) => { const cx = +d.getAttribute("cx"); const out = cx < x0 - 0.01 || cx > x1 + 0.01; return out !== d.classList.contains("worse"); });
    return { n: dots.length, pink: pink.length, wrong: wrong.length };
  });
  for (const N of [100, 13, 30, 200]) {
    await clickSeg("ef-N", N);
    const d = await drawn();
    const rd = parseInt(await txt("#ef-r-worse .value"));
    check(`${N} years: 200 dots drawn, pink ones exactly those outside the shaded zone @${width}`, d.n === 200 && d.wrong === 0, JSON.stringify(d));
    check(`${N} years: the readout counts the pink dots @${width}`, d.pink === rd, `${d.pink} vs ${rd}`);
  }
  await clickSeg("ef-N", 13);
  check(`13 years: kept on average 0% @${width}`, (await txt("#ef-r-theory .value")) === "0%");
  const be = await page.evaluate(() => {
    const svg = document.querySelector("#fig-estimate svg.kept");
    const n = +svg.querySelector("circle.n-dot").getAttribute("cy"), b = +svg.querySelector("circle.be-dot").getAttribute("cy");
    return Math.abs(n - b);
  });
  check(`and the dot sits on the break-even line @${width}`, be < 0.5, be.toFixed(2));
  await clickSeg("ef-N", 30);
  check(`30 years: 57% @${width}`, (await txt("#ef-r-theory .value")) === "57%");
  await clickSeg("ef-N", 100);

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
