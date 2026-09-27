/*
  Browser checks for unemployment-flows, two viewports, run against a build that
  ./verify/ship.sh has proved is the current one.

  The generic half is every article's: no sideways scroll (naming the offender),
  every svg inside its parent, no NaN geometry at any scroll position, KaTeX
  rendered, the title's lines inside the screen, nothing glued together.

  The article-specific half defends the figures' claims in rendered pixels:
    - the two towns' duration bars sum to one, side by side on a desktop;
    - the flows cross where the ring is, and at the same place in both towns;
    - in the lab the point sits on its own ray, both towns share the 6% ray,
      and the two Eastport shocks share one ray;
    - in the run, both shocks end on the same rate and only one raises layoffs.

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

  // --- two towns --------------------------------------------------------------------
  const towns = await page.evaluate(() => [...document.querySelectorAll("#two-towns .town")].map((t) => ({
    top: Math.round(t.getBoundingClientRect().top),
    sum: [...t.querySelectorAll("rect.bin")].reduce((a, r) => a + +r.dataset.share, 0),
    last: +[...t.querySelectorAll("rect.bin")].at(-1).dataset.share,
  })));
  ok(at("each town's four bars sum to 100%"), towns.length === 2 && towns.every((t) => Math.abs(t.sum - 1) < 1e-12));
  ok(at("Millbrook's year-plus bar is 30.6%, Eastport's under 0.1%"), (towns[1].last * 100).toFixed(1) === "30.6" && towns[0].last < 0.001);
  if (vp.name === "desktop") ok(at("the two towns sit side by side"), towns[0].top === towns[1].top, `${towns[0].top}, ${towns[1].top}`);
  else ok(at("the two towns stack on a phone"), towns[1].top > towns[0].top + 100);

  // --- the flows cross at the ring --------------------------------------------------
  const cross = async () => page.evaluate(() => {
    const svg = document.querySelector("#flow-cross svg");
    const ring = svg.querySelector("circle.cross");
    const p = __P(ring, +ring.getAttribute("cx"), +ring.getAttribute("cy"));
    const mIn = svg.querySelector("circle.mk.in"), mOut = svg.querySelector("circle.mk.out");
    return {
      dIn: __lineDist(svg.querySelector("line.flow.in"), p), dOut: __lineDist(svg.querySelector("line.flow.out"), p), x: p[0],
      mIn: __lineDist(svg.querySelector("line.flow.in"), __P(mIn, +mIn.getAttribute("cx"), +mIn.getAttribute("cy"))),
      mOut: mOut ? __lineDist(svg.querySelector("line.flow.out"), __P(mOut, +mOut.getAttribute("cx"), +mOut.getAttribute("cy"))) : 0,
      t: document.querySelector("#flow-cross .fig-title").textContent,
    };
  });
  await page.locator("#flow-cross").scrollIntoViewIfNeeded();
  const cA = await cross();
  ok(at("Eastport: the ring sits on both flow lines"), cA.dIn < 0.5 && cA.dOut < 0.5, `${cA.dIn.toFixed(2)}, ${cA.dOut.toFixed(2)}`);
  ok(at("Eastport at 10%: more find jobs than lose them, so unemployment falls"), /so unemployment falls\./.test(cA.t), cA.t);
  ok(at("the markers sit on their lines"), cA.mIn < 0.5 && cA.mOut < 0.5);
  await page.locator("#flow-cross input[type=range]").fill("6");
  const c6 = await cross();
  ok(at("at 6% the verdict is balance"), /as many people find jobs each month as lose them \(28\.2 per 1,000 workers\)/.test(c6.t), c6.t);
  await page.locator("#flow-cross .pill", { hasText: "Millbrook" }).click();
  const cB = await cross();
  ok(at("Millbrook's flows cross at the same place, on both lines"), Math.abs(cB.x - cA.x) < 0.5 && cB.dIn < 0.5 && cB.dOut < 0.5, `${cA.x.toFixed(1)} vs ${cB.x.toFixed(1)}`);

  // --- the ratio lab ------------------------------------------------------------------
  const lab = async () => page.evaluate(() => {
    const svg = document.querySelector("#ratio-lab svg");
    const h = svg.querySelector("circle.handle");
    const p = __P(h, +h.getAttribute("cx"), +h.getAttribute("cy"));
    const own = svg.querySelector("line.own-ray");
    const e = __P(own, +own.getAttribute("x2"), +own.getAttribute("y2"));
    const o = __P(own, +own.getAttribute("x1"), +own.getAttribute("y1"));
    const six = [...svg.querySelectorAll("line.ray")][1];
    const s6 = __P(six, +six.getAttribute("x2"), +six.getAttribute("y2"));
    const ang = (a) => Math.atan2(-(a[1] - o[1]), a[0] - o[0]);
    return { onOwn: __lineDist(own, p), end: e, angOwn: ang(e), ang6: ang(s6), rate: document.querySelector("#ratio-lab .fact.rate b").textContent, p };
  });
  await page.locator("#ratio-lab").scrollIntoViewIfNeeded();
  const l0 = await lab();
  ok(at("lab opens on Eastport: 6.0%, on its own ray, and that ray is the 6% ray"), l0.rate === "6.0%" && l0.onOwn < 0.5 && Math.abs(l0.angOwn - l0.ang6) < 1e-3, `${l0.rate}, ${l0.onOwn.toFixed(2)}`);
  await page.locator("#ratio-lab .pill", { hasText: /^Millbrook$/ }).click();
  const l1 = await lab();
  ok(at("Millbrook: also 6.0%, also on the 6% ray"), l1.rate === "6.0%" && Math.abs(l1.angOwn - l1.ang6) < 1e-3);
  await page.locator("#ratio-lab .pill", { hasText: "layoffs double" }).click();
  const l2 = await lab();
  await page.locator("#ratio-lab .pill", { hasText: "hiring halves" }).click();
  const l3 = await lab();
  ok(at("the two Eastport shocks read 11.3% and share one ray"), l2.rate === "11.3%" && l3.rate === "11.3%" && Math.hypot(l2.end[0] - l3.end[0], l2.end[1] - l3.end[1]) < 0.5, `${l2.rate}, ${l3.rate}`);
  ok(at("…and the point is on that ray both times"), l2.onOwn < 0.5 && l3.onOwn < 0.5);
  await page.locator("#ratio-lab .plot").focus();
  for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowRight");
  const l4 = await lab();
  ok(at("arrow keys raise f, lower the rate, and keep the point on its ray"), parseFloat(l4.rate) < 11.3 && l4.onOwn < 0.5, `${l4.rate}`);
  const box = await page.locator("#ratio-lab svg").boundingBox();
  const target = { x: box.x + box.width * 0.55, y: box.y + box.height * 0.35 };
  await page.mouse.move(target.x, target.y);
  await page.mouse.down();
  await page.mouse.up();
  const l5 = await lab();
  ok(at("a click moves the point to the pointer, in screen pixels"), Math.hypot(l5.p[0] - target.x, l5.p[1] - target.y) < 2, `${l5.p.map((v) => v.toFixed(1))} vs ${target.x.toFixed(1)},${target.y.toFixed(1)}`);
  ok(at("…and it is still on its own ray"), l5.onOwn < 0.5);

  // --- the run ------------------------------------------------------------------------
  const run = async () => page.evaluate(() => {
    const u = [...document.querySelectorAll("#freeze-run circle.u-dot")].map((c) => ({ k: c.classList[1], u: +c.dataset.u, p: __P(c, +c.getAttribute("cx"), +c.getAttribute("cy")) }));
    const l = [...document.querySelectorAll("#freeze-run circle.l-dot")].map((c) => ({ k: c.classList[1], l: +c.dataset.l, p: __P(c, +c.getAttribute("cx"), +c.getAttribute("cy")) }));
    const before = document.querySelector("#freeze-run line.before");
    const by = __P(before, +before.getAttribute("x1"), +before.getAttribute("y1"))[1];
    return { u, l, by, t: document.querySelector("#freeze-run .fig-title").textContent };
  });
  await page.locator("#freeze-run").scrollIntoViewIfNeeded();
  const r0 = await run();
  ok(at("the run opens before the shock at 6.0% and 28.2 per 1,000"), /Before the shock: 6\.0% unemployed, and 28\.2 of every 1,000/.test(r0.t), r0.t);
  await page.locator("#freeze-run button.next").click();
  const r1 = await run();
  ok(at("month 1: layoffs doubled means 56.4 per 1,000 lose their job; hiring halved still 28.2"), /Hiring halved: [\d.]+% unemployed, 28\.2 per 1,000/.test(r1.t) && /Layoffs doubled: [\d.]+% unemployed, 56\.4 per 1,000/.test(r1.t), r1.t);
  await page.locator("#freeze-run input.scrub").fill("24");
  const r24 = await run();
  const uF = r24.u.find((d) => d.k === "freeze"), uL = r24.u.find((d) => d.k === "layoffs");
  const lF = r24.l.find((d) => d.k === "freeze"), lL = r24.l.find((d) => d.k === "layoffs");
  ok(at("month 24: both runs sit on the same rate, to a pixel"), Math.abs(uF.p[1] - uL.p[1]) < 1 && Math.abs(uF.u - 0.1132) < 1e-3, `${uF.u}, ${uL.u}`);
  ok(at("month 24: the freeze's layoffs sit below the old rate, the layoff shock's far above"), lF.p[1] > r24.by && lL.p[1] < r24.by - 20, `${lF.p[1].toFixed(1)}, ${lL.p[1].toFixed(1)}, ${r24.by.toFixed(1)}`);

  ok(at("no console errors, warnings or page errors"), noise.length === 0, noise.slice(0, 3).join(" | "));

  if (SHOTS) {
    await page.locator("#ratio-lab .pill", { hasText: /^Eastport$/ }).click();
    await page.locator("#flow-cross .pill", { hasText: "Eastport" }).click();
    await page.locator("#flow-cross input[type=range]").fill("10");
    await page.locator("#freeze-run input.scrub").fill("8");
    await page.locator("#two-towns").screenshot({ path: `${SHOTS}/${vp.name}-towns.png` });
    await page.locator("#flow-cross").screenshot({ path: `${SHOTS}/${vp.name}-flows.png` });
    await page.locator("#ratio-lab").screenshot({ path: `${SHOTS}/${vp.name}-lab.png` });
    await page.locator("#freeze-run").screenshot({ path: `${SHOTS}/${vp.name}-run.png` });
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
