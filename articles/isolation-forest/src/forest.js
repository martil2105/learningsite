/*
  One forest, shared by every chart in the article, so that a number quoted in
  the prose, a number in a readout and a colour in the heat map all come from
  the same 60 trees.
*/
import { accounts, mulberry32 } from "./datasets.js";
import { makeForest, scorePoint } from "./isolation.js";

export const N_TREES = 60;
export const PSI = 64;

export const FOREST = makeForest(
  accounts,
  { nTrees: N_TREES, psi: PSI, seed: 7 },
  mulberry32
);

// Every account's score, computed once.
export const pointStats = accounts.map((point) => ({
  point,
  ...scorePoint(point, FOREST),
}));

export const statsById = new Map(pointStats.map((s) => [s.point.id, s]));

export const ranked = [...pointStats].sort((a, b) => b.score - a.score);
