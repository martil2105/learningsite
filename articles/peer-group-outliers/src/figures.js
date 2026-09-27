/*
  The wiring between precomputed results and the generic figures: for each
  figure, the options it offers and a get(option, second) that returns the
  catch strip for that combination. Kept out of App.svelte so the prose stays
  readable there.
*/
import P from "./precomputed.js";
import { FEATURES, FEATURE_LABELS, SEGMENT_LABELS } from "./bank.js";

const KS = [3, 5, 8];
const logZ = (k) => P.II1.byCfg.logZ[k];
const pct = (v) => `${Math.round(v * 100)}%`;

export const baseline = logZ(5);

// I.1 scope
export const scope = {
  options: [{ key: "without", label: "active customers only" }, { key: "with", label: "plus 400 dormant accounts" }],
  ks: KS,
  get: (o, k) => P.I1.byK[k][o],
  extra: (o, k) => (o === "with" ? `the 400 dormant accounts form one cluster of ${P.I1.byK[k].dormantCluster}` : ""),
};

// I.3 window
export const windowFig = {
  options: [{ key: "one", label: "one month" }, { key: "three", label: "three-month average" }],
  ks: KS,
  get: (o, k) => P.I3.byK[k][o],
  extra: (o, k) => `overlap with the next period's alert list: ${(o === "one" ? P.I3.byK[k].J1 : P.I3.byK[k].J3).toFixed(2)}`,
};

// I.4 missing values: the second axis is who is missing, at k = 5
export const missing = {
  options: ["median", "mean", "zero", "indicator", "drop"].map((k) => ({
    key: k, label: { median: "median", mean: "mean", zero: "zero", indicator: "median + flag", drop: "drop the rows" }[k],
  })),
  ks: ["mcar", "ring"],
  ksLabel: { mcar: "at random", ring: "legacy system" },
  get: (o, mech) => P.I4[mech].rows[o][5],
  extra: (o, mech) => `missing ring members among the alerts: ${P.I4[mech].rows[o][5].ringMissingCaught} of ${P.I4[mech].ringMissing}`,
};

// I.5 a categorical flag
export const category = {
  options: [{ key: "without", label: "without the flag" }, { key: "with", label: "with a foreign-address flag" }],
  ks: KS,
  get: (o, k) => (o === "without" ? logZ(k) : P.I5.byK[k]),
  extra: (o, k) => (o === "with" ? `alerts to flag holders: ${P.I5.byK[k].holderAlerts} · the ${P.I5.holders} holders are ${P.I5.byK[k].ownCluster ? "a cluster of their own" : "spread across clusters"} · overlap with the list without the flag ${P.I5.byK[k].J.toFixed(2)}` : ""),
};
const ps = P.I5.product.shares;
const catD = (a, b) => (a === b ? 0 : 1 / (ps[a] * (1 - ps[a])) + 1 / (ps[b] * (1 - ps[b])));
export const productLabels = ["A", "B", "C", "D"].map((l, i) => `${l} (${pct(ps[i])})`);
export const productSets = {
  standardised: [0, 1, 2, 3].map((a) => [0, 1, 2, 3].map((b) => catD(a, b))),
  unscaled: [0, 1, 2, 3].map((a) => [0, 1, 2, 3].map((b) => (a === b ? 0 : 2))),
};

// I.6 own-account transfers
export const internal = {
  options: [{ key: "netted", label: "netted out" }, { key: "left", label: "left in" }],
  ks: KS,
  get: (o, k) => (o === "netted" ? logZ(k) : P.I6.internal[k]),
  extra: (o, k) => (o === "left" ? `alerts to the ${P.I6.internalCount} customers moving their own savings: ${P.I6.internal[k].internalAlerts}` : ""),
};

// II.1 transforms
export const transforms = {
  options: [
    { key: "rawZ", label: "as recorded" }, { key: "winsorZ", label: "capped at 99th pct" },
    { key: "logZ", label: "log(1 + x)" }, { key: "log10k", label: "log(x + 10,000)" }, { key: "rank", label: "ranks" },
  ],
  ks: KS,
  get: (o, k) => (o === "log10k" ? P.II1.offsets[10000][k] : P.II1.byCfg[o][k]),
};
export const offsets = [1, 100, 1000, 10000, 100000];
export const transformLabels = ["as recorded", "capped", "log", "ranks"];

// II.2 caps
const capLabel = (q) => (q === null ? "no cap" : `${(q * 100).toFixed(1).replace(/\.0$/, "")}th pct`);
export const caps = {
  options: P.II2.sweep.none.map((r, i) => ({ key: String(i), label: capLabel(r.q) })),
  ks: ["none-3", "none-5", "log1p-3", "log1p-5"],
  ksLabel: { "none-3": "as recorded, k = 3", "none-5": "as recorded, k = 5", "log1p-3": "log, k = 3", "log1p-5": "log, k = 5" },
  get: (o, s) => { const [tr, k] = s.split("-"); return P.II2.sweep[tr][+o][`k${k}`]; },
  extra: (o) => (P.II2.sweep.none[+o].q === null ? "" : `customers tied at the cap on cash: ${P.II2.sweep.none[+o].ties}`),
};

// II.3 scalers
export const scalers = {
  options: P.II3.rows.map((r, i) => ({ key: String(i), label: `${r.tr === "none" ? "raw" : "log"}, ${r.s === "z" ? "z-score" : r.s === "minmax" ? "min–max" : r.s}` })),
  ks: [3, 5],
  get: (o, k) => P.II3.rows[+o][`k${k}`],
  extra: (o) => { const r = P.II3.rows[+o]; return r.sc ? `divides cash by ${r.sc[3].toLocaleString("en-GB")} and senders by ${r.sc[5].toLocaleString("en-GB")}` : "ranks every feature, then maps the ranks onto a bell curve"; },
};

// II.4 duplicates
export const dups = {
  options: [{ key: "none", label: "each feature once" }, { key: "inflow", label: "money in twice" }, { key: "senders", label: "senders twice" }, { key: "senders ×3", label: "senders three times" }],
  ks: [3, 5],
  get: (o, k) => (o === "none" ? logZ(k) : P.II4.dups[o][k]),
  extra: (o, k) => (o === "none" ? "" : `overlap with the list where each feature counts once: ${P.II4.dups[o][k].J.toFixed(2)}`),
};
export const featureLabels = FEATURES.map((f) => FEATURE_LABELS[f]);
export const corrSets = { correlation: P.II4.corr };

// II.5 PCA
export const pca = {
  options: [2, 3, 4, 5, 6].map((m) => ({ key: String(m), label: `${m} (${pct(P.II5.cumVar[m - 1])})` })),
  ks: KS,
  get: (o, k) => P.II5.keep[o][k],
};
export const pcLabels = ["PC1", "PC2", "PC3", "PC4", "PC5", "PC6"];
export const pcSets = { "mule ring": P.II5.ringOffset, structurers: P.II5.structOffset };

// II.6 noise
export const noiseXs = P.II6.rows.map((r) => r.q);

// II.7 ratio
export const ratio = {
  options: [{ key: "without", label: "six features" }, { key: "with", label: "plus share sent abroad" }],
  ks: KS,
  get: (o, k) => P.II7.byK[k][o],
  extra: (o, k) => (o === "with" ? `all ${P.II7.byK[k].ringTogether} ring members share a cluster of ${P.II7.byK[k].sharedCluster}` : ""),
};

// III.1 R² by k
export const r2Sets = Object.fromEntries(Object.entries(P.III1.r2ByK).map(([k, v]) => [`k = ${k}`, v]));

// IV.2 rules
export const rules = {
  options: [{ key: "global", label: "top 1% overall" }, { key: "perCluster", label: "top 1% of each cluster" }, { key: "normalised", label: "distance ÷ cluster radius" }, { key: "small", label: "small clusters" }],
  ks: KS,
  get: (o, k) => P.IV2.rules[k][o],
  extra: (o, k) => (o === "perCluster" ? `${P.IV2.rules[k].perCluster.size} alerts, because every cluster gets its share rounded up` : o === "small" ? "no cluster is smaller than 1% of customers" : ""),
};
const segs = ["student", "salaried", "pensioner", "high", "selfemp"];
export const segLabels = segs.map((s) => SEGMENT_LABELS[s]);
export const segSets = {
  "share of customers": segs.map((s) => P.meta.segShare[s]),
  "share of alerts": segs.map((s) => (P.IV2.segAlerts[s] || 0) / 50),
};

// IV.3 distances
const DLAB = { euclid: "Euclidean", manhattan: "Manhattan", chebyshev: "Chebyshev", cosine: "cosine", mahalGlobal: "Mahalanobis (all)", mahalCluster: "Mahalanobis (per cluster)" };
export const distances = {
  options: Object.keys(DLAB).map((k) => ({ key: k, label: DLAB[k] })),
  ks: KS,
  get: (o, k) => P.IV3.dist[k][o],
  extra: (o, k) => { const d = P.IV3.dist[k][o]; return `overlap with Euclidean ${d.J.toFixed(2)}${d.undefinedShare > 0 ? ` · undefined for ${pct(d.undefinedShare)} of customers` : ""}`; },
};

// IV.1 ring size grid
export const ringSizes = [1, 5, 10, 20, 40];
export const ringSeries = [3, 5, 8, 12].map((k, i) => ({
  name: `k = ${k}`, cls: `k${k}`, colour: ["#a79eea", "#7366b9", "#45308a", "#232f3e"][i],
  ys: ringSizes.map((m) => P.IV1.grid[`${m}-${k}`].rec * 100),
}));

// V.1 dose-response
export const doseXs = [5000, 10000, 20000, 40000, 80000, 160000];
export const doseSeries = [
  { name: "as recorded", cls: "raw", colour: "#2074d5", key: "rawZ" },
  { name: "log(1 + x)", cls: "log", colour: "#df2a5d", key: "logZ" },
  { name: "log(x + 10,000)", cls: "log10k", colour: "#2f7d32", key: "log10k" },
  { name: "ranks", cls: "rank", colour: "#8a94a2", key: "rank", dash: "4 3" },
].map((s) => ({ ...s, ys: doseXs.map((a) => P.V1.struct[a][s.key]) }));
export const sendersXs = [3, 6, 10, 15, 22, 30, 40];
export const sendersSeries = KS.map((k, i) => ({ name: `k = ${k}`, cls: `k${k}`, colour: ["#2074d5", "#df2a5d", "#2f7d32"][i], ys: sendersXs.map((s) => P.V1.senders[s][k]) }));

// V.2 benchmarks
const BLAB = { kmeans1: "k-means, k = 1", kmeans3: "k-means, k = 3", kmeans5: "k-means, k = 5", kmeans8: "k-means, k = 8", mahal: "Mahalanobis", maxz: "one-feature rules", knn5: "5th neighbour", knn30: "30th neighbour", iforest: "isolation forest" };
export const bench = {
  options: P.V2.dets.map((d) => ({ key: d.name, label: BLAB[d.name] })),
  get: (o) => P.V2.dets.find((d) => d.name === o),
  extra: (o) => { const d = P.V2.dets.find((x) => x.name === o); return `AUC ring ${d.aucRing.toFixed(3)} · structurers ${d.aucStruct.toFixed(3)} · house sales ${d.aucSales.toFixed(3)}`; },
};

// V.3 similarity
const VLAB = { rawZ: "raw", winsorZ: "capped", logZ: "log", rank: "ranks", logRobust: "log robust" };
export const simLabels = P.V3.names.map((n) => VLAB[n]);
export const simSets = { ARI: P.V3.ari, NMI: P.V3.nmi };

// V.4 Hennig
export const henSets = Object.fromEntries(Object.entries(P.V4.hen).map(([k, v]) => [`k = ${k}`, v.jac]));
export const henLabels = (k) => P.V4.hen[k].sizes.map((n, i) => `cluster ${i + 1} (${n.toLocaleString("en-GB")})`);

// V.5 margins
export const decileLabels = ["closest 10%", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "clearest 10%"];

// V.6 persistence
export const persistence = {
  options: [{ key: "monthOne", label: "month 1 on its own" }, { key: "once", label: "alerted in one month only" }, { key: "twoPlus", label: "alerted in 2 of 3 months" }],
  ks: KS,
  get: (o, k) => P.V6.pers[k][o],
  extra: (o, k) => (o === "monthOne" ? "" : `${P.V6.pers[k].distinct} different customers were alerted across the three months`),
};

// V.7 remedies
export const remedyLabels = Object.values(P.V7).map((r) => `ring of ${r.m}, k = ${r.k}`);
export const remedySets = {
  "plain k-means": Object.values(P.V7).map((r) => r.standard),
  "k-means--": Object.values(P.V7).map((r) => r.minus),
  "trim and refit": Object.values(P.V7).map((r) => r.trim),
};

// VI.6 importance
export const importanceSets = {
  "peer-group R²": P.VI.importance.r2,
  "share of alert d²": P.VI.importance.share,
  "permutation": P.VI.importance.perm,
  "drop and refit": P.VI.importance.drop,
};
