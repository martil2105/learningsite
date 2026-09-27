/*
  Browser checks, two viewports, run against a build that ./verify/ship.sh has
  proved is the current one. The generic half (overflow, svg fit, NaN sweep,
  rendered maths, title lines) is shared; the article half is the part that
  pays for the file.

  Usage:  BASE=http://127.0.0.1:8790 SHOTS=/tmp/shots node verify/check-browser.mjs
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

if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const noise = [];
  page.on("pageerror", (e) => noise.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") noise.push(`console ${m.type()}: ${m.text()}`);
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  const at = (claim) => `${vp.name}: ${claim}`;

  // --- the document does not scroll sideways, and if it does, name the offender
  const overflow = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth - window.innerWidth;
    if (over <= 0) return { over };
    const bad = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.left < -1 || r.right > window.innerWidth + 1)) {
        bad.push(`${el.tagName.toLowerCase()}.${el.className || "-"} [${Math.round(r.left)},${Math.round(r.right)}]`);
      }
      if (bad.length > 4) break;
    }
    return { over, bad };
  });
  ok(at("the page does not scroll horizontally"), overflow.over <= 0,
     overflow.over > 0 ? `${overflow.over}px too wide: ${(overflow.bad || []).join("; ")}` : "");

  // --- every svg fits its parent
  const svgs = await page.evaluate(() =>
    [...document.querySelectorAll("svg")].map((s) => {
      const r = s.getBoundingClientRect();
      const p = s.parentElement.getBoundingClientRect();
      return { cls: (s.parentElement.className || s.tagName).toString().slice(0, 30), over: Math.max(0, Math.round(r.right - p.right), Math.round(p.left - r.left)) };
    })
  );
  ok(at("every svg fits inside its parent"), svgs.every((s) => s.over <= 1),
     svgs.filter((s) => s.over > 1).map((s) => `${s.cls} +${s.over}px`).join("; "));

  // --- no invalid geometry, swept across the scroll
  const sweep = await page.evaluate(async () => {
    const bad = [];
    const H = document.documentElement.scrollHeight;
    for (let i = 0; i <= 20; i++) {
      window.scrollTo(0, (H * i) / 20);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      for (const el of document.querySelectorAll("svg [d], svg circle, svg rect, svg line")) {
        const d = el.getAttribute("d");
        if (d && /NaN|undefined|Infinity/.test(d)) bad.push(`d=${d.slice(0, 40)}`);
        for (const a of ["width", "height", "r"]) {
          const v = el.getAttribute(a);
          if (v !== null && (Number.isNaN(+v) || +v < 0)) bad.push(`${a}=${v}`);
        }
        for (const a of ["cx", "cy", "x1", "y1", "x2", "y2"]) {
          const v = el.getAttribute(a);
          if (v !== null && !Number.isFinite(+v)) bad.push(`${a}=${v}`);
        }
      }
      if (bad.length) break;
    }
    window.scrollTo(0, 0);
    return bad.slice(0, 3);
  });
  ok(at("no NaN, undefined or negative geometry at any scroll position"), sweep.length === 0, sweep.join("; "));

  // --- maths rendered, rather than reaching the DOM as source
  const math = await page.evaluate(() => ({
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 3),
    rendered: document.querySelectorAll(".katex").length,
  }));
  ok(at("no unrendered LaTeX in the text"), math.raw.length === 0, math.raw.join(" "));
  ok(at("KaTeX actually rendered something"), math.rendered > 0, `${math.rendered} .katex nodes`);

  // --- the title's rendered LINES fit the screen
  const title = await page.evaluate(() => {
    const h = document.querySelector("#intro-hed");
    const range = document.createRange();
    range.selectNodeContents(h);
    return Math.max(...[...range.getClientRects()].map((r) => r.width));
  });
  ok(at("the title's widest rendered line fits the viewport"), title <= vp.width - 2,
     `widest line ${Math.round(title)}px in ${vp.width}px`);

  // --- text glued to a separator or to a word
  const glued = await page.evaluate(() =>
    (document.body.innerText.match(/[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/g) || []).slice(0, 3)
  );
  ok(at("no text glued to a separator or a word"), glued.length === 0, glued.join(" "));
  // === article: markup-and-elasticity =========================================
  // The spine's two optimum lines coincide exactly at c = 10 and split
  // visibly by c = 12 — in rendered pixels, on the step grid.
  const optGap = () =>
    page.evaluate(() => {
      const svg = [...document.querySelectorAll("svg")].find((s) => s.querySelector(".opt"));
      if (!svg) return null;
      const m = svg.getScreenCTM();
      const P = (x) => new DOMPoint(x, 0).matrixTransform(m).x;
      const a = P(+svg.querySelector(".opt:not(.ces)").getAttribute("x1"));
      const b = P(+svg.querySelector(".opt.ces").getAttribute("x1"));
      return Math.abs(a - b);
    });
  const spine = page.locator("#spine input[type=range]").first();
  for (const [v, far] of [["8", true], ["10", false], ["12", true]]) {
    await spine.fill(v);
    const g = await optGap();
    ok(at(`c = ${v}: the two optima are ${far ? "apart" : "coincident"}`),
       g !== null && (far ? g > 20 : g < 1),
       g === null ? "figure not found" : `${g.toFixed(2)}px`);
  }

  // In the lab, the pin never moves as n sweeps: the ring's rendered centre
  // is one point across the whole sweep.
  const pinCentre = () =>
    page.evaluate(() => {
      const svg = [...document.querySelectorAll("svg")].find((s) => s.querySelector(".pin-dot"));
      if (!svg) return null;
      const m = svg.getScreenCTM();
      const dot = svg.querySelector(".pin-dot");
      const p = new DOMPoint(+dot.getAttribute("cx"), +dot.getAttribute("cy")).matrixTransform(m);
      return [p.x, p.y];
    });
  const lab = page.locator("#curvature-lab input[type=range]").first();
  const centres = [];
  for (const v of ["-5", "-2", "-1.5", "0.5", "1", "3", "6"]) {
    await lab.fill(v);
    centres.push(await pinCentre());
  }
  const pinWorst = Math.max(
    ...centres.map((c) => Math.hypot(c[0] - centres[0][0], c[1] - centres[0][1]))
  );
  ok(at("the pin sits still across the whole n sweep"), pinWorst < 1, `${pinWorst.toFixed(3)}px drift`);

  ok(at("no console errors, warnings or page errors"), noise.length === 0, noise.slice(0, 3).join(" | "));

  if (SHOTS) {
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
    for (const fig of await page.locator(".fig").all()) {
      const id = (await fig.getAttribute("id")) || "fig";
      await fig.screenshot({ path: `${SHOTS}/${vp.name}-${id}.png` });
    }
  }

  await page.close();
}

await browser.close();

if (fails.length) {
  console.error(`\n${fails.length} CHECKS FAILED\n`);
  for (const f of fails) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`ALL ${pass} CHECKS PASS`);