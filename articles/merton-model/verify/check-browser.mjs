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

  // ------------------------------------------------------ merton-model checks
  const near1 = (a, b, tol) => Math.abs(a - b) <= tol;
  // guess card
  await click('#guess button[data-g="under"]');
  check(`guess card: the assets move 18.8% @${width}`, (await txt("#guess-answer")).includes("18.8%") && (await txt("#guess-answer")).startsWith("That's right."), await txt("#guess-answer"));

  // ---- the solver
  const SP = ".solve-panel";
  check(`solver readouts at the start @${width}`, (await R("sl-v")) === "$97.78" && (await R("sl-sv")) === "18.81%" && (await R("sl-d")) === "1.84 sd" && (await R("sl-pd")) === "3.27%", `${await R("sl-v")} ${await R("sl-sv")} ${await R("sl-d")} ${await R("sl-pd")}`);
  {
    const sc = await scales(SP), X = lin(sc.xs), Y = lin(sc.ys);
    const cx = await nattr(`${SP} circle.cross`, "cx"), cy = await nattr(`${SP} circle.cross`, "cy");
    check(`the circle sits at 18.81% and $97.78 on the axes @${width}`, near1(X.val(cx), 18.81, 0.2) && near1(Y.val(cy), 97.78, 0.3), `${X.val(cx).toFixed(4)} ${Y.val(cy).toFixed(2)}`);
    const a = yAt(await pts(`${SP} path.price-curve`), cx), b = yAt(await pts(`${SP} path.vol-curve`), cx);
    check(`the circle is on both curves @${width}`, near1(a, cy, 1.5) && near1(b, cy, 1.5), `${a.toFixed(1)} ${b.toFixed(1)} vs ${cy.toFixed(1)}`);
    // the blue curve is nearly flat: under 3px between 5% and 30%
    const pc = await pts(`${SP} path.price-curve`);
    check(`the blue curve is nearly flat @${width}`, Math.abs(yAt(pc, X.px(5)) - yAt(pc, X.px(30))) < Y.px(60) - Y.px(62.5), `${(yAt(pc, X.px(5)) - yAt(pc, X.px(30))).toFixed(1)}px`);
  }
  {
    const cx0 = await nattr(`${SP} circle.cross`, "cx"), cy0 = await nattr(`${SP} circle.cross`, "cy");
    await setRange(page, "#sl-se", 0.9);
    const cx1 = await nattr(`${SP} circle.cross`, "cx"), cy1 = await nattr(`${SP} circle.cross`, "cy");
    const v = parseFloat((await R("sl-v")).replace("$", ""));
    check(`more share volatility moves the circle right, at much the same assets @${width}`, cx1 > cx0 + 20 && Math.abs(v - 97.78) < 2 && Math.abs(cy1 - cy0) < 8, `${(cx1 - cx0).toFixed(0)}px, $${v}`);
    const sc = await scales(SP), X = lin(sc.xs);
    check(`the circle is on both curves after the move @${width}`, near1(yAt(await pts(`${SP} path.price-curve`), cx1), cy1, 1.5) && near1(yAt(await pts(`${SP} path.vol-curve`), cx1), cy1, 1.5));
    await setRange(page, "#sl-se", 0.6);
    await setRange(page, "#sl-e", 15);
    const cy2 = await nattr(`${SP} circle.cross`, "cy");
    const d = parseFloat(await R("sl-d"));
    check(`cheaper shares drop the circle and shorten the distance @${width}`, cy2 > cy0 + 10 && d < 1.84, `${(cy2 - cy0).toFixed(0)}px, ${d}`);
    await setRange(page, "#sl-e", 30);
    check(`back to the start @${width}`, (await R("sl-v")) === "$97.78");
  }

  // ---- when the assets fall
  check(`fall: readouts at the start @${width}`, (await R("ff-e")) === "$30.00" && (await R("ff-ech")) === "0.0%" && (await R("ff-se")) === "60.0%" && (await R("ff-pd")) === "3.27%", `${await R("ff-e")} ${await R("ff-ech")} ${await R("ff-se")} ${await R("ff-pd")}`);
  await setRange(page, "#ff-ch", -0.1);
  check(`assets down 10%: shares −31.2%, 74.6%, 9.99% @${width}`, (await R("ff-ech")) === "−31.2%" && (await R("ff-se")) === "74.6%" && (await R("ff-pd")) === "9.99%", `${await R("ff-ech")} ${await R("ff-se")} ${await R("ff-pd")}`);
  {
    const X = lin((await scales(".pd-panel")).xs);
    const cx = await nattr(".vol-panel circle.now", "cx");
    check(`the dot sits at assets 10% below $97.78 @${width}`, near1(X.val(cx), 97.7777 * 0.9, 0.15), X.val(cx).toFixed(2));
    check(`both dots sit on their curves @${width}`, near1(yAt(await pts(".vol-panel path.vol-line"), cx), await nattr(".vol-panel circle.now", "cy"), 1.5) && near1(yAt(await pts(".pd-panel path.pd-line"), cx), await nattr(".pd-panel circle.now", "cy"), 1.5));
    const Y2 = (await scales(".pd-panel")).ys;
    // log axis: ticks 0.1%, 1%, 10%, 100%
    const lg = (v) => Math.log10(v); const a = Y2[0], b = Y2[Y2.length - 1]; const k = (b.p - a.p) / (lg(b.v) - lg(a.v));
    const val = (p) => Math.pow(10, lg(a.v) + (p - a.p) / k);
    check(`the pd dot reads 9.99% on the log axis @${width}`, near1(val(await nattr(".pd-panel circle.now", "cy")), 9.99, 0.15), val(await nattr(".pd-panel circle.now", "cy")).toFixed(2));
  }
  await setRange(page, "#ff-ch", -0.2);
  check(`assets down 20%: shares −59.7%, 97.5% @${width}`, (await R("ff-ech")) === "−59.7%" && (await R("ff-se")) === "97.5%", `${await R("ff-ech")} ${await R("ff-se")}`);
  await setRange(page, "#ff-ch", 0);

  // ---- whose chance
  check(`whose: readouts at 0.2 @${width}`, (await R("wf-q")) === "3.27%" && (await R("wf-p")) === "2.06%" && (await R("wf-r")) === "1.59×" && (await R("wf-rs")) === "1.88×", `${await R("wf-q")} ${await R("wf-p")} ${await R("wf-r")} ${await R("wf-rs")}`);
  {
    const WP = ".whose-panel";
    const cx = await nattr(`${WP} circle.dot-ours`, "cx"), cy = await nattr(`${WP} circle.dot-ours`, "cy");
    check(`our firm's dot is on the one-year curve @${width}`, near1(yAt(await pts(`${WP} path.one-year`), cx), cy, 1.5), `${yAt(await pts(`${WP} path.one-year`), cx).toFixed(1)} vs ${cy}`);
    const sx = await nattr(`${WP} circle.dot-safe`, "cx"), sy = await nattr(`${WP} circle.dot-safe`, "cy");
    check(`the safer firm is further left and higher @${width}`, sx < cx - 20 && sy < cy - 3 && near1(yAt(await pts(`${WP} path.one-year`), sx), sy, 1.5));
    const ten = await pts(`${WP} path.ten-year`), one = await pts(`${WP} path.one-year`);
    check(`the ten-year curve sits above the one-year curve @${width}`, yAt(ten, cx) < yAt(one, cx) - 10);
    await setRange(page, "#wf-lam", 0);
  }
  {
    const WP = ".whose-panel";
    const sc = await scales(WP);
    const ys = sc.ys, base = ys.find((t) => t.v === 1).p;
    const one = await pts(`${WP} path.one-year`), ten = await pts(`${WP} path.ten-year`);
    check(`at a Sharpe ratio of zero both curves lie on 1× @${width}`, one.every(([, y]) => near1(y, base, 0.6)) && ten.every(([, y]) => near1(y, base, 0.6)));
    check(`and the two chances agree @${width}`, (await R("wf-p")) === "3.27%" && (await R("wf-r")) === "1.00×", `${await R("wf-p")} ${await R("wf-r")}`);
    await setRange(page, "#wf-lam", 0.2);
  }

  // ---- paths
  check(`paths: 4 pink lines when a default is ending below @${width}`, (await R("pf-n")) === "4" && (await has(".paths-panel path.bad")) === 4 && (await R("pf-p")) === "2.06%", `${await R("pf-n")} ${await has(".paths-panel path.bad")}`);
  await clickSeg("pf-rule", "touch");
  check(`and 9 when touching counts @${width}`, (await R("pf-n")) === "9" && (await has(".paths-panel path.bad")) === 9 && (await R("pf-p")) === "4.60%", `${await R("pf-n")} ${await R("pf-p")}`);
  check(`200 paths are drawn @${width}`, (await has(".paths-panel path.path")) === 200);
  {
    const Y = lin((await scales(".paths-panel")).ys);
    check(`the debt line is at $70 @${width}`, near1(Y.val(await nattr(".paths-panel line.debt", "y1")), 70, 0.2));
  }
  await clickSeg("pf-rule", "end");
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
