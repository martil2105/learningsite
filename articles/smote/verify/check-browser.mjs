/*
  The rendering checks for the SMOTE article. Everything here is something
  check-numbers.mjs cannot see, because it is about pixels rather than algebra.

  The article-specific geometry checks are the point of this file:

    1. Every synthetic point drawn in the hook must lie ON one of the k segments
       drawn beside it, in rendered pixels. That is the algorithm's one claim,
       and checking it on screen exercises the neighbour table, the child
       arithmetic and the plot transform in a single assertion.

    2. Every synthetic point must lie inside the convex hull of the drawn fraud
       points. The maths section states this as an identity; this is the same
       statement made about the picture.

    3. A synthetic point drawn WITH a dark ring must be outside the shaded
       fraud region, and one without must be inside - tested with
       isPointInFill on the actual region path. This is the end-to-end check:
       it goes through the density verdict, the contour, and both transforms
       at once, and it is the shape of check that caught a whole Voronoi layer
       drawn in the wrong coordinate system in an earlier article.

  Run against a served production build:

      npm run build
      python3 -m http.server 8767 -d public &
      node verify/check-browser.mjs

  Needs Playwright. SHOTS=<dir> also writes screenshots. Look at them.
*/
import pw from '/home/claude/.npm-global/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const BASE = process.env.BASE || 'http://127.0.0.1:8767';
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
  await page.waitForSelector('.lab svg', { timeout: 15000 });
  const paint = Date.now() - t0;
  await page.waitForTimeout(600);

  ok('no page errors', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('no console warnings', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  ok('the hook is on screen quickly', paint < 6000, paint + ' ms');

  // The masthead is sized in vw for a reason: a fixed size chosen for a short
  // title gives a long one a horizontally scrolling page, and nothing else
  // notices, because the heading overflows the SCREEN rather than any box.
  const hed = await page.evaluate(() => {
    const h = document.querySelector('#intro-hed');
    if (!h) return null;
    const range = document.createRange();
    range.selectNodeContents(h);
    const r = range.getBoundingClientRect();
    return { text: h.textContent.trim(), w: Math.round(r.width), vw: window.innerWidth };
  });
  ok('the title text fits the screen', hed && hed.w <= hed.vw - 8,
     hed ? '"' + hed.text + '" renders ' + hed.w + 'px in ' + hed.vw : 'no #intro-hed');

  const katex = await page.evaluate(() => ({
    count: document.querySelectorAll('.katex').length,
    raw: (document.body.innerText.match(/\\[a-zA-Z]{2,}/g) || []).slice(0, 8),
  }));
  ok('KaTeX rendered', katex.count > 5, katex.count + ' nodes');
  ok('no raw LaTeX reached the DOM', katex.raw.length === 0, katex.raw.join(' '));

  const of = await page.evaluate(() => {
    const bad = [];
    for (const svg of document.querySelectorAll('svg')) {
      const s = svg.getBoundingClientRect();
      const p = svg.parentElement.getBoundingClientRect();
      if (s.width < 2) continue;
      if (s.right > p.right + 1.5 || s.left < p.left - 1.5) bad.push(Math.round(s.right - p.right));
    }
    const spill = [];
    for (const el of document.querySelectorAll('.eq, .card, .chart-box, .legend')) {
      if (el.getBoundingClientRect().right > window.innerWidth + 1) spill.push(el.className);
    }
    // Name the offenders. "the page is 93px too wide" is a fact; "this element
    // is 93px too wide" is a fix.
    const over = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width < 1) continue;
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        over.push(el.tagName.toLowerCase() + '.' + (typeof el.className === 'string' ? el.className : '?').split(' ')[0] +
                  ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
      }
    }
    return { sw: document.documentElement.scrollWidth, iw: window.innerWidth, bad, spill, over: [...new Set(over)].slice(0, 8) };
  });
  ok('page does not scroll horizontally', of.sw <= of.iw, of.sw + ' vs ' + of.iw + (of.over.length ? '  offenders: ' + of.over.join(' | ') : ''));
  ok('no svg escapes its parent box', of.bad.length === 0, JSON.stringify(of.bad.slice(0, 3)));
  ok('nothing spills past the viewport', of.spill.length === 0, of.spill.slice(0, 3).join(' | '));

  // Nothing may be DRAWN outside the svg that contains it. An outer <svg> clips
  // visually, so a mark running off the chart looks fine and still widens the
  // document.
  const spilled = await page.evaluate(() => {
    const out = [];
    for (const svg of document.querySelectorAll('svg')) {
      const b = svg.getBoundingClientRect();
      if (b.width < 40) continue;
      for (const el of svg.querySelectorAll('line, circle, rect, path')) {
        const r = el.getBoundingClientRect();
        if (r.width < 0.5 && r.height < 0.5) continue;
        if (r.right > b.right + 2 || r.left < b.left - 2 || r.bottom > b.bottom + 2 || r.top < b.top - 2) {
          out.push(el.tagName + '.' + (el.getAttribute('class') || '?') + ' by ' +
                   Math.round(Math.max(r.right - b.right, b.left - r.left, r.bottom - b.bottom, b.top - r.top)) + 'px');
        }
      }
    }
    return [...new Set(out)];
  });
  ok('nothing is drawn outside its own svg', spilled.length === 0, spilled.slice(0, 4).join(' | '));

  const glued = await page.evaluate(() =>
    [...document.querySelectorAll('.readout, .sub, .foot, .chart-sub, .hoverline, .cap, .dtitle, .key, .val, .rval')]
      .map(e => e.textContent).filter(t => /[\d%]·|·[\dA-Za-z]|\d[a-z]{3,}/.test(t)));
  ok('no text glued to a separator or a word', glued.length === 0, JSON.stringify(glued.slice(0, 3)));

  /* ================= the hook ================= */
  await page.locator('.lab').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Equal aspect: one decade of euros is 1/0.75 standardised units and six
  // hours is exactly 1, so the pixel gaps must be in that ratio. If they are
  // not, the chart is showing a geometry the algorithm is not using.
  const aspect = await page.evaluate(() => {
    const svg = document.querySelector('.lab svg');
    const texts = [...svg.querySelectorAll('text.tick')];
    const eur = texts.filter(t => /^€/.test(t.textContent));
    const hrs = texts.filter(t => /:00$/.test(t.textContent));
    const dx = Math.abs(+eur[1].getAttribute('x') - +eur[0].getAttribute('x'));
    const dy = Math.abs(+hrs[1].getAttribute('y') - +hrs[0].getAttribute('y'));
    return { dx, dy, ratio: dx / dy };
  });
  ok('both axes are drawn at the same scale', Math.abs(aspect.ratio - 1 / 0.75) < 0.02,
     'one decade ' + aspect.dx.toFixed(1) + 'px, six hours ' + aspect.dy.toFixed(1) + 'px, ratio ' + aspect.ratio.toFixed(3));

  const geom = () => page.evaluate(() => {
    const svg = document.querySelector('.lab svg');
    const segs = [...svg.querySelectorAll('line.seg')].map(l => ({
      x1: +l.getAttribute('x1'), y1: +l.getAttribute('y1'),
      x2: +l.getAttribute('x2'), y2: +l.getAttribute('y2'),
    }));
    const kids = [...svg.querySelectorAll('circle.kid')].map(c => ({
      x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), ringed: c.getAttribute('stroke') !== 'none',
    }));
    const fraud = [...svg.querySelectorAll('circle.fraud')].map(c => ({ x: +c.getAttribute('cx'), y: +c.getAttribute('cy') }));
    const handle = svg.querySelector('.handle circle:last-of-type');
    const wash = svg.querySelector('path.wash');
    // distance from a point to a segment, in user units
    const dseg = (p, s) => {
      const vx = s.x2 - s.x1, vy = s.y2 - s.y1;
      const L2 = vx * vx + vy * vy;
      let t = L2 ? ((p.x - s.x1) * vx + (p.y - s.y1) * vy) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(p.x - (s.x1 + t * vx), p.y - (s.y1 + t * vy));
    };
    const worstOffSegment = Math.max(...kids.map(k => Math.min(...segs.map(s => dseg(k, s)))));

    // convex hull of the drawn fraud points, including the handle
    const pts = fraud.concat([{ x: +handle.getAttribute('cx'), y: +handle.getAttribute('cy') }])
      .map(p => [p.x, p.y]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower = [], upper = [];
    for (const q of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop(); lower.push(q); }
    for (let i = pts.length - 1; i >= 0; i--) { const q = pts[i]; while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop(); upper.push(q); }
    lower.pop(); upper.pop();
    const hull = lower.concat(upper);
    const outside = kids.filter(k => {
      for (let i = 0; i < hull.length; i++) {
        const a = hull[i], b = hull[(i + 1) % hull.length];
        if ((b[0] - a[0]) * (k.y - a[1]) - (b[1] - a[1]) * (k.x - a[0]) < -0.6) return true;
      }
      return false;
    }).length;

    // ringed <-> outside the shaded region, on the real path geometry
    let wrong = 0, tested = 0;
    if (wash && wash.isPointInFill) {
      const pt = svg.createSVGPoint();
      for (const k of kids) {
        pt.x = k.x; pt.y = k.y;
        let inside;
        try { inside = wash.isPointInFill(pt); } catch (e) { continue; }
        tested++;
        if (inside === k.ringed) wrong++;
      }
    }
    return {
      nSeg: segs.length, nKid: kids.length, nFraud: fraud.length,
      worstOffSegment, outside, ringed: kids.filter(k => k.ringed).length, wrong, tested,
      readout: document.querySelector('.lab .readout').textContent.trim(),
      good: document.querySelector('.lab .readout').classList.contains('good'),
    };
  });

  const g0 = await geom();
  ok('the hook draws one segment per neighbour at the default k', g0.nSeg === 5, g0.nSeg + ' segments');
  ok('it draws 180 synthetic points', g0.nKid === 180, g0.nKid + ' points');
  ok('every synthetic point is ON one of the drawn segments', g0.worstOffSegment < 0.4,
     'worst off-segment distance ' + g0.worstOffSegment.toFixed(4) + 'px');
  ok('every synthetic point is inside the hull of the drawn fraud points', g0.outside === 0, g0.outside + ' outside');
  ok('a ringed point is outside the shaded region and an unringed one is inside',
     g0.tested > 100 && g0.wrong === 0, g0.wrong + ' disagreements over ' + g0.tested + ' points');
  ok('it opens with nothing flagged, as the prose says', g0.ringed === 0 && g0.good, g0.readout);

  // Drag the handle into the middle of ordinary spending, located from the DOM
  // rather than from a coordinate the check would have to be told.
  const target = await page.evaluate(() => {
    const svg = document.querySelector('.lab svg');
    const legit = [...svg.querySelectorAll('circle')].filter(c => c.getAttribute('fill') === '#8a94a2');
    const mx = legit.reduce((a, c) => a + +c.getAttribute('cx'), 0) / legit.length;
    const my = legit.reduce((a, c) => a + +c.getAttribute('cy'), 0) / legit.length;
    const h = svg.querySelector('.handle circle:last-of-type');
    const r = svg.getBoundingClientRect();
    const s = r.width / svg.viewBox.baseVal.width;
    return {
      from: { x: r.left + +h.getAttribute('cx') * s, y: r.top + +h.getAttribute('cy') * s },
      to: { x: r.left + mx * s, y: r.top + my * s },
      nLegit: legit.length,
    };
  });
  ok('the legitimate cloud is all drawn', target.nLegit === 900, target.nLegit + ' points');

  await page.mouse.move(target.from.x, target.from.y);
  await page.mouse.down();
  await page.mouse.move((target.from.x + target.to.x) / 2, (target.from.y + target.to.y) / 2, { steps: 8 });
  await page.mouse.move(target.to.x, target.to.y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(250);

  const g1 = await geom();
  ok('dragging it into ordinary spending flags most of the synthetic rows', g1.ringed > 90,
     g1.ringed + ' of ' + g1.nKid + ' — "' + g1.readout + '"');
  ok('and the readout stops saying everything is fine', !g1.good);
  ok('the segments still hold after a drag', g1.worstOffSegment < 0.4, g1.worstOffSegment.toFixed(4) + 'px');
  ok('the ring still means what it meant after a drag', g1.wrong === 0, g1.wrong + ' disagreements');

  await page.locator('.lab .pill', { hasText: /^15$/ }).click();
  await page.waitForTimeout(200);
  const g2 = await geom();
  ok('changing k changes the number of segments', g2.nSeg === 15, g2.nSeg + ' segments at k = 15');
  ok('...and the synthetic points follow onto them', g2.worstOffSegment < 0.4, g2.worstOffSegment.toFixed(4) + 'px');

  await page.locator('.lab .reset').click();
  await page.waitForTimeout(200);
  const g3 = await geom();
  // Reset is expected to restore k as well as the point, so the segment count
  // goes back to the default rather than staying at whatever the reader left.
  ok('reset puts it back exactly where it started, k included',
     g3.ringed === 0 && g3.nSeg === 5 && g3.good, g3.nSeg + ' segments — "' + g3.readout + '"');

  /* ================= the sweep and the verdict ================= */
  const sweep = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.grid-row .cell')];
    return {
      n: cells.length,
      tops: cells.map(c => Math.round(c.getBoundingClientRect().top)),
      titles: cells.map(c => c.querySelector('text.p-title').textContent.trim()),
      paths: cells.map(c => c.querySelector('path.ln').getAttribute('d')),
    };
  });
  ok('the sweep draws one panel per scenario', sweep.n === 3, sweep.titles.join(' | '));
  ok('the three panels sit on one row at desktop', vp.w < 950 || (Math.max(...sweep.tops) - Math.min(...sweep.tops) < 3), JSON.stringify(sweep.tops));
  ok('...and stack on mobile', vp.w > 950 || (Math.max(...sweep.tops) - Math.min(...sweep.tops) > 40), JSON.stringify(sweep.tops));
  ok('no panel path contains undefined or NaN', sweep.paths.every(d => !/undefined|NaN/.test(d)));

  const dots = await page.evaluate(() => {
    const groups = [...document.querySelectorAll('.dgroup')];
    return groups.map(g => ({
      title: g.querySelector('.dtitle').textContent.trim(),
      n: g.querySelectorAll('circle').length,
      values: [...g.querySelectorAll('text.rval')].map(t => t.textContent.trim()),
      xs: [...g.querySelectorAll('circle')].map(c => +c.getAttribute('cx')),
    }));
  });
  ok('the verdict draws five rows for each of three scenarios', dots.length === 3 && dots.every(d => d.n === 5),
     dots.map(d => d.title + ':' + d.n).join(' '));
  ok('every dot has a value label beside it', dots.every(d => d.values.length === 5 && d.values.every(v => /%$/.test(v))));
  // Tie-tolerant: several rows print the same value to one decimal, so an
  // exact sort comparison fails on ordering WITHIN a tie, which is not a bug.
  ok('the dot positions are ordered the same way as the numbers they carry', dots.every(d => {
    const nums = d.values.map(v => parseFloat(v));
    for (let i = 0; i < nums.length; i++)
      for (let j = 0; j < nums.length; j++)
        if (nums[i] + 0.05 < nums[j] && d.xs[i] >= d.xs[j]) return false;
    return true;
  }));

  /* ============= no negative geometry, anywhere, at any scroll ============= */
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
    for (const [i, f] of [0, 0.07, 0.14, 0.22, 0.30, 0.38, 0.46, 0.54, 0.62, 0.70, 0.78, 0.86, 0.94].entries()) {
      await page.evaluate(y => window.scrollTo(0, y), Math.round(H * f));
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${SHOTS}/sm-${vp.name}-${String(i).padStart(2, '0')}.png` });
    }
    await page.locator('.lab').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.locator('.lab .card').screenshot({ path: `${SHOTS}/sm-hook-${vp.name}.png` });
  }

  ok('still no page errors after interaction', errors.length === 0, errors.slice(0, 4).join(' | '));
  ok('still no console warnings after interaction', warnings.length === 0, warnings.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close();
console.log('\n' + (failures ? failures + ' BROWSER CHECK(S) FAILED' : 'all browser checks passed') + '\n');
process.exit(failures ? 1 : 0);
