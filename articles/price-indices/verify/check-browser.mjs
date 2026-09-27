/*
  Browser checks for price-indices, two viewports, run against a build that
  ./verify/ship.sh has proved is the current one.

  The generic half is every article's: no sideways scroll (naming the offender),
  every svg inside its parent, no NaN geometry at any scroll position, KaTeX
  rendered, the title's lines inside the screen, nothing glued together.

  The article-specific half defends the figures' claims in rendered pixels:
    - the guess figure's answers are the four true indices;
    - in the lab, A and B lie on the indifference curve, A on the fixed-basket
      line, B on the true line, the two lines are parallel, and the true line
      never crosses the curve, at several settings of R and sigma;
    - the square-law scrubber's markers lie on their curves;
    - chained Fisher sits on the truth at every even month of the sale path.

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

  // --- the guess ---------------------------------------------------------------------
  await page.locator("#guess").scrollIntoViewIfNeeded();
  ok(at("the answers are hidden until asked for"), (await page.locator("#guess circle.answer").count()) === 0);
  await page.locator("#guess button.pill").click();
  const answers = await page.evaluate(() => [...document.querySelectorAll("#guess circle.answer")].map((c) => ((+c.dataset.rise) * 100).toFixed(1)));
  ok(at("four answers: 20.0, 17.3, 14.9 and 11.1%"), answers.join(",") === "20.0,17.3,14.9,11.1", answers.join(","));
  await page.locator("#guess input[type=range]").fill("15");
  const gv = await page.locator("#guess .verdict").textContent();
  ok(at("a 15% guess is closest to σ = 1"), /closest to the household with σ = 1\./.test(gv), gv);

  // --- the lab -----------------------------------------------------------------------
  const labGeom = async () =>
    page.evaluate(() => {
      const svg = document.querySelector("#basket-lab svg.choice");
      const curve = svg.querySelector("path.curve");
      const A = svg.querySelector("circle.basket-a"), B = svg.querySelector("circle.basket-b");
      const la = svg.querySelector("line.las-line"), tr = svg.querySelector("line.true-line");
      const pA = __P(A, +A.getAttribute("cx"), +A.getAttribute("cy"));
      const pB = __P(B, +B.getAttribute("cx"), +B.getAttribute("cy"));
      const ang = (l) => { const a = __P(l, +l.getAttribute("x1"), +l.getAttribute("y1")), b = __P(l, +l.getAttribute("x2"), +l.getAttribute("y2")); return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; };
      // signed side of each curve point relative to the true line (origin side negative)
      const a = __P(tr, +tr.getAttribute("x1"), +tr.getAttribute("y1")), b = __P(tr, +tr.getAttribute("x2"), +tr.getAttribute("y2"));
      const o = __P(svg, 0, 0);
      const plot0 = (() => { const r = svg.querySelectorAll("line.rule")[0]; return __P(r, +r.getAttribute("x1"), +r.getAttribute("y1")); })();
      const side = (p) => ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / Math.hypot(b[0] - a[0], b[1] - a[1]);
      const originSide = Math.sign(side(plot0));
      const len = curve.getTotalLength();
      let worstCross = 0;
      for (let i = 0; i <= 400; i++) { const q = curve.getPointAtLength((len * i) / 400); const s = side(__P(curve, q.x, q.y)); if (Math.sign(s) === originSide) worstCross = Math.max(worstCross, Math.abs(s)); }
      const bars = Object.fromEntries([...document.querySelectorAll("#basket-lab rect.bar")].map((r) => [r.classList[1], +r.dataset.value]));
      return {
        aCurve: __polyDist(curve, pA), bCurve: __polyDist(curve, pB),
        aLas: __lineDist(la, pA), bTrue: __lineDist(tr, pB),
        dAng: Math.abs(ang(la) - ang(tr)), worstCross, bars,
        lasOutside: Math.sign(side(pA)) === -originSide || Math.abs(side(pA)) < 0.5,
      };
    });
  await page.locator("#basket-lab").scrollIntoViewIfNeeded();
  const setR = async (v) => page.locator("#basket-lab input.r-slider").fill(String(+Math.log2(v).toFixed(2)));
  const setS = async (v) => page.locator("#basket-lab input.s-slider").fill(String(v));
  const cases = [["opening, energy ×2, σ = 1", null, null], ["σ = 2", null, 2], ["σ = 0.5, energy ×0.5", 0.5, 0.5], ["σ = 3, energy ×3", 3, 3]];
  for (const [name, R, S] of cases) {
    if (R !== null) await setR(R);
    if (S !== null) await setS(S);
    const g = await labGeom();
    ok(at(`lab ${name}: A and B lie on the indifference curve`), g.aCurve < 1.2 && g.bCurve < 1.2, `${g.aCurve.toFixed(2)}, ${g.bCurve.toFixed(2)}px`);
    ok(at(`lab ${name}: A on the fixed-basket line, B on the true line`), g.aLas < 0.5 && g.bTrue < 0.5, `${g.aLas.toFixed(2)}, ${g.bTrue.toFixed(2)}px`);
    ok(at(`lab ${name}: the two lines are parallel`), g.dAng < 0.05, `${g.dAng.toFixed(3)}°`);
    ok(at(`lab ${name}: the true line never crosses the curve`), g.worstCross < 0.75, `${g.worstCross.toFixed(2)}px on the origin side`);
    ok(at(`lab ${name}: Paasche ≤ true ≤ fixed basket in the bars, Fisher between Paasche and fixed basket`),
       g.bars.P <= g.bars.C + 1e-12 && g.bars.C <= g.bars.L + 1e-12 && g.bars.F >= g.bars.P - 1e-12 && g.bars.F <= g.bars.L + 1e-12, JSON.stringify(g.bars));
  }
  await setR(2); await setS(1);
  const g1 = await labGeom();
  ok(at("lab back at ×2, σ = 1: Fisher bar 15.5%, true 14.9%"), ((g1.bars.F) * 100).toFixed(1) === "15.5" && (g1.bars.C * 100).toFixed(1) === "14.9", JSON.stringify(g1.bars));
  await page.locator("#basket-lab .pill", { hasText: /^0$/ }).click();
  const g0 = await labGeom();
  ok(at("σ = 0: every bar says 20%"), ["L", "P", "F", "C"].every((k) => Math.abs(g0.bars[k] - 0.2) < 1e-12), JSON.stringify(g0.bars));


  if (vp.name === "mobile") {
    await page.locator("#basket-lab svg.bars").scrollIntoViewIfNeeded();
    const vis = await page.evaluate(() => { const r = document.querySelector("#basket-lab input.s-slider").getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
    ok(at("the σ slider stays on screen while you read the bars"), vis);
  } else {
    const tops = await page.evaluate(() => [...document.querySelectorAll("#basket-lab .cell")].map((c) => Math.round(c.getBoundingClientRect().top)));
    ok(at("the lab's two panels sit side by side on a desktop"), tops.length === 2 && tops[0] === tops[1], tops.join(","));
  }

  // --- the square law ------------------------------------------------------------------
  await page.locator("#square-law").scrollIntoViewIfNeeded();
  const sq = async () => page.evaluate(() => {
    const svg = document.querySelector("#square-law svg");
    const m1 = svg.querySelector("circle.las-mk"), m2 = svg.querySelector("circle.fis-mk");
    const p1 = svg.querySelector("path.las.s10"), p2 = svg.querySelector("path.fis.s10");
    return { d1: __polyDist(p1, __P(m1, +m1.getAttribute("cx"), +m1.getAttribute("cy"))), d2: __polyDist(p2, __P(m2, +m2.getAttribute("cx"), +m2.getAttribute("cy"))), t: document.querySelector("#square-law .fig-title").textContent };
  });
  const s0 = await sq();
  ok(at("square law opens on a doubling"), /×2\.00 with σ = 1/.test(s0.t), s0.t);
  ok(at("square law: both markers sit on the σ = 1 curves"), s0.d1 < 1 && s0.d2 < 1, `${s0.d1.toFixed(2)}, ${s0.d2.toFixed(2)}`);
  await page.locator("#square-law input[type=range]").fill("-2.5");
  const s1 = await sq();
  ok(at("…and still after the scrubber moves"), s1.d1 < 1 && s1.d2 < 1, `${s1.d1.toFixed(2)}, ${s1.d2.toFixed(2)}`);

  // --- chaining -------------------------------------------------------------------------
  await page.locator("#chain-figure").scrollIntoViewIfNeeded();
  const ch = async () => page.evaluate(() => {
    const svg = document.querySelector("#chain-figure svg");
    const cs = [...svg.querySelectorAll("circle.c-pt")], fs = [...svg.querySelectorAll("circle.f-pt")];
    let worst = 0;
    cs.forEach((c, i) => { const a = __P(c, +c.getAttribute("cx"), +c.getAttribute("cy")), b = __P(fs[i], +fs[i].getAttribute("cx"), +fs[i].getAttribute("cy")); worst = Math.max(worst, Math.hypot(a[0] - b[0], a[1] - b[1])); });
    return { worst, n: cs.length, t: document.querySelector("#chain-figure .fig-title").textContent };
  });
  const c1 = await ch();
  ok(at("sale path: chained Fisher sits on the truth at all 13 even months"), c1.n === 13 && c1.worst < 0.5, `${c1.n}, ${c1.worst.toFixed(2)}px`);
  ok(at("sale path readout: +17.2% and −14.7%"), c1.t.includes("+17.2%") && c1.t.includes("−14.7%"), c1.t);
  await page.locator("#chain-figure .pill", { hasText: "energy doubles over a year" }).click();
  const c2 = await ch();
  ok(at("smooth path readout: chained fixed basket +15.2%, true +14.9%"), c2.t.includes("+15.2%") && c2.t.includes("true +14.9%"), c2.t);

  ok(at("no console errors, warnings or page errors"), noise.length === 0, noise.slice(0, 3).join(" | "));

  if (SHOTS) {
    await page.locator("#chain-figure .pill", { hasText: "a good on sale every other month" }).click();
    await setR(2); await setS(1);
    await page.locator("#guess").screenshot({ path: `${SHOTS}/${vp.name}-guess.png` });
    await page.locator("#basket-lab").screenshot({ path: `${SHOTS}/${vp.name}-lab.png` });
    await page.locator("#square-law").screenshot({ path: `${SHOTS}/${vp.name}-square.png` });
    await page.locator("#chain-figure").screenshot({ path: `${SHOTS}/${vp.name}-chain.png` });
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
