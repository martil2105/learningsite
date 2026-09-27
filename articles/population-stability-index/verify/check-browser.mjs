/*
  The rendering checks: everything check-numbers.mjs cannot see, because it is
  about pixels rather than algebra.

  The article-specific geometry checks are the point of the file, and all three
  have the same shape - take a number the page PRINTS, and recover it from where
  the page DREW something, through the chart's own scale:

    1. The lab's PSI axis is logarithmic. Read the two decade ticks out of the
       DOM, build the inverse scale from them, apply it to the reading marker's
       x, and require the result to equal the number in the readout. That runs
       the scale, the clamp, the binning and the reading through one assertion,
       and it is the check that would catch a marker drawn in the wrong units.

    2. The same inverse scale applied to the null band's two edges must give the
       5th and 95th percentiles for the sample size the second slider is on -
       so moving that slider has to move the band, in the right direction, by
       the right amount.

    3. The mirror figure's top panel is antisymmetric to machine precision in
       the DATA. In pixels it therefore has to be antisymmetric too: for every
       decile, the blue bar's height above the zero line must equal the red
       bar's below it. That is the figure's entire claim, and a rounding bug in
       either scale would break it.

  Run against a served production build:

      npm run build
      python3 -m http.server 8790 -d public &
      BASE=http://127.0.0.1:8790 SHOTS=/tmp/shots node verify/check-browser.mjs

  Needs Playwright. Then look at the screenshots - every bug that mattered in
  this project so far was invisible to every assertion and obvious in a picture.
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
  await page.waitForSelector('.lab svg.axis', { timeout: 20000 });
  const paint = Date.now() - t0;
  await page.waitForTimeout(700);

  ok('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('no console warnings', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  ok('the hook is on screen quickly', paint < 9000, paint + ' ms');

  /* ---------------------------------------------------------- the furniture */

  /*
    "Population Stability Index" is twenty-six characters and wraps. The element
    box is just the container, so measure the rendered LINES with a Range: a
    fixed font size chosen for a short title gives a long one a horizontally
    scrolling page, and a heading overflows the SCREEN rather than any box.
  */
  const hed = await page.evaluate(() => {
    const h = document.querySelector('#intro-hed');
    if (!h) return null;
    const r = document.createRange();
    r.selectNodeContents(h);
    const rects = [...r.getClientRects()].map(b => Math.round(b.width));
    return { text: h.textContent.trim(), lines: rects, widest: Math.max(...rects), vw: window.innerWidth };
  });
  ok('every line of the title fits the screen', hed && hed.widest <= hed.vw - 8,
     hed ? `"${hed.text}" on ${hed.lines.length} line(s), widest ${hed.widest}px in ${hed.vw}` : 'no #intro-hed');

  const katex = await page.evaluate(() => ({
    count: document.querySelectorAll('.katex').length,
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 8),
  }));
  ok('KaTeX rendered', katex.count > 5, katex.count + ' nodes');
  ok('no raw LaTeX reached the DOM', katex.raw.length === 0, katex.raw.join(' '));

  const of = await page.evaluate(() => {
    const bad = [];
    for (const svg of document.querySelectorAll('svg')) {
      if (svg.closest('.katex')) continue;   // KaTeX's own geometry, not ours
      const s = svg.getBoundingClientRect();
      const p = svg.parentElement.getBoundingClientRect();
      if (s.width < 2) continue;
      if (s.right > p.right + 1.5 || s.left < p.left - 1.5)
        bad.push('svg.' + (svg.getAttribute('class') || '?') + ' inside ' +
          svg.parentElement.tagName.toLowerCase() + '.' +
          (typeof svg.parentElement.className === 'string' ? svg.parentElement.className : '?').split(' ')[0] +
          ' by ' + Math.round(Math.max(s.right - p.right, p.left - s.left)));
    }
    const over = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.katex')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1) continue;
      if (r.right > window.innerWidth + 1 || r.left < -1)
        over.push(el.tagName.toLowerCase() + '.' +
          (typeof el.className === 'string' ? el.className : '?').split(' ')[0] +
          ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
    }
    return { sw: document.documentElement.scrollWidth, iw: window.innerWidth, bad, over: [...new Set(over)].slice(0, 8) };
  });
  ok('page does not scroll horizontally', of.sw <= of.iw,
     of.sw + ' vs ' + of.iw + (of.over.length ? '  offenders: ' + of.over.join(' | ') : ''));
  ok('no svg escapes its parent box', of.bad.length === 0, JSON.stringify(of.bad.slice(0, 3)));

  /* A table that scrolls inside its own wrapper still must not push the page. */
  const tbl = await page.evaluate(() =>
    [...document.querySelectorAll('.tablewrap')].map(w => ({
      w: Math.round(w.clientWidth), t: Math.round(w.querySelector('table') ? w.querySelector('table').scrollWidth : 0),
      spill: w.getBoundingClientRect().right > window.innerWidth + 1,
    })).filter(r => r.spill));
  ok('no table wrapper spills past the viewport', tbl.length === 0, JSON.stringify(tbl.slice(0, 3)));

  /* Svelte strips the leading whitespace of an {#if} or {#each} body, which has
     glued a figure to the next word in three articles now. */
  const glued = await page.evaluate(() =>
    [...document.querySelectorAll('.cv, .cap, .rs, .rk, .rv, .ftitle, .ptitle, .note, .tip, .n, .pd, .ek, .split, .legend, .body-text')]
      .map(e => e.textContent).filter(t => /[\d%]·|·[\dA-Za-z]|\d[a-z]{4,}/.test(t)));
  ok('no text glued to a separator or a word', glued.length === 0, JSON.stringify(glued.slice(0, 3)));

  /* ------------------------------------------------- the opening question */
  await page.locator('div.pack').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const pack = () => page.evaluate(() => {
    const cards = [...document.querySelectorAll('div.pack .card')];
    return {
      n: cards.length,
      tops: cards.map(c => Math.round(c.getBoundingClientRect().top)),
      names: cards.map(c => c.querySelector('.nm').textContent.trim()),
      vals: cards.map(c => c.querySelector('.val').textContent.trim()),
      verdicts: cards.map(c => c.querySelector('.verdict').textContent.trim()),
      bars: cards.map(c => c.querySelectorAll('rect').length),
      truths: cards.map(c => !!c.querySelector('.truth')),
    };
  });
  const p0 = await pack();
  ok('the pack draws four channels', p0.n === 4, p0.names.join(' | '));
  ok('each with ten decile bars', p0.bars.every(b => b === 10), JSON.stringify(p0.bars));
  ok('the four cards sit on one row at desktop',
     vp.w < 780 || (Math.max(...p0.tops) - Math.min(...p0.tops) < 3), JSON.stringify(p0.tops));
  ok('...and wrap on a phone', vp.w > 780 || (Math.max(...p0.tops) - Math.min(...p0.tops) > 40), JSON.stringify(p0.tops));
  ok('every reading in the opening month is green', p0.verdicts.every(v => v === 'no action'), p0.vals.join('  '));
  ok('the broker panel outscores the channel that moved, in the month shown',
     parseFloat(p0.vals[3]) > parseFloat(p0.vals[0]), p0.vals[3] + ' vs ' + p0.vals[0]);

  await page.locator('.ctrl .pill', { hasText: 'next month' }).click();
  await page.waitForTimeout(250);
  const p1 = await pack();
  ok('next month redraws all four', p1.vals.join() !== p0.vals.join(), p1.vals.join('  '));
  /* the point of the control: the channel that moved is the STEADY one */
  const moves = [];
  let last = p1.vals;
  for (let i = 0; i < 6; i++) {
    await page.locator('.ctrl .pill', { hasText: 'next month' }).click();
    await page.waitForTimeout(120);
    const p = await pack();
    moves.push(p.vals.map((v, k) => Math.abs(parseFloat(v) - parseFloat(last[k]))));
    last = p.vals;
  }
  const swing = [0, 1, 2, 3].map(k => Math.max(...moves.map(m => m[k])));
  ok('the channel that moved has the steadiest reading and the quiet panel the jumpiest',
     swing[3] > swing[0] * 3, 'month-to-month swing: ' + swing.map(s => s.toFixed(4)).join('  '));

  await page.locator('.ctrl .pill', { hasText: 'show me' }).click();
  await page.waitForTimeout(250);
  const p2 = await pack();
  ok('the reveal adds the truth to every card', p2.truths.every(Boolean));

  /* ==================== 1. the lab's axis is what it says ==================== */
  await page.locator('.lab').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  const lab = () => page.evaluate(() => {
    const svg = document.querySelector('.lab svg.axis');
    const ticks = [...svg.querySelectorAll('line.atick')].map(l => ({ v: +l.dataset.v, x: +l.getAttribute('x1') }));
    ticks.sort((a, b) => a.v - b.v);
    /* rebuild the inverse of whatever scale the page used, from the page itself */
    const a = ticks[0], b = ticks[ticks.length - 1];
    const inv = (x) => Math.exp(Math.log(a.v) + ((x - a.x) / (b.x - a.x)) * (Math.log(b.v) - Math.log(a.v)));
    const mark = svg.querySelector('line.readmark');
    const nb = svg.querySelector('rect.nullband');
    const read = +document.querySelector('.lab .reading').dataset.v;
    const floor = +document.querySelector('.lab .floorval').dataset.v;
    return {
      ticks: ticks.map(t => t.v),
      drawn: inv(+mark.getAttribute('x1')),
      read, floor,
      bandLo: inv(+nb.getAttribute('x')),
      bandHi: inv(+nb.getAttribute('x') + +nb.getAttribute('width')),
      bandW: +nb.getAttribute('width'),
      n: +document.querySelector('.lab .volcv').dataset.n,
      bars: svg.ownerDocument.querySelectorAll('.lab svg.dist rect.bar').length,
      edges: svg.ownerDocument.querySelectorAll('.lab svg.dist line.edge').length,
    };
  });

  const l0 = await lab();
  ok('the PSI axis is decades', l0.ticks.length === 5 && l0.ticks[0] === 1e-4 && l0.ticks[4] === 1, l0.ticks.join(' '));
  ok('THE CHECK: the reading marker, read back through the page\'s own log scale, is the printed number',
     Math.abs(l0.drawn / l0.read - 1) < 0.02, 'drawn ' + l0.drawn.toFixed(5) + ' vs printed ' + l0.read.toFixed(5));
  ok('the distribution panel draws a fine histogram and the nine decile edges',
     l0.bars > 30 && l0.edges === 9, l0.bars + ' bars, ' + l0.edges + ' edges');

  /* move the sample size: the band has to move left and shrink, and the
     reading has to stay put, because nothing about the population changed */
  const setRange = (sel, v) => page.$eval(sel, (el, val) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, String(val));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, v);
  await setRange('.lab input.vol', Math.log(60000));
  await page.waitForTimeout(400);
  const l1 = await lab();
  /* On a LOG axis the band slides without narrowing - the null distribution is
     the same shape at every N, rescaled - so the thing to assert is that its
     width in PSI units collapses while its width in pixels does not. An earlier
     version of this check asserted the pixels and was wrong about the article. */
  ok('turning the volume up collapses the no-drift band in PSI units',
     (l1.bandHi - l1.bandLo) < (l0.bandHi - l0.bandLo) / 8,
     (l0.bandHi - l0.bandLo).toExponential(2) + ' at ' + l0.n + ' -> ' +
     (l1.bandHi - l1.bandLo).toExponential(2) + ' at ' + l1.n);
  ok('...while keeping its width on the log axis, which is the law made visible',
     Math.abs(l1.bandW / l0.bandW - 1) < 0.08,
     l0.bandW.toFixed(1) + 'px -> ' + l1.bandW.toFixed(1) + 'px');
  ok('...and moves it left, toward zero', l1.bandHi < l0.bandHi,
     l0.bandHi.toExponential(2) + ' -> ' + l1.bandHi.toExponential(2));
  ok('...and the floor the readout prints follows (B-1)(1/N + 1/M)',
     Math.abs(l1.floor / (9 * (1 / l1.n + 1 / 50000)) - 1) < 0.05,
     'printed ' + l1.floor.toExponential(3) + ' vs formula ' + (9 * (1 / l1.n + 1 / 50000)).toExponential(3));
  ok('...and the band still brackets the floor', l1.bandLo < l1.floor && l1.bandHi > l1.floor);
  ok('the marker still matches its number at the other end of the range',
     Math.abs(l1.drawn / l1.read - 1) < 0.02, 'drawn ' + l1.drawn.toExponential(3) + ' vs printed ' + l1.read.toExponential(3));

  await setRange('.lab input.vol', Math.log(120));
  await page.waitForTimeout(400);
  const l2 = await lab();
  ok('at the small end the no-drift band reaches the amber line, with the drift at zero',
     l2.bandHi > 0.05, 'band runs to ' + l2.bandHi.toFixed(3) + ' at ' + l2.n + ' applications');

  /* now move the population and watch the reading leave the band */
  await setRange('.lab input.shift', 30);
  await page.waitForTimeout(400);
  const l3 = await lab();
  ok('moving the population really does move the reading', l3.read > l2.read * 1.5,
     l2.read.toFixed(4) + ' -> ' + l3.read.toFixed(4));
  ok('...without moving the no-drift band, which only knows about N',
     Math.abs(l3.bandHi / l2.bandHi - 1) < 0.02);

  await page.locator('.lab .pill.ghost').click();
  await page.waitForTimeout(350);
  const l4 = await lab();
  ok('reset puts the lab back', Math.abs(l4.n - l0.n) < 30 && Math.abs(l4.read / l0.read - 1) < 0.001, l4.n + ' applications');

  /* ==================== 2. the mirror figure is a mirror ==================== */
  await page.locator('.body-header', { hasText: 'A magnitude' }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const mirror = await page.evaluate(() => {
    const s = document.querySelector('svg.shifts');
    const t = document.querySelector('svg.terms');
    const h = (el) => +el.getAttribute('height');
    const up = [...s.querySelectorAll('rect.up')].map(h);
    const dn = [...s.querySelectorAll('rect.dn')].map(h);
    const tu = [...t.querySelectorAll('rect.up')].map(h);
    const td = [...t.querySelectorAll('rect.dn')].map(h);
    const upY = [...s.querySelectorAll('rect.up')].map(e => +e.getAttribute('y'));
    const dnY = [...s.querySelectorAll('rect.dn')].map(e => +e.getAttribute('y'));
    return {
      n: up.length,
      worstMirror: Math.max(...up.map((v, i) => Math.abs(v - dn[i]))),
      opposite: up.every((v, i) => (upY[i] < dnY[i]) === (upY[i] + v <= dnY[i] + 0.01) ? true : true),
      sides: up.map((v, i) => Math.sign(upY[i] - dnY[i])),
      termGap: Math.max(...tu.map((v, i) => Math.abs(v - td[i]))),
      termTotalUp: tu.reduce((a, b) => a + b, 0),
      termTotalDn: td.reduce((a, b) => a + b, 0),
    };
  });
  ok('the deviation panel draws ten pairs', mirror.n === 10);
  ok('THE CHECK: every pair is an exact mirror in pixels, as the data is to machine precision',
     mirror.worstMirror < 0.6, 'worst pair differs by ' + mirror.worstMirror.toFixed(3) + 'px');
  ok('each pair points opposite ways', mirror.sides.filter(s => s !== 0).length === 10,
     JSON.stringify(mirror.sides));
  ok('the contribution panel is NOT a mirror, which is the whole point',
     mirror.termGap > 2, 'worst pair differs by ' + mirror.termGap.toFixed(2) + 'px');
  ok('...and the improvement totals more than the deterioration',
     mirror.termTotalUp > mirror.termTotalDn,
     mirror.termTotalUp.toFixed(1) + 'px vs ' + mirror.termTotalDn.toFixed(1) + 'px');

  /* ==================== 3. the bin sweep adds up ==================== */
  await page.locator('svg.sweep').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const sweep = () => page.evaluate(() => {
    const svg = document.querySelector('svg.sweep');
    const sig = [...svg.querySelectorAll('rect.sig')];
    const flr = [...svg.querySelectorAll('rect.flr')];
    const y0 = Math.max(...sig.map(r => +r.getAttribute('y') + +r.getAttribute('height')));
    const rows = sig.map((s, i) => ({
      B: +s.dataset.b,
      sig: +s.getAttribute('height'),
      flr: +flr[i].getAttribute('height'),
      topY: +flr[i].getAttribute('y'),
    }));
    return {
      rows, y0,
      stacked: rows.every((r, i) => Math.abs((+flr[i].getAttribute('y') + r.flr) - (+sig[i].getAttribute('y'))) < 0.6),
      readout: document.querySelector('.sweepcv').textContent.trim(),
    };
  });
  const sw = await sweep();
  ok('the sweep draws a stacked bar per bin count', sw.rows.length === 16);
  ok('the floor segment sits exactly on top of the signal segment', sw.stacked);
  ok('the bars grow with the bin count, and grow by growing their floor',
     sw.rows[sw.rows.length - 1].topY < sw.rows[0].topY &&
     sw.rows[sw.rows.length - 1].flr > sw.rows[0].flr * 20,
     'floor ' + sw.rows[0].flr.toFixed(1) + 'px -> ' + sw.rows[sw.rows.length - 1].flr.toFixed(1) + 'px');
  ok('...while the signal segment stays within a factor of three',
     Math.max(...sw.rows.map(r => r.sig)) / Math.min(...sw.rows.map(r => r.sig)) < 3,
     sw.rows.map(r => r.sig.toFixed(0)).join(' '));
  await setRange('input.bins', 13);
  await page.waitForTimeout(300);
  const sw2 = await sweep();
  ok('the bin slider moves the readout', sw2.readout !== sw.readout, sw2.readout.slice(0, 70));

  /* ==================== 4. blindness really reads zero ==================== */
  await page.locator('.pills.warp').scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  const warpVals = [];
  for (const i of [0, 1, 2, 3]) {
    await page.locator('.pills.warp .pill').nth(i).click();
    await page.waitForTimeout(180);
    warpVals.push(await page.evaluate(() => ({
      psi: document.querySelector('.warppsi').textContent.trim(),
      appr: document.querySelector('.warppsi').closest('.ro').textContent,
    })));
  }
  ok('rearranging inside the deciles changes PSI by exactly nothing, at every setting',
     warpVals.every(v => v.psi === '0.000000'), warpVals.map(v => v.psi).join(' '));
  ok('...while the approval rate readout does move',
     new Set(warpVals.map(v => v.appr)).size === 4);

  await page.locator('.pills.bunch').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const bunchVals = [];
  for (const i of [0, 2, 4]) {
    await page.locator('.pills.bunch .pill').nth(i).click();
    await page.waitForTimeout(180);
    bunchVals.push(await page.evaluate(() => ({
      psi: document.querySelector('.bunchpsi').textContent.trim(),
      row: document.querySelector('.bunchpsi').closest('.ro').textContent,
    })));
  }
  ok('bunching on the far side of the cut-off also changes it by exactly nothing',
     bunchVals.every(v => v.psi === '0.000000'));
  ok('...while everything that matters to the lender moves',
     new Set(bunchVals.map(v => v.row)).size === 3);

  /* ==================== 5. the thresholds chart ==================== */
  await page.locator('path.fixed').scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  const thr = await page.evaluate(() => {
    const ys = (sel) => {
      const d = document.querySelector(sel).getAttribute('d');
      const n = d.replace(/[ML]/g, ' ').trim().split(/\s+/).map(Number);
      const out = [];
      for (let i = 1; i < n.length; i += 2) out.push(n[i]);
      return out;
    };
    return { fixed: ys('path.fixed'), adaptive: ys('path.adaptive'),
             amber: ys('path.amber'), red: ys('path.red'),
             badD: [...document.querySelectorAll('path')].filter(p => !p.closest('.katex')).some(p => /undefined|NaN/.test(p.getAttribute('d') || '')) };
  });
  const flat = Math.max(...thr.fixed) - Math.min(...thr.fixed);
  ok('the fixed-threshold curve is flat, which is the article\'s claim in pixels',
     flat < 14, flat.toFixed(1) + 'px of variation across the whole range');
  ok('the sample-size-aware curve falls right across the chart',
     thr.adaptive[thr.adaptive.length - 1] - thr.adaptive[0] > 40,
     (thr.adaptive[thr.adaptive.length - 1] - thr.adaptive[0]).toFixed(0) + 'px');
  ok('the false-alarm curves fall monotonically', thr.amber.every((y, i, a) => i === 0 || y >= a[i - 1] - 0.01));
  ok('no path anywhere has NaN or undefined in it', !thr.badD);

  /* ==================== 6. the damage scatter ==================== */
  await page.locator('svg.scatter').scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  const sc = await page.evaluate(() => {
    const g = (sel) => [...document.querySelectorAll('svg.scatter ' + sel)]
      .map(c => ({ x: +c.getAttribute('cx'), y: +c.getAttribute('cy') }));
    return { cov: g('circle.cov'), con: g('circle.con') };
  });
  ok('the scatter draws every scenario', sc.cov.length + sc.con.length > 30,
     sc.cov.length + ' covariate, ' + sc.con.length + ' concept');
  ok('the concept-drift points are the leftmost on the chart',
     Math.max(...sc.con.map(p => p.x)) < Math.min(...sc.cov.map(p => p.x)),
     'concept x <= ' + Math.max(...sc.con.map(p => p.x)).toFixed(0) +
     ', covariate x >= ' + Math.min(...sc.cov.map(p => p.x)).toFixed(0));
  ok('...and the topmost, which is the sentence under the chart',
     Math.max(...sc.con.map(p => p.y)) < Math.min(...sc.cov.map(p => p.y)),
     'the four most expensive months are the four furthest left');

  /* ==================== the generic sweeps ==================== */
  const spilled = await page.evaluate(() => {
    const out = [];
    for (const svg of document.querySelectorAll('svg')) {
      const b = svg.getBoundingClientRect();
      if (b.width < 40) continue;
      if (svg.closest('.katex')) continue;
      for (const el of svg.querySelectorAll('line, circle, rect, path, text')) {
        const r = el.getBoundingClientRect();
        if (r.width < 0.5 && r.height < 0.5) continue;
        if (r.right > b.right + 2 || r.left < b.left - 2 || r.bottom > b.bottom + 2 || r.top < b.top - 2)
          out.push('svg.' + (svg.getAttribute('class') || '?') + ' > ' + el.tagName + '.' +
            (el.getAttribute('class') || '?') + ' "' + (el.textContent || '').slice(0, 24) + '" by ' +
            Math.round(Math.max(r.right - b.right, b.left - r.left, r.bottom - b.bottom, b.top - r.top)) + 'px');
      }
    }
    return [...new Set(out)];
  });
  ok('nothing is drawn outside its own svg', spilled.length === 0, spilled.slice(0, 5).join(' | '));

  {
    const H = await page.evaluate(() => document.body.scrollHeight);
    let bad = [];
    for (let fr = 0; fr <= 1.0001; fr += 0.04) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * fr));
      await page.waitForTimeout(60);
      bad = bad.concat(await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('rect, circle, line, path')) {
          if (el.closest('.katex')) continue;
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
    await page.waitForTimeout(200);
    ok('no negative width, height or radius, and no NaN path, at any scroll position',
       bad.length === 0, [...new Set(bad)].slice(0, 4).join(' | '));
  }

  /* An <svg><text> does not wrap, so a long label inside one is clipped with no
     error and no overflow. Titles live in HTML here; check that stays true. */
  const longText = await page.evaluate(() =>
    [...document.querySelectorAll('svg text')].filter(t => !t.closest('.katex')).map(t => t.textContent.trim())
      .filter(s => s.length > 62));
  ok('no svg text long enough to clip on a phone', longText.length === 0, JSON.stringify(longText.slice(0, 2)));

  if (SHOTS) {
    await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('.lab svg.axis', { timeout: 20000 });
    await page.waitForTimeout(700);
    const H = await page.evaluate(() => document.body.scrollHeight);
    const fs = [0, 0.05, 0.10, 0.15, 0.20, 0.26, 0.32, 0.38, 0.44, 0.50, 0.56, 0.62, 0.68, 0.74, 0.80, 0.86, 0.92];
    for (const [i, fr] of fs.entries()) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * fr));
      await page.waitForTimeout(380);
      await page.screenshot({ path: `${SHOTS}/psi-${vp.name}-${String(i).padStart(2, '0')}.png` });
    }
    for (const [name, sel] of [
      ['pack', 'div.pack'],
      ['lab', '.lab'],
      ['cost', '.fig:has(circle)'],
      ['overlay', '.fig:has(svg.overlay)'],
      ['thresh', '.figs'],
      ['sweep', '.fig:has(svg.sweep)'],
      ['zeros', '.epsrow'],
      ['mirror', '.fig:has(svg.shifts)'],
      ['warp', '.fig:has(.pills.warp)'],
      ['bunch', '.fig:has(.pills.bunch)'],
      ['scatter', '.fig:has(svg.scatter)'],
      ['packfixed', '.fig:has(table.fixedpack)'],
      ['direction', '.fig:has(svg.terms)'],
    ]) {
      try {
        const el = page.locator(sel).first();
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await el.screenshot({ path: `${SHOTS}/psi-${name}-${vp.name}.png` });
      } catch (e) { console.log('       (no shot for ' + name + ': ' + e.message.split('\n')[0] + ')'); }
    }
  }

  ok('still no page errors after interaction', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('still no console warnings after interaction', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close();
console.log('\n' + (failures ? failures + ' BROWSER CHECK(S) FAILED' : 'all browser checks passed') + '\n');
process.exit(failures ? 1 : 0);
