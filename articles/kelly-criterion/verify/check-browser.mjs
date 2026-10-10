/*
  Browser checks for kelly-criterion at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8794 SHOTS=/tmp/kelly-criterion-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn bars, lines and dots back from the pixels.
*/
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://127.0.0.1:8794";
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
  const R = (id) => txt(`#${id} .value`);
  const has = (sel) => page.locator(sel).count();
  // read a drawn chart back: tick labels give the scales, paths and circles give the marks
  const scales = (svg) => page.evaluate((svg) => {
    const el = document.querySelector(svg);
    const num = (t) => parseFloat(t.replace("−", "-").replace(/[%,$¢]/g, ""));
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
  // the path's numbers are printed to two decimals, so clamp to its ends
  const yAt = (poly, px) => { const x = Math.min(Math.max(px, poly[0][0]), poly[poly.length - 1][0]); for (let i = 1; i < poly.length; i++) { const [x0, y0] = poly[i - 1], [x1, y1] = poly[i]; if (x >= x0 - 1e-6 && x <= x1 + 1e-6) return y0 + ((x - x0) / (x1 - x0 || 1)) * (y1 - y0); } return NaN; };
  const attr = (sel, a) => page.locator(sel).first().getAttribute(a);
  const nattr = async (sel, a) => +(await attr(sel, a));
  const readAt = async (svg, sel, xv) => { const sc = await scales(svg), X = lin(sc.xs), Y = lin(sc.ys); return Y.val(yAt(await pts(sel), X.px(xv))); };
  const click = async (sel) => { await page.click(sel); await settle(page); };

  // a log axis labelled 1¢, $1, $100, $10k, $1M (or 0.01×, 1×, 100×): read values and pixels
  const logTicksOf = (svg) => page.evaluate((svg) => {
    const el = document.querySelector(svg);
    const val = (t) => { t = t.replace("−", "-").trim(); if (t.endsWith("¢")) return parseFloat(t) / 100; let k = 1; if (/k$/.test(t)) k = 1e3; if (/M$/.test(t)) k = 1e6; return parseFloat(t.replace(/[$×kM,]/g, "")) * k; };
    return [...el.querySelectorAll(".axis-y text.tick-label")].map((t) => ({ v: val(t.textContent), p: +t.getAttribute("y") - 4 }));
  }, svg);
  const logLin = (t) => { const a = t[0], b = t[t.length - 1]; const k = (b.p - a.p) / (Math.log10(b.v) - Math.log10(a.v)); return { px: (v) => a.p + (Math.log10(v) - Math.log10(a.v)) * k, val: (p) => Math.pow(10, Math.log10(a.v) + (p - a.p) / k) }; };
  const lastPt = (d) => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); return [n[n.length - 2], n[n.length - 1]]; };

  // ---- the coin game
  const CP = ".coin-panel";
  check(`61 players are drawn @${width}`, (await has(`${CP} path.player`)) === 61);
  check(`the lab opens at 50% @${width}`, (await val("#cl-share")) === "50");
  {
    const beh = parseInt(await R("cl-r-behind"));
    check(`at 50% most of the 61 end behind @${width}`, beh > 30, String(beh));
  }
  await setRange(page, "#cl-share", 20);
  check(`at 20%: middle player $10,504, 3 behind, 57 reached $250 @${width}`, (await R("cl-r-median")) === "$10,504" && (await R("cl-r-behind")) === "3 of 61" && (await R("cl-r-cap")) === "57 of 61", `${await R("cl-r-median")} ${await R("cl-r-behind")} ${await R("cl-r-cap")}`);
  {
    const Y = logLin(await logTicksOf(CP));
    const ends = (await page.$$eval(`${CP} path.player`, (ps) => ps.map((p) => p.getAttribute("d")))).map((d) => lastPt(d)[1]).sort((a, b) => a - b);
    const typ = lastPt(await attr(`${CP} path.typical`, "d"))[1];
    check(`the blue line ends at the middle player's money @${width}`, Math.abs(typ - ends[30]) < 0.6, `${typ} vs ${ends[30]}`);
    check(`and that reads $10,504 on the axis @${width}`, Math.abs(Y.val(typ) / 10504 - 1) < 0.03, Y.val(typ).toFixed(0));
    const start = await nattr(`${CP} line.start`, "y1"), cap = await nattr(`${CP} line.cap`, "y1");
    check(`the dashed line is at $25 and the green one at $250 @${width}`, Math.abs(Y.val(start) / 25 - 1) < 0.02 && Math.abs(Y.val(cap) / 250 - 1) < 0.02);
    const first = (await attr(`${CP} path.typical`, "d")).match(/-?\d+(\.\d+)?/g).map(Number)[1];
    check(`every path starts on the $25 line @${width}`, Math.abs(first - start) < 0.6);
  }
  await setRange(page, "#cl-share", 50);

  // ---- growth per flip
  const GP = ".growth-panel";
  {
    const p = await pts(`${GP} path.typical`);
    const top = p.reduce((a, b) => (b[1] < a[1] ? b : a));
    const kx = await nattr(`${GP} circle.kelly`, "cx"), ky = await nattr(`${GP} circle.kelly`, "cy");
    check(`Kelly's open dot sits on the peak of the blue curve @${width}`, Math.abs(top[1] - ky) < 0.5 && Math.abs(yAt(p, kx) - ky) < 0.5, `${top} vs ${kx},${ky}`);
    const sc = await scales(GP), X = lin(sc.xs), Y = lin(sc.ys);
    check(`and the peak is at 20% and about 2% a flip @${width}`, Math.abs(X.val(kx) - 20) < 0.3 && Math.abs(Y.val(ky) - 2.01) < 0.05, `${X.val(kx).toFixed(2)} ${Y.val(ky).toFixed(2)}`);
    const zx = await nattr(`${GP} line.zero-tick`, "x1"), y0 = await nattr(`${GP} line.zero`, "y1");
    check(`the blue curve crosses zero at the tick, 38.9% @${width}`, Math.abs(yAt(p, zx) - y0) < 0.6 && Math.abs(X.val(zx) - 38.9) < 0.2, `${X.val(zx).toFixed(2)}`);
    const pm = await pts(`${GP} path.mean`);
    check(`the pink curve keeps rising @${width}`, pm.every((q, i) => i === 0 || q[1] <= pm[i - 1][1] + 1e-6));
  }
  check(`the readouts open at Kelly's 20% @${width}`, (await R("gf-r-g")) === "2.01%" && (await R("gf-r-med")) === "$10,504");
  await setRange(page, "#gf-share", 40);
  check(`at 40% the typical player shrinks @${width}`, (await R("gf-r-g")).startsWith("−"), await R("gf-r-g"));
  await setRange(page, "#gf-share", 20);

  // ---- the guess card
  await click('#guess button[data-g="99"]');
  check(`a wrong guess gets "only about two thirds", 65% @${width}`, (await txt("#guess-answer")).startsWith("It's only about two thirds.") && /ahead 65% of the time/.test((await txt("#guess-answer")).replace(/\s+/g, " ")));
  await click('#guess button[data-g="65"]');
  check(`the right one is confirmed @${width}`, (await txt("#guess-answer")).startsWith("That's right"));

  // ---- the race
  const RP = ".race-paths", RC = ".race-chance";
  check(`40 pairs are drawn @${width}`, (await has(`${RP} path.pair`)) === 40);
  check(`half Kelly, 30 years: 65%, 26 of 40 ahead, 341 years for 9 in 10 @${width}`, (await R("rl-r-chance")) === "65%" && (await R("rl-r-pairs")) === "26 ahead" && (await R("rl-r-90")) === "341", `${await R("rl-r-chance")} ${await R("rl-r-pairs")} ${await R("rl-r-90")}`);
  const countAbove = async () => {
    const sx = await nattr(`${RP} line.scrub`, "x1"), y1 = await nattr(`${RP} line.even`, "y1");
    const ds = await page.$$eval(`${RP} path.pair`, (ps) => ps.map((p) => p.getAttribute("d")));
    return ds.map((d) => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); const o = []; for (let i = 0; i + 1 < n.length; i += 2) o.push([n[i], n[i + 1]]); return yAt(o, sx); }).filter((y) => y < y1 - 1e-6).length;
  };
  check(`26 lines are above 1 at the scrubber @${width}`, (await countAbove()) === 26);
  {
    const sc = await scales(RC), X = lin(sc.xs), Y = lin(sc.ys);
    const cx = await nattr(`${RC} circle.dot`, "cx"), cy = await nattr(`${RC} circle.dot`, "cy");
    check(`the dot is on the curve, at 30 years and 65% @${width}`, Math.abs(yAt(await pts(`${RC} path.chance`), cx) - cy) < 0.6 && Math.abs(X.val(cx) - 30) < 0.5 && Math.abs(Y.val(cy) - 64.8) < 0.6);
    const Y1 = logLin(await logTicksOf(RP));
    check(`the black line is at 1× @${width}`, Math.abs(Y1.val(await nattr(`${RP} line.even`, "y1")) - 1) < 0.01);
  }
  await setRange(page, "#rl-year", 94);
  check(`94 years: 75%, 30 ahead @${width}`, (await R("rl-r-chance")) === "75%" && (await R("rl-r-pairs")) === "30 ahead" && (await countAbove()) === 30);
  await setRange(page, "#rl-year", 162);
  check(`162 years: 81% @${width}`, (await R("rl-r-chance")) === "81%");
  await clickSeg("rl-rival", "2");
  check(`against twice Kelly the 9-in-10 time falls to 85 years @${width}`, (await R("rl-r-90")) === "85", await R("rl-r-90"));
  await clickSeg("rl-rival", "0.5");
  await setRange(page, "#rl-year", 30);

  // ---- how far down
  const DP = ".drawdown-panel";
  check(`full Kelly over an endless future: halving 50.0%, losing 90% 10.0% @${width}`, (await R("dl-r-half")) === "50.0%" && (await R("dl-r-tenth")) === "10.0%");
  {
    const p = await pts(`${DP} path.curve`);
    const x1 = await nattr(`${DP} line.diagonal`, "x1"), y1 = await nattr(`${DP} line.diagonal`, "y1"), x2 = await nattr(`${DP} line.diagonal`, "x2"), y2 = await nattr(`${DP} line.diagonal`, "y2");
    const off = Math.max(...p.map(([x, y]) => Math.abs(y - (y1 + ((x - x1) / (x2 - x1)) * (y2 - y1)))));
    check(`at full Kelly the blue curve lies on the dashed diagonal @${width}`, off < 0.6, off.toFixed(2) + "px");
  }
  await setRange(page, "#dl-c", 0.5);
  check(`half Kelly: 12.5%, 0.1%, 75% of the growth, volatility 13.9% @${width}`, (await R("dl-r-half")) === "12.5%" && (await R("dl-r-tenth")) === "0.1%" && (await R("dl-r-kept")) === "75%" && (await R("dl-r-vol")) === "13.9%");
  {
    const p = await pts(`${DP} path.curve`);
    const hx = await nattr(`${DP} circle.half`, "cx"), hy = await nattr(`${DP} circle.half`, "cy");
    const x1 = await nattr(`${DP} line.diagonal`, "x1"), y1 = await nattr(`${DP} line.diagonal`, "y1"), x2 = await nattr(`${DP} line.diagonal`, "x2"), y2 = await nattr(`${DP} line.diagonal`, "y2");
    check(`the halving dot is on the curve, which is now below the diagonal @${width}`, Math.abs(yAt(p, hx) - hy) < 0.6 && hy > y1 + ((hx - x1) / (x2 - x1)) * (y2 - y1) + 20);
  }
  await setRange(page, "#dl-c", 1);
  await clickSeg("dl-h", "30");
  check(`full Kelly within 30 years: 42.2% @${width}`, (await R("dl-r-half")) === "42.2%", await R("dl-r-half"));
  await clickSeg("dl-h", "ever");

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
