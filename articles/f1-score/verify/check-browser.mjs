/*
  Rendering checks for the F1 article.

  This file was SMOTE's, copied and never adapted — it was still waiting for
  `.lab svg`, dragging fraud points and counting k-pills, none of which exist
  here, so the browser pass had never actually run. The generic half is kept;
  the middle is this article's.

  The article-specific check that pays for the file is the SWEEP: drive the real
  slider across the whole range, read the real F1 readout at each stop, and
  assert the argmax lands where the article says the empirical peak is. That is
  the number the entire piece is built on, verified through the UI rather than
  from the modules — so a broken scale, a stale binding or a wrong metric in the
  component fails here even though check-numbers stays green.

  Run against a served production build:

      ./verify/ship.sh
      python3 -m http.server 8790 -d public &
      BASE=http://127.0.0.1:8790 SHOTS=/tmp/shots node verify/check-browser.mjs
*/
import pw from '/home/claude/.npm-global/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const BASE = process.env.BASE || 'http://127.0.0.1:8790';
const SHOTS = process.env.SHOTS;

let failures = 0;
const ok = (label, cond, detail = '') => {
  console.log((cond ? '  PASS  ' : '  FAIL  ') + label + (detail ? '   ' + detail : ''));
  if (!cond) failures++;
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

for (const vp of [{ w: 1280, h: 900, name: 'desktop' }, { w: 390, h: 780, name: 'mobile' }]) {
  console.log(`\n================ ${vp.name} (${vp.w}x${vp.h}) ================`);
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [], warnings = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
    if (m.type() === 'warning') warnings.push('console.warn: ' + m.text());
  });

  const t0 = Date.now();
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await page.waitForSelector('.lab-container', { timeout: 15000 });
  const paint = Date.now() - t0;
  await page.waitForTimeout(600);

  ok('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('no console warnings', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  ok('the hook is on screen quickly', paint < 6000, paint + ' ms');

  /* ---------------------------------------------------- generic page health */
  const hed = await page.evaluate(() => {
    const h = document.querySelector('#intro-hed');
    if (!h) return null;
    const r = document.createRange(); r.selectNodeContents(h);
    return { text: h.textContent.trim(), w: Math.round(r.getBoundingClientRect().width), vw: window.innerWidth };
  });
  ok('the title text fits the screen', hed && hed.w <= hed.vw - 8,
     hed ? `"${hed.text}" renders ${hed.w}px in ${hed.vw}` : 'no #intro-hed');

  const katex = await page.evaluate(() => ({
    count: document.querySelectorAll('.katex').length,
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 8),
  }));
  ok('KaTeX rendered', katex.count > 5, katex.count + ' nodes');
  ok('no raw LaTeX reached the DOM', katex.raw.length === 0, katex.raw.join(' '));

  const of = await page.evaluate(() => {
    const bad = [];
    for (const svg of document.querySelectorAll('svg')) {
      const s = svg.getBoundingClientRect(), p = svg.parentElement.getBoundingClientRect();
      if (s.width < 2) continue;
      if (s.right > p.right + 1.5 || s.left < p.left - 1.5) bad.push(Math.round(s.right - p.right));
    }
    const over = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1) continue;
      if (r.right > window.innerWidth + 1 || r.left < -1)
        over.push(el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className : '?').split(' ')[0]);
    }
    return { sw: document.documentElement.scrollWidth, iw: window.innerWidth, bad, over: [...new Set(over)].slice(0, 8) };
  });
  ok('page does not scroll horizontally', of.sw <= of.iw,
     of.sw + ' vs ' + of.iw + (of.over.length ? '  offenders: ' + of.over.join(' | ') : ''));
  ok('no svg escapes its parent box', of.bad.length === 0, JSON.stringify(of.bad.slice(0, 3)));

  const spilled = await page.evaluate(() => {
    const out = [];
    for (const svg of document.querySelectorAll('svg')) {
      const b = svg.getBoundingClientRect();
      if (b.width < 40) continue;
      for (const el of svg.querySelectorAll('line, circle, rect, path')) {
        const r = el.getBoundingClientRect();
        if (r.width < 0.5 && r.height < 0.5) continue;
        if (r.right > b.right + 2 || r.left < b.left - 2 || r.bottom > b.bottom + 2 || r.top < b.top - 2)
          out.push(el.tagName + '.' + (el.getAttribute('class') || '?'));
      }
    }
    return [...new Set(out)];
  });
  ok('nothing is drawn outside its own svg', spilled.length === 0, spilled.slice(0, 4).join(' | '));

  const glued = await page.evaluate(() =>
    [...document.querySelectorAll('.metric-value, .metric-sub, .metric-meta, .chart-sub, .impact-val, .table-caption, .policy-loss, .cost-hint, .badge')]
      // F1max is a legitimate token, not a number glued to a word.
      .map(e => e.textContent.replace(/F1max/g, 'Fmax'))
      .filter(t => /[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/.test(t)));
  ok('no text glued to a separator or a word', glued.length === 0, JSON.stringify(glued.slice(0, 3)));

  /* ------------------------------------------------------------ the hook */
  await page.locator('.lab-container').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const readMetrics = () => page.evaluate(() => {
    const cards = [...document.querySelectorAll('.metric-card')].map(c => ({
      text: c.textContent.replace(/\s+/g, ' ').trim(),
      value: parseFloat((c.querySelector('.metric-value') || {}).textContent),
    }));
    const find = (re) => (cards.find(c => re.test(c.text)) || {}).value;
    const slider = document.querySelector('.custom-slider');
    return {
      precision: find(/precision/i), recall: find(/recall/i), f1: find(/\bF1\b|F₁/i),
      threshold: slider ? parseFloat(slider.value) : null,
      nCards: cards.length,
    };
  });

  const m0 = await readMetrics();
  ok('the hook exposes precision, recall and F1 readouts',
     [m0.precision, m0.recall, m0.f1].every(v => Number.isFinite(v)),
     JSON.stringify(m0));

  // F1 is the harmonic mean of the two numbers shown beside it — checked on the
  // rendered text, so a wrong metric in the component fails here.
  // Precision and recall are shown as percentages and F1 as a fraction, so put
  // them on one scale before comparing. The relationship is the article's whole
  // subject; it is worth asserting on the rendered text rather than the module.
  const unit = (v) => (v > 1.0001 ? v / 100 : v);
  const P = unit(m0.precision), R = unit(m0.recall), F = unit(m0.f1);
  const harm = (2 * P * R) / (P + R);
  ok('the F1 shown really is the harmonic mean of the precision and recall shown',
     Math.abs(harm - F) < 0.006,
     `P ${P.toFixed(3)} R ${R.toFixed(3)} → ${harm.toFixed(3)} vs shown ${F.toFixed(3)}`);

  const setSlider = (v) => page.evaluate((val) => {
    const s = document.querySelector('.custom-slider');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(s, String(val));
    s.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('change', { bubbles: true }));
  }, v);

  await setSlider(0.10); await page.waitForTimeout(120);
  const lo = await readMetrics();
  await setSlider(0.60); await page.waitForTimeout(120);
  const hi = await readMetrics();
  ok('raising the threshold cannot increase recall', hi.recall <= lo.recall + 1e-9,
     `recall ${lo.recall} at t=0.10 → ${hi.recall} at t=0.60`);
  ok('...and the slider actually drives the readouts', lo.f1 !== hi.f1,
     `F1 ${lo.f1} → ${hi.f1}`);

  /*
    THE ARTICLE-SPECIFIC ONE. Sweep the real control, read the real readout, and
    find where F1 actually peaks on screen. The whole piece rests on that number
    being 0.158 on this validation set.
  */
  let best = { f1: -1, t: null };
  for (let t = 0.02; t <= 0.70001; t += 0.004) {
    await setSlider(Number(t.toFixed(3)));
    const m = await readMetrics();
    if (Number.isFinite(m.f1) && m.f1 > best.f1) best = { f1: m.f1, t: Number(t.toFixed(3)) };
  }
  ok('sweeping the real slider, F1 peaks where the article says it does',
     Math.abs(best.t - 0.158) <= 0.02 && Math.abs(best.f1 - 0.512) < 0.01,
     `peak F1 ${best.f1} at t=${best.t} (article claims 0.512 at 0.158)`);

  /* -------------------------------------------------------- the reveal table */
  const table = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.reveal-table tbody tr')].map(tr =>
      [...tr.querySelectorAll('td')].map(td => td.textContent.trim()));
    return rows;
  });
  ok('the reveal table renders four prevalence rows', table.length === 4, JSON.stringify(table[0] || []));
  ok('every row shows F1max/2 equal to half the F1max beside it, and the population t* matching it',
     table.length === 4 && table.every(r => {
       const f1 = parseFloat(r[1]), tStar = parseFloat(r[2]), half = parseFloat(r[3]);
       return Math.abs(half - f1 / 2) < 5e-5 && Math.abs(tStar - half) < 2e-3;
     }),
     table.map(r => `${r[1]}/2=${r[3]} vs t*=${r[2]}`).join('  '));

  /* --------------------------------------------------------- the cost figure */
  const policies = await page.evaluate(() =>
    [...document.querySelectorAll('.policy-card')].map(c => ({
      name: (c.querySelector('.policy-name') || {}).textContent || '',
      loss: parseFloat(((c.querySelector('.policy-loss') || {}).textContent || '').replace(/[^\d.]/g, '')),
    })));
  ok('the closing figure compares two policies', policies.length >= 2, JSON.stringify(policies));
  ok('the cost-optimal policy never loses to the F1 policy on cost',
     policies.length >= 2 && (() => {
       const f1p = policies.find(p => /F1/i.test(p.name)), opt = policies.find(p => /optimal|cost/i.test(p.name));
       return f1p && opt ? opt.loss <= f1p.loss + 1e-6 : false;
     })(),
     policies.map(p => `${p.name.trim()}=${p.loss}`).join('  '));

  /* --------------------- no negative geometry, anywhere, at any scroll ------ */
  {
    const H = await page.evaluate(() => document.body.scrollHeight);
    let bad = [];
    for (let f = 0; f <= 1.0001; f += 0.05) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * f));
      await page.waitForTimeout(80);
      bad = bad.concat(await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('rect, circle, line, path')) {
          for (const a of ['width', 'height', 'r']) {
            const v = el.getAttribute(a);
            if (v !== null && Number(v) < 0) out.push(el.tagName + '.' + a + '=' + v);
          }
          const d = el.getAttribute('d');
          if (d && /undefined|NaN/.test(d)) out.push(el.tagName + '.d has ' + (d.match(/undefined|NaN/) || [])[0]);
        }
        return out;
      }));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    ok('no negative width, height or radius, and no NaN path, anywhere', bad.length === 0,
       [...new Set(bad)].slice(0, 4).join(' | '));
  }

  if (SHOTS) {
    const H = await page.evaluate(() => document.body.scrollHeight);
    for (const [i, f] of [0, 0.08, 0.16, 0.24, 0.33, 0.42, 0.51, 0.60, 0.69, 0.78, 0.87, 0.95].entries()) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * f));
      await page.waitForTimeout(420);
      await page.screenshot({ path: `${SHOTS}/f1-${vp.name}-${String(i).padStart(2, '0')}.png` });
    }
    await page.locator('.lab-container').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator('.lab-container').first().screenshot({ path: `${SHOTS}/f1-hook-${vp.name}.png` });
  }

  ok('still no page errors after interaction', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('still no console warnings after interaction', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close();
console.log('\n' + (failures ? failures + ' BROWSER CHECK(S) FAILED' : 'all browser checks passed') + '\n');
process.exit(failures ? 1 : 0);
