/*
  Everything on the page that is too slow to compute on load, computed from the
  same src/ modules the page imports, and written to src/precomputed.js.

    node scripts/precompute.mjs          # writes src/precomputed.js
    import { run } from "./precompute.mjs" # check-numbers diffs run() against the file

  Sections are keyed by the part of the article that uses them (I1 … VI6).
*/
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as B from "../src/bank.js";
import * as P from "../src/prep.js";
import * as K from "../src/cluster.js";
import * as D from "../src/detect.js";
import * as E from "../src/explain.js";
import { mulberry32, gaussian, poisson } from "../src/rng.js";

const r3 = (v) => Math.round(v * 1000) / 1000;
const r4 = (v) => Math.round(v * 10000) / 10000;
const r2 = (v) => Math.round(v * 100) / 100;
const KS = [3, 5, 8];

export function run({ quick = false } = {}) {
  const out = {};
  const prof = B.makeProfiles();
  const M = B.drawMonth(prof, B.MONTH_SEEDS[0], 0), R = B.rowsOf(M), N = R.length, BUD = B.budgetFor(N);
  const months = B.MONTH_SEEDS.map((s, i) => B.drawMonth(prof, s, i));
  const LOG = P.LOG_Z, RAW = P.RAW_Z;
  const X = P.pipeline(LOG, R);
  const alertsOf = (Z, k, seed = K.FIT_SEED, nInit = 10) => { const f = K.kmeans(Z, k, seed, nInit); return { f, A: K.top(K.scores(Z, f).dist) }; };
  const catchCfg = (cfg, k, rows = R, month = M) => { const Z = P.pipeline(cfg, rows); const { f, A } = alertsOf(Z, k); return { c: B.catches(month, A), A, f, Z }; };
  const sizes = (f) => { const n = new Array(f.C.length).fill(0); f.lab.forEach((l) => n[l]++); return n.sort((a, b) => a - b); };

  out.meta = { N, budget: BUD, ordinary: B.N_ORDINARY, planted: B.PLANTED,
    segShare: Object.fromEntries(B.SEGMENTS.map((s) => [s.name, r4(M.filter((c) => c.seg === s.name).length / N)])) };

  // ---------------------------------------------------------------- I.1 scope
  {
    const md = B.addDormant(M, 400, 9), Rd = B.rowsOf(md);
    const byK = {};
    for (const k of KS) {
      const a = catchCfg(LOG, k), b = catchCfg(LOG, k, Rd, md);
      const dIdx = B.idxOf(md, "dormant"), dl = new Set(dIdx.map((i) => b.f.lab[i]));
      const dCluster = dl.size === 1 ? b.f.lab.filter((l) => l === [...dl][0]).length : -1;
      byK[k] = { without: a.c, with: { ...b.c, dormant: dIdx.filter((i) => b.A.has(i)).length }, dormantCluster: dCluster };
    }
    const lx = P.col(R, 0).map(Math.log1p), ld = P.col(Rd, 0).map(Math.log1p);
    out.I1 = { byK, sdLog: [r3(P.sdev(lx)), r3(P.sdev(ld))], sdRatio: r2(P.sdev(ld) / P.sdev(lx)), dormantShare: r3(400 / Rd.length) };
  }

  // ---------------------------------------------------------------- I.2 shape
  {
    const feats = B.FEATURES.map((name, j) => {
      const c = P.col(R, j), n = c.length, mu = P.mean(c), sd = P.sdev(c);
      const sk = c.reduce((s, v) => s + ((v - mu) / sd) ** 3, 0) / n, ku = c.reduce((s, v) => s + ((v - mu) / sd) ** 4, 0) / n;
      const lc = c.map(Math.log1p), lmu = P.mean(lc), lsd = P.sdev(lc), lsk = lc.reduce((s, v) => s + ((v - lmu) / lsd) ** 3, 0) / n;
      const hist = (vals, lo, hi, nb) => { const h = new Array(nb).fill(0); let over = 0; vals.forEach((v) => { if (v > hi) { over++; return; } h[Math.min(nb - 1, Math.floor(((v - lo) / (hi - lo)) * nb))]++; }); return { lo, hi, h, over }; };
      const p995 = P.quantile(c, 0.995);
      return {
        name, zeros: r4(c.filter((v) => v === 0).length / n), distinct: new Set(c).size,
        mean: Math.round(mu), median: Math.round(P.quantile(c, 0.5)), p99: Math.round(P.quantile(c, 0.99)), max: Math.round(Math.max(...c)),
        skew: r2(sk), kurt: Math.round(ku), logSkew: r2(lsk),
        raw: hist(c, 0, p995, 40), log: hist(lc, 0, Math.max(...lc), 40),
      };
    });
    const x = P.col(R, 0), mu = P.mean(x), sd = P.sdev(x);
    const ss = x.map((v) => (v - mu) ** 2).sort((a, b) => b - a), tot = ss.reduce((s, v) => s + v, 0);
    out.I2 = { feats, top5ss: r3(ss.slice(0, 5).reduce((s, v) => s + v, 0) / tot), top50ss: r3(ss.slice(0, 50).reduce((s, v) => s + v, 0) / tot),
      medianZ: r3((P.quantile(x, 0.5) - mu) / sd) };
  }

  // ---------------------------------------------------------------- I.3 window
  {
    const avg = (ms) => ms[0].map((c, i) => ({ ...c, x: c.x.map((_, j) => P.mean(ms.map((m) => m[i].x[j]))) }));
    const w1 = avg(months.slice(0, 3)), w2 = avg(months.slice(3, 6)), wr = avg(months.slice(1, 4));
    const byK = {};
    for (const k of KS) {
      const al = (m) => catchCfg(LOG, k, B.rowsOf(m), m);
      const a1 = al(months[0]), a2 = al(months[1]), b1 = al(w1), b2 = al(w2), br = al(wr);
      byK[k] = { J1: r2(K.jaccard(a1.A, a2.A)), J3: r2(K.jaccard(b1.A, b2.A)), Jroll: r2(K.jaccard(b1.A, br.A)), one: a1.c, three: b1.c };
    }
    out.I3 = { byK };
  }

  // ---------------------------------------------------------------- I.4 missing
  {
    const res = {};
    for (const mech of ["mcar", "ring"]) {
      const mask = B.missingMask(M, 0.15, 21, mech);
      const ring = B.idxOf(M, "mule"), ringMissing = ring.filter((i) => mask[i]);
      const rows = {};
      for (const imp of ["median", "mean", "zero", "indicator", "drop"]) {
        rows[imp] = {};
        for (const k of KS) {
          let A;
          if (imp === "drop") {
            const keep = M.map((_, i) => i).filter((i) => !mask[i]);
            const Z = P.pipeline(LOG, keep.map((i) => R[i]));
            const f = K.kmeans(Z, k, K.FIT_SEED, 10); const At = K.topK(K.scores(Z, f).dist, BUD);
            A = new Set([...At].map((t) => keep[t]));
          } else {
            const Z = P.pipeline({ ...LOG, impute: imp, missing: { j: 5, maskFit: mask, maskApply: mask } }, R);
            A = alertsOf(Z, k).A;
          }
          rows[imp][k] = { ...B.catches(M, A), ringMissingCaught: ringMissing.filter((i) => A.has(i)).length, imputedAlerts: [...A].filter((i) => mask[i]).length };
        }
      }
      res[mech] = { share: r3(mask.filter(Boolean).length / N), ringMissing: ringMissing.length, rows };
    }
    const mask = B.missingMask(M, 0.15, 21, "mcar"), x = P.col(R, 5).map(Math.log1p);
    const obs = x.filter((_, i) => !mask[i]), mu = P.mean(obs), filled = x.map((v, i) => (mask[i] ? mu : v));
    const q = mask.filter(Boolean).length / N;
    res.sdRatio = r4(P.sdev(filled) / P.sdev(obs)); res.sqrt1q = r4(Math.sqrt(1 - q)); res.q = r3(q);
    out.I4 = res;
  }

  // ---------------------------------------------------------------- I.5 categorical
  {
    const fa = B.binaryColumn(M, 0.03, 31), holders = fa.filter(Boolean).length, p = holders / N;
    const byK = {};
    for (const k of KS) {
      const Z = P.pipeline({ ...LOG, extraCols: [{ fit: fa, apply: fa }], noTransformCols: [6] }, R);
      const { f, A } = alertsOf(Z, k), base = alertsOf(X, k).A;
      const hl = new Set(fa.map((v, i) => (v ? f.lab[i] : -1)).filter((l) => l >= 0));
      const own = hl.size === 1 && f.lab.filter((l) => l === [...hl][0]).length === holders;
      byK[k] = { ...B.catches(M, A), holderAlerts: [...A].filter((i) => fa[i]).length, ownCluster: own, J: r2(K.jaccard(A, base)), baseRing: B.catches(M, base).ring };
    }
    const r = mulberry32(41), shares = [0.6, 0.3, 0.08, 0.02];
    const cat = M.map(() => { let u = r(); for (let c = 0; c < 4; c++) { if (u < shares[c]) return c; u -= shares[c]; } return 3; });
    const ps = [0, 1, 2, 3].map((c) => cat.filter((v) => v === c).length / N);
    const dd = (a, b) => 1 / (ps[a] * (1 - ps[a])) + 1 / (ps[b] * (1 - ps[b]));
    out.I5 = { holders, prevalence: r4(p), dummyHi: r2(Math.sqrt((1 - p) / p)), dummyLo: r2(-Math.sqrt(p / (1 - p))), byK,
      product: { shares: ps.map(r3), AB: r2(dd(0, 1)), AD: r2(dd(0, 3)), CD: r2(dd(2, 3)) } };
  }

  // ---------------------------------------------------------------- I.6 quality
  {
    const mi = B.addInternal(M, 0.05, 13), nInt = mi.filter((c) => c.internal).length;
    const internal = {};
    for (const k of KS) { const { c, A } = catchCfg(LOG, k, B.rowsOf(mi), mi); internal[k] = { ...c, internalAlerts: [...A].filter((i) => mi[i].internal).length }; }
    const m2 = months[1], dec = m2.map((c) => ({ ...c, x: c.x.map((v, j) => (j <= 1 ? v * 1.3 : v)) }));
    const season = {};
    for (const k of [3, 5]) {
      const { f } = alertsOf(X, k);
      const frozen = (m) => { const Z = P.pipeline(LOG, R, B.rowsOf(m)); const lab = K.assignTo(Z, f.C); return K.top(K.scores(Z, { C: f.C, lab }).dist); };
      const refit = (m) => alertsOf(P.pipeline(LOG, B.rowsOf(m)), k).A;
      const fN = frozen(m2), fD = frozen(dec), rN = refit(m2), rD = refit(dec);
      const segs = (S) => { const c = {}; for (const i of S) c[M[i].seg] = (c[M[i].seg] || 0) + 1; return c; };
      season[k] = { Jfrozen: r2(K.jaccard(fN, fD)), Jrefit: r2(K.jaccard(rN, rD)), frozenNormal: segs(fN), frozenDec: segs(fD) };
    }
    out.I6 = { internalCount: nInt, internalShare: r3(nInt / N), internal, season };
  }

  // ---------------------------------------------------------------- II.1 transforms
  {
    const cfgs = { rawZ: RAW, winsorZ: { transform: "none", scaler: "z", capQ: 0.99 }, logZ: LOG, rank: { transform: "none", scaler: "rank" } };
    const byCfg = {}, sets5 = {};
    for (const [nm, cfg] of Object.entries(cfgs)) { byCfg[nm] = {}; for (const k of KS) { const { c, A } = catchCfg(cfg, k); byCfg[nm][k] = c; if (k === 5) sets5[nm] = A; } }
    const names = Object.keys(cfgs), J = names.map((a) => names.map((b) => r2(K.jaccard(sets5[a], sets5[b]))));
    const offsets = {};
    for (const c of [1, 100, 1000, 10000, 100000]) {
      offsets[c] = { gap0: r3(Math.log(1 + 3000 / c)), gap1: r3(Math.log(38000 + c) - Math.log(3000 + c)) };
      for (const k of KS) offsets[c][k] = catchCfg({ transform: "logc", c, scaler: "z" }, k).c;
    }
    const lc = P.col(R, 3).map(Math.log1p), mu = P.mean(lc), sd = P.sdev(lc), z = (v) => r2((Math.log1p(v) - mu) / sd);
    out.II1 = { byCfg, J5: { names, J }, offsets, cashShare: r3(P.col(R, 3).filter((v) => v > 0).length / N),
      logGap: [r3(Math.log1p(3000)), r3(Math.log1p(38000) - Math.log1p(3000))], zCash: [z(0), z(3000), z(38000)] };
  }

  // ---------------------------------------------------------------- II.2 caps
  {
    const QS = [null, 0.999, 0.995, 0.99, 0.975, 0.95];
    const sweep = {};
    for (const tr of ["none", "log1p"]) {
      sweep[tr] = QS.map((q) => ({ q, ties: q ? P.col(R, 3).filter((v) => v >= P.quantile(P.col(R, 3), q)).length : 0,
        k3: catchCfg({ transform: tr, scaler: "z", capQ: q }, 3).c, k5: catchCfg({ transform: tr, scaler: "z", capQ: q }, 5).c }));
    }
    const x = P.col(R, 0), mu = P.mean(x), sd = P.sdev(x);
    const x2 = x.filter((_, i) => M[i].kind !== "extreme"), mu2 = P.mean(x2), sd2 = P.sdev(x2);
    const a = P.pipeline({ ...LOG, capQ: 0.99, capOrder: "before" }, R), b = P.pipeline({ ...LOG, capQ: 0.99, capOrder: "after" }, R);
    let commute = 0; a.forEach((r, i) => r.forEach((v, j) => (commute = Math.max(commute, Math.abs(v - b[i][j])))));
    const Zc = P.pipeline(RAW, R).map((r) => r.map((v) => Math.min(v, 3)));
    const capped = R.map((r) => r.map((v, j) => Math.min(v, P.mean(P.col(R, j)) + 3 * P.sdev(P.col(R, j)))));
    const Y = P.pipeline(RAW, capped); let zclip = 0; Zc.forEach((r, i) => r.forEach((v, j) => (zclip = Math.max(zclip, Math.abs(v - Y[i][j])))));
    out.II2 = { sweep, sdCap: [Math.round(mu + 3 * sd), Math.round(mu2 + 3 * sd2)], sdCapAbove: [x.filter((v) => v > mu + 3 * sd).length, x.filter((v) => v > mu2 + 3 * sd2).length],
      commute, zclip: r2(zclip) };
  }

  // ---------------------------------------------------------------- II.3 scalers
  {
    const rows = [];
    for (const tr of ["none", "log1p"]) for (const s of ["z", "robust", "minmax", "rank"]) {
      if (tr === "log1p" && s === "rank") continue;
      const cfg = { transform: tr, scaler: s };
      const F = R.map((r) => r.map((v) => (tr === "log1p" ? Math.log1p(v) : v)));
      const sc = P.scale(s, F).sc;
      rows.push({ tr, s, k3: catchCfg(cfg, 3).c, k5: catchCfg(cfg, 5).c, sc: sc ? sc.map((v) => Number(v.toPrecision(3))) : null });
    }
    const x = P.col(R, 0), mn = Math.min(...x), mx = Math.max(...x);
    const iqr = (j) => P.quantile(P.col(R, j), 0.75) - P.quantile(P.col(R, j), 0.25);
    const colSS = [0, 1, 2, 3, 4, 5].map((j) => X.reduce((s, r) => s + r[j] ** 2, 0));
    out.II3 = { rows, minmax99: r3((P.quantile(x, 0.99) - mn) / (mx - mn)), iqrCash: iqr(3), iqrIntl: iqr(4),
      colSSdev: Math.max(...colSS.map((v) => Math.abs(v - N))), Np: N * 6 };
  }

  // ---------------------------------------------------------------- II.4 correlation, II.5 PCA
  {
    const p = 6;
    const C = Array.from({ length: p }, (_, a) => Array.from({ length: p }, (_, b) => X.reduce((s, r) => s + r[a] * r[b], 0) / N));
    const { vals, vecs } = jacobi(C);
    const order = vals.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    const ev = order.map(([v]) => v), pr = ev.reduce((s, v) => s + v, 0) ** 2 / ev.reduce((s, v) => s + v * v, 0);
    const base = { 3: alertsOf(X, 3).A, 5: alertsOf(X, 5).A };
    const dups = {};
    for (const [nm, dup] of [["inflow", [0]], ["senders", [5]], ["senders ×3", [5, 5]]]) {
      dups[nm] = {};
      for (const k of [3, 5]) { const { c, A } = catchCfg({ ...LOG, dup }, k); dups[nm][k] = { ...c, J: r2(K.jaccard(A, base[k])) }; }
    }
    // the smallest component: which features does it load on?
    const last = order[p - 1][1], lastVec = vecs.map((r) => r4(r[last]));
    out.II4 = { corr: C.map((r) => r.map(r4)), eig: ev.map(r3), participation: r2(pr), dups, smallestVec: lastVec };
    // PCA
    const tot = ev.reduce((s, v) => s + v, 0); let cum = 0; const cumv = ev.map((v) => r3((cum += v) / tot));
    const proj = (m) => X.map((x) => order.slice(0, m).map(([, i]) => x.reduce((s, v, q) => s + v * vecs[q][i], 0)));
    const keep = {};
    for (const m of [2, 3, 4, 5, 6]) { const Z = proj(m); keep[m] = {}; for (const k of KS) keep[m][k] = B.catches(M, alertsOf(Z, k).A); }
    const offsetShare = (kind) => { const ids = B.idxOf(M, kind), mu = X[0].map((_, j) => P.mean(ids.map((i) => X[i][j])));
      const s = order.map(([, i]) => mu.reduce((a, v, q) => a + v * vecs[q][i], 0) ** 2), t = s.reduce((a, v) => a + v, 0); return s.map((v) => r3(v / t)); };
    out.II5 = { cumVar: cumv, keep, ringOffset: offsetShare("mule"), structOffset: offsetShare("struct") };
  }

  // ---------------------------------------------------------------- II.6 noise
  {
    const r = mulberry32(51), rows = [];
    for (const q of [0, 2, 5, 10, 20]) {
      const noise = Array.from({ length: q }, () => M.map(() => gaussian(r)));
      const Z = X.map((x, i) => [...x, ...noise.map((c) => c[i])]);
      const row = { q };
      for (const k of [3, 5]) {
        const f = K.kmeans(Z, k, K.FIT_SEED, 10), sc = K.scores(Z, f), A = K.top(sc.dist);
        const d = [...sc.dist].sort((a, b) => a - b);
        row[k] = { ...B.catches(M, A), contrast: r2(d[Math.floor(0.99 * d.length)] / d[Math.floor(0.5 * d.length)]) };
      }
      rows.push(row);
    }
    out.II6 = { rows };
  }

  // ---------------------------------------------------------------- II.7 a ratio feature
  {
    const ratio = R.map((r) => r[4] / r[0]), ring = B.idxOf(M, "mule");
    const ringMin = Math.min(...ring.map((i) => ratio[i]));
    const byK = {};
    for (const k of KS) {
      const Z = P.pipeline({ ...LOG, extraCols: [{ fit: ratio, apply: ratio }] }, R);
      const { f, A } = alertsOf(Z, k);
      const cnt = {}; ring.forEach((i) => (cnt[f.lab[i]] = (cnt[f.lab[i]] || 0) + 1));
      const [cl, n] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
      byK[k] = { with: B.catches(M, A), without: B.catches(M, alertsOf(X, k).A), ringTogether: n, sharedCluster: f.lab.filter((l) => l === +cl).length };
    }
    out.II7 = { ringMin: r2(ringMin), othersAbove: ratio.filter((v, i) => v >= ringMin && M[i].kind !== "mule").length, byK };
  }

  // ---------------------------------------------------------------- III.1–4
  {
    const f5 = K.kmeans(X, 5, K.FIT_SEED, 10), d = K.decomposition(X, f5);
    const T = d.tot.reduce((s, v) => s + v, 0), W = d.within.reduce((s, v) => s + v, 0), Bt = d.between.reduce((s, v) => s + v, 0);
    const r2ByK = {};
    for (let k = 2; k <= 8; k++) r2ByK[k] = K.decomposition(X, K.kmeans(X, k, K.FIT_SEED, 10)).r2.map(r3);
    out.III1 = { total: r2(T), within: r2(W), between: r2(Bt), residual: Math.abs(T - W - Bt), r2: d.r2.map(r3), r2ByK };
    const own = (Z) => { const tot = Z.reduce((s, x) => s + x.reduce((a, v) => a + v * v, 0), 0);
      const sales = B.idxOf(M, "extreme").reduce((s, i) => s + Z[i].reduce((a, v) => a + v * v, 0), 0);
      const per = Z.map((x) => x.reduce((a, v) => a + v * v, 0)).sort((a, b) => b - a);
      return { sales: r3(sales / tot), top50: r3(per.slice(0, 50).reduce((s, v) => s + v, 0) / tot) }; };
    out.III2 = { raw: own(P.pipeline(RAW, R)), log: own(X) };
    // seeds
    const seeds = {};
    for (const k of [5, 8, 10]) for (const nInit of [1, 10]) {
      const fits = Array.from({ length: quick ? 8 : 40 }, (_, s) => K.kmeans(X, k, 500 + s, nInit));
      const iner = fits.map((f) => f.inertia), best = Math.min(...iner);
      const al = fits.map((f) => K.top(K.scores(X, f).dist)), ring = al.map((A) => B.catches(M, A).ring);
      const js = []; for (let a = 0; a < al.length; a++) for (let b = a + 1; b < al.length; b++) js.push(K.jaccard(al[a], al[b]));
      const ar = []; for (let a = 0; a < 10 && a < fits.length; a++) for (let b = a + 1; b < 10 && b < fits.length; b++) ar.push(K.ari(fits[a].lab, fits[b].lab));
      seeds[`${k}-${nInit}`] = { k, nInit, ring, inertia: iner.map((v) => r2(v)), distinct: new Set(iner.map((v) => v.toFixed(3))).size,
        worst: r3(Math.max(...iner) / best), Jmean: r2(P.mean(js)), Jmin: r2(Math.min(...js)), ARI: r3(P.mean(ar)) };
    }
    out.III3 = seeds;
    // choosing k
    const rr = mulberry32(5), sample = Array.from({ length: 800 }, () => Math.floor(rr() * N));
    const rows = [];
    for (let k = 1; k <= 12; k++) {
      const f = K.kmeans(X, k, K.FIT_SEED, 10);
      rows.push({ k, inertia: r2(f.inertia), ch: k > 1 ? Math.round(K.chIndex(X, f)) : null, db: k > 1 ? r3(K.dbIndex(X, f)) : null,
        sil: k > 1 ? r3(K.silhouette(X, f.lab, sample)) : null, c: B.catches(M, K.top(K.scores(X, f).dist)) });
    }
    rows.forEach((w, i) => (w.d2 = i > 0 && i < rows.length - 1 ? Math.round(rows[i - 1].inertia - 2 * w.inertia + rows[i + 1].inertia) : null));
    const g = K.gapStat(X, [1, 2, 3, 4, 5, 6, 7, 8], 5, 3);
    let gk = null; for (let i = 0; i < g.length - 1; i++) if (g[i].gap >= g[i + 1].gap - g[i + 1].s) { gk = g[i].k; break; }
    rows.forEach((w) => { const G = g.find((v) => v.k === w.k); w.gap = G ? r3(G.gap) : null; });
    const pick = (key, dir) => rows.filter((w) => w[key] !== null).sort((a, b) => dir * (a[key] - b[key]))[0].k;
    out.III4 = { rows, picks: { elbow: rows.filter((w) => w.d2 !== null).sort((a, b) => b.d2 - a.d2)[0].k, ch: pick("ch", -1), db: pick("db", 1), sil: pick("sil", -1), gap: gk } };
  }

  // ---------------------------------------------------------------- IV.1 the ring buys a centroid
  {
    const S = quick ? 3 : 12, MS = [1, 5, 10, 20, 40], KK = [3, 5, 8, 12];
    const grid = {};
    for (const m of MS) for (const k of KK) {
      let rec = 0, own = 0;
      for (let t = 0; t < S; t++) {
        const mm = B.drawMonth(B.makeProfiles(5000, 1000 + t, { mules: m, struct: 0, extreme: 0 }), 2000 + t);
        const Z = P.pipeline(LOG, B.rowsOf(mm)), f = K.kmeans(Z, k, 3000 + t, 10), sc = K.scores(Z, f);
        const A = K.top(sc.dist), idx = B.idxOf(mm, "mule");
        rec += idx.filter((i) => A.has(i)).length / m;
        const cnt = {}; idx.forEach((i) => (cnt[f.lab[i]] = (cnt[f.lab[i]] || 0) + 1));
        const [cl, c] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]; own += c / sc.n[cl] >= 0.5;
      }
      grid[`${m}-${k}`] = { rec: r2(rec / S), own: r2(own / S) };
    }
    // the price of a centroid
    const pm = B.rowsOf(B.drawMonth(B.makeProfiles(5000, 1000, { mules: 0, struct: 0, extreme: 0 }), 2000));
    const ringRows = B.rowsOf(B.drawMonth(B.makeProfiles(0, 77, { mules: 40, struct: 0, extreme: 0 }), 78));
    const Zall = P.pipeline(LOG, pm, [...pm, ...ringRows]), Z = Zall.slice(0, pm.length), Rg = Zall.slice(pm.length);
    const muR = Rg[0].map((_, j) => P.mean(Rg.map((x) => x[j])));
    const mstar = {}; let prev = K.kmeans(Z, 1, 5, 10);
    for (let k = 2; k <= 12; k++) {
      const b = K.kmeans(Z, k, 5, 10), dI = prev.inertia - b.inertia;
      let bj = 0, bd = Infinity; b.C.forEach((c, j) => { const d = K.d2(muR, c); if (d < bd) { bd = d; bj = j; } });
      const n = b.lab.filter((l) => l === bj).length;
      mstar[k] = { dI: Math.round(dI), D2: r2(bd), n, m: Math.round(((dI * n) / (n * bd - dI)) * 10) / 10 };
      prev = b;
    }
    const spread = Rg.reduce((s, x) => s + K.d2(x, muR), 0) / Rg.length;
    // the same collapse in the 2-D view the lab uses
    const two = {};
    for (const k of [5, 8, 12]) {
      let s = 0;
      for (let t = 0; t < S; t++) {
        const mm = B.drawMonth(B.makeProfiles(5000, 1000 + t, { mules: 40, struct: 0, extreme: 0 }), 2000 + t);
        const Z2 = P.pipeline(LOG, mm.map((c) => [c.x[0], c.x[5]])), f = K.kmeans(Z2, k, 3000 + t, 10);
        const A = K.top(K.scores(Z2, f).dist); s += B.idxOf(mm, "mule").filter((i) => A.has(i)).length / 40;
      }
      two[k] = r2(s / S);
    }
    // raw z: the five house sales own a cluster of five
    const Zr = P.pipeline(RAW, R), salesCluster = {};
    for (const k of [3, 5, 8, 12]) { const f = K.kmeans(Zr, k, K.FIT_SEED, 5), sal = B.idxOf(M, "extreme"); const ls = new Set(sal.map((i) => f.lab[i]));
      salesCluster[k] = ls.size === 1 ? f.lab.filter((l) => l === [...ls][0]).length : -1; }
    out.IV1 = { grid, mstar, spread: r3(spread), two, salesCluster };
  }

  // ---------------------------------------------------------------- IV.2 rules, IV.3 distances, IV.4 chi-square
  {
    const rules = {}, dist = {}, chi = {};
    for (const k of KS) {
      const f = K.kmeans(X, k, K.FIT_SEED, 10), sc = K.scores(X, f);
      const small = new Set(f.lab.map((l, i) => (sc.n[l] < 0.01 * N ? i : -1)).filter((i) => i >= 0));
      const pc = K.perCluster(sc.dist, f.lab, 0.01);
      const quota = new Array(k).fill(0); for (const i of pc) quota[f.lab[i]]++;
      const ms = new Array(k).fill(0); f.lab.forEach((l, i) => (ms[l] += sc.norm[i] ** 2 / sc.n[l]));
      rules[k] = { global: B.catches(M, K.top(sc.dist)), perCluster: B.catches(M, pc), normalised: B.catches(M, K.top(sc.norm)), small: B.catches(M, small),
        quotaOk: quota.every((v, j) => v === Math.ceil(0.01 * sc.n[j])), meanSqDev: Math.max(...ms.map((v) => Math.abs(v - 1))) };
      const sets = {};
      dist[k] = {};
      for (const kind of D.DISTANCES) {
        const s = D.distScores(X, f, kind, R); sets[kind] = K.top(D.defined(s));
        dist[k][kind] = { ...B.catches(M, sets[kind]), undefinedShare: r3(s.filter(Number.isNaN).length / N) };
      }
      for (const kind of D.DISTANCES) dist[k][kind].J = r2(K.jaccard(sets.euclid, sets[kind]));
    }
    for (const k of [1, 3, 5, 8]) {
      const f = K.kmeans(X, k, K.FIT_SEED, 10), sc = K.scores(X, f), p = 6;
      const stat = sc.dist.map((d, i) => (d * d) / (sc.rms[f.lab[i]] ** 2 / p));
      const mh = D.distScores(X, f, "mahalCluster").filter((v) => !Number.isNaN(v)).map((v) => v * v);
      chi[k] = { iso: r4(stat.filter((v) => v > 16.812).length / N), full: r4(mh.filter((v) => v > 16.812).length / mh.length) };
    }
    // who gets the alerts under the global rule, k = 5
    const f5 = K.kmeans(X, 5, K.FIT_SEED, 10), A5 = K.top(K.scores(X, f5).dist);
    const segAlerts = {}; for (const i of A5) segAlerts[M[i].seg] = (segAlerts[M[i].seg] || 0) + 1;
    // Mahalanobis alerts and the pass-through direction
    const gm = K.top(D.distScores(X, f5, "mahalGlobal")), ratio = R.map((r) => r[1] / r[0]);
    const devA = P.mean([...gm].map((i) => Math.abs(ratio[i] - 0.93))), devAll = P.mean(ratio.map((v) => Math.abs(v - 0.93)));
    const constant = {};
    for (const k of KS) { const f = K.kmeans(X, k, K.FIT_SEED, 10); constant[k] = [];
      for (let c = 0; c < k; c++) { const ids = f.lab.map((l, i) => (l === c ? i : -1)).filter((i) => i >= 0);
        const cf = [0, 1, 2, 3, 4, 5].filter((j) => new Set(ids.map((i) => X[i][j])).size === 1);
        if (cf.length) constant[k].push({ n: ids.length, feats: cf.map((j) => B.FEATURES[j]) }); } }
    const Zr = P.pipeline(RAW, R), fr = K.kmeans(Zr, 3, K.FIT_SEED, 5);
    out.IV2 = { rules, segAlerts };
    out.IV3 = { dist, passThrough: [r3(devA), r3(devAll)], constant, rawUndefined: D.distScores(Zr, fr, "mahalCluster").filter(Number.isNaN).length };
    out.IV4 = { chi, cut: 16.812 };
  }

  // ---------------------------------------------------------------- V.1 dose-response
  {
    const struct = {};
    for (const amt of [5000, 10000, 20000, 40000, 80000, 160000]) {
      const m = M.map((c) => (c.kind === "struct" ? { ...c, x: c.x.map((v, j) => (j === 3 ? amt * (v / 38000 > 0 ? v / 38000 : 1) : j === 0 ? v - c.x[3] + amt * (c.x[3] / 38000) : v)) } : c));
      const rows = B.rowsOf(m); struct[amt] = {};
      for (const [nm, cfg] of [["rawZ", RAW], ["logZ", LOG], ["log10k", { transform: "logc", c: 10000, scaler: "z" }], ["rank", { transform: "none", scaler: "rank" }]])
        struct[amt][nm] = B.caught(m, alertsOf(P.pipeline(cfg, rows), 3).A, "struct");
    }
    const senders = {};
    for (const s of [3, 6, 10, 15, 22, 30, 40]) {
      const r = mulberry32(s); const m = M.map((c) => (c.kind === "mule" ? { ...c, x: c.x.map((v, j) => (j === 5 ? Math.max(1, poisson(r, s)) : v)) } : c));
      const Z = P.pipeline(LOG, B.rowsOf(m)); senders[s] = {};
      for (const k of KS) senders[s][k] = B.caught(m, alertsOf(Z, k).A, "mule");
    }
    out.V1 = { struct, senders };
  }

  // ---------------------------------------------------------------- V.2 benchmarks
  {
    const auc = (s, kind) => { const pos = B.idxOf(M, kind), neg = M.map((c, i) => (c.kind === "normal" ? i : -1)).filter((i) => i >= 0);
      const sub = [...pos, ...neg].map((i) => [s[i], i]).sort((a, b) => a[0] - b[0]); const rr = new Map(); sub.forEach(([, i], t) => rr.set(i, t + 1));
      let S = 0; pos.forEach((i) => (S += rr.get(i))); return r3((S - (pos.length * (pos.length + 1)) / 2) / (pos.length * neg.length)); };
    const dets = [];
    const add = (name, s) => dets.push({ name, ...B.catches(M, K.top(s)), aucRing: auc(s, "mule"), aucStruct: auc(s, "struct"), aucSales: auc(s, "extreme") });
    for (const k of [1, 3, 5, 8]) add(`kmeans${k}`, K.scores(X, K.kmeans(X, k, K.FIT_SEED, 10)).dist);
    add("mahal", D.distScores(X, { C: [X[0].map(() => 0)], lab: X.map(() => 0) }, "mahalGlobal"));
    add("maxz", D.maxAbsZ(X));
    add("knn5", D.knnScore(X, 5));
    add("knn30", D.knnScore(X, 30));
    add("iforest", D.iforest(X, 1));
    out.V2 = { dets };
  }

  // ---------------------------------------------------------------- V.3–V.6 similarity and stability
  {
    const cfgs = { rawZ: RAW, winsorZ: { transform: "none", scaler: "z", capQ: 0.99 }, logZ: LOG, rank: { transform: "none", scaler: "rank" }, logRobust: { transform: "log1p", scaler: "robust" } };
    const labs = Object.fromEntries(Object.entries(cfgs).map(([n, c]) => [n, K.kmeans(P.pipeline(c, R), 5, K.FIT_SEED, 10).lab]));
    const names = Object.keys(labs);
    const perm = labs.logZ.map((l) => (l + 2) % 5);
    out.V3 = { names, ari: names.map((a) => names.map((b) => r2(K.ari(labs[a], labs[b])))), nmi: names.map((a) => names.map((b) => r2(K.nmi(labs[a], labs[b])))), permARI: K.ari(labs.logZ, perm) };
    const hen = {};
    for (const k of KS) { const h = K.clusterwiseJaccard(X, k, quick ? 5 : 30, 7); hen[k] = { jac: h.jac.map(r2), sizes: h.sizes }; }
    out.V4 = { hen };
    const X2 = P.pipeline(LOG, B.rowsOf(months[1])), X2f = P.pipeline(LOG, R, B.rowsOf(months[1]));
    const sw = {}, rank = {};
    for (const k of KS) {
      const f1 = K.kmeans(X, k, K.FIT_SEED, 10), f2 = K.kmeans(X2, k, K.FIT_SEED, 10);
      const rel = K.matchLabels(f1.lab, f2.lab, k);
      const renum = [...Array(k).keys()].filter((c) => f2.lab.some((l, i) => rel[i] === c && l !== c)).length;
      sw[k] = { raw: r3(f1.lab.filter((l, i) => l === f2.lab[i]).length / N), matched: r3(f1.lab.filter((l, i) => l === rel[i]).length / N), renum, ari: r3(K.ari(f1.lab, f2.lab)) };
      const lab2 = K.assignTo(X2f, f1.C), s1 = K.scores(X, f1).dist, s2 = K.scores(X2f, { C: f1.C, lab: lab2 }).dist;
      const A1 = K.top(s1), A2 = K.top(s2), A2r = K.top(K.scores(X2, f2).dist);
      rank[k] = { spearman: r3(K.spearman(s1, s2)), J1: r2(K.jaccard(A1, A2)), J5: r2(K.jaccard(K.top(s1, 0.05), K.top(s2, 0.05))), Jrefit: r2(K.jaccard(A1, A2r)) };
    }
    const f5 = K.kmeans(X, 5, K.FIT_SEED, 10), lab2 = K.assignTo(X2f, f5.C), mg = K.margins(X, f5.C);
    const order = mg.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const deciles = []; for (let d = 0; d < 10; d++) { const ids = order.slice(Math.floor((d * N) / 10), Math.floor(((d + 1) * N) / 10)).map((t) => t[1]); deciles.push(r3(ids.filter((i) => lab2[i] !== f5.lab[i]).length / ids.length)); }
    out.V5 = { sw, rank, deciles, switchAll: r3(f5.lab.filter((l, i) => l !== lab2[i]).length / N) };
    const pers = {};
    for (const k of KS) {
      const f1 = K.kmeans(X, k, K.FIT_SEED, 10);
      const al = months.slice(0, 3).map((m) => { const Zm = P.pipeline(LOG, R, B.rowsOf(m)); return K.top(K.scores(Zm, { C: f1.C, lab: K.assignTo(Zm, f1.C) }).dist); });
      const hits = new Map(); al.forEach((A) => A.forEach((i) => hits.set(i, (hits.get(i) || 0) + 1)));
      const kinds = (ids) => { const c = { ring: 0, struct: 0, sales: 0, other: 0 }; ids.forEach((i) => { const t = M[i].kind; c[t === "mule" ? "ring" : t === "extreme" ? "sales" : t === "struct" ? "struct" : "other"]++; }); return c; };
      pers[k] = { distinct: hits.size, once: kinds([...hits].filter(([, v]) => v === 1).map(([i]) => i)), twoPlus: kinds([...hits].filter(([, v]) => v >= 2).map(([i]) => i)),
        monthOne: B.catches(M, al[0]) };
    }
    out.V6 = { pers };
  }

  // ---------------------------------------------------------------- V.7 remedies
  {
    const S = quick ? 2 : 12, res = {};
    for (const m of [20, 40]) for (const k of [5, 8, 12]) {
      let a = 0, b = 0, c = 0;
      for (let t = 0; t < S; t++) {
        const mm = B.drawMonth(B.makeProfiles(5000, 1000 + t, { mules: m, struct: 0, extreme: 0 }), 2000 + t);
        const Z = P.pipeline(LOG, B.rowsOf(mm)), bud = B.budgetFor(Z.length), ring = B.idxOf(mm, "mule");
        const f = K.kmeans(Z, k, 3000 + t, 10), s0 = K.scores(Z, f).dist, A0 = K.topK(s0, bud);
        a += ring.filter((i) => A0.has(i)).length / m;
        const g = D.kmeansMinus(Z, k, bud, 3000 + t, 5), A1 = K.topK(Z.map((x, i) => Math.sqrt(K.d2(x, g.C[g.lab[i]]))), bud);
        b += ring.filter((i) => A1.has(i)).length / m;
        const drop = K.topK(s0, Math.round(0.02 * Z.length)), Zt = Z.filter((_, i) => !drop.has(i));
        const h = K.kmeans(Zt, k, 3000 + t, 10), lab = K.assignTo(Z, h.C), A2 = K.topK(Z.map((x, i) => Math.sqrt(K.d2(x, h.C[lab[i]]))), bud);
        c += ring.filter((i) => A2.has(i)).length / m;
      }
      res[`${m}-${k}`] = { m, k, standard: r2(a / S), minus: r2(b / S), trim: r2(c / S) };
    }
    out.V7 = res;
  }

  // ---------------------------------------------------------------- VI explaining an alert
  {
    const k = 5, f = K.kmeans(X, k, K.FIT_SEED, 10), sc = K.scores(X, f), A = [...K.top(sc.dist)];
    const t = [...sc.dist].sort((a, b) => b - a)[B.budgetFor(N) - 1];
    const logR = R.map((r) => r.map(Math.log1p)), zs = P.scale("z", logR), back = (z, j) => Math.expm1(z * zs.sc[j] + zs.loc[j]);
    const tm = (i) => E.terms(X[i], f.C[f.lab[i]]);
    const top = A.map((i) => { const tt = tm(i), s = tt.reduce((a, b) => a + b, 0), j = tt.indexOf(Math.max(...tt)); return { j, share: tt[j] / s }; });
    const topCount = new Array(6).fill(0); top.forEach(({ j }) => topCount[j]++);
    let shapGap = 0, reassignDiff = 0, topChange = 0;
    for (const i of A) {
      const phi = E.shapley(X[i], f.C, f.lab[i], false), tt = tm(i); phi.forEach((p, j) => (shapGap = Math.max(shapGap, Math.abs(p - tt[j]))));
      const phr = E.shapley(X[i], f.C, f.lab[i], true);
      if (phr.some((p, j) => Math.abs(p - tt[j]) > 1e-9)) reassignDiff++;
      if (tt.indexOf(Math.max(...tt)) !== phr.indexOf(Math.max(...phr))) topChange++;
    }
    const oneFix = A.filter((i) => E.singleFeatureFix(X[i], f.C[f.lab[i]], t).some((v) => v !== null)).length;
    const shrink = A.map((i) => t / sc.dist[i]);
    // four example alerts for the explainer panel
    const pick = (pred) => A.filter(pred).sort((a, b) => sc.dist[b] - sc.dist[a])[0];
    const byKind = (kind) => (i) => M[i].kind === kind;
    const cashUser = (i) => M[i].kind === "normal" && tm(i).indexOf(Math.max(...tm(i))) === 3;
    const abroad = (i) => M[i].kind === "normal" && tm(i).indexOf(Math.max(...tm(i))) === 4;
    const examples = [["ring", pick(byKind("mule"))], ["sale", pick(byKind("extreme"))], ["cash", pick(cashUser)], ["abroad", pick(abroad)]]
      .filter(([, i]) => i !== undefined).map(([tag, i]) => {
        const c = f.C[f.lab[i]], tt = tm(i), fix = E.singleFeatureFix(X[i], c, t), phr = E.shapley(X[i], f.C, f.lab[i], true);
        return { tag, i, kind: M[i].kind, seg: M[i].seg, cluster: f.lab[i], d: r3(sc.dist[i]), raw: R[i].map((v) => Math.round(v)),
          peer: c.map((z, j) => Math.round(back(z, j))), terms: tt.map(r3), shapReassign: phr.map(r3),
          fix: fix.map((z, j) => (z === null ? null : Math.round(back(z, j) * 10) / 10)) };
      });
    const geo = [];
    for (let c = 0; c < k; c++) { const ids = f.lab.map((l, i) => (l === c ? i : -1)).filter((i) => i >= 0);
      const bk = back(f.C[c][0], 0), ar = P.mean(ids.map((i) => R[i][0])), md = P.quantile(ids.map((i) => R[i][0]), 0.5);
      geo.push({ n: ids.length, centroid: Math.round(bk), arithmetic: Math.round(ar), median: Math.round(md), ratio: r2(ar / bk) }); }
    const fid = [], trees = {};
    for (let depth = 1; depth <= 5; depth++) { const T = E.tree(R, f.lab, depth); fid.push(r3(R.filter((x, i) => T.predict(x) === f.lab[i]).length / N));
      if (depth <= 3) trees[depth] = E.rules(T.root).map((r) => ({ ...r, conds: r.conds.map(([q, op, s]) => [q, op, Math.round(s)]) })); }
    // four importance measures
    const d = K.decomposition(X, f), share = new Array(6).fill(0);
    A.forEach((i) => { const tt = tm(i), s = tt.reduce((a, b) => a + b, 0); tt.forEach((v, j) => (share[j] += v / s / A.length)); });
    const base = new Set(A), rr = mulberry32(77), perm = [], drop = [];
    for (let j = 0; j < 6; j++) {
      const idx = Array.from({ length: N }, (_, i) => i); for (let a = N - 1; a > 0; a--) { const b = Math.floor(rr() * (a + 1)); [idx[a], idx[b]] = [idx[b], idx[a]]; }
      const Xp = X.map((x, i) => x.map((v, q) => (q === j ? X[idx[i]][j] : v)));
      perm.push(r2(1 - K.jaccard(base, K.top(K.scores(Xp, { C: f.C, lab: K.assignTo(Xp, f.C) }).dist))));
      const Xd = X.map((x) => x.filter((_, q) => q !== j)); drop.push(r2(1 - K.jaccard(base, K.top(K.scores(Xd, K.kmeans(Xd, k, K.FIT_SEED, 10)).dist))));
    }
    out.VI = { t: r3(t), topCount, over50: top.filter((v) => v.share > 0.5).length, over80: top.filter((v) => v.share > 0.8).length,
      shapGap, reassignDiff, topChange, oneFix, shrinkMin: r3(Math.min(...shrink)), examples, geo, fidelity: fid, trees,
      importance: { r2: d.r2.map(r2), share: share.map(r2), perm, drop } };
  }

  // ---------------------------------------------------------------- robustness across other months
  {
    const seeds = quick ? [21, 31] : [21, 31, 41, 51, 61, 71], rows = [];
    for (const ps of seeds) {
      const m = B.drawMonth(B.makeProfiles(5000, ps), 101, 0), Rm = B.rowsOf(m), Xm = P.pipeline(LOG, Rm), n = Rm.length;
      const cc = (cfg, k) => B.catches(m, alertsOf(P.pipeline(cfg, Rm), k).A);
      const fa = B.binaryColumn(m, 0.03, 31), holders = fa.filter(Boolean).length;
      const fz = K.kmeans(P.pipeline({ ...LOG, extraCols: [{ fit: fa, apply: fa }], noTransformCols: [6] }, Rm), 5, K.FIT_SEED, 10);
      const hl = new Set(fa.map((v, i) => (v ? fz.lab[i] : -1)).filter((l) => l >= 0));
      const mask = B.missingMask(m, 0.15, 21, "mcar"), ringMiss = B.idxOf(m, "mule").filter((i) => mask[i]);
      const Zi = P.pipeline({ ...LOG, impute: "median", missing: { j: 5, maskFit: mask, maskApply: mask } }, Rm), Ai = alertsOf(Zi, 3).A;
      const f5 = K.kmeans(Xm, 5, K.FIT_SEED, 10), und = D.distScores(Xm, f5, "mahalCluster").filter(Number.isNaN).length / n;
      const kz = [3, 5, 8].map((k) => cc(LOG, k)), mz = B.catches(m, K.top(D.maxAbsZ(Xm)));
      rows.push({ seed: ps, logStruct: kz.map((c) => c.struct), rawStruct: cc(RAW, 3).struct, faOwn: hl.size === 1 && fz.lab.filter((l) => l === [...hl][0]).length === holders,
        ringMissing: ringMiss.length, ringMissingCaught: ringMiss.filter((i) => Ai.has(i)).length, mahalUndefined: r3(und),
        maxz: mz, kmBest: Math.max(...kz.map((c) => c.ring + c.struct + c.sales)) });
    }
    out.robust = rows;
  }
  return out;
}

function jacobi(A0) {
  const n = A0.length, A = A0.map((r) => r.slice()), V = A.map((_, i) => A.map((_, j) => (i === j ? 1 : 0)));
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2; if (off < 1e-20) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-15) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]), t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
    }
  }
  return { vals: A.map((r, i) => r[i]), vecs: V };
}
export { jacobi };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t0 = Date.now();
  const res = run({ quick: process.argv.includes("--quick") });
  const target = new URL("../src/precomputed.js", import.meta.url);
  writeFileSync(target, `// Generated by scripts/precompute.mjs. Do not edit; re-run \`npm run precompute\`.\nexport default ${JSON.stringify(res)};\n`);
  console.log(`wrote src/precomputed.js in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
