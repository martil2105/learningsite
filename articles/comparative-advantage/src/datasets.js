/*
  The article's economy. Everything in it is invented for this page.

  Two economies make two goods with labour alone. Productivity is written as
  what one worker makes in a day if they spend the whole day on one good, which
  is the form a reader can compare at a glance:

                 tools   sacks of grain
    the Valley     9          18
    the Coast      2           9

  The Valley is better at both. Its opportunity cost of a tool is 18 / 9 = 2
  sacks and the Coast's is 9 / 2 = 4.5, so the Valley has the comparative
  advantage in tools and the Coast in grain.

  The numbers are chosen so that the things the article asserts come out exact:
  the two opportunity costs differ by a factor of 2.25, whose square root is
  1.5, and the Valley's tools per worker equal the Coast's sacks per worker, so
  inside the band the market price is exactly the ratio of the two workforces.
*/

export const VALLEY = { name: "Valley", tools: 9, grain: 18 };
export const COAST = { name: "Coast", tools: 2, grain: 9 };

// People spend half of their income on each good (Cobb–Douglas, equal shares).
export const SHARE_TOOLS = 0.5;

// The Valley's workforce is held fixed; the article moves the Coast's.
export const VALLEY_WORKERS = 1000;

// Presets for the size lab, as Coast workers per Valley worker.
export const SIZE_PRESETS = [1, 2, 3, 4.5, 8];
export const SIZE_MIN = 0.25;
export const SIZE_MAX = 16;

// The price the reader is allowed to try in the opening question.
export const PRICE_MIN = 1;
export const PRICE_MAX = 6;
export const PRICE_STEP = 0.05;

// The catch-up section holds the Coast at three times the Valley's workforce,
// where both economies specialise and gain equally.
export const CATCHUP_SIZE = 3;
export const CATCHUP_TOOLS = { from: 2, to: 9 };
export const CATCHUP_GRAIN = { from: 9, to: 18 };

// The many-goods section: N goods with equal spending shares, and the Valley's
// productivity edge (Valley output / Coast output) spread evenly on a log scale
// from its edge in grain (2) to its edge in tools (4.5). N = 2 is the article's
// own economy.
export const GOODS_COUNTS = [2, 3, 5, 10];
export const EDGE_LOW = VALLEY.grain / COAST.grain; // 2
export const EDGE_HIGH = VALLEY.tools / COAST.tools; // 4.5

export function edges(n) {
  if (n < 2) throw new Error("at least two goods");
  return Array.from({ length: n }, (_, j) => EDGE_LOW * Math.pow(EDGE_HIGH / EDGE_LOW, j / (n - 1)));
}
