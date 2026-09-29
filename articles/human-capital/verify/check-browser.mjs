/*
  Browser checks for human-capital at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/human-capital-shots node verify/check-browser.mjs

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

  check(`at 25: ratio 54.7, rule 4,299% @${width}`, (await txt("#hl-r-ratio .value")) === "54.7" && (await txt("#hl-r-rule .value")) === "4,299%");
  await setRange(page, "#hl-age", 47);
  const at47 = parseFloat((await txt("#hl-r-rule .value")).replace(/[,%]/g, ""));
  await setRange(page, "#hl-age", 49);
  const at49 = parseFloat((await txt("#hl-r-rule .value")).replace(/[,%]/g, ""));
  check(`the rule crosses 300% between 47 and 49 @${width}`, at47 > 300 && at49 < 300, `${at47} / ${at49}`);
  await setRange(page, "#hl-age", 65);
  check(`at 65 it's the Merton share, 77% @${width}`, (await txt("#hl-r-rule .value")) === "77%");
  // pixel checks: the rule's share line enters the chart below 300% around 48; the capped line sits on the limit
  const geo = async () => page.evaluate(() => {
    const svg = document.querySelector("#fig-life svg.share-panel");
    const pts = (sel) => { const n = svg.querySelector(sel).getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number); const o = []; for (let i = 0; i + 1 < n.length; i += 2) o.push([n[i], n[i + 1]]); return o; };
    const axis = [...svg.querySelectorAll(".axis-x text.tick-label")].map((t) => ({ v: +t.textContent, x: t.parentNode.getAttribute("transform") }));
    const xs = axis.map((a) => +a.x.match(/translate\(([-\d.]+)/)[1]);
    const ageAt = (px) => 25 + ((px - xs[0]) / (xs[xs.length - 1] - xs[0])) * 40;
    const yTicks = [...svg.querySelectorAll(".axis-y text.tick-label")].map((t) => ({ v: t.textContent, y: +t.getAttribute("y") - 4 }));
    const y100 = yTicks.find((t) => t.v === "100%").y, y300 = yTicks.find((t) => t.v === "300%").y;
    const rule = pts("path.rule-share"), capped = pts("path.capped-share");
    return { ruleStart: ageAt(rule[0][0]), ruleStartY: rule[0][1], y300, y100, capped, ageAt };
  });
  const s0 = await geo();
  check(`the rule's line enters the window at the top, at about 48 @${width}`, Math.abs(s0.ruleStart - 48.1) < 0.3 && Math.abs(s0.ruleStartY - s0.y300) < 0.5, `${s0.ruleStart.toFixed(2)}`);
  await clickSeg("hl-cap", "one");
  const s1 = await page.evaluate(() => {
    const svg = document.querySelector("#fig-life svg.share-panel");
    const n = svg.querySelector("path.capped-share").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    const yTicks = [...svg.querySelectorAll(".axis-y text.tick-label")].map((t) => ({ v: t.textContent, y: +t.getAttribute("y") - 4 }));
    const y100 = yTicks.find((t) => t.v === "100%").y;
    const xs = [...svg.querySelectorAll(".axis-x .tick-label")].map((t) => +t.parentNode.getAttribute("transform").match(/translate\(([-\d.]+)/)[1]);
    const ageAt = (px) => 25 + ((px - xs[0]) / (xs[xs.length - 1] - xs[0])) * 40;
    let leave = null; for (let i = 0; i + 1 < n.length; i += 2) if (Math.abs(n[i + 1] - y100) > 0.05) { leave = ageAt(n[i]); break; }
    return { leave, firstOn: Math.abs(n[1] - y100) < 0.05 };
  });
  check(`no borrowing: the dashed line sits on 100% and leaves it at about 62 @${width}`, s1.firstOn && Math.abs(s1.leave - 61.8) < 0.5, JSON.stringify(s1));
  check(`and at 65 holds the Merton share @${width}`, (await txt("#hl-r-held .value")) === "77%");
  await clickSeg("hl-cap", "two");
  await setRange(page, "#hl-age", 40);
  check(`a 200% limit: at 40 we hold 200% @${width}`, (await txt("#hl-r-held .value")) === "200%");
  // beta at the Merton share: flat line in pixels
  await clickSeg("hl-cap", "none");
  const flat = async () => page.evaluate(() => {
    const n = document.querySelector("#fig-life path.rule-share").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    const ys = []; for (let i = 1; i < n.length; i += 2) ys.push(n[i]);
    return Math.max(...ys) - Math.min(...ys);
  });
  await setRange(page, "#hl-beta", 0.77);
  const f77 = await flat();
  await setRange(page, "#hl-beta", 0.75);
  const f75 = await flat();
  await setRange(page, "#hl-beta", 0.8);
  const f80 = await flat();
  check(`at 77% of pay in stocks the share line is flat, flatter than at 75% or 80% @${width}`, f77 < 6 && f77 < f75 && f77 < f80, `${f77.toFixed(1)} / ${f75.toFixed(1)} / ${f80.toFixed(1)}`);
  await setRange(page, "#hl-beta", 1);
  await setRange(page, "#hl-age", 40);
  check(`all pay like stocks: short at 40 @${width}`, (await txt("#hl-r-rule .value")).startsWith("−"));
  await setRange(page, "#hl-age", 50);
  check(`and long again at 50 @${width}`, !(await txt("#hl-r-rule .value")).startsWith("−"));
  await setRange(page, "#hl-beta", 0);
  await setRange(page, "#hl-age", 25);
  // the stacked areas: savings under future pay; the top of the stack at 25 is about 27.9 years of pay
  const stack = await page.evaluate(() => {
    const svg = document.querySelector("#fig-life svg.wealth-panel");
    const n = svg.querySelector("path.future-pay").getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    const yTicks = [...svg.querySelectorAll(".axis-y text.tick-label")].map((t) => ({ v: +t.textContent, y: +t.getAttribute("y") - 4 }));
    const y0 = yTicks.find((t) => t.v === 0).y, y30 = yTicks.find((t) => t.v === 30).y;
    const val = (py) => ((y0 - py) / (y0 - y30)) * 30;
    return val(n[1]);
  });
  check(`the stack's top at 25 is about 27.9 years of pay @${width}`, Math.abs(stack - 27.86) < 0.1, stack.toFixed(2));

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
