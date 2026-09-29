/*
  Browser checks for lifecycle-leverage at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/lifecycle-leverage-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back from the pixels.
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
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const num = async (page, sel) =>
  parseFloat(((await page.locator(sel).first().textContent()) || "").replace(/[−–]/g, "-").replace(/[^\d.\-]/g, ""));
const settle = (page) => page.waitForTimeout(80);
async function setRange(page, sel, value) {
  await page.locator(sel).evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await settle(page);
}

if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const noise = [];
  page.on("pageerror", (e) => noise.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") noise.push(`console: ${m.text()}`); });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const at = (claim) => `${vp.name}: ${claim}`;

  // ---------------------------------------------------------- common checks
  const textLen = await page.evaluate(() => document.body.innerText.trim().length);
  ok(at("the page renders its text"), textLen > 2000, `${textLen} characters`);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(at("the page does not scroll horizontally"), overflow <= 0, `${overflow}px too wide`);

  const svgs = await page.evaluate(() =>
    [...document.querySelectorAll("svg")].filter((s) => !s.closest(".katex")).map((s) => {
      const r = s.getBoundingClientRect();
      const p = s.parentElement.getBoundingClientRect();
      return { cls: String(s.parentElement.className || "svg").slice(0, 30), over: Math.max(0, Math.round(r.right - p.right), Math.round(p.left - r.left)), vb: s.hasAttribute("viewBox") };
    })
  );
  ok(at("every chart svg fits inside its parent"), svgs.every((s) => s.over <= 1), svgs.filter((s) => s.over > 1).map((s) => `${s.cls} +${s.over}px`).join("; "));
  ok(at("every chart svg has a viewBox"), svgs.every((s) => s.vb), `${svgs.filter((s) => !s.vb).length} without`);

  const geom = async () => page.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll("svg [d], svg circle, svg rect, svg line, svg text")) {
      const d = el.getAttribute("d");
      if (d && /NaN|undefined|Infinity/.test(d)) bad.push(`d=${d.slice(0, 30)}`);
      for (const a of ["cx", "cy", "x1", "y1", "x2", "y2", "x", "y", "r", "width", "height"]) {
        const v = el.getAttribute(a);
        if (v !== null && v !== "" && !/%$/.test(v) && !Number.isFinite(+v)) bad.push(`${el.tagName} ${a}=${v}`);
      }
    }
    return bad;
  });
  const g0 = await geom();
  ok(at("no NaN/undefined/Infinity in SVG geometry on load"), g0.length === 0, g0.slice(0, 3).join("; "));

  const hygiene = await page.evaluate(() => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll(".katex, svg, script, style").forEach((e) => e.remove());
    const t = clone.innerText;
    return {
      dollars: (t.match(/\$[^$\n]{0,40}[\\^_=][^$\n]{0,40}\$/) || [""])[0],
      backslash: (t.match(/\\[a-zA-Z]{3,}/) || [""])[0],
      bad: (t.match(/\bNaN\b|\bundefined\b|\bnull\b|\bInfinity\b/) || [""])[0],
      katex: document.querySelectorAll(".katex").length,
      katexErr: document.querySelectorAll(".katex-error").length,
      thanks: [...document.querySelectorAll("p")].some((p) => p.textContent.trim() === "Thanks for reading!"),
      title: (() => { const h = document.querySelector("#intro-hed"); if (!h) return -1; const r = h.getBoundingClientRect(); return Math.round(r.right - window.innerWidth); })(),
    };
  });
  ok(at("no raw $…$ LaTeX in the text"), !hygiene.dollars, hygiene.dollars);
  ok(at("no raw LaTeX commands in the text"), !hygiene.backslash, hygiene.backslash);
  ok(at("no NaN/undefined/null in the text"), !hygiene.bad, hygiene.bad);
  ok(at("KaTeX rendered, with no errors"), hygiene.katex > 0 && hygiene.katexErr === 0, `${hygiene.katex} rendered, ${hygiene.katexErr} errors`);
  ok(at('"Thanks for reading!" is a paragraph'), hygiene.thanks);
  ok(at("the title fits the viewport"), hygiene.title <= 0, `${hygiene.title}px over`);

  const outside = await page.evaluate(() => {
    const bad = [];
    for (const s of document.querySelectorAll("svg")) {
      if (s.closest(".katex")) continue;
      const r = s.getBoundingClientRect();
      for (const el of s.querySelectorAll("path, circle, rect, line, text")) {
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;
        if (b.left < r.left - 1.5 || b.right > r.right + 1.5 || b.top < r.top - 1.5 || b.bottom > r.bottom + 1.5)
          bad.push(`${s.getAttribute("class") || "svg"} ${el.tagName}.${el.getAttribute("class") || ""}`);
      }
    }
    return bad;
  });
  ok(at("nothing is drawn outside its svg"), outside.length === 0, outside.slice(0, 4).join("; "));
  const glued = await page.evaluate(() => {
    // the rendered text, laid out (flex items are separate lines), with maths and charts hidden
    const hide = [...document.querySelectorAll(".katex, svg")].filter((e) => !e.closest(".katex") || e.classList.contains("katex"));
    const was = hide.map((e) => e.style.display);
    hide.forEach((e) => (e.style.display = "none"));
    const t = document.body.innerText;
    hide.forEach((e, i) => (e.style.display = was[i]));
    return (t.match(/[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/) || [""])[0];
  });
  ok(at("no text glued to a number"), !glued, glued);
  const semis = await page.evaluate(() => [...document.querySelectorAll(".katex annotation")].map((a) => a.textContent).filter((t) => /(^|[^\\]);/.test(t)));
  ok(at("no KaTeX spacing command lost its backslash"), semis.length === 0, semis.slice(0, 2).join(" | "));

  // ---------------------------------------------------- this article's checks
  const width = vp.width;
  const check = (claim, cond, detail = "") => ok(at(claim), cond, detail);
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) || "").trim();
  const clickSeg = async (id, v) => { await page.click(`#${id} button[data-value="${v}"]`); await settle(page); };
  const on = (id, v) => page.locator(`#${id} button[data-value="${v}"]`).getAttribute("aria-pressed");
  const val = (sel) => page.locator(sel).first().inputValue();

  // helpers that read a drawn chart back: tick labels give the scales, paths and bars give the marks
  const scales = (svg) => page.evaluate((svg) => {
    const el = document.querySelector(svg);
    const num = (t) => parseFloat(t.replace("−", "-").replace(/[%,]/g, ""));
    const xs = [...el.querySelectorAll(".axis-x g[transform]")].map((g) => ({ v: num(g.querySelector("text").textContent), p: +g.getAttribute("transform").match(/translate\(([-\d.]+)/)[1] }));
    const ys = [...el.querySelectorAll(".axis-y text.tick-label")].map((t) => ({ v: num(t.textContent), p: +t.getAttribute("y") - 4 }));
    return { xs, ys };
  }, svg);
  const lin = (t) => { const a = t[0], b = t[t.length - 1]; const k = (b.p - a.p) / (b.v - a.v); return { px: (v) => a.p + (v - a.v) * k, val: (p) => a.v + (p - a.p) / k }; };
  const pts = (sel) => page.evaluate((sel) => {
    const d = document.querySelector(sel).getAttribute("d");
    const n = d.match(/-?\d+(\.\d+)?/g).map(Number); const o = [];
    for (let i = 0; i + 1 < n.length; i += 2) o.push([n[i], n[i + 1]]);
    return o;
  }, sel);
  const yAt = (poly, px) => { for (let i = 1; i < poly.length; i++) { const [x0, y0] = poly[i - 1], [x1, y1] = poly[i]; if (px >= x0 - 1e-6 && px <= x1 + 1e-6) return y0 + ((px - x0) / (x1 - x0 || 1)) * (y1 - y0); } return NaN; };
  const attr = (sel, a) => page.locator(sel).first().getAttribute(a);
  const nattr = async (sel, a) => +(await attr(sel, a));
  const R = (id) => txt(`#${id} .value`);

  // figure 1: the drawn exposure of a year (percent of final wealth), and the drawn share of wealth in stocks (percent)
  const barPct = async (year) => {
    const sc = await scales("#fig-exposure svg.exp-panel"), Y = lin(sc.ys);
    return Y.val(await nattr(`#fig-exposure rect.bar[data-year="${year}"]`, "y"));
  };
  const barsPct = async () => { const o = []; for (let y = 1; y <= 40; y++) o.push(await barPct(y)); return o; };
  const levPct = async (year) => {
    const sc = await scales("#fig-exposure svg.lev-panel"), X = lin(sc.xs), Y = lin(sc.ys);
    const P = await pts("#fig-exposure path.lev");
    // the path's numbers are printed to two decimals, so clamp to its ends
    return Y.val(yAt(P, Math.min(Math.max(X.px(year), P[0][0]), P[P.length - 1][0])));
  };
  const evenPct = async () => {
    const sc = await scales("#fig-exposure svg.exp-panel"), Y = lin(sc.ys);
    return Y.val(await nattr("#fig-exposure line.even", "y1"));
  };
  const redBars = () => page.evaluate(() => [...document.querySelectorAll("#fig-exposure rect.bar")].filter((r) => r.getAttribute("fill") === "var(--c2)").map((r) => +r.dataset.year));

  // the guess card
  await page.click('#guess button[data-g="last"]'); await settle(page);
  check(`the guess card says right for "the last decade" @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await page.click('#guess button[data-g="first"]'); await settle(page);
  check(`and says which decade it is for "the first" @${width}`, (await txt("#guess-answer")).startsWith("It's the last"));

  // ---- figure 1 at its defaults: all stocks, last ten years highlighted
  check(`the defaults are all stocks and the last ten years @${width}`, (await on("el-rule", "all")) === "true" && (await val("#el-k")) === "10");
  check(`readouts: 35.2 effective years, 41% of the variance and 34% of the exposure in the last ten, 28.6 in all @${width}`,
    (await R("el-r-neff")) === "35.2" && (await R("el-r-var")) === "41%" && (await R("el-r-exp")) === "34%" && (await R("el-r-sum")) === "28.6");
  check(`and the simulation: spread 0.821, median 144.7, 5th percentile 41.1 @${width}`, (await R("el-r-sd")) === "0.821" && (await R("el-r-med")) === "144.7" && (await R("el-r-p5")) === "41.1");
  {
    const B = await barsPct();
    check(`forty bars are drawn, and they read 7% in year 1, 53% in year 10, 79% in year 20, 93% in year 30, 100% in year 40 @${width}`,
      B.length === 40 && near(B[0], 7.0, 0.8) && near(B[9], 52.7, 0.8) && near(B[19], 79.5, 0.8) && near(B[29], 93.1, 0.8) && near(B[39], 100, 0.8), [B[0], B[9], B[19], B[29], B[39]].map((v) => v.toFixed(1)).join(" "));
    check(`the bars rise every year @${width}`, B.every((v, i) => i === 0 || v > B[i - 1]));
    const ev = await evenPct();
    check(`the dashed line is at the even level, 71.4% @${width}`, near(ev, 71.4, 0.8), ev.toFixed(2));
    const red = await redBars();
    check(`the last ten bars are red, and only they @${width}`, red.length === 10 && red[0] === 31 && red[9] === 40, red.join(","));
    const l1 = await levPct(1), l40 = await levPct(40);
    check(`the upper chart draws all stocks as a flat line at 100% @${width}`, near(l1, 100, 1) && near(l40, 100, 1), `${l1.toFixed(1)} ${l40.toFixed(1)}`);
    // the highlight band spans exactly the last ten bars
    const band = await page.evaluate(() => { const r = document.querySelector("#fig-exposure svg.exp-panel rect.band").getBoundingClientRect(); const b31 = document.querySelector('#fig-exposure rect.bar[data-year="31"]').getBoundingClientRect(), b30 = document.querySelector('#fig-exposure rect.bar[data-year="30"]').getBoundingClientRect(), b40 = document.querySelector('#fig-exposure rect.bar[data-year="40"]').getBoundingClientRect(); return { l: r.left, r: r.right, b31: b31.left, b30: b30.right, b40: b40.right }; });
    check(`the shaded band starts between bars 30 and 31 and ends after bar 40 @${width}`, band.l > band.b30 - 0.5 && band.l < band.b31 + 0.5 && band.r > band.b40 - 0.5, JSON.stringify(band));
  }
  // the slider: the last twenty years
  await setRange(page, "#el-k", 20);
  check(`twenty years: 74% of the variance and 65% of the exposure in the last twenty, and the legend says so @${width}`,
    (await R("el-r-var")) === "74%" && (await R("el-r-exp")) === "65%" && (await page.locator("#fig-exposure .legend").textContent()).includes("last 20 years") && (await redBars()).length === 20);
  await setRange(page, "#el-k", 5);
  check(`five years: 5 red bars, 17% of the exposure and 21% of the variance in them @${width}`, (await redBars()).length === 5 && (await R("el-r-exp")) === "17%" && (await R("el-r-var")) === "21%", `${await R("el-r-exp")} ${await R("el-r-var")}`);
  await setRange(page, "#el-k", 10);

  // cap 2
  await clickSeg("el-rule", "c2");
  check(`cap 2: 39.0 effective years, 26% of the exposure in the last ten, the same 28.6 in all @${width}`,
    (await R("el-r-neff")) === "39.0" && (await R("el-r-exp")) === "26%" && (await R("el-r-sum")) === "28.6");
  check(`and the simulation: spread 0.758, median 142.2, 5th percentile 46.9 @${width}`, (await R("el-r-sd")) === "0.758" && (await R("el-r-med")) === "142.2" && (await R("el-r-p5")) === "46.9");
  {
    const B = await barsPct();
    check(`the bars read 18% in year 1 and 75% from year 6 to year 40 @${width}`, near(B[0], 17.9, 0.8) && B.slice(5).every((v) => near(v, 75, 0.8)) && B[4] < 74.5, [B[0], B[4], B[5], B[39]].map((v) => v.toFixed(1)).join(" "));
    const l = [await levPct(1), await levPct(5), await levPct(6), await levPct(16), await levPct(17), await levPct(40)];
    check(`the upper chart: 200% in years 1 and 5, below 200% in year 6, above 100% in year 16 and below it in year 17, 75% in year 40 @${width}`,
      near(l[0], 200, 1.5) && near(l[1], 200, 1.5) && l[2] < 199 && l[3] > 100 && l[4] < 100 && near(l[5], 75, 1.5), l.map((v) => v.toFixed(1)).join(" "));
    const ev = await evenPct();
    check(`the dashed line has not moved, 71.4% @${width}`, near(ev, 71.4, 0.8), ev.toFixed(2));
  }
  // cap 3, cap 1.5, glide
  await clickSeg("el-rule", "c3");
  check(`cap 3: 39.6 effective years, and the line starts at 300% @${width}`, (await R("el-r-neff")) === "39.6" && near(await levPct(1), 300, 1.5), (await levPct(1)).toFixed(1));
  await clickSeg("el-rule", "c15");
  check(`cap 1.5: 38.2 effective years, and the line starts at 150% @${width}`, (await R("el-r-neff")) === "38.2" && near(await levPct(1), 150, 1.5), (await levPct(1)).toFixed(1));
  await clickSeg("el-rule", "glide");
  check(`glide path: 37.1 effective years, total exposure 16.1, spread 0.467, median 109.7, 5th percentile 54.4 @${width}`,
    (await R("el-r-neff")) === "37.1" && (await R("el-r-sum")) === "16.1" && (await R("el-r-sd")) === "0.467" && (await R("el-r-med")) === "109.7" && (await R("el-r-p5")) === "54.4");
  {
    const l1 = await levPct(1), l40 = await levPct(40), ev = await evenPct();
    check(`the upper chart falls from 90% to 40%, and the dashed line drops to 40.2% @${width}`, near(l1, 90, 1.5) && near(l40, 40, 1.5) && near(ev, 40.2, 0.8), `${l1.toFixed(1)} ${l40.toFixed(1)} ${ev.toFixed(1)}`);
    const B = await barsPct();
    check(`its bars stay below 50% and peak in the middle years @${width}`, Math.max(...B) < 50 && B.indexOf(Math.max(...B)) > 12 && B.indexOf(Math.max(...B)) < 30, `${Math.max(...B).toFixed(1)} at ${B.indexOf(Math.max(...B)) + 1}`);
  }
  await clickSeg("el-rule", "all");

  // ---- figure 2: the cap
  const cpts = async (id) => pts(`#fig-cap path.series[data-series="${id}"]`);
  const capScales = async () => { const sc = await scales("#fig-cap svg.cap-panel"); return { X: lin(sc.xs), Y: lin(sc.ys) }; };
  const dotPct = async (id) => { const { Y } = await capScales(); return Y.val(await nattr(`#fig-cap circle.dot[data-series="${id}"]`, "cy")); };
  check(`figure 2 starts at a cap of 2 to 1 @${width}`, (await on("cl-cap", 2)) === "true");
  check(`readouts: 2.0 to 1 in year 1, 39.0 effective years, spread −8%, 5th percentile +14%, median −2% @${width}`,
    (await R("cl-r-e1")) === "2.0 to 1" && (await R("cl-r-neff")) === "39.0" && (await R("cl-r-sd")) === "−8%" && (await R("cl-r-p5")) === "+14%" && (await R("cl-r-med")) === "−2%");
  {
    const { X, Y } = await capScales();
    const d = [await dotPct("sd"), await dotPct("p5"), await dotPct("med")];
    check(`the dots read −7.8%, +14.1% and −1.7% @${width}`, near(d[0], -7.8, 0.6) && near(d[1], 14.1, 0.6) && near(d[2], -1.7, 0.6), d.map((v) => v.toFixed(2)).join(" "));
    const mk = await nattr("#fig-cap line.cap-marker", "x1");
    check(`the marker is at a cap of 2 @${width}`, near(X.val(mk), 2, 0.03), X.val(mk).toFixed(3));
    const P = { sd: await cpts("sd"), p5: await cpts("p5"), med: await cpts("med") };
    const at1 = (p) => Y.val(p[0][1]), at4 = (p) => Y.val(p[p.length - 1][1]);
    check(`all three lines start at 0% for no leverage @${width}`, [P.sd, P.p5, P.med].every((p) => near(at1(p), 0, 0.3) && near(X.val(p[0][0]), 1, 0.03)), [P.sd, P.p5, P.med].map((p) => at1(p).toFixed(2)).join(" "));
    check(`and end at −9.5%, +16.6% and −2.6% at a cap of 4 @${width}`, near(at4(P.sd), -9.5, 0.6) && near(at4(P.p5), 16.6, 0.6) && near(at4(P.med), -2.6, 0.6) && near(X.val(P.sd[P.sd.length - 1][0]), 4, 0.03), [P.sd, P.p5, P.med].map((p) => at4(p).toFixed(2)).join(" "));
    const mono = (p, sign) => p.every((q, i) => i === 0 || sign * (q[1] - p[i - 1][1]) >= -1e-6);
    check(`the spread and the median fall with the cap and the 5th percentile rises (pixel y goes up for a fall) @${width}`, mono(P.sd, +1) && mono(P.med, +1) && mono(P.p5, -1));
    const zl = await nattr("#fig-cap line.zero-line", "y1");
    check(`the zero line is drawn at 0% @${width}`, near(Y.val(zl), 0, 0.4));
  }
  await clickSeg("cl-cap", 1);
  check(`no leverage: 1.0 to 1, 35.2 effective years, no change in anything @${width}`, (await R("cl-r-e1")) === "1.0 to 1" && (await R("cl-r-neff")) === "35.2" && (await R("cl-r-sd")) === "0%" && (await R("cl-r-p5")) === "0%" && (await R("cl-r-med")) === "0%");
  await clickSeg("cl-cap", 4);
  check(`a cap of 4: 39.8 effective years, spread −9%, 5th percentile +17%, median −3% @${width}`, (await R("cl-r-neff")) === "39.8" && (await R("cl-r-sd")) === "−9%" && (await R("cl-r-p5")) === "+17%" && (await R("cl-r-med")) === "−3%", `${await R("cl-r-sd")} ${await R("cl-r-p5")} ${await R("cl-r-med")}`);
  {
    const { X } = await capScales();
    const mk = await nattr("#fig-cap line.cap-marker", "x1");
    check(`the marker moved to 4 @${width}`, near(X.val(mk), 4, 0.03), X.val(mk).toFixed(3));
  }
  await clickSeg("cl-cap", 1.5);
  check(`a cap of 1.5: 38.2 effective years, spread −6% @${width}`, (await R("cl-r-neff")) === "38.2" && (await R("cl-r-sd")) === "−6%");
  await clickSeg("cl-cap", 3);
  check(`a cap of 3: 39.6 effective years @${width}`, (await R("cl-r-neff")) === "39.6");
  await clickSeg("cl-cap", 2);

  if (SHOTS) {
    for (const id of await page.evaluate(() => [...document.querySelectorAll(".fin-card, #guess")].map((c) => c.id))) {
      await page.locator("#" + id).screenshot({ path: `${SHOTS}/${vp.name}-${id}.png` });
    }
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
  }

  const g1 = await geom();
  ok(at("no NaN/undefined/Infinity in SVG geometry after the interactions"), g1.length === 0, g1.slice(0, 3).join("; "));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${vp.name}-full.png`, fullPage: true });
  ok(at("no page errors or console errors"), noise.length === 0, noise.slice(0, 3).join(" | "));
  await page.close();
}

await browser.close();
if (fails.length) {
  console.log(`\n${fails.length} FAILED of ${pass + fails.length}:`);
  for (const f of fails) console.log("  FAIL " + f);
  process.exit(1);
}
console.log(`\nALL ${pass} CHECKS PASS`);
