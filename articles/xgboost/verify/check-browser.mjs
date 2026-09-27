/*
  Generic rendering checks, for an article that predates its own
  check-browser.mjs. Nothing here knows what the article is about: it catches
  page errors, unrendered LaTeX, horizontal overflow and the offender behind it,
  SVGs escaping their boxes, broken geometry while scrolling, and text glued to a
  separator. An article-specific geometry assertion is still owed.

      npm run build
      python3 -m http.server 8765 -d public &
      BASE=http://127.0.0.1:8765 SHOTS=/tmp/shots node verify/check-browser.mjs
*/
import pw from '/home/claude/.npm-global/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const SHOTS = process.env.SHOTS;

let failures = 0;
const ok = (label, cond, detail = '') => {
  console.log((cond ? '  PASS  ' : '  FAIL  ') + label + (detail ? '   ' + detail : ''));
  if (!cond) failures++;
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const vp of [{ w: 1280, h: 900, name: 'desktop' }, { w: 390, h: 780, name: 'mobile' }]) {
  console.log(`\n================ ${vp.name} (${vp.w}x${vp.h}) ================`);
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [], warnings = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
    if (m.type() === 'warning') warnings.push('console.warn: ' + m.text());
  });
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  ok('no page errors on load', errors.length === 0, errors.slice(0, 3).join(' | '));
  ok('no console warnings on load', warnings.length === 0, warnings.slice(0, 3).join(' | '));

  const tex = await page.evaluate(() => ({
    count: document.querySelectorAll('.katex').length,
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 5),
  }));
  ok('KaTeX rendered', tex.count > 0, tex.count + ' nodes');
  ok('no raw LaTeX reached the DOM', tex.raw.length === 0, tex.raw.join(' '));

  const title = await page.evaluate(() => {
    const h = document.querySelector('#intro-hed');
    if (!h) return null;
    const r = document.createRange(); r.selectNodeContents(h);
    return { w: Math.round(r.getBoundingClientRect().width), vw: innerWidth };
  });
  ok('title text fits the viewport', !title || title.w <= title.vw, JSON.stringify(title));

  // Walk the page, checking geometry at each stop.
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const stops = 20;
  const bad = new Set(), overflow = new Set();
  for (let i = 0; i <= stops; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round((H - vp.h) * i / stops));
    await page.waitForTimeout(160);
    const r = await page.evaluate(() => {
      const out = { bad: [], over: [] };
      for (const el of document.querySelectorAll('rect, circle, path, line')) {
        for (const a of ['width', 'height', 'r']) {
          const v = el.getAttribute(a);
          if (v !== null && (v.includes('NaN') || v === 'undefined' || parseFloat(v) < 0)) out.bad.push(el.tagName + '[' + a + '=' + v + ']');
        }
        const d = el.getAttribute('d');
        if (d && /NaN|undefined/.test(d)) out.bad.push(el.tagName + '[d has NaN]');
      }
      if (document.documentElement.scrollWidth > innerWidth) {
        for (const el of document.querySelectorAll('body *')) {
          const b = el.getBoundingClientRect();
          if (b.width && b.right > innerWidth + 1) {
            out.over.push((el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className && el.className.baseVal === undefined ? '.' + String(el.className).split(' ')[0] : '')) + ' → ' + Math.round(b.right));
            if (out.over.length > 4) break;
          }
        }
      }
      return out;
    });
    r.bad.forEach((x) => bad.add(x));
    r.over.forEach((x) => overflow.add(x));
  }
  ok('no NaN, undefined or negative geometry at any scroll position', bad.size === 0, [...bad].slice(0, 4).join(' | '));
  ok('page never scrolls horizontally', overflow.size === 0, [...overflow].slice(0, 5).join(' | '));

  const svgs = await page.evaluate(() => {
    const out = [];
    for (const s of document.querySelectorAll('svg')) {
      if (s.closest('.katex')) continue;
      const p = s.parentElement.getBoundingClientRect(), b = s.getBoundingClientRect();
      if (b.width === 0) continue;
      if (b.left < p.left - 1 || b.right > p.right + 1) out.push(Math.round(b.width) + '>' + Math.round(p.width));
    }
    return out;
  });
  ok('no svg is wider than its parent', svgs.length === 0, svgs.slice(0, 4).join(' '));

  const glued = await page.evaluate(() =>
    (document.body.innerText.match(/[\d%]·|·[\dA-Za-z]|\d[a-z]{4,}/g) || []).slice(0, 4));
  ok('no text glued to a separator or number', glued.length === 0, glued.join(' '));

  ok('still no page errors after scrolling', errors.length === 0, errors.slice(0, 3).join(' | '));
  ok('still no console warnings after scrolling', warnings.length === 0, warnings.slice(0, 3).join(' | '));

  if (SHOTS) {
    for (const [i, f] of [0.0, 0.25, 0.5, 0.75].entries()) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((H - vp.h) * f));
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${SHOTS}/${vp.name}-${String(i).padStart(2, '0')}.png` });
    }
  }
  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} browser check(s) FAILED` : '\nall browser checks passed');
process.exit(failures ? 1 : 0);
