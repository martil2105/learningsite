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
  }));
  ok(at("no unrendered LaTeX in the text"), math.raw.length === 0, math.raw.join(" "));
  ok(at("KaTeX actually rendered something"), math.rendered > 0, `${math.rendered} .katex nodes`);

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

  // --- all seven figures arrive, and each one is drawn into a viewBox
  const figs = await page.evaluate(() => {
    const want = ["frontier", "indifference", "tangency", "wagelab",
                  "decomposition", "sigmaline", "subsistence"];
    const missing = want.filter((id) => !document.getElementById(id));
    const noBox = [...document.querySelectorAll(".fig svg")]
      .filter((s) => !s.getAttribute("viewBox")).length;
    return { missing, noBox, n: document.querySelectorAll(".fig").length };
  });
  ok(at("every figure the article names is on the page"), figs.missing.length === 0,
     figs.missing.join(", "));
  ok(at("every figure svg has a viewBox"), figs.noBox === 0, `${figs.noBox} without one`);

  // --- THE assertion this file exists for -----------------------------------
  // The article's claim is that at sigma = 1 the wage does not move the working
  // day. The locus is every optimum over the whole wage range, so that claim is
  // "this path is vertical" — asserted here in RENDERED pixels, which runs the
  // closed form, the scale, the viewBox and the margins through one
  // measurement. Then the handle must sit on it, and on the frontier.
  const lab = async () =>
    page.evaluate(() => {
      const svg = document.querySelector("#wagelab svg");
      const m = svg.getScreenCTM();
      const P = (x, y) => {
        const p = new DOMPoint(x, y).matrixTransform(m);
        return [p.x, p.y];
      };
      const parse = (sel) =>
        [...document.querySelector(sel).getAttribute("d").matchAll(/(-?[\d.]+)\s+(-?[\d.]+)/g)]
          .map((g) => P(+g[1], +g[2]));
      const locus = parse("#wagelab path.locus");
      const front = parse("#wagelab path.model");
      const dot = svg.querySelector("circle.handle");
      const h = P(+dot.getAttribute("cx"), +dot.getAttribute("cy"));
      const xs = locus.map((p) => p[0]);
      const o = front[0], e = front[front.length - 1];
      const len = Math.hypot(e[0] - o[0], e[1] - o[1]);
      const cross = (e[0] - o[0]) * (h[1] - o[1]) - (e[1] - o[1]) * (h[0] - o[0]);
      return {
        spread: Math.max(...xs) - Math.min(...xs),
        onFrontier: Math.abs(cross) / len,
        offLocus: Math.abs(h[0] - xs[0]),
        handleY: h[1],
        title: document.querySelector("#wagelab .fig-title").textContent,
      };
    });

  const l0 = await lab();
  ok(at("at sigma = 1 the locus of optima is vertical in rendered pixels"),
     l0.spread < 0.35, `spans ${l0.spread.toFixed(3)}px horizontally`);
  ok(at("the optimum sits on the drawn frontier"), l0.onFrontier < 0.3,
     `${l0.onFrontier.toFixed(3)}px off`);
  ok(at("the optimum sits on its own locus"), l0.offLocus < 0.35,
     `${l0.offLocus.toFixed(3)}px off`);
  ok(at("the lab's readout names the eight-hour day and a zero spread"),
     /8\.00 hours/.test(l0.title) && /move by 0\.00 of an hour/.test(l0.title),
     l0.title.slice(0, 120));

  // --- and it survives interaction: the wage moves, the working day does not
  await page.locator("#wagelab .plot").focus();
  for (let i = 0; i < 12; i++) await page.keyboard.press("ArrowUp");
  const l1 = await lab();
  ok(at("the arrow keys actually raise the wage"), l1.handleY < l0.handleY - 4,
     `handle y ${l0.handleY.toFixed(1)} → ${l1.handleY.toFixed(1)}`);
  ok(at("and the optimum does not move sideways while it happens"),
     Math.abs(l1.offLocus) < 0.35 && l1.spread < 0.35,
     `off locus ${l1.offLocus.toFixed(3)}px, spread ${l1.spread.toFixed(3)}px`);
  ok(at("the readout still says eight hours after the wage has moved"),
     /8\.00 hours/.test(l1.title), l1.title.slice(0, 120));

  // --- the check is not vacuous: off the knife-edge the locus really does bend
  await page.locator("#wagelab .presets button", { hasText: "σ = 2" }).click();
  await page.waitForTimeout(120);
  const l2 = await lab();
  ok(at("at sigma = 2 the same locus is visibly not vertical"), l2.spread > 5,
     `spans only ${l2.spread.toFixed(2)}px`);
  ok(at("the optimum is still on the frontier off the knife-edge"), l2.onFrontier < 0.3,
     `${l2.onFrontier.toFixed(3)}px off`);
  await page.locator("#wagelab .presets button", { hasText: "σ = 1" }).click();

  // --- the identity, in rendered pixels: the solved points lie on the line the
  //     closed form draws. Same shape of assertion, different claim.
  const fan = await page.evaluate(() => {
    const svg = document.querySelector("#sigmaline svg");
    const m = svg.getScreenCTM();
    const P = (x, y) => {
      const p = new DOMPoint(x, y).matrixTransform(m);
      return [p.x, p.y];
    };
    const line = [...svg.querySelector("path.model").getAttribute("d")
      .matchAll(/(-?[\d.]+)\s+(-?[\d.]+)/g)].map((g) => P(+g[1], +g[2]));
    const o = line[0], e = line[line.length - 1];
    const len = Math.hypot(e[0] - o[0], e[1] - o[1]);
    let worst = 0;
    for (const c of svg.querySelectorAll("circle")) {
      const h = P(+c.getAttribute("cx"), +c.getAttribute("cy"));
      const cross = (e[0] - o[0]) * (h[1] - o[1]) - (e[1] - o[1]) * (h[0] - o[0]);
      worst = Math.max(worst, Math.abs(cross) / len);
    }
    return { worst, n: svg.querySelectorAll("circle").length };
  });
  ok(at("every solved point lies on the closed-form line"), fan.worst < 0.35 && fan.n > 20,
     `${fan.n} points, worst ${fan.worst.toFixed(3)}px off`);

  // --- the subsistence curve approaches the floor and never crosses it.
  //     The first version of this check selected the FIRST .curve, which is the
  //     sigma = 0.5 contrast curve — and that one is supposed to fall through
  //     the floor, so the check was asserting the opposite of the figure's
  //     point. Both curves are now named.
  const floor = await page.evaluate(() => {
    const svg = document.querySelector("#subsistence svg");
    const ys = (el) => [...el.getAttribute("d").matchAll(/(-?[\d.]+)\s+(-?[\d.]+)/g)].map((g) => +g[2]);
    const floorY = ys(svg.querySelector("path.floor"))[0];
    const sg = ys(svg.querySelector("path.sg"));
    const ces = ys(svg.querySelector("path.ces"));
    return {
      floorY,
      below: sg.filter((y) => y > floorY + 0.5).length,
      gap: Math.min(...sg.map((y) => floorY - y)),
      cesBelow: ces.filter((y) => y > floorY + 0.5).length,
    };
  });
  ok(at("the subsistence curve never drops below the eight-hour floor"), floor.below === 0,
     `${floor.below} points below it`);
  ok(at("and it does get close to it"), floor.gap < 12,
     `closest approach ${floor.gap.toFixed(1)}px`);
  ok(at("while the constant-sigma curve does fall through the floor, as the figure claims"),
     floor.cesBelow > 20, `only ${floor.cesBelow} points below it`);

  // --- the furniture: a conclusion ending "Thanks for reading!", then the sources
  const furniture = await page.evaluate(() => ({
    thanks: [...document.querySelectorAll("#conclusion p")].some((p) => p.textContent.trim() === "Thanks for reading!"),
    sources: document.querySelectorAll("#resources .resources-list li").length,
    order: !!document.querySelector("#conclusion ~ #resources"),
  }));
  ok(at('the conclusion ends with "Thanks for reading!" and the sources follow it'),
     furniture.thanks && furniture.order && furniture.sources >= 5, JSON.stringify(furniture));

  ok(at("no console errors, warnings or page errors"), noise.length === 0, noise.slice(0, 3).join(" | "));


  if (SHOTS) {
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
    await page.locator("#wagelab").screenshot({ path: `${SHOTS}/${vp.name}-wagelab.png` });
    await page.locator("#tangency").screenshot({ path: `${SHOTS}/${vp.name}-tangency.png` });
    await page.locator("#decomposition").screenshot({ path: `${SHOTS}/${vp.name}-decomposition.png` });
    await page.locator("#sigmaline").screenshot({ path: `${SHOTS}/${vp.name}-sigmaline.png` });
    await page.locator("#subsistence").screenshot({ path: `${SHOTS}/${vp.name}-subsistence.png` });
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
