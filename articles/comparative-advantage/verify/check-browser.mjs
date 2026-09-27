/*
  Browser checks, two viewports, run against a build that ./verify/ship.sh has
  proved is the current one.

  The assertions this file exists for are the geometric ones. The article's
  claim is that at equal size the Valley's trading line lies ON its own
  frontier (it gains nothing) while the Coast's lies outside it, and that the
  reverse holds once the Coast is big enough. The honest way to check a claim
  like that is to drag the real slider in a real browser and measure the drawn
  lines in SCREEN pixels, through each element's own transform. A line one
  pixel off its frontier would survive every other check here and contradict
  the sentence next to it.

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

// Runs inside the page: a point in an element's user units, in screen pixels.
const GEOMETRY_HELPERS = `
  window.__scr = (el, x, y) => {
    const m = el.getScreenCTM();
    return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
  };
  window.__lineEnds = (el) => [
    __scr(el, +el.getAttribute("x1"), +el.getAttribute("y1")),
    __scr(el, +el.getAttribute("x2"), +el.getAttribute("y2")),
  ];
  window.__distToLine = (p, a, b) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    return Math.abs(dy * (p.x - a.x) - dx * (p.y - a.y)) / Math.hypot(dx, dy);
  };
  window.__pathPoints = (el) => {
    const nums = (el.getAttribute("d").match(/-?\\d+(\\.\\d+)?/g) || []).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push(__scr(el, nums[i], nums[i + 1]));
    return pts;
  };
  window.__distToPolyline = (p, pts) => {
    let best = Infinity;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y;
      const L = dx * dx + dy * dy;
      let t = L ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / L : 0;
      t = Math.max(0, Math.min(1, t));
      best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
    }
    return best;
  };
`;

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const noise = [];
  page.on("pageerror", (e) => noise.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") noise.push(`console ${m.type()}: ${m.text()}`);
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: GEOMETRY_HELPERS });
  const at = (claim) => `${vp.name}: ${claim}`;
  const text = async (sel) => ((await page.locator(sel).first().textContent()) || "").replace(/\s+/g, " ").trim();

  // ------------------------------------------------------------ generic
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

  const svgs = await page.evaluate(() =>
    [...document.querySelectorAll("svg")].filter((s) => !s.closest("#site-mark") && !s.closest(".katex")).map((s) => {
      const r = s.getBoundingClientRect();
      const p = s.parentElement.getBoundingClientRect();
      return { cls: s.getAttribute("class") || s.parentElement.className, over: Math.max(0, Math.round(r.right - p.right), Math.round(p.left - r.left)) };
    })
  );
  ok(at("every svg fits inside its parent"), svgs.every((s) => s.over <= 1),
     svgs.filter((s) => s.over > 1).map((s) => `${s.cls} +${s.over}px`).join("; "));
  ok(at("the article draws a sensible number of charts"), svgs.length >= 10, `${svgs.length} svgs`);

  const tables = await page.evaluate(() =>
    [...document.querySelectorAll("table")].map((t) => Math.round(t.getBoundingClientRect().right - window.innerWidth))
  );
  ok(at("no table runs off the screen"), tables.every((o) => o <= 0), tables.join(", "));

  // Nothing drawn outside its own svg (an outer svg clips visually while still
  // widening the document).
  const escapes = await page.evaluate(() => {
    const bad = [];
    for (const s of document.querySelectorAll("svg")) {
      // KaTeX draws radicals and big delimiters as stretched svgs that overhang
      // their own box on purpose; they are not our charts.
      if (s.closest("#site-mark") || s.closest(".katex")) continue;
      const box = s.getBoundingClientRect();
      for (const el of s.querySelectorAll("line, circle, rect, path")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.left < box.left - 1.5 || r.right > box.right + 1.5 || r.top < box.top - 1.5 || r.bottom > box.bottom + 1.5) {
          bad.push(`${el.tagName}.${el.getAttribute("class")} in ${s.getAttribute("aria-label")?.slice(0, 30)}`);
        }
      }
    }
    return bad.slice(0, 4);
  });
  ok(at("nothing is drawn outside the svg that contains it"), escapes.length === 0, escapes.join("; "));

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
          if (v !== null && (Number.isNaN(+v) || +v < 0)) bad.push(`${el.getAttribute("class")} ${a}=${v}`);
        }
        for (const a of ["cx", "cy", "x1", "y1", "x2", "y2", "x", "y"]) {
          const v = el.getAttribute(a);
          if (v !== null && !Number.isFinite(+v)) bad.push(`${el.getAttribute("class")} ${a}=${v}`);
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
    display: document.querySelectorAll(".katex-display").length,
  }));
  ok(at("no unrendered LaTeX in the text"), math.raw.length === 0, math.raw.join(" "));
  ok(at("KaTeX rendered the maths section"), math.rendered >= 12 && math.display >= 8,
     `${math.rendered} .katex, ${math.display} display`);

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

  const oldName = await page.evaluate(() =>
    /nash|scaffold|deterrence|economic rent/i.test(document.title + document.querySelector("#intro").innerText)
  );
  ok(at("no other article's name in the title or masthead"), !oldName);

  // ------------------------------------------------ 1. who makes what
  {
    const fig = "#who-makes-what";
    ok(at("the opening question starts without a verdict"), /Pick one/.test(await text(`${fig} .verdict`)));
    ok(at("and without the cost table"), (await page.locator(`${fig} table.costs`).count()) === 0);
    await page.locator(`${fig} .choice`, { hasText: "The Valley" }).click();
    const wrong = await text(`${fig} .verdict`);
    ok(at("picking the Valley is corrected with both sack costs"),
       /^Not quite/.test(wrong) && /half a tool/.test(wrong) && /two-ninths of a tool/.test(wrong), wrong);
    ok(at("and the opportunity costs appear"), (await page.locator(`${fig} table.costs`).count()) === 1);
    await page.locator(`${fig} .choice`, { hasText: "The Coast" }).click();
    const right = await text(`${fig} .verdict`);
    ok(at("picking the Coast is confirmed"), /^Right\./.test(right), right);
    const costs = await page.locator(`${fig} table.costs td`).allTextContents();
    ok(at("the cost table reads 2 and 4.5 sacks, 0.5 and 0.22 tools"),
       costs.join("|") === "2 sacks|0.5 tools|4.5 sacks|0.22 tools", costs.join("|"));
  }

  // -------------------------------------- shared frontier-panel geometry
  const panelGeometry = (figSel) =>
    page.evaluate((figSel) => {
      const out = {};
      for (const tag of ["valley", "coast"]) {
        const panel = document.querySelector(`${figSel} .frontier.${tag}`);
        const own = panel.querySelector("line.own-frontier");
        const [a, b] = __lineEnds(own);
        const trade = panel.querySelector("line.trade-line");
        const ends = trade ? __lineEnds(trade) : [];
        const dot = panel.querySelector("circle.with-trade");
        const hollow = panel.querySelector("circle.no-trade");
        const c = (el) => (el ? __scr(el, +el.getAttribute("cx"), +el.getAttribute("cy")) : null);
        out[tag] = {
          hasTrade: !!trade,
          tradeOff: ends.length ? Math.max(...ends.map((p) => __distToLine(p, a, b))) : null,
          dotOff: dot ? __distToLine(c(dot), a, b) : null,
          dotToHollow: dot ? Math.hypot(c(dot).x - c(hollow).x, c(dot).y - c(hollow).y) : null,
          // above the frontier = further from the origin; SVG y grows downward,
          // so compare the dot against the frontier's y at the same x.
          dotAbove: dot ? (() => { const p = c(dot); const t = (p.x - a.x) / (b.x - a.x); return p.y < a.y + t * (b.y - a.y) - 0.5; })() : null,
          gainAreas: panel.querySelectorAll("path.gain-area").length,
          readout: panel.parentElement.querySelector(".readout")?.textContent.replace(/\s+/g, " ").trim(),
        };
      }
      return out;
    }, figSel);

  // ------------------------------------------------ 2. the price test
  {
    const fig = "#price-test";
    const slider = page.locator(`${fig} input[type=range]`);
    await page.locator(`${fig} .pill`, { hasText: "p = 2" }).click();
    let g = await panelGeometry(fig);
    ok(at("price test at 2: the Valley's trading line lies on its frontier"), g.valley.tradeOff < 0.5,
       `${g.valley.tradeOff?.toFixed(3)}px`);
    ok(at("price test at 2: so no gain area is drawn for the Valley"), g.valley.gainAreas === 0);
    ok(at("price test at 2: and its readout says +0.0%"), /\+0\.0%/.test(g.valley.readout), g.valley.readout);
    ok(at("price test at 2: the Coast's trading line is well outside its frontier"), g.coast.tradeOff > 10,
       `${g.coast.tradeOff?.toFixed(1)}px`);
    ok(at("price test at 2: the Coast reads +50.0%"), /\+50\.0%/.test(g.coast.readout), g.coast.readout);

    await page.locator(`${fig} .pill`, { hasText: "p = 4.5" }).click();
    g = await panelGeometry(fig);
    ok(at("price test at 4.5: now the Coast's line is on its frontier and the Valley's is not"),
       g.coast.tradeOff < 0.5 && g.valley.tradeOff > 10, `${g.coast.tradeOff?.toFixed(3)} / ${g.valley.tradeOff?.toFixed(1)}`);

    await page.locator(`${fig} .pill`, { hasText: "p = 3" }).click();
    g = await panelGeometry(fig);
    ok(at("price test at 3: both gain 22.5%"),
       /\+22\.5%/.test(g.valley.readout) && /\+22\.5%/.test(g.coast.readout), `${g.valley.readout} / ${g.coast.readout}`);
    ok(at("price test at 3: both baskets sit above their frontiers"), g.valley.dotAbove && g.coast.dotAbove);

    await slider.fill("1.5");
    g = await panelGeometry(fig);
    ok(at("price test at 1.5: no deal, and no trading lines"),
       /no deal/.test(g.valley.readout) && /no deal/.test(g.coast.readout) && !g.valley.hasTrade && !g.coast.hasTrade,
       `${g.valley.readout} / ${g.coast.readout}`);
    ok(at("price test at 1.5: the verdict says the Valley refuses"), /Valley would be selling a tool for less/.test(await text(`${fig} .verdict`)));

    // the price mark sits on the strip where the slider says
    const mark = await page.evaluate((fig) => {
      const m = document.querySelector(`${fig} line.price-mark`);
      const r = document.querySelector(`${fig} rect.deal-range`);
      const [p] = __lineEnds(m);
      const rr = r.getBoundingClientRect();
      return { x: p.x, left: rr.left, right: rr.right };
    }, fig);
    ok(at("price test at 1.5: the price mark is left of the shaded range"), mark.x < mark.left - 5, JSON.stringify(mark));
    await slider.fill("3");
  }

  // ------------------------------------------------ 3. the market reveal
  {
    const fig = "#market-reveal";
    ok(at("before opening the border there are no after-trade bars"), (await page.locator(`${fig} rect.after`).count()) === 0);
    await page.locator(`${fig} .pill`).click();
    const bars = await page.evaluate((fig) => {
      const w = (sel) => document.querySelector(`${fig} ${sel}`).getBoundingClientRect().width;
      return {
        vtB: w(".card.valley rect.before.tools"), vtA: w(".card.valley rect.after.tools"),
        vgB: w(".card.valley rect.before.grain"), vgA: w(".card.valley rect.after.grain"),
        ctB: w(".card.coast rect.before.tools"), ctA: w(".card.coast rect.after.tools"),
        cgB: w(".card.coast rect.before.grain"), cgA: w(".card.coast rect.after.grain"),
      };
    }, fig);
    ok(at("with the border open, the Valley's bars are exactly as long as before"),
       Math.abs(bars.vtA - bars.vtB) < 0.01 && Math.abs(bars.vgA - bars.vgB) < 0.01, JSON.stringify(bars));
    ok(at("the Coast's tool bar grows 2.25 times and its grain bar does not move"),
       Math.abs(bars.ctA / bars.ctB - 2.25) < 0.02 && Math.abs(bars.cgA - bars.cgB) < 0.01,
       `${(bars.ctA / bars.ctB).toFixed(3)}`);
    const gains = await page.locator(`${fig} .gain`).allTextContents();
    ok(at("the cards read +0.0% and +50.0%"), gains.join("|") === "+0.0%|+50.0%", gains.join("|"));
    const world = await text(`${fig} .world`);
    ok(at("the world line gives the price, the output and the 250 farmers"),
       /settles at 2 sacks/.test(world) && /6,750 tools/.test(world) && /13,500 sacks/.test(world) && /250 of the Valley's 1,000/.test(world), world);
  }

  // ------------------------------------------------ 4. the world frontier
  {
    const fig = "#world-frontier";
    const read = () => page.evaluate((fig) => {
      const svg = document.querySelector(`${fig} svg`);
      const [va, vb] = __lineEnds(svg.querySelector("line.piece.valley"));
      const [ca, cb] = __lineEnds(svg.querySelector("line.piece.coast"));
      const c = (el) => __scr(el, +el.getAttribute("cx"), +el.getAttribute("cy"));
      const prod = c(svg.querySelector("circle.production"));
      const none = c(svg.querySelector("circle.no-trade"));
      const cr = svg.querySelector("rect.corner");
      const corner = __scr(cr, +cr.getAttribute("x") + 4, +cr.getAttribute("y") + 4);
      return {
        onValley: __distToLine(prod, va, vb), onCoast: __distToLine(prod, ca, cb),
        toCorner: Math.hypot(prod.x - corner.x, prod.y - corner.y),
        noneBelow: __distToLine(none, va, vb),
      };
    }, fig);
    let r = await read();
    ok(at("equal size: world production sits on the Valley's piece, away from the corner"),
       r.onValley < 0.5 && r.toCorner > 20, `${r.onValley.toFixed(3)}px, ${r.toCorner.toFixed(1)}px from corner`);
    ok(at("equal size: the no-trade output is inside the frontier"), r.noneBelow > 5);
    ok(at("equal size: the readout says the same 13,500 sacks"), /same 13,500 sacks/.test(await text(`${fig} .readout`)));
    await page.locator(`${fig} .pill`, { hasText: "3×" }).click();
    r = await read();
    ok(at("3×: production is exactly on the corner"), r.toCorner < 0.5, `${r.toCorner.toFixed(3)}px`);
    ok(at("3×: the readout says 20% more of each"), /20% more of each/.test(await text(`${fig} .readout`)));
    await page.locator(`${fig} .pill`, { hasText: "6×" }).click();
    r = await read();
    ok(at("6×: production sits on the Coast's piece, away from the corner"),
       r.onCoast < 0.5 && r.toCorner > 20, `${r.onCoast.toFixed(3)}px`);
    ok(at("6×: the readout says the same 10,500 tools"), /same 10,500 tools/.test(await text(`${fig} .readout`)));
  }

  // ------------------------------------------------ 5. THE size lab
  {
    const fig = "#size-lab";
    const slider = page.locator(`${fig} input[type=range]`);
    await page.locator(`${fig} .pill`, { hasText: /^1×$/ }).click();
    let g = await panelGeometry(fig);
    ok(at("size lab at 1×: the Valley's trading line lies ON its frontier"), g.valley.tradeOff < 0.5,
       `${g.valley.tradeOff.toFixed(3)}px`);
    ok(at("size lab at 1×: the Valley's basket is on the frontier, on top of its no-trade basket"),
       g.valley.dotOff < 0.5 && g.valley.dotToHollow < 0.5, `${g.valley.dotOff.toFixed(3)}px, ${g.valley.dotToHollow.toFixed(3)}px`);
    ok(at("size lab at 1×: the Coast's trading line is outside its frontier"), g.coast.tradeOff > 10,
       `${g.coast.tradeOff.toFixed(1)}px`);
    ok(at("size lab at 1×: gains read +0.0% and +50.0%"),
       /\+0\.0%/.test(g.valley.readout) && /\+50\.0%/.test(g.coast.readout));
    const tests1 = await page.locator(`${fig} .test`).allTextContents();
    ok(at("size lab at 1×: the tools test passes and the grain test fails"),
       tests1[0].startsWith("✓") && tests1[1].startsWith("✗"), tests1.join(" / "));
    ok(at("size lab at 1×: the wage readout is exactly 2"), /2\.00 Coast wages/.test(await text(`${fig} .n-wage`)));

    await page.locator(`${fig} .pill`, { hasText: /^8×$/ }).click();
    g = await panelGeometry(fig);
    ok(at("size lab at 8×: the reverse — the Coast's line is on its frontier and the Valley's is not"),
       g.coast.tradeOff < 0.5 && g.valley.tradeOff > 10, `${g.coast.tradeOff.toFixed(3)} / ${g.valley.tradeOff.toFixed(1)}`);
    ok(at("size lab at 8×: gains read +50.0% and +0.0%"),
       /\+50\.0%/.test(g.valley.readout) && /\+0\.0%/.test(g.coast.readout), `${g.valley.readout} / ${g.coast.readout}`);
    ok(at("size lab at 8×: 22% of Coast workers stay in the workshops"), /22% of Coast workers/.test(await text(`${fig} .verdict`)));

    await page.locator(`${fig} .pill`, { hasText: /^3×$/ }).click();
    g = await panelGeometry(fig);
    ok(at("size lab at 3×: both trading lines are outside, and both tests pass"),
       g.valley.tradeOff > 10 && g.coast.tradeOff > 10 &&
       (await page.locator(`${fig} .test.pass`).count()) === 2);

    // the product readout, swept across the whole slider
    const products = [];
    for (let i = 0; i <= 24; i++) {
      await slider.fill(String(-2 + (6 * i) / 24));
      products.push((await text(`${fig} .n-product`)).split("=").pop().trim());
    }
    ok(at("size lab: the gain factors multiply to 1.500 at 25 slider positions"),
       products.every((v) => v === "1.500"), products.filter((v) => v !== "1.500").join(", "));
    const regimes = new Set();
    for (const v of ["-2", "1.5", "4"]) {
      await slider.fill(v);
      regimes.add((await text(`${fig} .verdict`)).slice(0, 18));
    }
    ok(at("size lab: the sweep really visits all three regimes"), regimes.size === 3, [...regimes].join(" | "));

    // on a phone the controls stay on screen while the reader looks at the Coast
    if (vp.name === "mobile") {
      await page.locator(`${fig} .frontier.coast`).scrollIntoViewIfNeeded();
      const bar = await page.evaluate((fig) => {
        const r = document.querySelector(`${fig} .controls-bar input`).getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, h: window.innerHeight };
      }, fig);
      ok(at("size lab on a phone: the slider is still on screen beside the Coast's panel"),
         bar.top >= 0 && bar.bottom <= bar.h, JSON.stringify(bar));
    }
    await page.locator(`${fig} .pill`, { hasText: /^1×$/ }).click();
  }

  // ------------------------------------------------ 6. the identity figure
  {
    const fig = "#band-figure";
    const geo = await page.evaluate((fig) => {
      const svg = document.querySelector(`${fig} .price-panel svg`);
      const pts = __pathPoints(svg.querySelector("path.clamp"));
      const samples = [...svg.querySelectorAll("circle.sample")].map((c) => __scr(c, +c.getAttribute("cx"), +c.getAttribute("cy")));
      const band = svg.querySelector("rect.band").getBoundingClientRect();
      const worst = Math.max(...samples.map((p) => __distToPolyline(p, pts)));
      // the slope of the middle piece, in rendered pixels, against the slope of
      // the identity line p = k drawn on the same log axes
      const slopeMid = (pts[2].y - pts[1].y) / (pts[2].x - pts[1].x);
      return { n: samples.length, worst, bandL: band.left, bandR: band.right, k1: pts[1].x, k2: pts[2].x, slopeMid,
               label: svg.querySelector("text.band-label").textContent };
    }, fig);
    ok(at("identity figure: all 19 solved-market dots lie on the closed-form line"),
       geo.n === 19 && geo.worst < 0.5, `${geo.n} dots, worst ${geo.worst.toFixed(3)}px`);
    ok(at("identity figure: the shaded band starts and ends at the two kinks"),
       Math.abs(geo.bandL - geo.k1) < 0.5 && Math.abs(geo.bandR - geo.k2) < 0.5);
    ok(at("identity figure: the band is labelled ×2.25"), geo.label === "×2.25", geo.label);
    // on these axes (log x over 6 doublings, log y from 1.5 to 6) slope 1 in
    // log–log has a known pixel slope; compare with the drawn one
    const axes = await page.evaluate((fig) => {
      const svg = document.querySelector(`${fig} .price-panel svg`);
      const s = svg.getBoundingClientRect().width / +svg.getAttribute("viewBox").split(" ")[2];
      return { s, W: +svg.getAttribute("viewBox").split(" ")[2] };
    }, fig);
    const pxPerLogX = ((axes.W - 16 - 46) * axes.s) / Math.log(64);
    const pxPerLogY = ((250 - 40 - 22) * axes.s) / Math.log(4);
    const expected = -pxPerLogY / pxPerLogX;
    ok(at("identity figure: the middle piece has slope exactly 1 in log–log"),
       Math.abs(geo.slopeMid / expected - 1) < 0.002, `${geo.slopeMid.toFixed(4)} vs ${expected.toFixed(4)}`);

    // The figure opens at exactly 2.7, the example the prose quotes. The
    // slider's 0.01 grid on log2(k) cannot land on 2.7 again once it is moved,
    // so the opening state is checked before the slider is touched.
    const r27 = await text(`${fig} .readout`);
    ok(at("identity figure opens at 2.7, with the prose's 16.2%, 29.1% and 1.162 × 1.291 = 1.500"),
       /^At 2\.70×/.test(r27) && /16\.2%/.test(r27) && /29\.1%/.test(r27) && /1\.162\s×\s1\.291\s=\s1\.500/.test(r27), r27);
    const slider = page.locator(`${fig} input[type=range]`);
    for (const v of ["-2", "4", "1.43", "0.17"]) {
      await slider.fill(v);
      const r = await text(`${fig} .readout`);
      ok(at(`identity figure at 2^${v}: the product still reads 1.500`), /=\s1\.500\.$/.test(r), r);
    }
  }

  // ------------------------------------------------ 7. catch-up
  {
    const fig = "#catch-up";
    const slider = page.locator(`${fig} input[type=range]`);
    const dot = () => page.evaluate((fig) => {
      const svg = document.querySelector(`${fig} svg`);
      const v = svg.querySelector("circle.scrub-dot.valley");
      const c = svg.querySelector("circle.scrub-dot.coast");
      const base = svg.querySelector("line.rule");
      const [b] = __lineEnds(base);
      return {
        valley: __scr(v, +v.getAttribute("cx"), +v.getAttribute("cy")).y,
        coast: __scr(c, +c.getAttribute("cx"), +c.getAttribute("cy")).y,
        zero: b.y,
      };
    }, fig);
    const ys = [];
    for (const v of ["2", "2.5", "3"]) { await slider.fill(v); ys.push(await dot()); }
    ok(at("catch-up: the Valley's dot does not move as Coast tools go 2 → 3"),
       Math.abs(ys[0].valley - ys[1].valley) < 0.01 && Math.abs(ys[0].valley - ys[2].valley) < 0.01,
       ys.map((y) => y.valley.toFixed(3)).join(", "));
    ok(at("catch-up: while the Coast's falls to the zero line"),
       ys[0].coast < ys[2].coast - 20 && Math.abs(ys[2].coast - ys[2].zero) < 0.5);
    await slider.fill("4.5");
    const p = await dot();
    ok(at("catch-up at 4.5: the Valley's dot sits on the zero line"), Math.abs(p.valley - p.zero) < 0.5,
       `${(p.valley - p.zero).toFixed(3)}px`);
    ok(at("catch-up at 4.5: the readout says there is nothing to trade"), /nothing to trade/.test(await text(`${fig} .readout`)));
    await slider.fill("9");
    ok(at("catch-up at 9: the Valley gains 41.4%"), /Valley gains 41\.4%/.test(await text(`${fig} .readout`)));
    const labels = await page.locator(`${fig} text.marker-label`).allTextContents();
    ok(at("catch-up: the two rules are labelled 3 and 4.5"), labels.join("|") === "3|4.5", labels.join("|"));

    await page.locator(`${fig} .pill`, { hasText: "better at grain" }).click();
    const gslider = page.locator(`${fig} input[type=range]`);
    const g = [];
    for (const v of ["9", "12", "15", "18"]) { await gslider.fill(v); g.push((await dot()).valley); }
    ok(at("catch-up, grain: the Valley's dot rises all the way"), g[0] > g[1] && g[1] > g[2] && g[2] > g[3],
       g.map((y) => y.toFixed(1)).join(", "));
    ok(at("catch-up, grain: 73.2% at 18"), /Valley gains 73\.2%/.test(await text(`${fig} .readout`)));
    ok(at("catch-up, grain: no rules drawn"), (await page.locator(`${fig} line.marker`).count()) === 0);
    await page.locator(`${fig} .pill`, { hasText: "better at tools" }).click();
  }

  // ------------------------------------------------ 8. more goods
  {
    const fig = "#goods-figure";
    const edgesMatch = () => page.evaluate((fig) => {
      const svg = document.querySelector(`${fig} svg`);
      const v = __pathPoints(svg.querySelector("path.curve.valley"));
      const c = __pathPoints(svg.querySelector("path.curve.coast"));
      const [lo] = __lineEnds(svg.querySelector("line.edge.lo"));
      const [hi] = __lineEnds(svg.querySelector("line.edge.hi"));
      const zero = Math.max(...v.map((p) => p.y)); // the zero line is the lowest point drawn
      const flatBefore = v.filter((p) => p.x < lo.x - 0.5).every((p) => Math.abs(p.y - zero) < 0.01);
      const risesAfter = v.filter((p) => p.x > lo.x + 3).every((p) => p.y < zero - 0.1);
      const coastZero = Math.max(...c.map((p) => p.y));
      const cFlatAfter = c.filter((p) => p.x > hi.x + 0.5).every((p) => Math.abs(p.y - coastZero) < 0.01);
      const cAboveBefore = c.filter((p) => p.x < hi.x - 3).every((p) => p.y < coastZero - 0.1);
      return { flatBefore, risesAfter, cFlatAfter, cAboveBefore, nBefore: v.filter((p) => p.x < lo.x - 0.5).length };
    }, fig);
    let e = await edgesMatch();
    ok(at("ten goods: the solver's Valley curve is zero exactly up to the closed-form edge, and positive after it"),
       e.flatBefore && e.risesAfter && e.nBefore > 10, JSON.stringify(e));
    ok(at("ten goods: and the Coast's is zero exactly from the other edge"), e.cFlatAfter && e.cAboveBefore, JSON.stringify(e));
    const r10 = await text(`${fig} .readout`);
    ok(at("ten goods: the readout gives 222, 40,500, 2.7% and 28.7%"),
       /at most 222 workers/.test(r10) && /from 40,500 up/.test(r10) && /2\.7%/.test(r10) && /28\.7%/.test(r10), r10);
    await page.locator(`${fig} .pill`, { hasText: /^2$/ }).click();
    e = await edgesMatch();
    ok(at("two goods: the edges match again"), e.flatBefore && e.risesAfter && e.cFlatAfter && e.cAboveBefore);
    const r2 = await text(`${fig} .readout`);
    ok(at("two goods: the readout is the article's own band, 2,000 to 4,500, with 0.0% and 50.0%"),
       /at most 2,000 workers/.test(r2) && /from 4,500 up/.test(r2) && /Valley gains 0\.0%/.test(r2) && /Coast 50\.0%/.test(r2), r2);
    await page.locator(`${fig} .pill`, { hasText: /^10$/ }).click();
  }

  ok(at("no console errors, warnings or page errors"), noise.length === 0, noise.slice(0, 3).join(" | "));

  if (SHOTS) {
    // A tall viewport, so a whole figure fits and no sticky bar is caught mid-scroll.
    await page.setViewportSize({ width: vp.width, height: 1500 });
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
    for (const id of ["who-makes-what", "price-test", "market-reveal", "world-frontier", "band-figure", "catch-up", "goods-figure"]) {
      await page.locator(`#${id}`).screenshot({ path: `${SHOTS}/${vp.name}-${id}.png` });
    }
    await page.locator("#size-lab .pill", { hasText: /^1×$/ }).click();
    await page.locator("#size-lab").screenshot({ path: `${SHOTS}/${vp.name}-size-lab-1x.png` });
    await page.locator("#size-lab .pill", { hasText: /^8×$/ }).click();
    await page.locator("#size-lab").screenshot({ path: `${SHOTS}/${vp.name}-size-lab-8x.png` });
    const maths = page.locator("section.body-text", { has: page.locator("h3", { hasText: "The maths" }) });
    await maths.screenshot({ path: `${SHOTS}/${vp.name}-maths.png` });
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
