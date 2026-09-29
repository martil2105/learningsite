// Written by scripts/precompute.mjs from src/expo.js. Do not edit by hand.
// Key: the leverage cap (1 is 100% stocks), or "glide". Values: sd, median and 5th percentile of the final wealth
// of 100,000 seeded savers (median and percentile in years of deposits), the mean, and the exposure measures.
export const DATA = {
  "1": {"sd":0.8214,"median":144.666,"p5":41.128,"mean":214.395,"neff":35.1954,"sumE":28.5767,"sdDelta":0.867,"e1":1},
  "2": {"sd":0.7577,"median":142.161,"p5":46.922,"mean":204.692,"neff":38.9787,"sumE":28.5767,"sdDelta":0.8239,"e1":2},
  "3": {"sd":0.7476,"median":141.264,"p5":47.644,"mean":202.53,"neff":39.593,"sumE":28.5767,"sdDelta":0.8175,"e1":3},
  "4": {"sd":0.7436,"median":140.887,"p5":47.947,"mean":201.783,"neff":39.8245,"sumE":28.5767,"sdDelta":0.8151,"e1":4},
  "1.25": {"sd":0.7842,"median":143.426,"p5":44.733,"mean":209.535,"neff":37.2941,"sumE":28.5767,"sdDelta":0.8423,"e1":1.25},
  "1.5": {"sd":0.7705,"median":142.945,"p5":45.93,"mean":207.188,"neff":38.1557,"sumE":28.5767,"sdDelta":0.8327,"e1":1.5},
  "1.75": {"sd":0.7628,"median":142.556,"p5":46.537,"mean":205.715,"neff":38.6537,"sumE":28.5767,"sdDelta":0.8273,"e1":1.75},
  "2.5": {"sd":0.7514,"median":141.627,"p5":47.389,"mean":203.345,"neff":39.3699,"sumE":28.5767,"sdDelta":0.8198,"e1":2.5},
  "3.5": {"sd":0.7453,"median":141.055,"p5":47.786,"mean":202.08,"neff":39.7362,"sumE":28.5767,"sdDelta":0.816,"e1":3.5},
  "glide": {"sd":0.4672,"median":109.724,"p5":54.355,"mean":125.845,"neff":37.1115,"sumE":16.0889,"sdDelta":0.4754,"e1":0.9},
};
