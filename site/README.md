# Visual explainers

Static site of interactive machine-learning and statistics articles, served by
GitHub Pages.

Nothing here is edited by hand. The site is generated from the article sources
in the (separate, local) `mlu-explain-generator` project:

```
./scripts/build-site.sh
```

That builds every article under `articles/`, copies the built output into
`site/<slug>/`, and regenerates `index.html` from `articles.json`. Commit and
push what changes.

## Credits and licensing

The article format, scaffold and design system come from
[MLU-Explain](https://mlu-explain.github.io/) (Amazon Machine Learning
University), used under CC BY-SA 4.0. All writing, code and data here are
original.

The starter's Amazon Ember typeface is proprietary and is **not** included.
It has been replaced with [Inter](https://rsms.me/inter/) and
[IBM Plex Mono](https://www.ibm.com/plex/), both SIL OFL, self-hosted under
`assets/fonts/`. Math is set in KaTeX's own fonts (MIT).
