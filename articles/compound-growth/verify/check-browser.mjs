/*
  Browser checks for compound-growth, two viewports, run against a build that
  ./verify/ship.sh has proved is the current one.

  The generic half is every article's: no sideways scroll (naming the offender),
  every svg inside its parent, no NaN geometry at any scroll position, KaTeX
  rendered, the title's lines inside the screen, nothing glued together.

  The article-specific half defends the figures' claims in rendered pixels:
    - on the logarithmic axis constant growth is a straight line, and on the
      ordinary one it is not; the doubling markers sit on the 2% path;
    - the question's answer and its two paths agree;
    - the drag figure's marker and zero ring sit on the exact curve;
    - the fan's expected and median markers end their lines, and the readouts
      are the exact values at the presets.

  Usage: BASE=http://127.0.0.1:8790 SHOTS=/tmp/shots node verify/check-browser.mjs
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

async function generic(page, vp, at) {
  const overflow = await page.evaluate(() => {
    const over = document.documentElement.scrollWidth - window.innerWidth;
    if (over <= 0) return { over };
    const bad = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.left < -1 || r.right > window.innerWidth + 1)) {
        bad.push(`${el.tagName.toLowerCase()}.${el.className?.baseVal ?? el.className ?? "-"} [${Math.round(r.left)},${Math.round(r.right)}]`);
      }
      if (bad.length > 4) break;
    }
    return { over, bad };
  });
  ok(at("the page does not scroll horizontally"), overflow.over <= 0,
     overflow.over > 0 ? `${overflow.over}px too wide: ${(overflow.bad || []).join("; ")}` : "");

  const svgs = await page.evaluate(() =>
    [...document.querySelectorAll("svg")].filter((s) => !s.closest(".katex")).map((s) => {
      const r = s.getBoundingClientRect();
      const p = s.parentElement.getBoundingClientRect();
      return { cls: s.getAttribute("class") || s.parentElement.className, over: Math.max(0, Math.round(r.right - p.right), Math.round(p.left - r.left)) };
    })
  );
  ok(at("every svg fits inside its parent"), svgs.every((s) => s.over <= 1),
     svgs.filter((s) => s.over > 1).map((s) => `${s.cls} +${s.over}px`).join("; "));

  const drawnOutside = await page.evaluate(() => {
    const bad = [];
    for (const svg of document.querySelectorAll("svg")) {
      if (svg.closest(".katex") || svg.closest("#site-mark")) continue;
      const box = svg.getBoundingClientRect();
      for (const el of svg.querySelectorAll("rect, circle, line, path, text")) {
        if (el.closest("defs") || el.closest("pattern")) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.left < box.left - 1.5 || r.right > box.right + 1.5 || r.top < box.top - 1.5 || r.bottom > box.bottom + 1.5) {
          bad.push(`${el.tagName}.${el.getAttribute("class") || "-"}`);
        }
      }
    }
    return bad.slice(0, 4);
  });
  ok(at("nothing is drawn outside the svg that contains it"), drawnOutside.length === 0, drawnOutside.join("; "));

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
          if (v !== null && !v.endsWith("%") && (Number.isNaN(+v) || +v < 0)) bad.push(`${a}=${v}`);
        }
        for (const a of ["cx", "cy", "x1", "y1", "x2", "y2", "x", "y"]) {
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

  const math = await page.evaluate(() => ({
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 3),
    rendered: document.querySelectorAll(".katex").length,
    // In a JS template literal "\;" is just ";", so a spacing command written
    // with one backslash reaches KaTeX as a literal semicolon. Nothing warns.
    lost: [...document.querySelectorAll(".katex annotation")].map((a) => a.textContent).filter((t) => /(^|[^\\]);/.test(t)).slice(0, 2),
  }));
  ok(at("no unrendered LaTeX in the text"), math.raw.length === 0, math.raw.join(" "));
  ok(at("KaTeX actually rendered something"), math.rendered > 0, `${math.rendered} .katex nodes`);
  ok(at("no KaTeX spacing command lost to a single-backslash escape"), math.lost.length === 0, math.lost.join(" | "));

  const title = await page.evaluate(() => {
    const h = document.querySelector("#intro-hed");
    const range = document.createRange();
    range.selectNodeContents(h);
    return Math.max(...[...range.getClientRects()].map((r) => r.width));
  });
  ok(at("the title's widest rendered line fits the viewport"), title <= vp.width - 2,
     `widest line ${Math.round(title)}px in ${vp.width}px`);

  const glued = await page.evaluate(() =>
    (document.body.innerText.match(/[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/g) || []).slice(0, 3)
  );
  ok(at("no text glued to a separator or a word"), glued.length === 0, glued.join(" "));
}

// Map an SVG user-space point through the element's own CTM into page pixels.
const CTM = `
  window.__P = (el, x, y) => { const p = new DOMPoint(x, y).matrixTransform(el.getScreenCTM()); return [p.x, p.y]; };
  window.__polyDist = (path, pt) => {
    const len = path.getTotalLength(); let best = Infinity;
    for (let i = 0; i <= 600; i++) { const q = path.getPointAtLength((len * i) / 600); const s = __P(path, q.x, q.y); best = Math.min(best, Math.hypot(s[0] - pt[0], s[1] - pt[1])); }
    return best;
  };
  window.__lineDist = (line, pt) => {
    const a = __P(line, +line.getAttribute("x1"), +line.getAttribute("y1"));
    const b = __P(line, +line.getAttribute("x2"), +line.getAttribute("y2"));
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return Math.abs((b[0] - a[0]) * (pt[1] - a[1]) - (b[1] - a[1]) * (pt[0] - a[0])) / len;
  };
`;

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const noise = [];
  page.on("pageerror", (e) => noise.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") noise.push(`console ${m.type()}: ${m.text()}`);
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(CTM);
  const at = (claim) => `${vp.name}: ${claim}`;

  await generic(page, vp, at);

  // --- straight on a log axis -------------------------------------------------------------
  const bend = async () => page.evaluate(() => {
    const p = document.querySelector("#log-scale path.growth.g0");
    const len = p.getTotalLength();
    const a = p.getPointAtLength(0), b = p.getPointAtLength(len);
    const A = __P(p, a.x, a.y), B = __P(p, b.x, b.y);
    let worst = 0;
    for (let i = 1; i < 40; i++) {
      const q = p.getPointAtLength((len * i) / 40), Q = __P(p, q.x, q.y);
      const d = Math.abs((B[0] - A[0]) * (Q[1] - A[1]) - (B[1] - A[1]) * (Q[0] - A[0])) / Math.hypot(B[0] - A[0], B[1] - A[1]);
      worst = Math.max(worst, d);
    }
    const marks = [...document.querySelectorAll("#log-scale circle.doubling")].map((c) => __polyDist(p, __P(c, +c.getAttribute("cx"), +c.getAttribute("cy"))));
    return { worst, marks, t: document.querySelector("#log-scale .fig-title").textContent };
  });
  await page.locator("#log-scale").scrollIntoViewIfNeeded();
  const b1 = await bend();
  ok(at("on the logarithmic axis the 2% path is a straight line"), b1.worst < 0.6, `${b1.worst.toFixed(2)}px`);
  ok(at("the doubling markers sit on the 2% path"), b1.marks.length === 2 && b1.marks.every((d) => d < 1), b1.marks.map((d) => d.toFixed(2)).join(","));
  ok(at("year 100: the gap between the two economies is 2.65×"), /the gap between them is 2\.65×/.test(b1.t), b1.t);
  await page.locator("#log-scale .pill", { hasText: "ordinary axis" }).click();
  const b2 = await bend();
  ok(at("on the ordinary axis it bends"), b2.worst > 10, `${b2.worst.toFixed(1)}px`);
  await page.locator("#log-scale input[type=range]").fill("35");
  const b3 = await bend();
  ok(at("year 35: the 2% economy has doubled"), /2% economy is 2\.00 times/.test(b3.t), b3.t);

  // --- the question ---------------------------------------------------------------------------
  await page.locator("#swing-quiz").scrollIntoViewIfNeeded();
  ok(at("the paths are hidden until a pick"), (await page.locator("#swing-quiz svg").count()) === 0);
  await page.locator('#swing-quiz button[data-choice="B"]').click();
  const v = await page.locator("#swing-quiz .verdict").textContent();
  ok(at("picking B: not quite, 4.38 vs 4.13, 6.1% richer, 2.88% a year"), /^Not quite\./.test(v) && v.includes("4.38") && v.includes("4.13") && v.includes("6.1%") && v.includes("2.88%"), v);
  const ends = await page.evaluate(() => {
    const a = document.querySelector("#swing-quiz circle.end-a"), b = document.querySelector("#swing-quiz circle.end-b");
    const pa = document.querySelector("#swing-quiz path.path-a"), pb = document.querySelector("#swing-quiz path.path-b");
    const A = __P(a, +a.getAttribute("cx"), +a.getAttribute("cy")), B = __P(b, +b.getAttribute("cx"), +b.getAttribute("cy"));
    return { da: __polyDist(pa, A), db: __polyDist(pb, B), aAbove: A[1] < B[1] };
  });
  ok(at("each path ends at its dot, and A's dot is higher"), ends.da < 1 && ends.db < 1 && ends.aAbove, JSON.stringify(ends));

  // --- the drag -----------------------------------------------------------------------------
  const drag = async () => page.evaluate(() => {
    const svg = document.querySelector("#drag-figure svg");
    const c = svg.querySelector("path.curve"), m = svg.querySelector("circle.marker"), z = svg.querySelector("circle.zero-pt");
    return { dm: __polyDist(c, __P(m, +m.getAttribute("cx"), +m.getAttribute("cy"))), dz: __polyDist(c, __P(z, +z.getAttribute("cx"), +z.getAttribute("cy"))), t: document.querySelector("#drag-figure .fig-title").textContent };
  });
  await page.locator("#drag-figure").scrollIntoViewIfNeeded();
  const d0 = await drag();
  ok(at("drag figure opens on the quiz's swing: 2.88%"), /compounds at 2\.88% a year/.test(d0.t), d0.t);
  ok(at("the marker and the zero ring sit on the exact curve"), d0.dm < 1 && d0.dz < 1, `${d0.dm.toFixed(2)}, ${d0.dz.toFixed(2)}`);
  await page.locator("#drag-figure input[type=range]").fill("24.5");
  const d1 = await drag();
  ok(at("at ±24.5 points growth is a hair above zero, and the marker is still on the curve"), /compounds at 0\.0\d% a year/.test(d1.t) && d1.dm < 1, d1.t);

  // --- the fan ------------------------------------------------------------------------------
  const fan = async () => page.evaluate(() => {
    const svg = document.querySelector("#fan-lab svg");
    const e = svg.querySelector("circle.exp-end"), m = svg.querySelector("circle.med-end");
    const pe = svg.querySelector("path.expected"), pm = svg.querySelector("path.median");
    const facts = Object.fromEntries([...document.querySelectorAll("#fan-lab .fact")].map((f) => [f.classList[1], f.querySelector("b").textContent]));
    return { de: __polyDist(pe, __P(e, +e.getAttribute("cx"), +e.getAttribute("cy"))), dm: __polyDist(pm, __P(m, +m.getAttribute("cx"), +m.getAttribute("cy"))), n: svg.querySelectorAll("path.one").length, facts };
  });
  await page.locator("#fan-lab").scrollIntoViewIfNeeded();
  const f0 = await fan();
  ok(at("fan opens at 15%: expected 2.69×, median 1.53×, exact share 29.8%"), f0.facts.expected === "2.69×" && f0.facts.median === "1.53×" && f0.facts.above.endsWith("29.8% exact"), JSON.stringify(f0.facts));
  ok(at("fan: both summary markers end their lines, and every path is drawn"), f0.de < 1 && f0.dm < 1 && f0.n >= 395, `${f0.de.toFixed(2)}, ${f0.dm.toFixed(2)}, ${f0.n}`);
  await page.locator("#fan-lab .pill", { hasText: "a stock" }).click();
  const f1 = await fan();
  ok(at("a stock, 20%: expected still 2.69×, median 0.99×, exact 24.0%"), f1.facts.expected === "2.69×" && f1.facts.median === "0.99×" && f1.facts.above.endsWith("24.0% exact"), JSON.stringify(f1.facts));
  await page.locator("#fan-lab .pill", { hasText: "GDP" }).click();
  const f2 = await fan();
  ok(at("a country's GDP, 2%: median 2.66×, exact 47.2%"), f2.facts.median === "2.66×" && f2.facts.above.endsWith("47.2% exact"), JSON.stringify(f2.facts));
  await page.locator("#fan-lab input[type=range]").fill("30");
  const f3 = await fan();
  ok(at("σ = 30%: markers still on their lines"), f3.de < 1 && f3.dm < 1 && f3.facts.expected === "2.69×");

  if (vp.name === "mobile") {
    await page.locator("#fan-lab .legend").scrollIntoViewIfNeeded();
    const vis = await page.evaluate(() => { const r = document.querySelector("#fan-lab input[type=range]").getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
    ok(at("the volatility slider stays on screen at the bottom of the fan"), vis);
  }

  ok(at("no console errors, warnings or page errors"), noise.length === 0, noise.slice(0, 3).join(" | "));

  if (SHOTS) {
    await page.locator("#log-scale .pill", { hasText: "logarithmic axis" }).click();
    await page.locator("#fan-lab input[type=range]").fill("15");
    await page.locator("#drag-figure input[type=range]").fill("5");
    await page.locator("#log-scale").screenshot({ path: `${SHOTS}/${vp.name}-log.png` });
    await page.locator("#swing-quiz").screenshot({ path: `${SHOTS}/${vp.name}-quiz.png` });
    await page.locator("#drag-figure").screenshot({ path: `${SHOTS}/${vp.name}-drag.png` });
    await page.locator("#fan-lab").screenshot({ path: `${SHOTS}/${vp.name}-fan.png` });
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
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
