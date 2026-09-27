/*
  Browser checks, two viewports, run against a build that ./verify/ship.sh has
  proved is the current one. Copy this into a new article and change the
  selectors; the generic half is what every article needs, and the one geometry
  assertion at the bottom is the half that pays for the file.

  Usage (in the container, after extracting the tarball ship.sh produced):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/shots node verify/check-browser.mjs
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

  // --- every svg fits its parent. body { overflow-x: hidden } means a clipped
  //     chart passes the page-level test above.
  const svgs = await page.evaluate(() =>
    [...document.querySelectorAll("svg")].map((s) => {
      const r = s.getBoundingClientRect();
      const p = s.parentElement.getBoundingClientRect();
      return { cls: s.parentElement.className || s.tagName, over: Math.max(0, Math.round(r.right - p.right), Math.round(p.left - r.left)) };
    })
  );
  ok(at("every svg fits inside its parent"), svgs.every((s) => s.over <= 1),
     svgs.filter((s) => s.over > 1).map((s) => `${s.cls} +${s.over}px`).join("; "));

  // --- no invalid geometry, swept across the scroll. NaN in a path `d` and a
  //     negative r render as nothing at all rather than as an error.
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
    // In a JS template literal "\;" is just ";", so a spacing command written
    // with one backslash reaches KaTeX as a literal semicolon. Nothing warns.
    lost: [...document.querySelectorAll(".katex annotation")].map((a) => a.textContent).filter((t) => /(^|[^\\]);/.test(t)).slice(0, 2),
  }));
  ok(at("no unrendered LaTeX in the text"), math.raw.length === 0, math.raw.join(" "));
  ok(at("KaTeX actually rendered something"), math.rendered > 0, `${math.rendered} .katex nodes`);
  ok(at("no KaTeX spacing command lost to a single-backslash escape"), math.lost.length === 0, math.lost.join(" | "));

  // --- the title's rendered LINES fit the screen. The h1 box is only the
  //     container width, so measuring the element proves nothing.
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

  // --- the scroll section is side by side on desktop and stacked on mobile
  const layout = await page.evaluate(() => {
    const s = document.querySelector(".sticky").getBoundingClientRect();
    const t = document.querySelector(".steps").getBoundingClientRect();
    return { stickyTop: s.top, stepsTop: t.top, stickyBottom: s.bottom };
  });
  if (vp.name === "desktop") {
    ok(at("figure and steps share a top when side by side"),
       Math.abs(layout.stickyTop - layout.stepsTop) <= 2,
       `${Math.round(layout.stickyTop)} vs ${Math.round(layout.stepsTop)}`);
  } else {
    ok(at("the steps fold below the figure on a phone"),
       layout.stepsTop > layout.stickyTop + 40,
       `${Math.round(layout.stickyTop)} vs ${Math.round(layout.stepsTop)}`);
  }

  // --- THE assertion this file exists for -----------------------------------
  // The handle is drawn from the same transform as the line, so it must land ON
  // the line in RENDERED pixels — which runs the scale, the viewBox and the
  // margin arithmetic through one measurement. Then the readout must agree with
  // where the line actually is: a chart contradicting its own caption is the
  // class of error every assertion but this one survives.
  const onTheLine = async () =>
    page.evaluate(() => {
      const svg = document.querySelector(".plot svg");
      const line = svg.querySelector("line.model");
      const dot = svg.querySelector("circle.handle");
      const m = svg.getScreenCTM();
      const P = (x, y) => {
        const p = new DOMPoint(x, y).matrixTransform(m);
        return [p.x, p.y];
      };
      const o = P(+line.getAttribute("x1"), +line.getAttribute("y1"));
      const e = P(+line.getAttribute("x2"), +line.getAttribute("y2"));
      const h = P(+dot.getAttribute("cx"), +dot.getAttribute("cy"));
      const len = Math.hypot(e[0] - o[0], e[1] - o[1]);
      const cross = (e[0] - o[0]) * (h[1] - o[1]) - (e[1] - o[1]) * (h[0] - o[0]);
      const text = document.querySelector(".fig-title").textContent;
      const nums = [...text.matchAll(/-?\d+\.?\d*/g)].map((x) => +x[0]);
      return { dist: Math.abs(cross) / len, slope: nums[0], xAt: nums[1], yAt: nums[2] };
    });

  const before = await onTheLine();
  ok(at("the handle sits on the drawn line"), before.dist < 0.25, `${before.dist.toFixed(3)}px off`);
  ok(at("the readout agrees with the geometry it describes"),
     Math.abs(before.slope * before.xAt - before.yAt) < 0.011,
     `${before.slope} × ${before.xAt} ≠ ${before.yAt}`);

  // --- and it survives interaction, which is where a stale helper used to show
  await page.locator(".plot").focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press("ArrowUp");
  const after = await onTheLine();
  ok(at("the arrow keys actually move the slope"), after.slope > before.slope,
     `${before.slope} → ${after.slope}`);
  ok(at("the handle is still on the line after interaction"), after.dist < 0.25, `${after.dist.toFixed(3)}px off`);
  ok(at("the readout still agrees after interaction"),
     Math.abs(after.slope * after.xAt - after.yAt) < 0.011,
     `${after.slope} × ${after.xAt} ≠ ${after.yAt}`);

  ok(at("no console errors, warnings or page errors"), noise.length === 0, noise.slice(0, 3).join(" | "));

  if (SHOTS) {
    await page.locator(".fig").screenshot({ path: `${SHOTS}/${vp.name}-lab.png` });
    await page.locator(".scrolly").screenshot({ path: `${SHOTS}/${vp.name}-scrolly.png` });
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
