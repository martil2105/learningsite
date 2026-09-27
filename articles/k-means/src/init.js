/*
  Initialisation. This file is short and it decides the answer, which is the
  point the middle of the article is making.
*/
import { dist2 } from "./kmeans.js";

/*
  Forgy: k distinct data points, uniformly at random. The oldest rule and still
  the honest baseline - scikit-learn's init="random" is this.
*/
export function initRandom(points, k, rand) {
  const chosen = [];
  const used = new Set();
  while (chosen.length < k) {
    const i = Math.floor(rand() * points.length);
    if (used.has(i)) continue;
    used.add(i);
    chosen.push({ x: points[i].x, y: points[i].y });
  }
  return chosen;
}

/*
  k-means++ (Arthur & Vassilvitskii, SODA 2007). First centre uniform; every
  later centre drawn with probability proportional to D(x)^2, the squared
  distance from x to the nearest centre already chosen.

  The squaring is what does the work. Under plain uniform sampling a blob with
  many points is likely to be picked twice; under D^2 the far-away blob that
  nothing covers yet has the largest total weight, so it goes next.
*/
export function initPlusPlus(points, k, rand) {
  const n = points.length;
  const centres = [{ ...points[Math.floor(rand() * n)] }];
  const d2 = points.map((p) => dist2(p, centres[0]));

  while (centres.length < k) {
    let total = 0;
    for (let i = 0; i < n; i++) total += d2[i];
    // Degenerate case: every point already coincides with a centre.
    if (total <= 0) {
      centres.push({ ...points[Math.floor(rand() * n)] });
    } else {
      let target = rand() * total;
      let pick = n - 1;
      for (let i = 0; i < n; i++) {
        target -= d2[i];
        if (target <= 0) {
          pick = i;
          break;
        }
      }
      centres.push({ x: points[pick].x, y: points[pick].y });
    }
    const last = centres[centres.length - 1];
    for (let i = 0; i < n; i++) d2[i] = Math.min(d2[i], dist2(points[i], last));
  }
  return centres;
}
