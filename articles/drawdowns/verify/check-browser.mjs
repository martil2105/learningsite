/*
  Browser checks for drawdowns at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8796 SHOTS=/tmp/drawdowns-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions and
  reads the drawn paths, curves and lines back through their axes.
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

  // --------------------------------------------------------- drawdowns checks
  const logAxis = (t) => { const a = t[0], b = t[t.length - 1]; const k = (b.p - a.p) / (Math.log10(b.v) - Math.log10(a.v)); return { px: (v) => a.p + (Math.log10(v) - Math.log10(a.v)) * k, val: (p) => Math.pow(10, Math.log10(a.v) + (p - a.p) / k) }; };
  const shoelace = (p) => { let a = 0; for (let i = 0; i < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length]; a += x0 * y1 - x1 * y0; } return Math.abs(a) / 2; };

  // ---- the guess card
  await click('#guess button[data-g="5"]');
  check(`a wrong guess is told it's a coin toss, 50% @${width}`, /^It's a coin toss\. The chance is 50%\. Before either decade happens/.test((await txt("#guess-answer")).replace(/\s+/g, " ")), await txt("#guess-answer"));
  await click('#guess button[data-g="50"]');
  check(`the right one is confirmed @${width}`, (await txt("#guess-answer")).startsWith("That's right, it's a coin toss."));

  // ---- the path lab
  const DD = ".dd-panel";
  check(`the first path: backtest worst 28.9%, gone past in live year 4.9, live worst 35.6% @${width}`, (await R("pl-bt")) === "28.9%" && (await R("pl-first")) === "live year 4.9" && (await R("pl-live")) === "35.6%", [await R("pl-bt"), await R("pl-first"), await R("pl-live")].join(" | "));
  const dotPast = async () => {
    const cy = await nattr(`${DD} circle.beaten`, "cy"), ly = await nattr(`${DD} line.bt-worst`, "y1");
    const sc = await scales(DD), X = lin(sc.xs);
    return { past: cy >= ly - 0.01, year: X.val(await nattr(`${DD} circle.beaten`, "cx")) };
  };
  {
    const d = await dotPast();
    check(`the pink dot is past the dashed line at year 14.9 @${width}`, d.past && Math.abs(d.year - 14.9) < 0.15, JSON.stringify(d));
    const stair = await pts(`${DD} path.stair.live`);
    check(`the live staircase only ever goes down the chart @${width}`, stair.every((p, i) => i === 0 || p[1] >= stair[i - 1][1] - 0.01));
    const area = await pts(`${DD} path.dd-area.live`);
    check(`the shading reaches the staircase's deepest step @${width}`, Math.abs(Math.max(...area.map((p) => p[1])) - stair[stair.length - 1][1]) < 0.6);
    const Y = lin((await scales(DD)).ys);
    check(`the dashed line reads 28.9% @${width}`, Math.abs(-Y.val(await nattr(`${DD} line.bt-worst`, "y1")) - 28.9) < 0.4, `${Y.val(await nattr(`${DD} line.bt-worst`, "y1"))}`);
  }
  await clickSeg("pl-sr", "0");
  check(`with no edge the same days fall further @${width}`, parseFloat(await R("pl-live")) > 35.6);
  await clickSeg("pl-sr", "0.5");
  await click("#pl-again");
  check(`the second path takes 13.3 live years @${width}`, (await R("pl-first")) === "live year 13.3", await R("pl-first"));
  await click("#pl-again");
  check(`the third path doesn't go past in 30 years, and has no dot @${width}`, (await R("pl-first")) === "not in 30 years" && (await has(`${DD} circle.beaten`)) === 0);
  await click("#pl-again"); await click("#pl-again"); await click("#pl-again");
  check(`and the button comes back round to the first path @${width}`, (await R("pl-bt")) === "28.9%");

  // ---- the scale figure
  const SP = ".scale-panel";
  check(`Sharpe 0.5: 13.6%, 29.5%, 40.8% @${width}`, (await R("sc-1")) === "13.6%" && (await R("sc-10")) === "29.5%" && (await R("sc-40")) === "40.8%");
  {
    const sc = await scales(SP), X = logAxis(sc.xs), Y = lin(sc.ys);
    const rd = async (cls, T) => Y.val(yAt(await pts(`${SP} path.med.${cls}`), X.px(T)));
    check(`the drawn curves read 42.0% (no edge) and 29.5% (Sharpe 0.5) at ten years @${width}`, Math.abs((await rd("sr0", 10)) - 42.0) < 0.6 && Math.abs((await rd("sr05", 10)) - 29.5) < 0.6, `${(await rd("sr0", 10)).toFixed(2)} ${(await rd("sr05", 10)).toFixed(2)}`);
  }
  await clickSeg("sc-view", "scaled");
  {
    const master = await pts(`${SP} path.master`);
    let worst = 0;
    for (const cls of ["sr025", "sr05", "sr1"]) for (const [x, y] of await pts(`${SP} path.med.${cls}`)) worst = Math.max(worst, Math.abs(yAt(master, x) - y));
    check(`in the strategy's own units, all three curves lie on the grey line @${width}`, worst < 1, `${worst.toFixed(2)}px`);
    check(`and the no-edge curve isn't drawn there @${width}`, (await has(`${SP} path.med.sr0`)) === 0);
  }
  await clickSeg("sc-view", "years");

  // ---- live against the backtest
  const NP = ".next-panel";
  check(`ten years, Sharpe 0.5: 4.0%, 50.0%, 68.4% @${width}`, (await R("nf-1")) === "4.0%" && (await R("nf-same")) === "50.0%" && (await R("nf-double")) === "68.4%");
  {
    const sc = await scales(NP), X = lin(sc.xs), Y = lin(sc.ys);
    check(`the dot sits at ten years and 50% @${width}`, Math.abs(X.val(await nattr(`${NP} circle.mid`, "cx")) - 10) < 0.1 && Math.abs(Y.val(await nattr(`${NP} circle.mid`, "cy")) - 50) < 0.3);
    check(`the curve passes through it @${width}`, Math.abs(Y.val(yAt(await pts(`${NP} path.beat.b10`), X.px(10))) - 50) < 0.3);
  }
  await clickSeg("nf-b", "5");
  check(`five years: 10.8%, 50.0%, 69.0% @${width}`, (await R("nf-1")) === "10.8%" && (await R("nf-same")) === "50.0%" && (await R("nf-double")) === "69.0%");
  await clickSeg("nf-b", "20");
  check(`twenty years: 1.1%, 50.0%, 67.9% @${width}`, (await R("nf-1")) === "1.1%" && (await R("nf-same")) === "50.0%" && (await R("nf-double")) === "67.9%");
  await clickSeg("nf-b", "10");
  await clickSeg("nf-sr", "0");
  check(`no edge: 1.8%, 50.0%, 72.8% @${width}`, (await R("nf-1")) === "1.8%" && (await R("nf-same")) === "50.0%" && (await R("nf-double")) === "72.8%");
  await clickSeg("nf-sr", "0.5");

  // ---- how deep
  const DP2 = ".deep-panel";
  check(`five years: the line at 40.6%, 5.0% and 24.1% @${width}`, (await val("#df-thr")) === "0.406" && (await R("df-working")) === "5.0%" && (await R("df-dead")) === "24.1%", [await val("#df-thr"), await R("df-working"), await R("df-dead")].join(" "));
  {
    const X = lin((await scales(DP2)).xs);
    check(`the line is drawn at 40.6% @${width}`, Math.abs(X.val(await nattr(`${DP2} line.thr`, "x1")) - 40.6) < 0.2);
    const whole = await pts(`${DP2} path.dens.working`), tail = await pts(`${DP2} path.tail.working`);
    const y0 = tail[0][1];
    const under = shoelace([[whole[0][0], y0], ...whole, [whole[whole.length - 1][0], y0]]);
    check(`the blue shading holds about 5% of the area under the blue curve @${width}`, Math.abs(shoelace(tail) / under - 0.05) < 0.006, (shoelace(tail) / under).toFixed(4));
  }
  await clickSeg("df-t", "2");
  check(`two years: the line at 31.4%, 15.1% of dead ones @${width}`, (await val("#df-thr")) === "0.314" && (await R("df-dead")) === "15.1%");
  await clickSeg("df-t", "10");
  check(`ten years: the line at 47.3%, 35.4% of dead ones @${width}`, (await val("#df-thr")) === "0.473" && (await R("df-dead")) === "35.4%");
  await setRange(page, "#df-thr", 0.3);
  check(`a shallower line catches more of both @${width}`, parseFloat(await R("df-working")) > 5 && parseFloat(await R("df-dead")) > 35.4);
  await click("#df-rule");
  check(`the button puts the line back @${width}`, (await val("#df-thr")) === "0.473");
  await clickSeg("df-t", "5");

  // ---- the US market
  const UP = ".us-panel";
  check(`the US readouts: 84.1% from Sep 1929 to Jul 1932, back in Feb 1945, 50.9% and 74.1% @${width}`, (await R("us-worst")) === "84.1%, Sep 1929 to Jul 1932" && (await R("us-back")) === "Feb 1945" && (await R("us-walk")) === "50.9% typical, 1 in 100 past 74.1%", [await R("us-worst"), await R("us-back"), await R("us-walk")].join(" | "));
  {
    const Y = lin((await scales(UP)).ys);
    const area = await pts(`${UP} path.us-area`);
    check(`the deepest dip reads 84.1% @${width}`, Math.abs(-Y.val(Math.max(...area.map((p) => p[1]))) - 84.1) < 0.4);
    check(`the dashed line reads 50.9% and the dotted one 74.1% @${width}`, Math.abs(-Y.val(await nattr(`${UP} line.med`, "y1")) - 50.9) < 0.3 && Math.abs(-Y.val(await nattr(`${UP} line.p99`, "y1")) - 74.1) < 0.3);
  }

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
