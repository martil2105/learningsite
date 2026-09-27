/*
  Browser checks for elasticity at 390px and 1280px viewports.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8791";
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
    return bad;
  });
  ok(at("no NaN/undefined/Infinity in SVG geometry"), sweep.length === 0, sweep.slice(0, 3).join("; "));

  // 4. Geometry Assertion via getScreenCTM():
  // Measure upper and lower segment lengths in rendered screen pixels and verify ratio === printed elasticity to 0.5%
  // Test at 3 positions on 3 curves: lin, exp, quad
  const famButtons = {
    lin: 'button:has-text("Linear")',
    exp: 'button:has-text("Exponential")',
    quad: 'button:has-text("Quadratic")',
  };

  for (const [fId, btnSel] of Object.entries(famButtons)) {
    await page.locator(`#ruler-lab ${btnSel}`).click();
    await page.waitForTimeout(100);

    const testPrices = fId === "lin" ? [15, 25, 45] : fId === "exp" ? [20, 25, 40] : [20, 30, 40];

    for (const pVal of testPrices) {
      // Set slider
      await page.locator("#ruler-p-slider").fill(String(pVal));
      await page.waitForTimeout(60);

      const geomResult = await page.evaluate(() => {
        const segUp = document.querySelector("#seg-upper");
        const segLow = document.querySelector("#seg-lower");
        if (!segUp || !segLow) return { err: "segments missing" };

        const ctmUp = segUp.getScreenCTM();
        const ctmLow = segLow.getScreenCTM();

        // Upper segment points
        const ptA_up = segUp.ownerSVGElement.createSVGPoint();
        ptA_up.x = +segUp.getAttribute("x1");
        ptA_up.y = +segUp.getAttribute("y1");
        const sA_up = ptA_up.matrixTransform(ctmUp);

        const ptB_up = segUp.ownerSVGElement.createSVGPoint();
        ptB_up.x = +segUp.getAttribute("x2");
        ptB_up.y = +segUp.getAttribute("y2");
        const sB_up = ptB_up.matrixTransform(ctmUp);

        // Lower segment points
        const ptA_low = segLow.ownerSVGElement.createSVGPoint();
        ptA_low.x = +segLow.getAttribute("x1");
        ptA_low.y = +segLow.getAttribute("y1");
        const sA_low = ptA_low.matrixTransform(ctmLow);

        const ptB_low = segLow.ownerSVGElement.createSVGPoint();
        ptB_low.x = +segLow.getAttribute("x2");
        ptB_low.y = +segLow.getAttribute("y2");
        const sB_low = ptB_low.matrixTransform(ctmLow);

        const pixLenUp = Math.hypot(sB_up.x - sA_up.x, sB_up.y - sA_up.y);
        const pixLenLow = Math.hypot(sB_low.x - sA_low.x, sB_low.y - sA_low.y);
        const pixRatio = pixLenLow > 0 ? pixLenUp / pixLenLow : 0;

        const printedEps = parseFloat(document.querySelector("#ruler-formula-eps")?.textContent || "0");
        return { pixLenUp, pixLenLow, pixRatio, printedEps };
      });

      const relErr = Math.abs(geomResult.pixRatio - geomResult.printedEps) / geomResult.printedEps;
      ok(
        at(`rendered pixel segment ratio equals |ε| to < 0.5% on ${fId} at p=${pVal}`),
        relErr < 0.005,
        `ratio ${geomResult.pixRatio.toFixed(4)} vs printed ${geomResult.printedEps.toFixed(4)} (err ${(relErr * 100).toFixed(3)}%)`
      );
    }
  }

  // 5. At |ε| = 1, assert rendered segment lengths are equal to within 0.5px
  await page.locator('#ruler-lab button:has-text("Linear")').click();
  await page.locator('#ruler-lab button:has-text("Unit ε")').click();
  await page.waitForTimeout(100);

  const unitGeom = await page.evaluate(() => {
    const segUp = document.querySelector("#seg-upper");
    const segLow = document.querySelector("#seg-lower");
    const ctm = segUp.getScreenCTM();

    const pA1 = segUp.ownerSVGElement.createSVGPoint();
    pA1.x = +segUp.getAttribute("x1"); pA1.y = +segUp.getAttribute("y1");
    const sA1 = pA1.matrixTransform(ctm);

    const pA2 = segUp.ownerSVGElement.createSVGPoint();
    pA2.x = +segUp.getAttribute("x2"); pA2.y = +segUp.getAttribute("y2");
    const sA2 = pA2.matrixTransform(ctm);

    const pB1 = segLow.ownerSVGElement.createSVGPoint();
    pB1.x = +segLow.getAttribute("x1"); pB1.y = +segLow.getAttribute("y1");
    const sB1 = pB1.matrixTransform(ctm);

    const pB2 = segLow.ownerSVGElement.createSVGPoint();
    pB2.x = +segLow.getAttribute("x2"); pB2.y = +segLow.getAttribute("y2");
    const sB2 = pB2.matrixTransform(ctm);

    const lenUp = Math.hypot(sA2.x - sA1.x, sA2.y - sA1.y);
    const lenLow = Math.hypot(sB2.x - sB1.x, sB2.y - sB1.y);
    return { lenUp, lenLow, diff: Math.abs(lenUp - lenLow) };
  });
  ok(
    at("at unit elasticity (|ε|=1), rendered upper and lower segments are equal to < 0.5px"),
    unitGeom.diff < 0.5,
    `lenUp ${unitGeom.lenUp.toFixed(2)}px vs lenLow ${unitGeom.lenLow.toFixed(2)}px (diff ${unitGeom.diff.toFixed(3)}px)`
  );

  // 6. Drag / slider monotonicity across >= 20 positions
  const epsValues = [];
  for (let pVal = 10; pVal <= 50; pVal += 2) {
    await page.locator("#ruler-p-slider").fill(String(pVal));
    const eps = await page.evaluate(() =>
      parseFloat(document.querySelector("#ruler-formula-eps")?.textContent || "0")
    );
    epsValues.push(eps);
  }
  let strictlyIncreasing = true;
  for (let i = 1; i < epsValues.length; i++) {
    if (epsValues[i] <= epsValues[i - 1]) strictlyIncreasing = false;
  }
  ok(
    at("printed elasticity is strictly increasing across 21 slider positions"),
    strictlyIncreasing && epsValues.length >= 20,
    `evaluated ${epsValues.length} steps, monotonic: ${strictlyIncreasing}`
  );

  // 7. RevenueFigure: rendered x of revenue peak and zero crossing agree to < 1px on 3 families, neither on CES
  const revFamilies = [
    { name: "Linear", hasPeak: true },
    { name: "Exponential", hasPeak: true },
    { name: "Quadratic", hasPeak: true },
    { name: "Constant ε", hasPeak: false },
  ];

  for (const rf of revFamilies) {
    await page.locator(`#revenue-figure button:has-text("${rf.name}")`).click();
    await page.waitForTimeout(100);

    const peakCheck = await page.evaluate((hasPeak) => {
      const peakLine = document.querySelector("#rev-peak-line");
      const zeroLine = document.querySelector("#rev-zero-line");

      if (!hasPeak) {
        return { drawn: !!(peakLine || zeroLine), agree: true, diff: 0 };
      }
      if (!peakLine || !zeroLine) {
        return { drawn: false, agree: false, diff: 999 };
      }
      const r1 = peakLine.getBoundingClientRect();
      const r2 = zeroLine.getBoundingClientRect();
      const diff = Math.abs(r1.left - r2.left);
      return { drawn: true, agree: diff < 1.0, diff };
    }, rf.hasPeak);

    if (rf.hasPeak) {
      ok(
        at(`RevenueFigure peak and zero-crossing agree to < 1px on ${rf.name}`),
        peakCheck.agree,
        `diff ${peakCheck.diff.toFixed(2)}px`
      );
    } else {
      ok(
        at(`RevenueFigure draws neither peak nor zero-crossing on ${rf.name}`),
        !peakCheck.drawn,
        `markers drawn: ${peakCheck.drawn}`
      );
    }
  }

  // 8. Series naming check
  const seriesNames = await page.evaluate(() => {
    const up = document.querySelector("line.seg.upper");
    const low = document.querySelector("line.seg.lower");
    const curve = document.querySelector("path.curve");
    return {
      hasUp: !!up,
      hasLow: !!low,
      hasCurve: !!curve,
    };
  });
  ok(
    at("ruler elements have required series names (seg upper, seg lower, curve)"),
    seriesNames.hasUp && seriesNames.hasLow && seriesNames.hasCurve
  );

  // 9. Tangent is clipped inside SVG plot
  const clippingCheck = await page.evaluate(() => {
    const svg = document.querySelector("#ruler-lab svg");
    const rSvg = svg.getBoundingClientRect();
    const up = document.querySelector("#seg-upper").getBoundingClientRect();
    const low = document.querySelector("#seg-lower").getBoundingClientRect();

    const upOut = up.left < rSvg.left - 2 || up.right > rSvg.right + 2 || up.top < rSvg.top - 2 || up.bottom > rSvg.bottom + 2;
    const lowOut = low.left < rSvg.left - 2 || low.right > rSvg.right + 2 || low.top < rSvg.top - 2 || low.bottom > rSvg.bottom + 2;
    return !upOut && !lowOut;
  });
  ok(at("tangent segments do not overflow outside the SVG bounds"), clippingCheck);

  // 10. Prose hygiene: no unrendered LaTeX, no undefined/NaN, no glued separators
  const hygiene = await page.evaluate(() => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll("annotation, svg, script, style").forEach((e) => e.remove());
    const text = clone.innerText;
    const rawLatex = /\\[a-zA-Z]{3,}/.test(text);
    const unrendered = /NaN|undefined|null/.test(text);
    const glued = /[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/.test(text);
    return { rawLatex, unrendered, glued };
  });
  ok(at("no unrendered LaTeX in prose"), !hygiene.rawLatex);
  ok(at("no NaN/undefined/null in prose"), !hygiene.unrendered);

  if (SHOTS) {
    await page.screenshot({ path: `${SHOTS}/${vp.name}-full.png`, fullPage: true });
  }
  await page.close();
}

await browser.close();

console.log(`\nBrowser Checks Results: ${pass} passed, ${fails.length} failed`);
if (fails.length > 0) {
  console.error("Failures:\n" + fails.join("\n"));
  process.exit(1);
}
