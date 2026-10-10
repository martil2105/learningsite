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

  // ---------------------------------------------------- put-call-parity checks
  const near1 = (a, b, tol) => Math.abs(a - b) <= tol;
  // ---- payoffs
  {
    const PP = ".payoff-panel";
    check(`payoffs at a $100 strike, share ending at $120 @${width}`, (await R("pf-call")) === "$20" && (await R("pf-put")) === "$0" && (await R("pf-diff")) === "$20", `${await R("pf-call")} ${await R("pf-put")} ${await R("pf-diff")}`);
    const sc = await scales(PP), X = lin(sc.xs), Y = lin(sc.ys);
    const call = await pts(`${PP} path.call`), put = await pts(`${PP} path.put`);
    check(`the call is flat to $100 then rises one for one @${width}`, near1(Y.val(yAt(call, X.px(90))), 0, 0.2) && near1(Y.val(yAt(call, X.px(130))), 30, 0.2));
    check(`the put falls one for one to $100 then is flat @${width}`, near1(Y.val(yAt(put, X.px(70))), 30, 0.2) && near1(Y.val(yAt(put, X.px(120))), 0, 0.2));
    await setRange(page, "#pf-st", 80);
    check(`ending at $80: $0, $20, −$20 @${width}`, (await R("pf-call")) === "$0" && (await R("pf-put")) === "$20" && (await R("pf-diff")) === "−$20", `${await R("pf-call")} ${await R("pf-put")} ${await R("pf-diff")}`);
    await clickSeg("pf-show", "diff");
    const d = await pts(`${PP} path.diff`);
    check(`the difference is the straight line S − K @${width}`, near1(Y.val(yAt(d, X.px(80))), -20, 0.2) && near1(Y.val(yAt(d, X.px(120))), 20, 0.2) && near1(Y.val(await nattr(`${PP} circle.dot-diff`, "cy")), -20, 0.2));
    await setRange(page, "#pf-k", 110);
    check(`move the strike to $110: the line shifts down @${width}`, (await R("pf-diff")) === "−$30" && near1(Y.val(yAt(await pts(`${PP} path.diff`), X.px(110))), 0, 0.2));
    await setRange(page, "#pf-k", 100);
    await setRange(page, "#pf-st", 120);
    await clickSeg("pf-show", "both");
  }
  // ---- guess
  await click('#guess button[data-g="same"]');
  check(`guess card: $12 @${width}`, (await txt("#guess-answer")).startsWith("That's right, $12."), await txt("#guess-answer"));
  // ---- models
  {
    const MP = ".models-panel";
    check(`smooth model at $110: $5.66, $11.35, −$5.69, −$5.69 @${width}`, (await R("ml-call")) === "$5.66" && (await R("ml-put")) === "$11.35" && (await R("ml-diff")) === "−$5.69" && (await R("ml-fwd")) === "−$5.69", `${await R("ml-call")} ${await R("ml-put")} ${await R("ml-diff")} ${await R("ml-fwd")}`);
    const d0 = await pts(`${MP} path.diff`), c0 = await pts(`${MP} path.call`);
    await clickSeg("ml-model", "crash");
    check(`crash model at $110: $4.53, $10.22, −$5.69 @${width}`, (await R("ml-call")) === "$4.53" && (await R("ml-put")) === "$10.22" && (await R("ml-diff")) === "−$5.69", `${await R("ml-call")} ${await R("ml-put")} ${await R("ml-diff")}`);
    const d1 = await pts(`${MP} path.diff`), c1 = await pts(`${MP} path.call`);
    check(`the black line doesn't move when the model changes @${width}`, d0.length === d1.length && d0.every((p, i) => near1(p[1], d1[i][1], 0.02)));
    check(`but the call line does @${width}`, c0.some((p, i) => Math.abs(p[1] - c1[i][1]) > 3));
    const sc = await scales(MP), X = lin(sc.xs), Y = lin(sc.ys);
    check(`the black line reads −$5.69 at $110 @${width}`, near1(Y.val(yAt(d1, X.px(110))), -5.69, 0.15));
    check(`the dashed lines are the smooth model's @${width}`, (await pts(`${MP} path.call-other`)).every((p, i) => near1(p[1], c0[i][1], 0.02)));
    await clickSeg("ml-model", "calm");
  }
  // ---- implied volatility
  {
    const IP = ".iv-panel";
    check(`a 3% fee, the wrong forward: call 20.45%, put 28.17% @${width}`, (await R("iv-call")) === "20.45%" && (await R("iv-put")) === "28.17%" && (await R("iv-f")) === "$101.01" && (await R("iv-none")) === "below $84.5", `${await R("iv-call")} ${await R("iv-put")} ${await R("iv-f")} ${await R("iv-none")}`);
    const sc = await scales(IP), X = lin(sc.xs), Y = lin(sc.ys);
    check(`the lines read 20.45% and 28.17% at $100 @${width}`, near1(Y.val(yAt(await pts(`${IP} path.call-iv`), X.px(100))), 20.45, 0.15) && near1(Y.val(yAt(await pts(`${IP} path.put-iv`), X.px(100))), 28.17, 0.15));
    check(`the call line starts at $84.50 @${width}`, near1(X.val((await pts(`${IP} path.call-iv`))[0][0]), 84.5, 0.05));
    await clickSeg("iv-fwd", "implied");
    const yc = await pts(`${IP} path.call-iv`), yp = await pts(`${IP} path.put-iv`);
    check(`with the options' own forward both lines lie flat at 25% @${width}`, yc.length === 81 && yc.concat(yp).every(([, y]) => near1(Y.val(y), 25, 0.05)) && (await R("iv-none")) === "none");
    await clickSeg("iv-fwd", "naive");
    await setRange(page, "#iv-fee", 0);
    check(`with no fee the two meet without help @${width}`, (await R("iv-call")) === "25.00%" && (await R("iv-put")) === "25.00%" && (await R("iv-f")) === "$104.08", `${await R("iv-call")} ${await R("iv-put")}`);
    await setRange(page, "#iv-fee", 0.03);
  }
  // ---- Palm
  {
    const PP = ".palm-panel";
    check(`Palm, November: $39.12 to $42.62, 23% to 29% below @${width}`, (await R("pm-short")) === "$39.12" && (await R("pm-long")) === "$42.62" && (await R("pm-below")) === "23% to 29%", `${await R("pm-short")} ${await R("pm-long")} ${await R("pm-below")}`);
    const X = lin((await scales(PP)).xs);
    const x = await nattr(`${PP} rect.nov`, "x"), w = await nattr(`${PP} rect.nov`, "width");
    check(`the November bar runs from $39.12 to $42.62 on the axis @${width}`, near1(X.val(x), 39.12, 0.03) && near1(X.val(x + w), 42.62, 0.03));
    check(`the pink line is at $55.25 @${width}`, near1(X.val(await nattr(`${PP} line.price`, "x1")), 55.25, 0.03));
    const xs = await page.evaluate((s) => ["may", "aug", "nov"].map((k) => +document.querySelector(`${s} rect.${k}`).getAttribute("x")), PP);
    check(`the bars move left with time to expiry @${width}`, xs[0] > xs[1] && xs[1] > xs[2]);
    await clickSeg("pm-exp", "may");
    check(`May: $47.56 to $51.06, 8% to 14% @${width}`, (await R("pm-short")) === "$47.56" && (await R("pm-long")) === "$51.06" && (await R("pm-below")) === "8% to 14%", `${await R("pm-short")} ${await R("pm-long")} ${await R("pm-below")}`);
    await clickSeg("pm-exp", "nov");
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
