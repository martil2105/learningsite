/*
  Browser checks for supply-and-demand at 390px and 1280px viewports.
  Run against the bundle built by ./verify/ship.sh.
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

  // 1. Horizontal overflow
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

  // 2. SVG fit
  const svgs = await page.evaluate(() =>
    [...document.querySelectorAll("svg")].map((s) => {
      const r = s.getBoundingClientRect();
      const p = s.parentElement.getBoundingClientRect();
      return {
        cls: (s.parentElement.className || s.tagName).toString().slice(0, 30),
        over: Math.max(0, Math.round(r.right - p.right), Math.round(p.left - r.left)),
      };
    })
  );
  ok(at("every svg fits inside its parent"), svgs.every((s) => s.over <= 1),
     svgs.filter((s) => s.over > 1).map((s) => `${s.cls} +${s.over}px`).join("; "));

  // 3. Geometry sweep across scroll
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
  ok(at("no NaN, undefined or negative geometry across scroll positions"), sweep.length === 0, sweep.join("; "));

  // 4. Rendered maths
  const math = await page.evaluate(() => ({
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 3),
    rendered: document.querySelectorAll(".katex").length,
  }));
  ok(at("no unrendered LaTeX in the text"), math.raw.length === 0, math.raw.join(" "));
  ok(at("KaTeX rendered equations properly"), math.rendered > 0, `${math.rendered} .katex nodes`);

  // 5. Title line wrap
  const title = await page.evaluate(() => {
    const h = document.querySelector("#intro-hed");
    const range = document.createRange();
    range.selectNodeContents(h);
    return Math.max(...[...range.getClientRects()].map((r) => r.width));
  });
  ok(at("title widest line fits viewport"), title <= vp.width - 2,
     `widest line ${Math.round(title)}px in ${vp.width}px`);

  // 6. Text glued checks
  const glued = await page.evaluate(() =>
    (document.body.innerText.match(/[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/g) || []).slice(0, 3)
  );
  ok(at("no text glued to a separator or a word"), glued.length === 0, glued.join(" "));

  // === Article specific: supply-and-demand ===================================
  // A. Check required series classes
  const classesCheck = await page.evaluate(() => ({
    hasDemand: !!document.querySelector(".line.demand"),
    hasSupply: !!document.querySelector(".line.supply"),
    hasFit: !!document.querySelector(".line.fit"),
    hasReverse: !!document.querySelector(".line.reverse"),
    hasObs: document.querySelectorAll(".dot.obs").length > 0,
  }));
  ok(at("all required SVG series classes exist in DOM"),
     classesCheck.hasDemand && classesCheck.hasSupply && classesCheck.hasFit && classesCheck.hasReverse && classesCheck.hasObs);

  // B. Geometry Assertion via getScreenCTM() in CloudLab:
  // At w = 0, every point lies on the demand line (< 0.5px)
  await page.locator("#cloud-lab button:has-text('Supply shocks only')").click();
  await page.waitForTimeout(100);

  const geomW0 = await page.evaluate(() => {
    const lab = document.querySelector("#cloud-lab");
    const svg = lab.querySelector("svg");
    const ctm = svg.getScreenCTM();
    const dots = [...lab.querySelectorAll(".dot.obs")];
    const demandPath = lab.querySelector(".line.demand");

    // Parse demand line endpoints from path 'M x1 y1 L x2 y2'
    const d = demandPath.getAttribute("d").split(/[ML\s]+/).filter(Boolean).map(Number);
    const p1 = new DOMPoint(d[0], d[1]).matrixTransform(ctm);
    const p2 = new DOMPoint(d[2], d[3]).matrixTransform(ctm);

    // Line distance function in screen pixels: |(y2-y1)x0 - (x2-x1)y0 + x2*y1 - y2*x1| / hypot(x2-x1, y2-y1)
    const A = p2.y - p1.y;
    const B = p1.x - p2.x;
    const C = p2.x * p1.y - p2.y * p1.x;
    const den = Math.hypot(A, B);

    let maxDist = 0;
    for (const dot of dots) {
      const pt = new DOMPoint(+dot.getAttribute("cx"), +dot.getAttribute("cy")).matrixTransform(ctm);
      const dist = Math.abs(A * pt.x + B * pt.y + C) / den;
      if (dist > maxDist) maxDist = dist;
    }
    return { maxDist };
  });
  ok(at("at w = 0, every observation lies on the demand line to < 0.5px"),
     geomW0.maxDist < 0.5, `max distance ${geomW0.maxDist.toFixed(3)}px`);

  // At w = 1, every point lies on the supply line (< 0.5px) and mean distance to demand line > 10px
  await page.locator("#cloud-lab button:has-text('Demand shocks only')").click();
  await page.waitForTimeout(100);

  const geomW1 = await page.evaluate(() => {
    const lab = document.querySelector("#cloud-lab");
    const svg = lab.querySelector("svg");
    const ctm = svg.getScreenCTM();
    const dots = [...lab.querySelectorAll(".dot.obs")];
    const supplyPath = lab.querySelector(".line.supply");
    const demandPath = lab.querySelector(".line.demand");

    const sD = supplyPath.getAttribute("d").split(/[ML\s]+/).filter(Boolean).map(Number);
    const sp1 = new DOMPoint(sD[0], sD[1]).matrixTransform(ctm);
    const sp2 = new DOMPoint(sD[2], sD[3]).matrixTransform(ctm);
    const sA = sp2.y - sp1.y, sB = sp1.x - sp2.x, sC = sp2.x * sp1.y - sp2.y * sp1.x;
    const sDen = Math.hypot(sA, sB);

    const dD = demandPath.getAttribute("d").split(/[ML\s]+/).filter(Boolean).map(Number);
    const dp1 = new DOMPoint(dD[0], dD[1]).matrixTransform(ctm);
    const dp2 = new DOMPoint(dD[2], dD[3]).matrixTransform(ctm);
    const dA = dp2.y - dp1.y, dB = dp1.x - dp2.x, dC = dp2.x * dp1.y - dp2.y * dp1.x;
    const dDen = Math.hypot(dA, dB);

    let maxDistSupply = 0, sumDistDemand = 0;
    for (const dot of dots) {
      const pt = new DOMPoint(+dot.getAttribute("cx"), +dot.getAttribute("cy")).matrixTransform(ctm);
      const dS = Math.abs(sA * pt.x + sB * pt.y + sC) / sDen;
      const dD = Math.abs(dA * pt.x + dB * pt.y + dC) / dDen;
      if (dS > maxDistSupply) maxDistSupply = dS;
      sumDistDemand += dD;
    }
    return { maxDistSupply, meanDistDemand: sumDistDemand / dots.length };
  });
  ok(at("at w = 1, every observation lies on the supply line to < 0.5px"),
     geomW1.maxDistSupply < 0.5, `max distance ${geomW1.maxDistSupply.toFixed(3)}px`);
  ok(at("at w = 1, mean distance to demand line exceeds 10px"),
     geomW1.meanDistDemand > 10, `mean distance ${geomW1.meanDistDemand.toFixed(1)}px`);

  // C. BracketFigure readouts agreement
  const bracketReadouts = await page.evaluate(() => {
    const fig = document.querySelector("#bracket-figure");
    const ratioText = fig.querySelector(".ratio-val")?.textContent || "";
    const invR2Text = fig.querySelector(".invr2-val")?.textContent || "";
    return {
      ratio: parseFloat(ratioText),
      invR2: parseFloat(invR2Text),
    };
  });
  ok(at("BracketFigure ratio and 1/R2 agree to 3 decimal places"),
     Math.abs(bracketReadouts.ratio - bracketReadouts.invR2) < 0.005,
     `ratio: ${bracketReadouts.ratio}, 1/R2: ${bracketReadouts.invR2}`);

  // D. Reverse regression distinctness in BracketFigure
  const reverseCheck = await page.evaluate(() => {
    const fig = document.querySelector("#bracket-figure");
    const fit = fig.querySelector(".line.fit");
    const rev = fig.querySelector(".line.reverse");
    return {
      hasFit: !!fit,
      hasRev: !!rev,
      isDashed: rev?.getAttribute("stroke-dasharray") !== null,
      dFit: fit?.getAttribute("d"),
      dRev: rev?.getAttribute("d"),
    };
  });
  ok(at("reverse regression line is rendered and distinct from forward regression"),
     reverseCheck.hasFit && reverseCheck.hasRev && reverseCheck.isDashed && reverseCheck.dFit !== reverseCheck.dRev);

  // E. Mobile sticky controls check
  if (vp.width <= 700) {
    const stickyCheck = await page.evaluate(async () => {
      const lab = document.querySelector("#cloud-lab");
      lab.scrollIntoView();
      window.scrollBy(0, 300);
      await new Promise((r) => setTimeout(r, 50));
      const controls = lab.querySelector(".controls-bar");
      const rect = controls.getBoundingClientRect();
      return { top: Math.round(rect.top), isVisible: rect.top >= -5 && rect.bottom > 0 };
    });
    ok(at("controls bar sticks at top of viewport on mobile"), stickyCheck.isVisible, `top: ${stickyCheck.top}px`);
  }

  // F. Interactive guess in TheQuestion
  const questionCheck = await page.evaluate(async () => {
    const q = document.querySelector("#the-question");
    const commitBtn = q.querySelector(".commit-btn");
    commitBtn.click();
    await new Promise((r) => setTimeout(r, 50));
    const scoreReport = q.querySelector(".score-report");
    return { hasScore: !!scoreReport };
  });
  ok(at("committing a guess in TheQuestion reveals the score report"), questionCheck.hasScore);

  await page.close();
}

await browser.close();

console.log(`\nBrowser checks: ${pass} passed, ${fails.length} failed`);
if (fails.length > 0) {
  for (const f of fails) console.log(`  - ${f}`);
  process.exit(1);
}
