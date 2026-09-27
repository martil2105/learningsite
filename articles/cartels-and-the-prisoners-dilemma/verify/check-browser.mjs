/*
  Browser checks for cartels-and-the-prisoners-dilemma at 390px and 1280px.

  Run against a served build of public/ (see verify/ship.sh for the recipe):
    BASE=http://127.0.0.1:8790 SHOTS=/tmp/cartels-and-the-prisoners-dilemma-shots node verify/check-browser.mjs

  The first block is the same in every article: the page loads without an
  error, nothing scrolls sideways, every SVG fits its box and has finite
  geometry, the maths is rendered, and no raw LaTeX, NaN or "undefined" reaches
  the reader. The second block exercises this article's own interactions.
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

  // ---------------------------------------------------- this article's checks
  const M = await import("../src/cournot.js");
  const txt = async (sel) => ((await page.locator(sel).first().textContent()) || "").replace(/\s+/g, " ").trim();

  // TheQuestion: nothing is revealed until a guess; a wrong guess and the right one both reveal the model's numbers
  const q = page.locator("#cartel-question");
  ok(at("the guess reveals nothing before a choice"), (await q.locator(".reveal-box").count()) === 0);
  await q.locator('button[data-choice="rises"]').click(); await settle(page);
  const wrong = await txt("#cartel-question .reveal-title");
  ok(at("a wrong guess says 'Not quite' and gives the 28% fall"), /^Not quite\./.test(wrong) && wrong.includes("28%"), wrong);
  await q.locator('button[data-choice="unchanged"]').click(); await settle(page);
  ok(at("'It stays the same' is also marked wrong"), /^Not quite\./.test(await txt("#cartel-question .reveal-title")));
  await q.locator('button[data-choice="falls"]').click(); await settle(page);
  const right = await txt("#cartel-question .reveal-title");
  ok(at("the right guess says 'Right.'"), /^Right\./.test(right), right);
  const qm = await num(page, "#cartel-question .q-member"), qo = await num(page, "#cartel-question .q-outsider"), qb = await num(page, "#cartel-question .q-before");
  ok(at("the reveal reads 225, 162 and 324 from the model"), near(qb, M.piN(5), 1e-9) && near(qm, M.member(5, 2), 1e-9) && near(qo, M.outsider(5, 2), 1e-9), `${qb}, ${qm}, ${qo}`);
  ok(at("the reveal text has no exclamation mark"), !(await txt("#cartel-question .reveal-box")).includes("!"));

  // TheAnswer: the outsider's dot moves up and to the left along the reaction line, and every label stays inside the chart
  const rf = await page.locator("#reaction-figure").evaluate((el) => {
    const svg = el.querySelector("svg").getBoundingClientRect();
    const b = el.querySelector("circle.dot-before").getBoundingClientRect();
    const a = el.querySelector("circle.dot-after").getBoundingClientRect();
    const out = [...el.querySelectorAll("svg text")].filter((t) => {
      const r = t.getBoundingClientRect();
      return r.left < svg.left - 1 || r.right > svg.right + 1 || r.top < svg.top - 1 || r.bottom > svg.bottom + 1;
    }).map((t) => t.textContent.trim());
    return { dx: a.left - b.left, dy: a.top - b.top, out };
  });
  ok(at("on screen the outsider's dot sits up and to the left of the starting dot"), rf.dx < -2 && rf.dy < -2, `dx ${rf.dx.toFixed(1)}, dy ${rf.dy.toFixed(1)}`);
  ok(at("every reaction-chart label is inside the svg"), rf.out.length === 0, rf.out.join(" | "));

  // MergerLab: each state of the banner, the readouts against the module, and the identity
  const lab = async (n, k) => { await setRange(page, "#lab-n-slider", n); await setRange(page, "#lab-k-slider", k); };
  await lab(5, 4);
  ok(at("lab at n = 5, k = 4 reads 225.00 for a member and 900.00 for the outsider"),
     near(await num(page, "#lab-member"), M.member(5, 4), 0.005) && near(await num(page, "#lab-outsider"), M.outsider(5, 4), 0.005));
  ok(at("lab at n = 5, k = 4 says break-even"), /^Break-even\./.test(await txt("#lab-banner")), await txt("#lab-banner"));
  ok(at("lab at n = 5, k = 4: the outsider earns 4.0× a member"), (await txt("#lab-ratio")) === "4.0×", await txt("#lab-ratio"));
  ok(at("lab at n = 5, k = 4: the price is 40.00"), near(await num(page, "#lab-price"), M.price(5, 4), 0.005));
  await lab(5, 2);
  ok(at("lab at n = 5, k = 2 says the cartel doesn't pay, 28.0% less"), /^The cartel doesn't pay\./.test(await txt("#lab-banner")) && (await txt("#lab-banner")).includes("28.0%"), await txt("#lab-banner"));
  ok(at("lab at n = 5, k = 2 reads 162.00 and 324.00, and 'fails'"),
     near(await num(page, "#lab-member"), 162, 0.005) && near(await num(page, "#lab-outsider"), 324, 0.005) && (await txt("#lab-condition")) === "fails");
  await lab(5, 5);
  ok(at("lab at n = 5, k = 5 is a monopoly with no outsider card"), /^Monopoly\./.test(await txt("#lab-banner")) && (await page.locator("#lab-outsider").count()) === 0 && near(await num(page, "#lab-member"), M.member(5, 5), 0.005));
  await lab(20, M.kMin(20));
  ok(at(`lab at n = 20, k = ${M.kMin(20)} says the cartel pays, and the condition holds`), /^The cartel pays\./.test(await txt("#lab-banner")) && (await txt("#lab-condition")) === "holds", await txt("#lab-banner"));
  await setRange(page, "#lab-k-slider", M.kMin(20) - 1);
  ok(at(`lab at n = 20, k = ${M.kMin(20) - 1} does not pay`), /doesn't pay/.test(await txt("#lab-banner")));
  for (const [n, k] of [[12, 7], [17, 3]]) {
    await lab(n, k);
    const r = await txt("#lab-ratio");
    ok(at(`lab at n = ${n}, k = ${k}: the outsider earns ${k}.0× a member`), r === `${k}.0×` && near(await num(page, "#lab-outsider"), M.outsider(n, k), 0.005), r);
  }
  await lab(20, 20); await setRange(page, "#lab-n-slider", 3);
  const kNow = await num(page, "#lab-k");
  ok(at("dropping n below k pulls k down with it"), kNow === 3, `k = ${kNow}`);
  const labText = await txt("#cartel-lab");
  ok(at("no exclamation mark or 'decimals' in the lab"), !labText.includes("!") && !/decimal/i.test(labText));
  await lab(5, 4);

  // FreeRideFigure: the five-firm table is the model's
  const cells = await page.locator("#five-firm-table tbody tr").evaluateAll((rows) => rows.map((r) => [...r.querySelectorAll("td")].map((td) => td.textContent.trim())));
  const want = [2, 3, 4, 5].map((k) => [M.member(5, k).toFixed(2), k < 5 ? M.outsider(5, k).toFixed(2) : "—"]);
  ok(at("the five-firm table reads 162.00/324.00, 168.75/506.25, 225.00/900.00, 405.00/—"),
     cells.length === 4 && cells.every((c, i) => c[1] === want[i][0] && c[4] === want[i][1]), JSON.stringify(cells.map((c) => [c[1], c[4]])));
  ok(at("the table's statuses read Loss, Loss, Break-even, Gain"), cells.map((c) => c[3]).join(",") === "Loss,Loss,Break-even,Gain", cells.map((c) => c[3]).join(","));

  // ThresholdFigure: smallest profitable cartel and most outsiders, from the module
  const th = await page.locator("#threshold-table tbody tr").evaluateAll((rows) => rows.map((r) => [...r.querySelectorAll("td")].map((td) => td.textContent.trim().replace(/,/g, ""))));
  const ns = [5, 6, 10, 20, 50, 100, 1000];
  ok(at("the threshold table matches kMin and maxOutsiders for every row"),
     th.length === ns.length && th.every((c, i) => +c[0] === ns[i] && +c[1] === M.kMin(ns[i]) && +c[3] === M.maxOutsiders(ns[i])), JSON.stringify(th));

  // WelfareFigure: prices, surpluses and the deadweight loss
  const wf = async (cls) => page.locator(`#welfare-figure .${cls}`).evaluateAll((els) => els.map((e) => parseFloat(e.textContent.replace(/,/g, ""))));
  const [pr, cs, pf, tot, dwl] = [await wf("w-price"), await wf("w-cs"), await wf("w-profit"), await wf("w-total"), await wf("w-dwl")];
  ok(at("welfare: price 25 then 40, consumer surplus 2,812.5 then 1,800.0"),
     near(pr[0], M.price(5, 1), 0.005) && near(pr[1], M.price(5, 4), 0.005) && near(cs[0], M.consumerSurplus(5, 1), 0.05) && near(cs[1], M.consumerSurplus(5, 4), 0.05), `${pr} | ${cs}`);
  ok(at("welfare: profit 1,125.0 then 1,800.0, and a deadweight loss of 337.5"),
     near(pf[0], 1125, 0.05) && near(pf[1], 1800, 0.05) && near(dwl[0], M.totalSurplus(5, 1) - M.totalSurplus(5, 4), 0.05) && near(tot[0] - tot[1], dwl[0], 0.05), `${pf} | ${tot} | ${dwl}`);

  // furniture: sentence-case headings, no kicker, no "Figure N."
  const furn = await page.evaluate(() => ({
    heads: [...document.querySelectorAll("h3.body-header, h3.card-title")].map((h) => h.textContent.trim()),
    upper: [...document.querySelectorAll("th, .card-tag, .col-label, .col-head, .badge, h3")].filter((e) => getComputedStyle(e).textTransform === "uppercase").length,
    fig: /Figure \d+\./.test(document.body.innerText),
  }));
  ok(at("no heading is typed in capitals"), furn.heads.every((h) => h !== h.toUpperCase()), furn.heads.filter((h) => h === h.toUpperCase()).join(" | "));
  ok(at("no label, table header or heading is upper-cased by CSS"), furn.upper === 0, `${furn.upper} upper-cased`);
  ok(at("no 'Figure N.' captions"), !furn.fig);

  if (SHOTS) {
    await page.locator("#intro").screenshot({ path: `${SHOTS}/${vp.name}-title.png` });
    await page.locator("#cartel-question").screenshot({ path: `${SHOTS}/${vp.name}-question.png` });
    await page.locator("#reaction-figure").screenshot({ path: `${SHOTS}/${vp.name}-reaction.png` });
    await page.locator("#cartel-lab").screenshot({ path: `${SHOTS}/${vp.name}-lab.png` });
    await page.locator("#welfare-figure").screenshot({ path: `${SHOTS}/${vp.name}-welfare.png` });
    await page.locator("#conclusion").screenshot({ path: `${SHOTS}/${vp.name}-end.png` });
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
