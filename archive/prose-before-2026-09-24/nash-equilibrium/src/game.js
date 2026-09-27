/*
  The article's model, and the only place its arithmetic lives.

  One period. Two players.

    Row    = a TRADER,    actions {Breach, Comply}
    Column = a RISK DESK, actions {Audit,  Skip}

                       Audit            Skip
      Breach      (-F, V - C)       (+G, -L)
      Comply      ( 0,    -C)       ( 0,   0)

    G  gain to the trader from a breach nobody audits
    F  fine if the breach is audited
    C  cost to the risk desk of running an audit
    V  value to the risk desk of catching a breach
    L  damage to the risk desk of a breach that gets through

  The two closed forms below are the article. Read what is IN each of them:
  the audit rate is built from the trader's numbers, and the breach rate is
  built from the risk desk's numbers. Neither player's own payoffs appear in
  their own equilibrium behaviour.
*/

export const BASE = Object.freeze({ G: 60, F: 140, C: 12, V: 50, L: 30 });

export const LABELS = Object.freeze({
  rows: ["Breach", "Comply"],
  cols: ["Audit", "Skip"],
  row: "trader",
  col: "risk desk",
});

/* The two payoff matrices, indexed [row][col]. */
export function matrices({ G, F, C, V, L }) {
  return {
    A: [[-F, G], [0, 0]],       // trader
    B: [[V - C, -L], [-C, 0]],  // risk desk
  };
}

/* Cells that survive the dots-and-circles test: neither player would switch. */
export function pureNE(A, B) {
  const out = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      if (A[r][c] > A[1 - r][c] && B[r][c] > B[r][1 - c]) out.push([r, c]);
    }
  }
  return out;
}

/* Who would deviate from a cell, and to what. Drives the opening question. */
export function deviations(A, B, r, c) {
  const out = [];
  if (A[1 - r][c] > A[r][c]) out.push({ who: "row", from: r, to: 1 - r, gain: A[1 - r][c] - A[r][c] });
  if (B[r][1 - c] > B[r][c]) out.push({ who: "col", from: c, to: 1 - c, gain: B[r][1 - c] - B[r][c] });
  return out;
}

/*
  The mixed equilibrium, in closed form.

    q* = G / (G + F)    the AUDIT rate  — only trader parameters
    p* = C / (V + L)    the BREACH rate — only risk desk parameters
*/
export function mixed({ G, F, C, V, L }) {
  return { p: C / (V + L), q: G / (G + F) };
}

/*
  The same equilibrium with no knowledge of the structure: it is handed both
  matrices and solves each indifference condition numerically. Used as the
  second, independent derivation — a check that only ever reads `mixed` would
  be checking the algebra against itself.
*/
export function mixedGeneric(A, B) {
  return {
    p: (B[1][1] - B[1][0]) / (B[0][0] - B[1][0] - B[0][1] + B[1][1]),
    q: (A[1][1] - A[0][1]) / (A[0][0] - A[0][1] - A[1][0] + A[1][1]),
  };
}

/* How much either player could gain by abandoning the mix. Zero at equilibrium. */
export function exploitability(A, B, p, q) {
  const rU = q * A[0][0] + (1 - q) * A[0][1];
  const rD = q * A[1][0] + (1 - q) * A[1][1];
  const cL = p * B[0][0] + (1 - p) * B[1][0];
  const cR = p * B[0][1] + (1 - p) * B[1][1];
  return Math.max(
    Math.max(rU, rD) - (p * rU + (1 - p) * rD),
    Math.max(cL, cR) - (q * cL + (1 - q) * cR)
  );
}

/* Equilibrium expected payoffs. Both are indifferent, so either row will do. */
export function values(P) {
  const { A, B } = matrices(P);
  const { p, q } = mixed(P);
  return {
    row: q * A[0][0] + (1 - q) * A[0][1],
    col: p * B[0][0] + (1 - p) * B[1][0],
  };
}

/*
  A monitor who is NOT a player: the audit rate is imposed at qbar rather than
  chosen. The trader now faces a fixed probability and simply compares.
  Breach is strictly better iff  G(1 - qbar) > F*qbar, i.e. qbar < G/(G+F).
*/
export const tolerated = ({ G, F }) => G / (G + F);

export function breachFixedMonitor(P, qbar) {
  const t = tolerated(P);
  return qbar < t ? 1 : qbar > t ? 0 : 0.5;
}

/*
  Both regimes at once: a regulator mandates a MINIMUM audit rate qbar, and the
  risk desk audits more only if it wants to. The floor is slack while
  qbar <= G/(G+F) and the mixed equilibrium stands; above that the risk desk is
  forced past the trader's tolerance and the trader complies outright.

  So the fine does nothing at all until it is large enough to push the risk
  desk's own preferred audit rate BELOW the floor, and the threshold is exact.
*/
export function criticalFine({ G }, qbar) {
  return qbar <= 0 ? Infinity : (G * (1 - qbar)) / qbar;
}

export function breachWithFloor(P, qbar) {
  return qbar > tolerated(P) ? 0 : P.C / (P.V + P.L);
}

export function auditWithFloor(P, qbar) {
  return qbar > tolerated(P) ? qbar : Math.max(qbar, tolerated(P));
}
