/*
  The three-player game the article opens with.

  Ada, Bo and Cleo take on work together. The value function says what any
  subset of them could bill on their own over a year, in thousands. Payoffs are
  indexed by bitmask: Ada = bit 0, Bo = bit 1, Cleo = bit 2.

    0  {}            1  {Ada}         2  {Bo}          3  {Ada,Bo}
    4  {Cleo}        5  {Ada,Cleo}    6  {Bo,Cleo}     7  {Ada,Bo,Cleo}

  Every preset below is a real cooperative game, and each one exists to make a
  property of the Shapley value visible on the page rather than asserted in the
  prose. The expected values in `teaches` are checked in verify/check-numbers.mjs.
*/

export const PLAYERS = [
  { key: "ada", name: "Ada", role: "builds the thing" },
  { key: "bo", name: "Bo", role: "brings the clients" },
  { key: "cleo", name: "Cleo", role: "the specialist" },
];

export const COALITION_LABELS = [
  "nobody",
  "Ada",
  "Bo",
  "Ada + Bo",
  "Cleo",
  "Ada + Cleo",
  "Bo + Cleo",
  "all three",
];

export const PRESETS = [
  {
    key: "consultancy",
    name: "The practice",
    payoffs: [0, 15, 30, 75, 0, 45, 60, 120],
    blurb:
      "Cleo cannot win a contract on her own, and is worth 45 to whoever she joins.",
    teaches: "the general case",
  },
  {
    key: "freerider",
    name: "A free rider",
    payoffs: [0, 15, 30, 75, 0, 15, 30, 75],
    blurb:
      "Cleo adds exactly nothing to any group she joins. Every coalition is worth what it was without her.",
    teaches: "null player: a player who adds nothing to every coalition is paid nothing",
  },
  {
    key: "twins",
    name: "Two of a kind",
    payoffs: [0, 30, 30, 60, 0, 60, 60, 90],
    blurb:
      "Swap Ada for Bo anywhere and no coalition changes value. They are interchangeable.",
    teaches: "symmetry: interchangeable players are paid the same",
  },
  {
    key: "unanimity",
    name: "All or nothing",
    payoffs: [0, 0, 0, 0, 0, 0, 0, 120],
    blurb:
      "The contract needs all three signatures. Any group of two is worth as little as one alone: nothing.",
    teaches: "the equal split is not the rule, but it is the answer when the game is symmetric",
  },
];

export const DEFAULT_PRESET = PRESETS[0];

// The reader can drag any payoff. These bound the drag so the game stays
// monotone-ish and the bars stay on screen; nothing here is a Shapley
// requirement, and the values still need not be superadditive.
export const PAYOFF_MAX = 150;
export const PAYOFF_STEP = 5;
