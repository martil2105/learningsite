/*
  Browser checks for efficient-markets at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8794 SHOTS=/tmp/efficient-markets-shots node verify/check-browser.mjs

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

  const logTicksOf = (svg) => page.evaluate((svg) => {
    const el = document.querySelector(svg);
    const val = (t) => { t = t.replace("−", "-").trim(); if (t.endsWith("¢")) return parseFloat(t) / 100; let k = 1; if (/k$/.test(t)) k = 1e3; if (/M$/.test(t)) k = 1e6; return parseFloat(t.replace(/[$×kM,]/g, "")) * k; };
    return [...el.querySelectorAll(".axis-y text.tick-label")].map((t) => ({ v: val(t.textContent), p: +t.getAttribute("y") - 4 }));
  }, svg);
  const logLin = (t) => { const a = t[0], b = t[t.length - 1]; const k = (b.p - a.p) / (Math.log10(b.v) - Math.log10(a.v)); return { px: (v) => a.p + (Math.log10(v) - Math.log10(a.v)) * k, val: (p) => Math.pow(10, Math.log10(a.v) + (p - a.p) / k) }; };
  const lastPt = (d) => { const n = d.match(/-?\d+(\.\d+)?/g).map(Number); return [n[n.length - 2], n[n.length - 1]]; };
  const yScale = async (svg) => lin((await scales(svg)).ys);
  const barValue = async (svg, sel, Y) => { const y = await nattr(sel, "y"), h = await nattr(sel, "height"), z = Y.px(0); return Math.abs(y - z) < 0.5 ? -Y.val(z + h) * -1 : Y.val(y); };

  // ---- a century, five years at a time
  const HP = ".history-panel";
  check(`twenty windows are drawn, each with its band @${width}`, (await has(`${HP} rect.bar`)) === 20 && (await has(`${HP} rect.band`)) === 20);
  check(`it opens on 1967–71: 0.33, the rule 36.0%, the market 9.0% @${width}`, (await R("hb-r-win")) === "1967–71" && (await R("hb-r-rho")) === "0.33" && (await R("hb-r-rule")) === "36.0%" && (await R("hb-r-mkt")) === "9.0%", `${await R("hb-r-rho")} ${await R("hb-r-rule")} ${await R("hb-r-mkt")}`);
  {
    const Y = await yScale(HP);
    const top = Y.val(await nattr(`${HP} rect.bar[data-i="8"]`, "y"));
    check(`the picked bar reaches 0.33 on the axis @${width}`, Math.abs(top - 0.333) < 0.006, top.toFixed(3));
    const bandTop = Y.val(await nattr(`${HP} rect.band[data-i="8"]`, "y"));
    check(`and clears its band, which ends near 0.057 @${width}`, top > bandTop + 0.2 && Math.abs(bandTop - 2 / Math.sqrt(1234)) < 0.004, bandTop.toFixed(3));
    const z = Y.px(0), y18 = await nattr(`${HP} rect.bar[data-i="18"]`, "y"), h18 = await nattr(`${HP} rect.bar[data-i="18"]`, "height");
    check(`2017–21 hangs below zero to −0.23 @${width}`, Math.abs(y18 - z) < 0.5 && Math.abs(Y.val(y18 + h18) + 0.227) < 0.006, Y.val(y18 + h18).toFixed(3));
  }
  await clickSeg("hb-view", "rule");
  check(`the rule view has a market tick on every window @${width}`, (await has(`${HP} line.mkt`)) === 20 && (await has(`${HP} rect.band`)) === 0);
  {
    const Y = await yScale(HP);
    check(`the picked bar is the rule's 36.0% and its tick the market's 9.0% @${width}`, Math.abs(Y.val(await nattr(`${HP} rect.bar[data-i="8"]`, "y")) - 36.0) < 0.4 && Math.abs(Y.val(await nattr(`${HP} line.mkt[data-i="8"]`, "y1")) - 9.0) < 0.4);
  }
  await setRange(page, "#hb-pick", 18);
  check(`2017–21: −0.23 @${width}`, (await R("hb-r-rho")) === "−0.23");
  await clickSeg("hb-view", "rho");
  await setRange(page, "#hb-pick", 8);

  // ---- the variance ratio
  const VP = ".vr-panel";
  check(`1962–86: VR(2) 1.23, VR(21) 1.58, nine standard errors @${width}`, (await R("vf-r-2")) === "1.23" && (await R("vf-r-21")) === "1.58" && (await R("vf-r-z")) === "9.1", `${await R("vf-r-2")} ${await R("vf-r-21")} ${await R("vf-r-z")}`);
  {
    const Y = await yScale(VP);
    const dots = await page.$$eval(`${VP} circle.vr-dot`, (cs) => cs.map((c) => +c.getAttribute("cy")));
    check(`21 dots, the first at 1 and the last at 1.58 @${width}`, dots.length === 21 && Math.abs(Y.val(dots[0]) - 1) < 0.005 && Math.abs(Y.val(dots[20]) - 1.584) < 0.006);
    check(`the dashed line is at 1 @${width}`, Math.abs(Y.val(await nattr(`${VP} line.walk`, "y1")) - 1) < 0.003);
  }
  await clickSeg("vf-period", "2000");
  {
    const Y = await yScale(VP);
    const dots = await page.$$eval(`${VP} circle.vr-dot`, (cs) => cs.map((c) => +c.getAttribute("cy")));
    const band = await pts(`${VP} path.band`);
    const lowest = Math.max(...band.map((p) => p[1]));
    check(`2000–26: VR(21) 0.78, below the band @${width}`, (await R("vf-r-21")) === "0.78" && Math.abs(Y.val(dots[20]) - 0.779) < 0.006 && dots[20] > lowest, `${Y.val(dots[20]).toFixed(3)}`);
  }
  await clickSeg("vf-period", "1962");

  // ---- two ways to record a random walk
  const WD = ".world-days", WV = ".world-vr";
  check(`stale, 30%: lag-1 0.30, VR(21) 1.80 @${width}`, (await R("wl-r-rho")) === "0.30" && (await R("wl-r-vr")) === "1.80");
  {
    const Y = await yScale(WV);
    const th = await pts(`${WV} path.theory`);
    check(`the formula starts at 1 and ends at 1.80 @${width}`, Math.abs(Y.val(th[0][1]) - 1) < 0.01 && Math.abs(Y.val(th[th.length - 1][1]) - 1.799) < 0.01);
    check(`20 simulated dots @${width}`, (await has(`${WV} circle.sample`)) === 20);
    const s21 = parseFloat((await R("wl-r-vrs")).replace("−", "-")), cy = await page.$$eval(`${WV} circle.sample`, (cs) => +cs[cs.length - 1].getAttribute("cy"));
    check(`the last dot sits at the sample's VR(21) @${width}`, Math.abs(Y.val(cy) - s21) < 0.011, `${Y.val(cy).toFixed(3)} vs ${s21}`);
    const tr = await pts(`${WD} path.truth`), rc = await pts(`${WD} path.recorded`);
    check(`forty days of both prices, starting together at 100 @${width}`, tr.length === 41 && rc.length === 41 && Math.abs(tr[0][1] - rc[0][1]) < 0.01);
  }
  await setRange(page, "#wl-pi", 0);
  check(`with every stock trading, the recorded index is the random walk @${width}`, (await R("wl-r-rho")) === "0.00" && (await R("wl-r-vr")) === "1.00");
  {
    const tr = await pts(`${WD} path.truth`), rc = await pts(`${WD} path.recorded`);
    check(`and the two lines coincide @${width}`, tr.every((p, i) => Math.abs(p[1] - rc[i][1]) < 0.02));
  }
  await setRange(page, "#wl-pi", 0.3);
  await clickSeg("wl-kind", "bounce");
  check(`bounce, 1%: −0.17, VR(21) 0.68, Roll's spread about 1% @${width}`, (await R("wl-r-rho")) === "−0.17" && (await R("wl-r-vr")) === "0.68" && Math.abs(parseFloat(await R("wl-r-roll")) - 1) < 0.1, `${await R("wl-r-rho")} ${await R("wl-r-vr")} ${await R("wl-r-roll")}`);
  {
    const Y = await yScale(WV);
    const th = await pts(`${WV} path.theory`);
    check(`the bounce formula ends at 0.68 @${width}`, Math.abs(Y.val(th[th.length - 1][1]) - 0.683) < 0.01);
  }
  await setRange(page, "#wl-s", 2);
  check(`a 2% spread: −0.33, VR(21) 0.37 @${width}`, (await R("wl-r-rho")) === "−0.33" && (await R("wl-r-vr")) === "0.37", `${await R("wl-r-rho")} ${await R("wl-r-vr")}`);
  await setRange(page, "#wl-s", 1);
  await clickSeg("wl-kind", "stale");

  // ---- the rule on paper and for real
  const PP = ".profit-panel";
  check(`stale world: paper 32.2%, real 6.2%, holding 12.2% @${width}`, (await R("pf-r-paper")) === "32.2%" && (await R("pf-r-real")) === "6.2%" && (await R("pf-r-hold")) === "12.2%", `${await R("pf-r-paper")} ${await R("pf-r-real")} ${await R("pf-r-hold")}`);
  {
    const Y = logLin(await logTicksOf(PP));
    const pe = Y.val(lastPt(await attr(`${PP} path.paper`, "d"))[1]), re = Y.val(lastPt(await attr(`${PP} path.real`, "d"))[1]);
    check(`the pink line ends near $1,080 and the blue one near $4.50 @${width}`, Math.abs(pe / 1080.6 - 1) < 0.03 && Math.abs(re / 4.499 - 1) < 0.03, `${pe.toFixed(0)} ${re.toFixed(2)}`);
  }
  await clickSeg("pf-kind", "bounce");
  check(`bounce world: paper 30.2%, real −47.3% @${width}`, (await R("pf-r-paper")) === "30.2%" && (await R("pf-r-real")) === "−47.3%", `${await R("pf-r-paper")} ${await R("pf-r-real")}`);
  {
    const real = await pts(`${PP} path.real`), bottom = await nattr(`${PP} .axis-x line`, "y1");
    check(`the blue line leaves the bottom of the chart @${width}`, Math.abs(real[real.length - 1][1] - bottom) < 0.6 && real[real.length - 1][0] < (await nattr(`${PP} .axis-x line`, "x2")) - 50);
  }
  await clickSeg("pf-kind", "stale");

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
