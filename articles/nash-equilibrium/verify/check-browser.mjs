/*
  Browser checks, two viewports, run against a build that ./verify/ship.sh has
  proved is the current one.

  The assertion this file exists for is at the bottom: the article's whole claim
  is that dragging the fine does not move the breach rate, and the only way to
  check a claim like that honestly is to drag it in a real browser and measure
  the bar in RENDERED pixels. A figure that quietly moved by a pixel would
  survive every other check here and contradict the sentence next to it.

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

  // --- the payoff matrix is a table and tables are the other way a page gets wide
  const tables = await page.evaluate(() =>
    [...document.querySelectorAll("table")].map((t) => {
      const r = t.getBoundingClientRect();
      return { over: Math.round(r.right - window.innerWidth), cls: t.className };
    })
  );
  ok(at("no table runs off the screen"), tables.every((t) => t.over <= 0),
     tables.filter((t) => t.over > 0).map((t) => `${t.cls} +${t.over}px`).join("; "));

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

  // --- the identity figure is two panels side by side on desktop, stacked on a phone
  const panels = await page.evaluate(() => {
    const p = [...document.querySelectorAll(".panels .panel")].map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, width: r.width };
    });
    return p;
  });
  ok(at("the identity figure has both of its panels"), panels.length === 2, `${panels.length} panels`);
  if (vp.name === "desktop") {
    ok(at("the two panels share a top when side by side"),
       Math.abs(panels[0].top - panels[1].top) <= 2,
       `${Math.round(panels[0].top)} vs ${Math.round(panels[1].top)}`);
  } else {
    ok(at("the two panels stack on a phone"),
       panels[1].top > panels[0].top + 40,
       `${Math.round(panels[0].top)} vs ${Math.round(panels[1].top)}`);
  }

  // --- the opening question really does come up empty when all four are tried
  const cells = page.locator(".fig .matrix .cell.clickable .cell-inner");
  ok(at("the opening matrix offers four clickable cells"), (await cells.count()) === 4,
     `${await cells.count()} cells`);
  for (let i = 0; i < 4; i++) await cells.nth(i).click();
  const stuck = await page.locator(".fig").first().locator(".fig-title").textContent();
  ok(at("checking all four cells reports that none survives"),
     /none survives/.test(stuck) && /no equilibrium/.test(stuck), stuck.trim());

  // --- THE assertion this file exists for -----------------------------------
  // Drag the fine from one end of its range to the other. The breach bar must
  // not move by a single rendered pixel, and the audit bar must shrink. The
  // printed percentages have to agree with the bars they sit beside, because a
  // chart contradicting its own readout is the class of error every other
  // assertion here survives.
  const lab = page.locator(".lab");
  const fineSlider = lab.locator(".sliders .slider input").nth(0);

  const readLab = () =>
    page.evaluate(() => {
      const svg = document.querySelector(".lab .plot svg");
      const px = (sel) => svg.querySelector(sel).getBoundingClientRect().width;
      const txt = (sel) => parseFloat(svg.querySelector(sel).textContent);
      const anchor = svg.querySelector("line.anchor").getBoundingClientRect();
      const breach = svg.querySelector("rect.bar.p").getBoundingClientRect();
      return {
        breachW: px("rect.bar.p"),
        auditW: px("rect.bar.q"),
        breachPct: txt("text.bar-value.p"),
        auditPct: txt("text.bar-value.q"),
        trackW: px("rect.track"),
        anchorGap: Math.abs(anchor.left - breach.right),
      };
    });

  await fineSlider.fill("20");
  const low = await readLab();
  await fineSlider.fill("10000");
  const high = await readLab();

  ok(at("the breach bar does not move when the fine is swept end to end"),
     Math.abs(low.breachW - high.breachW) < 0.01,
     `${low.breachW.toFixed(4)}px at F=20 vs ${high.breachW.toFixed(4)}px at F=10000`);
  ok(at("the breach readout does not move either"),
     low.breachPct === high.breachPct && low.breachPct === 15,
     `${low.breachPct}% vs ${high.breachPct}%`);
  ok(at("the audit bar does shrink, so the slider is really connected"),
     high.auditW < low.auditW - 10,
     `${low.auditW.toFixed(1)}px → ${high.auditW.toFixed(1)}px`);
  ok(at("the audit readout falls with it"), high.auditPct < low.auditPct,
     `${low.auditPct}% → ${high.auditPct}%`);
  ok(at("the breach bar's end still sits on the 'where it started' marker"),
     low.anchorGap < 1.5 && high.anchorGap < 1.5,
     `${low.anchorGap.toFixed(2)}px, ${high.anchorGap.toFixed(2)}px`);

  // the bars are drawn from the same scale the percentages are printed from
  const consistent = (r) => Math.abs(r.breachW / r.trackW - r.breachPct / 100) < 0.005;
  ok(at("the breach bar's length agrees with the percentage printed beside it"),
     consistent(low) && consistent(high),
     `${(low.breachW / low.trackW).toFixed(4)} vs ${low.breachPct / 100}`);

  // --- the second slider is the one that works
  const costSlider = lab.locator(".sliders .slider input").nth(1);
  await costSlider.fill("6");
  const cheap = await readLab();
  ok(at("halving the audit cost halves the breach rate"), cheap.breachPct === 7.5,
     `${cheap.breachPct}%`);
  ok(at("and the breach bar moves when that happens"), cheap.breachW < high.breachW - 5,
     `${high.breachW.toFixed(1)}px → ${cheap.breachW.toFixed(1)}px`);

  // --- the floor figure draws a kink, and the two segments are at different heights
  const floor = await page.evaluate(() => {
    const svg = [...document.querySelectorAll("svg")].find((s) => s.querySelector("line.kink"));
    if (!svg) return null;
    const slack = svg.querySelector("path.curve.slack");
    const bound = svg.querySelector("path.curve.bound");
    const k = svg.querySelector("line.kink").getBoundingClientRect();
    return {
      hasBoth: !!slack && !!bound,
      slackY: slack ? slack.getBoundingClientRect().top : null,
      boundY: bound ? bound.getBoundingClientRect().top : null,
      kinkX: k.left,
      label: svg.querySelector("text.kink-label")?.textContent.trim(),
    };
  });
  ok(at("the floor figure draws both segments and a kink"), floor && floor.hasBoth, JSON.stringify(floor));
  ok(at("the segment after the kink is below the one before it"),
     floor && floor.boundY > floor.slackY + 20,
     floor ? `${Math.round(floor.slackY)} vs ${Math.round(floor.boundY)}` : "");
  ok(at("the kink is labelled with the closed-form fine of 180"),
     floor && /180/.test(floor.label || ""), floor?.label);

  // --- the live invariance table really ran, and really reports zero
  const sizeRows = await page.evaluate(() =>
    [...document.querySelectorAll(".results tbody tr")].map((tr) =>
      [...tr.querySelectorAll("td")].map((td) => td.textContent.trim())
    )
  );
  ok(at("the invariance table rendered four sizes"), sizeRows.length === 4, `${sizeRows.length} rows`);
  ok(at("every size reports a displacement of exactly zero"),
     sizeRows.length === 4 && sizeRows.every((r) => r[2] === "0"),
     sizeRows.map((r) => r[2]).join(" "));
  ok(at("every size solved a usable number of games"),
     sizeRows.length === 4 && sizeRows.every((r) => +r[1] >= 100),
     sizeRows.map((r) => r[1]).join(" "));

  ok(at("no console errors, warnings or page errors"), noise.length === 0, noise.slice(0, 3).join(" | "));

  if (SHOTS) {
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
    await page.locator(".lab").screenshot({ path: `${SHOTS}/${vp.name}-lab.png` });
    await page.locator(".panels").screenshot({ path: `${SHOTS}/${vp.name}-identity.png` });
    await page.locator(".matrix").first().screenshot({ path: `${SHOTS}/${vp.name}-matrix.png` });
    const kinkFig = page.locator(".fig").filter({ has: page.locator("line.kink") }).first();
    if (await kinkFig.count()) await kinkFig.screenshot({ path: `${SHOTS}/${vp.name}-floor.png` });
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
