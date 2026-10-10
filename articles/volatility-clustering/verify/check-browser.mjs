/*
  Browser checks for volatility-clustering at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8794 SHOTS=/tmp/volatility-clustering-shots node verify/check-browser.mjs

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

  // ---- the guess card
  await click('#guess button[data-g="1987"]');
  {
    const t = (await txt("#guess-answer")).replace(/\s+/g, " ");
    check(`a wrong guess is told 1955, with 16.2 and 6.1 against 14.2 and 8.5 @${width}`, t.startsWith("It was 1955.") && /1987 was 16\.2 standard deviations and 1955 only 6\.1/.test(t) && /1955 was 14\.2 and 1987 8\.5/.test(t), t.slice(0, 120));
  }
  await click('#guess button[data-g="1955"]');
  check(`the right one is confirmed @${width}`, (await txt("#guess-answer")).startsWith("That's right, 1955."));

  // ---- memory in the sign and in the size
  const AP = ".acf-panel";
  check(`at one day: returns 0.046, sizes 0.302 @${width}`, (await R("af-r-lag")) === "1" && (await R("af-r-ret")) === "0.046" && (await R("af-r-abs")) === "0.302", `${await R("af-r-ret")} ${await R("af-r-abs")}`);
  {
    const Y = lin((await scales(AP)).ys);
    check(`the dots sit at the readouts @${width}`, Math.abs(Y.val(await nattr(`${AP} circle.dot-abs`, "cy")) - 0.302) < 0.004 && Math.abs(Y.val(await nattr(`${AP} circle.dot-ret`, "cy")) - 0.046) < 0.004);
    const ab = await pts(`${AP} path.abs`);
    check(`the blue line falls from 0.30 to about 0.07 at 500 days @${width}`, Math.abs(Y.val(ab[0][1]) - 0.302) < 0.004 && Math.abs(Y.val(ab[ab.length - 1][1]) - 0.07) < 0.006);
    const band = await pts(`${AP} path.band`);
    const top = Math.min(...band.map((p) => p[1])), bot = Math.max(...band.map((p) => p[1]));
    check(`the grey band spans about ±0.03 at its widest @${width}`, Math.abs(Y.val(top) - 0.031) < 0.003 && Math.abs(Y.val(bot) + 0.031) < 0.003, `${Y.val(top).toFixed(3)} ${Y.val(bot).toFixed(3)}`);
  }
  {
    const i252 = await page.evaluate(() => 0); // index found by scanning the slider below
    let found = -1;
    for (let i = 0; i < 40 && found < 0; i++) { await setRange(page, "#af-lag", i); if ((await R("af-r-lag")) === "252") found = i; }
    check(`a year apart: sizes 0.108 @${width}`, found >= 0 && (await R("af-r-abs")) === "0.108", await R("af-r-abs"));
    await setRange(page, "#af-lag", 0);
  }

  // ---- three years with the band
  const VP = ".vol-panel";
  check(`around 1987: 48 of 759 outside, the crash at −16.2 and −8.5 @${width}`, (await R("vl-r-out")) === "48 of 759 (6.3%)" && (await R("vl-r-big")) === "19 Oct 1987, −17.4%" && (await R("vl-r-raw")) === "−16.2" && (await R("vl-r-garch")) === "−8.5", `${await R("vl-r-out")} | ${await R("vl-r-big")} | ${await R("vl-r-raw")} ${await R("vl-r-garch")}`);
  check(`759 days are drawn and 48 of them pink @${width}`, (await has(`${VP} line.day`)) === 759 && (await has(`${VP} line.day.out`)) === 48);
  {
    const Y = lin((await scales(VP)).ys);
    const band = await pts(`${VP} path.band`);
    const half = band.length / 2, up = band.slice(0, half), dn = band.slice(half).reverse();
    const days = await page.$$eval(`${VP} line.day`, (ls) => ls.map((l) => ({ x: +l.getAttribute("x1"), y: +l.getAttribute("y2"), out: l.classList.contains("out") })));
    const wrong = days.filter((d, j) => { const u = up[j][1], v = dn[j][1]; const outside = d.y < u - 0.01 || d.y > v + 0.01; return outside !== d.out && Math.abs(d.y - u) > 0.3 && Math.abs(d.y - v) > 0.3; });
    check(`every pink line ends outside the band and every grey one inside @${width}`, wrong.length === 0 && up.length === days.length, `${wrong.length} wrong`);
    const crash = days.reduce((a, b) => (b.y > a.y ? b : a));
    check(`the crash's line reaches −17.4% on the axis @${width}`, Math.abs(Y.val(crash.y) + 17.41) < 0.2, Y.val(crash.y).toFixed(2));
  }
  await clickSeg("vl-period", "calm");
  check(`1964: a quiet market, Kennedy's reopening at 3.6 and 3.4 @${width}`, (await R("vl-r-out")).startsWith("17 of 756") && (await R("vl-r-big")).startsWith("26 Nov 1963") && (await R("vl-r-raw")) === "3.6" && (await R("vl-r-garch")) === "3.4", `${await R("vl-r-out")} ${await R("vl-r-big")}`);
  await clickSeg("vl-period", "y2020");
  check(`2020: 16 March, −12.0%, only −2.3 of its forecast @${width}`, (await R("vl-r-big")) === "16 Mar 2020, −12.0%" && (await R("vl-r-garch")) === "−2.3");
  await clickSeg("vl-period", "y1987");

  // ---- the ten biggest days
  const RP = ".rank-panel";
  const labels = async () => page.$$eval(`${RP} text.row-label`, (ts) => ts.map((t) => t.textContent));
  {
    const L = await labels();
    check(`by the forecast: 1955 first at 14.2, 1987 fourth at 8.5 @${width}`, L.length === 10 && L[0] === "1. 26 September 1955, −6.5%: 14.2 sd" && L[1].startsWith("2. 13 October 1989") && L[2].startsWith("3. 26 June 1950") && L[3] === "4. 19 October 1987, −17.4%: 8.5 sd", L.slice(0, 4).join(" | "));
    const sc = await scales(RP), X = lin(sc.xs);
    const w0 = await nattr(`${RP} rect.bar`, "width"), x0 = await nattr(`${RP} rect.bar`, "x");
    check(`the first bar is 14.2 long on the axis @${width}`, Math.abs(X.val(x0 + w0) - 14.23) < 0.08, X.val(x0 + w0).toFixed(2));
    const fills = await page.$$eval(`${RP} rect.bar`, (rs) => rs.map((r) => r.getAttribute("fill")));
    check(`falls are pink @${width}`, fills[0] === "var(--c2)" && fills[3] === "var(--c2)");
  }
  await clickSeg("rf-ruler", "raw");
  {
    const L = await labels();
    check(`by the century: 1987 first at 16.2, 16 March 2020 in the list @${width}`, L[0] === "1. 19 October 1987, −17.4%: 16.2 sd" && L.some((l) => l.includes("16 March 2020")) && !L.some((l) => l.includes("1955")), L[0]);
  }
  await clickSeg("rf-ruler", "garch");

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
