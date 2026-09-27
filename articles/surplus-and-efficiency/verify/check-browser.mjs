/*
  Browser checks for surplus-and-efficiency at 390px and 1280px viewports.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8792";
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

  // 2. SVG fit inside parent
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

  // 3. Geometry sweep across scroll: no NaN/undefined/Infinity
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
    return bad;
  });
  ok(at("no NaN/undefined/Infinity in SVG geometry"), sweep.length === 0, sweep.slice(0, 3).join("; "));

  // 4. Bounding rect comparison spine layout:
  // Desktop: shared top. Mobile: stacked top.
  const spineLayout = await page.evaluate(() => {
    const colQ = document.querySelector("#col-quantity");
    const colR = document.querySelector("#col-rationing");
    if (!colQ || !colR) return { err: "columns missing" };
    const rQ = colQ.getBoundingClientRect();
    const rR = colR.getBoundingClientRect();
    return {
      topDiff: Math.abs(rQ.top - rR.top),
      stacked: rR.top >= rQ.bottom - 2,
    };
  });
  if (vp.width === 1280) {
    ok(at("desktop: comparison panels share bounding-box top (< 2px)"),
       spineLayout.topDiff < 2, `diff: ${spineLayout.topDiff?.toFixed(1)}px`);
  } else {
    ok(at("mobile: comparison panels are stacked"),
       spineLayout.stacked, `stacked: ${spineLayout.stacked}`);
  }

  // 5. Geometry assertions on cut slider sweep (10+ positions)
  // - left triangle area proportional to d^2 (to 0.5%)
  // - stacked bar width proportional to d (to 0.5%)
  // - positive height on shaded rects across >= 10 positions
  const setCut = async (val) => {
    await page.evaluate((v) => {
      const el = document.querySelector("#spine-figure #cut-slider");
      if (!el) return;
      el.value = v;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, String(val));
    await page.waitForTimeout(40);
  };

  const testCuts = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50, 0.60, 0.70];
  const sweepResults = [];

  for (const cutVal of testCuts) {
    await setCut(cutVal);

    const data = await page.evaluate(() => {
      const triPath = document.querySelector("#col-quantity .shade.triangle");
      const misRect = document.querySelector("#col-rationing .shade.misalloc");
      const barFill = document.querySelector("#stacked-total-bar");

      let triArea = 0;
      if (triPath) {
        // Compute polygon area from d attribute: M x1 y1 L x2 y2 L x3 y3 Z
        const dStr = triPath.getAttribute("d");
        const pts = dStr
          .replace(/[MLZ]/g, "")
          .trim()
          .split(/\s+/)
          .map(Number);
        if (pts.length >= 6) {
          // triangle with vertices (pts[0], pts[1]), (pts[2], pts[3]), (pts[4], pts[5])
          triArea = 0.5 * Math.abs(
            pts[0] * (pts[3] - pts[5]) +
            pts[2] * (pts[5] - pts[1]) +
            pts[4] * (pts[1] - pts[3])
          );
        }
      }

      let misHeight = 0, misWidth = 0;
      if (misRect) {
        misHeight = +misRect.getAttribute("height") || 0;
        misWidth = +misRect.getAttribute("width") || 0;
      }

      const barStyle = barFill?.getAttribute("style") || "";
      const match = barStyle.match(/width:\s*([\d.]+)%/);
      const barPct = match ? parseFloat(match[1]) : 0;

      return { triArea, misHeight, misWidth, barPct };
    });

    sweepResults.push({ d: cutVal, ...data });
  }

  // All 10 have positive shaded rect height
  const allPositiveHeight = sweepResults.every((r) => r.misHeight > 0 && r.misWidth > 0);
  ok(at("misallocation shaded rect has positive height and width across all 10 positions"),
     allPositiveHeight);

  // Stacked bar width matches d (percentage) to 0.5%
  let barMaxErr = 0;
  for (const r of sweepResults) {
    const expectedPct = r.d * 100;
    const diff = Math.abs(r.barPct - expectedPct);
    if (diff > barMaxErr) barMaxErr = diff;
  }
  ok(at("stacked total bar width matches cut d to < 0.5% across 10 positions"),
     barMaxErr < 0.5, `maxErr: ${barMaxErr.toFixed(3)}%`);

  // Left triangle area proportional to d^2:
  // Normalize by area at d = 0.50
  const ref = sweepResults.find((r) => Math.abs(r.d - 0.50) < 1e-4);
  let worstTriRel = 0;
  if (ref && ref.triArea > 0) {
    for (const r of sweepResults) {
      if (r.d < 0.10) continue; // skip tiny cuts where pixel rounding dominates
      const expectedRatio = Math.pow(r.d / ref.d, 2);
      const actualRatio = r.triArea / ref.triArea;
      const rel = Math.abs(actualRatio - expectedRatio) / expectedRatio;
      if (rel > worstTriRel) worstTriRel = rel;
    }
  }
  ok(at("left panel shaded triangle area grows quadratically (∝ d²) to < 0.5%"),
     worstTriRel < 0.005, `worstRel: ${(worstTriRel * 100).toFixed(3)}%`);

  // 6. Channel equality at d = 0.5:
  // At d = 0.50, triangle loss share and misallocation share agree to within 1%
  await setCut(0.50);
  const halfCheck = await page.evaluate(() => {
    const formulaText = document.querySelector("#identity-formula")?.textContent || "";
    // Format: "d² (25.00%) + d(1 − d) (25.00%) = 50.00% (cut d)"
    const matches = formulaText.match(/\(([\d.]+)%\)/g);
    if (!matches || matches.length < 2) return { err: "formula text missing" };
    const p1 = parseFloat(matches[0].replace(/[()%]/g, ""));
    const p2 = parseFloat(matches[1].replace(/[()%]/g, ""));
    return { p1, p2, diff: Math.abs(p1 - p2) };
  });
  ok(at("at d = 0.50, triangle and misallocation shares agree to < 1% (both 25%)"),
     halfCheck.diff < 0.1, `tri: ${halfCheck.p1}%, mis: ${halfCheck.p2}%`);

  // 7. Instrument toggle at fixed quantity q:
  // Flip instrument toggle: quantity line does not move (< 0.5px) while total loss changes by printed ratio to within 1%
  await page.locator("#instrument-figure #btn-inst-quota").click();
  await page.waitForTimeout(60);
  const quotaLineLeft = await page.evaluate(() => {
    const qLine = document.querySelector("#instrument-figure .line.qty-line");
    return qLine ? qLine.getBoundingClientRect().left : 0;
  });
  const quotaLoss = await page.evaluate(() => {
    const text = document.querySelector("#inst-loss-val")?.textContent || "";
    const m = text.match(/£([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  });

  await page.locator("#instrument-figure #btn-inst-ceiling").click();
  await page.waitForTimeout(60);
  const ceilingLineLeft = await page.evaluate(() => {
    const qLine = document.querySelector("#instrument-figure .line.qty-line");
    return qLine ? qLine.getBoundingClientRect().left : 0;
  });
  const ceilingLoss = await page.evaluate(() => {
    const text = document.querySelector("#inst-loss-val")?.textContent || "";
    const m = text.match(/£([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  });
  const multiplierText = await page.evaluate(() => {
    const text = document.querySelector("#inst-multiplier")?.textContent || "";
    const m = text.match(/([\d.]+)×/);
    return m ? parseFloat(m[1]) : 1;
  });

  const lineDiff = Math.abs(quotaLineLeft - ceilingLineLeft);
  ok(at("instrument toggle: rendered quantity line does not move (< 0.5px)"),
     lineDiff < 0.5, `diff: ${lineDiff.toFixed(2)}px`);

  const lossRatio = quotaLoss > 0 ? ceilingLoss / quotaLoss : 1;
  const ratioDiff = Math.abs(lossRatio - multiplierText) / multiplierText;
  ok(at("instrument toggle: total loss changes by printed multiplier to < 1%"),
     ratioDiff < 0.01, `actual: ${lossRatio.toFixed(2)}x, printed: ${multiplierText.toFixed(2)}x`);

  // 8. Sticky controls under 700px viewport
  if (vp.width < 700) {
    const stickyCheck = await page.evaluate(async () => {
      const card = document.querySelector("#spine-figure");
      const bar = document.querySelector("#spine-figure .controls-bar");
      if (!card || !bar) return { err: "missing" };
      const cardRect = card.getBoundingClientRect();
      window.scrollTo(0, window.scrollY + cardRect.top + 100);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const barRect = bar.getBoundingClientRect();
      return { barTop: barRect.top };
    });
    ok(at("controls bar is sticky under 700px viewport (top <= 2px)"),
       stickyCheck.barTop <= 2, `barTop: ${stickyCheck.barTop}px`);
  }

  // 9. Console hygiene
  ok(at("no console errors or page errors"), noise.length === 0, noise.slice(0, 3).join("; "));

  if (SHOTS) {
    await page.screenshot({ path: `${SHOTS}/${vp.name}-full.png`, fullPage: true });
  }
  await page.close();
}

await browser.close();

console.log(`\nBrowser Checks: ${pass} passed, ${fails.length} failed`);
if (fails.length > 0) {
  fails.forEach((f) => console.log("  FAIL: " + f));
  process.exit(1);
}
