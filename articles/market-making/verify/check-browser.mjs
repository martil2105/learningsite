/*
  Browser checks for market-making at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/market-making-shots node verify/check-browser.mjs

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

  // the guess card
  await click('#guess button[data-g="twenty"]');
  check(`the guess card says right for 20 cents @${width}`, (await txt("#guess-answer")).startsWith("Right"));
  await click('#guess button[data-g="tick"]');
  check(`and says what it is for one cent @${width}`, (await txt("#guess-answer")).startsWith("It's 20 cents"));

  // ---- who sends a buy order
  const B = "#fig-bayes svg.bayes-panel";
  check(`the first figure opens at 10% informed @${width}`, (await val("#bf-mu")) === "0.1");
  check(`readouts: 55.0%, ask $100.10, bid $99.90, spread 20¢ @${width}`,
    (await R("bf-r-hb")) === "55.0%" && (await R("bf-r-ask")) === "$100.10" && (await R("bf-r-bid")) === "$99.90" && (await R("bf-r-spread")) === "20¢");
  // the ask is the average value over the drawn pink area, and the bid over the blue
  const areaAsk = async () => page.evaluate((B) => {
    const r = (sel) => [...document.querySelectorAll(`${B} rect${sel}`)].reduce((a, e) => a + (+e.getAttribute("height")) * (+e.getAttribute("width")), 0);
    const hiBuy = r(".buy[class*='high-']"), loBuy = r(".buy[class*='low-']"), hiSell = r(".sell[class*='high-']"), loSell = r(".sell[class*='low-']");
    return { ask: 99 + 2 * hiBuy / (hiBuy + loBuy), bid: 99 + 2 * hiSell / (hiSell + loSell), cols: [hiBuy + hiSell, loBuy + loSell] };
  }, B);
  {
    const a = await areaAsk();
    check(`the ask read from the pink area is $100.10 and the bid from the blue $99.90 @${width}`, Math.abs(a.ask - 100.1) < 0.004 && Math.abs(a.bid - 99.9) < 0.004, `${a.ask.toFixed(4)} ${a.bid.toFixed(4)}`);
    check(`the two columns have the same area @${width}`, Math.abs(a.cols[0] - a.cols[1]) < 0.01 * a.cols[0]);
  }
  await setRange(page, "#bf-mu", 0.3);
  {
    const a = await areaAsk();
    check(`at 30%: the area gives an ask of $100.30 and the readout agrees @${width}`, Math.abs(a.ask - 100.3) < 0.004 && (await R("bf-r-ask")) === "$100.30" && (await R("bf-r-spread")) === "60¢", `${a.ask.toFixed(4)}`);
  }
  await setRange(page, "#bf-mu", 0);
  check(`with nobody informed the spread closes @${width}`, (await R("bf-r-spread")) === "0¢" && (await R("bf-r-hb")) === "50.0%");
  await setRange(page, "#bf-mu", 0.5);
  check(`at 50% the spread is a dollar @${width}`, (await R("bf-r-spread")) === "100¢" && (await R("bf-r-ask")) === "$100.50");
  check(`the lab below follows the share @${width}`, (await val("#tl-mu")) === "0.5");
  await setRange(page, "#bf-mu", 0.1);

  // ---- one day of trades
  const T = "#fig-trades svg.trade-panel";
  check(`the lab opens on day 1 with no trades, quotes $99.90 and $100.10 @${width}`,
    (await R("tl-r-day")) === "1" && (await R("tl-r-n")) === "0" && (await R("tl-r-bid")) === "$99.90" && (await R("tl-r-ask")) === "$100.10" && (await has(`${T} circle.trade`)) === 0);
  await click('#tl-buttons button[data-b="one"]');
  check(`one trade: one dot, and the spread has moved off 20¢ @${width}`, (await R("tl-r-n")) === "1" && (await has(`${T} circle.trade`)) === 1 && (await R("tl-r-spread")) !== "20.0¢");
  await click('#tl-buttons button[data-b="ten"]');
  check(`ten more: 11 trades and 11 dots @${width}`, (await R("tl-r-n")) === "11" && (await has(`${T} circle.trade`)) === 11);
  await click('#tl-buttons button[data-b="all"]');
  check(`run to 300: 300 dots @${width}`, (await R("tl-r-n")) === "300" && (await has(`${T} circle.trade`)) === 300);
  check(`day 1 ends at −$10.06, +$11.44 and −$1.39 @${width}`, (await R("tl-r-unf")) === "−$10.06" && (await R("tl-r-inf")) === "+$11.44" && (await R("tl-r-mm")) === "−$1.39");
  const sum3 = async () => { const v = []; for (const id of ["tl-r-unf", "tl-r-inf", "tl-r-mm"]) v.push(parseFloat((await R(id)).replace("−", "-").replace(/[$+]/g, ""))); return v.reduce((a, b) => a + b, 0); };
  check(`the three scores add to zero, to the cent @${width}`, Math.abs(await sum3()) <= 0.011, String(await sum3()));
  // every dot sits on the quote line it traded at: a buy on the ask, a sell on the bid
  const onLines = async () => {
    const sc = await scales(T), X = lin(sc.xs);
    const askP = await pts(`${T} path.ask-line`), bidP = await pts(`${T} path.bid-line`);
    const dots = await page.evaluate((T) => [...document.querySelectorAll(`${T} circle.trade`)].map((c) => ({ x: +c.getAttribute("cx"), y: +c.getAttribute("cy"), buy: c.classList.contains("buy"), informed: c.classList.contains("informed") })), T);
    let worst = 0;
    for (const d of dots) {
      const t = Math.round(X.val(d.x) + 0.5); // the dot for trade t sits half a trade before t
      const vtx = (d.buy ? askP : bidP)[t - 1];
      worst = Math.max(worst, Math.abs(vtx[1] - d.y));
    }
    return { worst, dots };
  };
  {
    const { worst, dots } = await onLines();
    check(`every dot sits on the ask (buys) or the bid (sells) at its trade @${width}`, worst < 0.05, worst.toFixed(3));
    check(`every ringed trader bought, since the stock is worth $101 @${width}`, dots.filter((d) => d.informed).every((d) => d.buy) && dots.some((d) => d.informed));
    const sc = await scales(T), Y = lin(sc.ys), askEnd = await pts(`${T} path.ask-line`);
    check(`the quotes end near $101 @${width}`, Y.val(askEnd[askEnd.length - 1][1]) > 100.85, Y.val(askEnd[askEnd.length - 1][1]).toFixed(3));
    const tv = await nattr(`${T} line.truth`, "y1");
    check(`the dashed line is at $101 @${width}`, Math.abs(Y.val(tv) - 101) < 0.01);
  }
  await click('#tl-buttons button[data-b="another"]');
  check(`another day: day 2, back to no trades @${width}`, (await R("tl-r-day")) === "2" && (await R("tl-r-n")) === "0");
  await click('#tl-buttons button[data-b="all"]');
  check(`day 2 ends at −$70.83 for the uninformed and +$23.58 for us @${width}`, (await R("tl-r-unf")) === "−$70.83" && (await R("tl-r-mm")) === "+$23.58");
  {
    const sc = await scales(T), Y = lin(sc.ys), P = await pts(`${T} path.bid-line`);
    const below = P.filter((q) => Y.val(q[1]) < 100).length;
    check(`day 2: the bid line sits below $100 for most of the day @${width}`, below > 0.8 * P.length, `${below} of ${P.length}`);
  }
  await clickSeg("tl-v", "low");
  {
    const { worst, dots } = await onLines();
    check(`worth $99: every ringed trader sold, and every dot is still on its line @${width}`, dots.filter((d) => d.informed).every((d) => !d.buy) && worst < 0.05);
    const sc = await scales(T), Y = lin(sc.ys), tv = await nattr(`${T} line.truth`, "y1");
    check(`and the dashed line moved to $99 @${width}`, Math.abs(Y.val(tv) - 99) < 0.01);
  }
  check(`the scores still add to zero @${width}`, Math.abs(await sum3()) <= 0.011);
  await clickSeg("tl-v", "high");
  await click('#tl-buttons button[data-b="restart"]');
  check(`start again empties the chart @${width}`, (await R("tl-r-n")) === "0" && (await has(`${T} circle.trade`)) === 0);

  // ---- how fast the spread closes (log axis)
  const L = "#fig-learn svg.learn-panel";
  check(`half: 22, 85 and 341 trades @${width}`, (await R("lc-r-mu20")) === "22 trades" && (await R("lc-r-mu10")) === "85 trades" && (await R("lc-r-mu5")) === "341 trades");
  const logX = async () => {
    const sc = await scales(L); const a = sc.xs[0], b = sc.xs[sc.xs.length - 1];
    const k = (b.p - a.p) / (Math.log10(b.v) - Math.log10(a.v));
    return (p) => Math.pow(10, Math.log10(a.v) + (p - a.p) / k);
  };
  {
    const inv = await logX(), sc = await scales(L), Y = lin(sc.ys);
    const got = [];
    for (const c of ["mu20", "mu10", "mu5"]) got.push(inv(await nattr(`${L} circle.hit.${c}`, "cx")));
    check(`the dots sit at 22, 85 and 341 trades on the log axis @${width}`, [22, 85, 341].every((v, i) => Math.abs(got[i] / v - 1) < 0.02), got.map((v) => v.toFixed(1)).join(" "));
    const ly = await nattr(`${L} line.level`, "y1");
    check(`the level line is at 50% @${width}`, Math.abs(Y.val(ly) - 50) < 0.5);
    // each dot is on its own curve
    let worst = 0;
    for (const c of ["mu20", "mu10", "mu5"]) { const P = await pts(`${L} path.curve.${c}`); const cx = await nattr(`${L} circle.hit.${c}`, "cx"), cy = await nattr(`${L} circle.hit.${c}`, "cy"); worst = Math.max(worst, Math.abs(yAt(P, cx) - cy)); }
    check(`each dot lies on its own curve, within the step the curve takes there @${width}`, worst < 4, worst.toFixed(2));
    // the curves are the same shape shifted by a factor of about four
    const P20 = await pts(`${L} path.curve.mu20`), P5 = await pts(`${L} path.curve.mu5`);
    const at20 = inv(P20.find((q) => Y.val(q[1]) < 30)[0]), at5 = inv(P5.find((q) => Y.val(q[1]) < 30)[0]);
    check(`20% and 5% cross 30% about sixteen times apart @${width}`, at5 / at20 > 14 && at5 / at20 < 18, (at5 / at20).toFixed(2));
  }
  await clickSeg("lc-level", "tenth");
  check(`a tenth: 83, 336 and 1,344 trades @${width}`, (await R("lc-r-mu20")) === "83 trades" && (await R("lc-r-mu10")) === "336 trades" && (await R("lc-r-mu5")) === "1,344 trades");
  {
    const sc = await scales(L), Y = lin(sc.ys), ly = await nattr(`${L} line.level`, "y1");
    check(`and the level line moved to 10% @${width}`, Math.abs(Y.val(ly) - 10) < 0.5);
  }
  await clickSeg("lc-level", "half");

  // ---- the bill
  const Bc = "#fig-bill svg.bill-panel";
  check(`news after 100 trades: peak at 12% who know, $6.22; $6.09 at 10% and $4.24 at 5% @${width}`,
    (await R("bc-r-peak")) === "12% who know" && (await R("bc-r-peakbill")) === "$6.22" && (await R("bc-r-10")) === "$6.09" && (await R("bc-r-5")) === "$4.24");
  const peakOn = async () => {
    const sc = await scales(Bc), X = lin(sc.xs), Y = lin(sc.ys);
    const P = await pts(`${Bc} path.bill`), cx = await nattr(`${Bc} circle.peak`, "cx"), cy = await nattr(`${Bc} circle.peak`, "cy");
    const top = Math.min(...P.map((q) => q[1]));
    return { mu: X.val(cx), bill: Y.val(cy), onCurve: Math.abs(yAt(P, cx) - cy), isTop: Math.abs(top - cy) };
  };
  {
    const p = await peakOn();
    check(`the dot is at 12% and $6.22, on the curve, at its highest point @${width}`, Math.abs(p.mu - 12) < 0.3 && Math.abs(p.bill - 6.22) < 0.1 && p.onCurve < 0.05 && p.isTop < 0.05, JSON.stringify(p));
    const v10 = await readAt(Bc, `${Bc} path.bill`, 10), nv = await readAt(Bc, `${Bc} path.never`, 10);
    check(`the blue line reads $6.09 at 10%, and the dashed line $12.48 @${width}`, Math.abs(v10 - 6.09) < 0.08 && Math.abs(nv - 12.48) < 0.08, `${v10.toFixed(2)} ${nv.toFixed(2)}`);
  }
  await clickSeg("bc-n", 1000);
  check(`news after 1,000 trades: the peak moves to 4%, $21.48 @${width}`, (await R("bc-r-peak")) === "4% who know" && (await R("bc-r-peakbill")) === "$21.48");
  {
    const p = await peakOn();
    check(`and the dot moved there @${width}`, Math.abs(p.mu - 4) < 0.3 && Math.abs(p.bill - 21.48) < 0.15 && p.isTop < 0.05, JSON.stringify(p));
  }
  await clickSeg("bc-n", 250);
  check(`news after 250 trades: the peak is at 8% @${width}`, (await R("bc-r-peak")) === "8% who know");
  await clickSeg("bc-n", 100);

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
