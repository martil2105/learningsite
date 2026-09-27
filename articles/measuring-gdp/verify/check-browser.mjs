/*
  Browser checks for measuring-gdp, two viewports, run against a build that
  ./verify/ship.sh has proved is the current one.

  The generic half is every article's: no sideways scroll (naming the offender),
  every svg inside its parent, no NaN geometry at any scroll position, KaTeX
  rendered, the title's lines inside the screen, nothing glued together.

  The article-specific half defends the figures' claims in rendered pixels:
    - the three net stacks of the ledger end on the same GDP line;
    - the quiz's verdicts and the ledger agree after each answer;
    - the chain's bars add up to the readout, and the last one reaches GDP;
    - in the lab every marker lies on its line, the net-exports line is flat
      with home-made flour and sloped with imported flour, and the tables read
      what the markers say.

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

  // --- the ledger: three net stacks end on one GDP line ---------------------------
  const ledgerTops = async (root) =>
    page.evaluate((root) => {
      const svg = document.querySelector(`${root} svg.three-ways`);
      const line = svg.querySelector(".gdp-line");
      const gy = __P(line, +line.getAttribute("x1"), +line.getAttribute("y1"))[1];
      const tops = [...svg.querySelectorAll("rect.net-top")].map((r) => __P(r, +r.getAttribute("x"), +r.getAttribute("y"))[1]);
      const sales = svg.querySelector("rect.sales");
      const sy = __P(sales, +sales.getAttribute("x"), +sales.getAttribute("y"))[1];
      const label = svg.querySelector(".gdp-label").textContent;
      return { gy, tops, sy, label };
    }, root);

  const base = await ledgerTops(".fig-wrap");
  ok(at("base year: the three net stacks end on the GDP line"), base.tops.length === 3 && base.tops.every((t) => Math.abs(t - base.gy) < 0.5),
     `${base.tops.map((t) => t.toFixed(1)).join(", ")} vs ${base.gy.toFixed(1)}`);
  ok(at("base year: the all-sales bar stands well above GDP"), base.sy < base.gy - 20, `${base.sy.toFixed(1)} vs ${base.gy.toFixed(1)}`);
  ok(at("base year: the GDP label reads €100"), base.label.trim() === "GDP €100", base.label);

  // --- the quiz ---------------------------------------------------------------------
  const quiz = page.locator("#event-quiz");
  await quiz.scrollIntoViewIfNeeded();
  const answer = async (id, label) => {
    await page.locator(`#event-quiz .card[data-event="${id}"] .pill`, { hasText: label }).click();
    await page.waitForTimeout(60);
  };
  await answer("importedFlour", "Lowers GDP");
  const flour = await ledgerTops("#event-quiz");
  ok(at("imported flour: the verdict says right"), (await page.locator('#event-quiz .card[data-event="importedFlour"] .verdict b').textContent()) === "Right.");
  ok(at("imported flour: the ledger's GDP label drops to €50"), flour.label.trim() === "GDP €50", flour.label);
  ok(at("imported flour: the three net stacks still share the GDP line"), flour.tops.every((t) => Math.abs(t - flour.gy) < 0.5));

  await answer("bikes", "Lowers GDP");
  const bikes = await ledgerTops("#event-quiz");
  ok(at("bikes, answered wrongly: the verdict says not quite"), (await page.locator('#event-quiz .card[data-event="bikes"] .verdict b').textContent()) === "Not quite.");
  ok(at("bikes: GDP stays at €100 and the three stacks agree"), bikes.label.trim() === "GDP €100" && bikes.tops.every((t) => Math.abs(t - bikes.gy) < 0.5));
  const hatch = await page.locator("#event-quiz svg.three-ways rect.imports").count();
  ok(at("bikes: the spending column carries a hatched imports block"), hatch === 1, `${hatch}`);

  await answer("bikes", "Leaves it alone");
  await answer("merged", "Leaves it alone");
  await answer("unsold", "Leaves it alone");
  const score = await page.locator("#event-quiz .score").textContent();
  ok(at("four right answers score four of four, and say only one lowers GDP"), /You got 4 of 4\. Only one of the four lowers GDP\./.test(score), score);
  const merged = await ledgerTops("#event-quiz");
  ok(at("the last event shown (unsold) keeps GDP at €100"), merged.label.trim() === "GDP €100");

  // --- the chain --------------------------------------------------------------------
  const chainState = async () =>
    page.evaluate(() => {
      const fig = document.querySelector("#chain-figure");
      const bars = [...fig.querySelectorAll("rect.sale")];
      const total = bars.reduce((a, b) => a + +b.dataset.value, 0);
      const text = fig.querySelector(".fig-title").textContent;
      const m = text.match(/€(\d+(?:\.\d+)?)/);
      const line = fig.querySelector(".gdp-line");
      const gy = __P(line, +line.getAttribute("x1"), +line.getAttribute("y1"))[1];
      const last = bars[bars.length - 1];
      const ly = __P(last, +last.getAttribute("x"), +last.getAttribute("y"))[1];
      return { n: bars.length, total, said: m ? +m[1] : NaN, gy, ly, k: +fig.querySelector(".k").textContent };
    });
  await page.locator("#chain-figure").scrollIntoViewIfNeeded();
  const c3 = await chainState();
  ok(at("the chain opens at three firms with three bars"), c3.k === 3 && c3.n === 3);
  ok(at("the chain's readout equals the bars it draws"), Math.abs(c3.total - c3.said) < 0.01, `${c3.total} vs ${c3.said}`);
  ok(at("the last firm's sale reaches the €100 line"), Math.abs(c3.ly - c3.gy) < 0.5, `${c3.ly.toFixed(1)} vs ${c3.gy.toFixed(1)}`);
  for (let i = 0; i < 5; i++) await page.locator('#chain-figure button[aria-label="more firms"]').click();
  const c8 = await chainState();
  ok(at("eight firms: eight bars, sales €450 = 4.5 × GDP"), c8.n === 8 && Math.abs(c8.total - 450) < 1e-9 && c8.said === 450, `${c8.n}, ${c8.total}, ${c8.said}`);
  ok(at("…and the last bar still stops at the GDP line"), Math.abs(c8.ly - c8.gy) < 0.5);

  // --- the lab ----------------------------------------------------------------------
  const labState = async () =>
    page.evaluate(() => {
      const fig = document.querySelector("#import-lab");
      const svg = fig.querySelector("svg");
      const out = {};
      for (const k of ["cons", "nx", "gdp"]) {
        const line = svg.querySelector(`line.line.${k}`);
        const mk = svg.querySelector(`circle.marker.${k}`);
        const c = __P(mk, +mk.getAttribute("cx"), +mk.getAttribute("cy"));
        const a = __P(line, +line.getAttribute("x1"), +line.getAttribute("y1"));
        const b = __P(line, +line.getAttribute("x2"), +line.getAttribute("y2"));
        out[k] = { dist: __lineDist(line, c), dy: b[1] - a[1], value: +mk.dataset.value };
      }
      const cell = (cls) => fig.querySelector(`td.${cls}`).textContent;
      const euro = (t) => { const m = t.replace("−", "-").match(/(-?)€(\d+(?:\.\d+)?)/); return m ? (m[1] ? -1 : 1) * +m[2] : NaN; };
      out.table = { cons: euro(cell("c-cons")), nx: euro(cell("c-nx")), gdp: euro(cell("c-gdp")), acons: euro(cell("a-cons")), anx: euro(cell("a-nx")) };
      return out;
    });
  await page.locator("#import-lab").scrollIntoViewIfNeeded();
  const l0 = await labState();
  ok(at("lab opens at 60%: every marker sits on its line"), ["cons", "nx", "gdp"].every((k) => l0[k].dist < 0.5),
     ["cons", "nx", "gdp"].map((k) => l0[k].dist.toFixed(2)).join(", "));
  ok(at("lab, home-made flour: the net-exports line is flat"), Math.abs(l0.nx.dy) < 0.01, `${l0.nx.dy}`);
  ok(at("lab at 60%: the release reads +€16, −€40, −€24"), l0.table.cons === 16 && l0.table.nx === -40 && l0.table.gdp === -24, JSON.stringify(l0.table));
  ok(at("lab: consumption net of its imports equals the GDP change"), l0.table.acons === l0.table.gdp && l0.table.anx === 0);
  ok(at("lab: the GDP marker's value is what the table prints"), Math.abs(l0.gdp.value - l0.table.gdp) < 1e-9);

  const slider = page.locator('#import-lab input[type="range"]');
  const sweepOK = [];
  for (const v of [0, 25, 100]) {
    await slider.fill(String(v));
    const s = await labState();
    sweepOK.push(s.table.nx === -40 && Math.abs(s.table.gdp + 0.4 * v) < 1e-9 && ["cons", "nx", "gdp"].every((k) => s[k].dist < 0.5));
  }
  ok(at("lab sweep 0/25/100%: net exports stay at −€40 while GDP moves by −€0.40 per point, markers on their lines"), sweepOK.every(Boolean), sweepOK.join(","));

  await slider.fill("60");
  await page.locator('#import-lab .toggle input').check();
  const l1 = await labState();
  ok(at("imported flour: the GDP line is half as steep as with home-made flour"), Math.abs(l1.gdp.dy / l0.gdp.dy - 0.5) < 0.01, `${(l1.gdp.dy / l0.gdp.dy).toFixed(3)}`);
  ok(at("imported flour: the net-exports line slopes"), Math.abs(l1.nx.dy) > 5, `${l1.nx.dy.toFixed(1)}px`);
  ok(at("imported flour at 60%: GDP −€12, markers on their lines"), l1.table.gdp === -12 && ["cons", "nx", "gdp"].every((k) => l1[k].dist < 0.5), JSON.stringify(l1.table));

  if (vp.name === "mobile") {
    // The controls stick: scroll to the tables and the slider is still on screen.
    await page.locator("#import-lab .tables").scrollIntoViewIfNeeded();
    const vis = await page.evaluate(() => {
      const r = document.querySelector('#import-lab input[type="range"]').getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight;
    });
    ok(at("the lab's slider stays on screen while you read the tables"), vis);
  } else {
    const side = await page.evaluate(() => {
      const a = document.querySelector("#event-quiz .cards").getBoundingClientRect();
      const b = document.querySelector("#event-quiz .panel").getBoundingClientRect();
      return { a: a.top, b: b.top, ax: a.left, bx: b.left };
    });
    ok(at("the quiz's cards and ledger sit side by side on a desktop"), side.bx > side.ax + 100, JSON.stringify(side));
  }

  ok(at("no console errors, warnings or page errors"), noise.length === 0, noise.slice(0, 3).join(" | "));

  if (SHOTS) {
    await page.locator(".fig-wrap").screenshot({ path: `${SHOTS}/${vp.name}-ledger.png` });
    await page.locator("#event-quiz").screenshot({ path: `${SHOTS}/${vp.name}-quiz.png` });
    await page.locator("#chain-figure").screenshot({ path: `${SHOTS}/${vp.name}-chain.png` });
    await page.locator("#import-lab").screenshot({ path: `${SHOTS}/${vp.name}-lab.png` });
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
