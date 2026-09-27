/*
  Browser checks for money-creation, two viewports, run against a build that
  ./verify/ship.sh has proved is the current one.

  The generic half is every article's: no sideways scroll (naming the offender),
  every svg inside its parent, no NaN geometry at any scroll position, KaTeX
  rendered (and no spacing command lost to a JS escape), the title's lines
  inside the screen, nothing glued together.

  The article-specific half defends the figures' claims:
    - every balance sheet balances at every step, and the system totals are
      the ones the prose quotes;
    - in the lab Anchor's marker rides the drain line, and the banks' net
      flows sum to zero and agree with the marker;
    - in the multiplier table the measured ratio and the formula agree in every
      row, and the rounds marker sits on the cumulative curve.

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
  window.__eur = (t) => { const m = t.replace("−", "-").match(/(-?)€([\\d,]+(?:\\.\\d+)?)/); return m ? (m[1] ? -1 : 1) * +m[2].replace(/,/g, "") : NaN; };
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

  // --- the balance sheets --------------------------------------------------------------
  const sheets = async () => page.evaluate(() => {
    const out = {};
    for (const b of document.querySelectorAll("#balance-sheets .bank")) {
      const v = (sel) => __eur(b.querySelector(sel).textContent);
      out[b.dataset.bank] = {
        assets: v('[data-total="assets"] b'), liabilities: v('[data-total="liabilities"] b'),
        reserves: v('[data-item="reserves"] b'), bar: +b.querySelector("rect.res").getAttribute("width"),
      };
    }
    out.money = __eur(document.querySelector("#balance-sheets .t-money").textContent);
    out.reserves = __eur(document.querySelector("#balance-sheets .t-reserves").textContent);
    return out;
  });
  await page.locator("#balance-sheets").scrollIntoViewIfNeeded();
  const expectMoney = [1000, 1100, 1100, 1200, 1200];
  const balanced = [], moneyOK = [];
  const byStep = [];
  for (let i = 0; i <= 4; i++) {
    await page.locator(`#balance-sheets .step-pill[data-step="${i}"]`).click();
    const s = await sheets();
    byStep.push(s);
    balanced.push(["anchor", "birch", "cedar"].every((k) => Math.abs(s[k].assets - s[k].liabilities) < 1e-9));
    moneyOK.push(s.money === expectMoney[i] && s.reserves === 100);
  }
  ok(at("every balance sheet balances at every step"), balanced.every(Boolean), balanced.join(","));
  ok(at("money reads €1,000, €1,100, €1,100, €1,200, €1,200 and reserves stay at €100"), moneyOK.every(Boolean), byStep.map((s) => `${s.money}/${s.reserves}`).join(" "));
  ok(at("step 2: Anchor's reserves are gone, and its bar is empty"), byStep[2].anchor.reserves === 0 && byStep[2].anchor.bar === 0);
  ok(at("step 4: every bank is back to its opening reserves"), byStep[4].anchor.reserves === 50 && byStep[4].birch.reserves === 30 && byStep[4].cedar.reserves === 20);
  await page.locator("#balance-sheets button.next").isDisabled().then((d) => ok(at("the next button stops at the last step"), d));

  // --- the in-step lab ---------------------------------------------------------------------
  const lab = async () => page.evaluate(() => {
    const svg = document.querySelector("#in-step-lab svg.drain-panel");
    const mk = svg.querySelector("circle.drain-mk"), line = svg.querySelector("line.drain-line");
    const bars = [...document.querySelectorAll("#in-step-lab rect.flow-bar")].map((r) => ({ bank: r.dataset.bank, v: +r.dataset.value }));
    const zeroY = (() => { const g = [...svg.querySelectorAll("line.grid.zero")][0]; return __P(g, +g.getAttribute("x1"), +g.getAttribute("y1"))[1]; })();
    const end = __P(line, +line.getAttribute("x2"), +line.getAttribute("y2"));
    return {
      onLine: __lineDist(line, __P(mk, +mk.getAttribute("cx"), +mk.getAttribute("cy"))),
      mk: +mk.dataset.value, bars, sum: bars.reduce((a, b) => a + b.v, 0), endAtZero: Math.abs(end[1] - zeroY),
      t: document.querySelector("#in-step-lab .fig-title").textContent,
    };
  });
  await page.locator("#in-step-lab").scrollIntoViewIfNeeded();
  const l0 = await lab();
  ok(at("the lab opens with Anchor alone losing €50"), /Anchor loses €50 of reserves/.test(l0.t) && Math.abs(l0.mk + 50) < 1e-9, l0.t);
  ok(at("the marker rides the drain line, and the line ends at €0 when fully in step"), l0.onLine < 0.5 && l0.endAtZero < 0.5, `${l0.onLine.toFixed(2)}, ${l0.endAtZero.toFixed(2)}`);
  ok(at("the banks' net flows sum to zero and Anchor's bar is the marker's value"), Math.abs(l0.sum) < 1e-9 && Math.abs(l0.bars[0].v - l0.mk) < 1e-9);
  await page.locator("#in-step-lab input.phi").fill("40");
  const l1 = await lab();
  ok(at("40% in step: Anchor loses €30, still on the line, flows still sum to zero"), Math.abs(l1.mk + 30) < 1e-9 && l1.onLine < 0.5 && Math.abs(l1.sum) < 1e-9, `${l1.mk}`);
  await page.locator("#in-step-lab .pill", { hasText: "all lend in step" }).click();
  const l2 = await lab();
  ok(at("all in step: nobody loses reserves"), l2.bars.every((b) => Math.abs(b.v) < 1e-9) && /nobody loses reserves/.test(l2.t), l2.t);
  await page.locator("#in-step-lab .pill", { hasText: "Anchor lends alone" }).click();
  await page.locator("#in-step-lab input.share").fill("10");
  const l3 = await lab();
  ok(at("a bank with a tenth of the market, lending alone, loses €90"), Math.abs(l3.mk + 90) < 1e-9 && l3.onLine < 0.5 && Math.abs(l3.sum) < 1e-9, `${l3.mk}`);
  await page.locator("#in-step-lab input.share").fill("50");

  if (vp.name === "mobile") {
    await page.locator("#in-step-lab svg.flow-panel").scrollIntoViewIfNeeded();
    const vis = await page.evaluate(() => { const r = document.querySelector("#in-step-lab input.phi").getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
    ok(at("the in-step slider stays on screen while you read the flows"), vis);
  } else {
    const tops = await page.evaluate(() => [...document.querySelectorAll("#in-step-lab .cell")].map((c) => Math.round(c.getBoundingClientRect().top)));
    ok(at("the lab's two panels sit side by side on a desktop"), tops.length === 2 && tops[0] === tops[1], tops.join(","));
  }

  // --- the multiplier -------------------------------------------------------------------------
  const table = async () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll("#multiplier-lab tr[data-row]")].map((r) => [r.dataset.row, {
    m: r.querySelector(".measured").textContent, f: r.querySelector(".ident").textContent, M: __eur(r.children[1].textContent),
  }])));
  await page.locator("#multiplier-lab").scrollIntoViewIfNeeded();
  const t = await table();
  ok(at("the measured ratio equals the formula in every row"), Object.values(t).every((r) => r.m === r.f), JSON.stringify(t));
  ok(at("ratios: 5.50 before, 5.50 after the textbook rounds, 2.29 after QE"), t.open.m === "5.50" && t.textbook.m === "5.50" && t.qe.m === "2.29", JSON.stringify(t));
  ok(at("QE takes money from €1,100 to €1,600"), t.open.M === 1100 && t.qe.M === 1600);
  const rounds = async () => page.evaluate(() => {
    const svg = document.querySelector("#multiplier-lab svg.rounds");
    const mk = svg.querySelector("circle.round-mk");
    return { d: __polyDist(svg.querySelector("path.cum"), __P(mk, +mk.getAttribute("cx"), +mk.getAttribute("cy"))), t: document.querySelector("#multiplier-lab .panel-note").textContent };
  });
  const r0 = await rounds();
  ok(at("round 5: the marker sits on the cumulative curve"), r0.d < 1 && /After 5 rounds/.test(r0.t), `${r0.d.toFixed(2)}, ${r0.t}`);
  await page.locator("#multiplier-lab input[type=range]").fill("30");
  const r1 = await rounds();
  ok(at("round 30: still on the curve, and on its way to €550"), r1.d < 1 && /on its way to €550/.test(r1.t), r1.t);

  ok(at("no console errors, warnings or page errors"), noise.length === 0, noise.slice(0, 3).join(" | "));

  if (SHOTS) {
    await page.locator('#balance-sheets .step-pill[data-step="2"]').click();
    await page.locator("#in-step-lab input.phi").fill("40");
    await page.locator("#multiplier-lab input[type=range]").fill("5");
    await page.locator("#balance-sheets").screenshot({ path: `${SHOTS}/${vp.name}-sheets.png` });
    await page.locator("#in-step-lab").screenshot({ path: `${SHOTS}/${vp.name}-lab.png` });
    await page.locator("#multiplier-lab").screenshot({ path: `${SHOTS}/${vp.name}-multiplier.png` });
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
