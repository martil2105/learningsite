// svelte.config.js
let preprocess;
try {
  preprocess = require("svelte-preprocess");
} catch (e) {
  try {
    preprocess = require("./node_modules/svelte-preprocess");
  } catch (err) {
    preprocess = () => ({});
  }
}

module.exports = {
  preprocess: preprocess ? preprocess() : {},
};
