# Publishing

The whole of `learningsite/` is one git repository,
github.com/martil2105/learningsite. The built static site is `site/`, and
`.github/workflows/pages.yml` uploads it to GitHub Pages on every push to `main`
that changes it. `.gitignore` keeps `sources/` (papers we read), the 243MB
`reference/aws-mlu-explain/` clone, `Claude outputs/`, every `node_modules` and
the articles' own `public/build/` out of the repository; articles' sources,
`reference/`, `scripts/` and `site/` are all committed.

```bash
./scripts/build-site.sh
```

It runs the prose gate on every article listed in `site/articles.json` and
refuses to go on if one fails, builds each of them, copies its `public/` into
`site/<slug>/` without source maps, regenerates `site/index.html` from the
manifest, and loads every page in a browser. It refuses an article that still
carries Amazon Ember, and one that fails the prose gate. The only exceptions
are the ten machine-learning articles in `VOICE_LEGACY`, written before the
voice rules, which warn until each has had its voice pass. No new article goes
on that list.

**An article goes live only when it has an entry in `site/articles.json`**, so
unfinished ones sit in `articles/` untouched. The manifest entry is
`slug`, `title`, `blurb` and `date`. An economics article also has `track`,
`spine_order`, `unit` and `bridge`: the bridge is the two sentences on the landing
page that lead from the article before it to this one. A finance article has
the same four with `track: "finance"`, its own `spine_order` from 1 and its
finance slate ID (`Fm1`, `Fr3`, …) as the `unit`; `render-index.py` draws it as a
third spine, between economics and machine learning.

The blurb is the article's actual claim in one or two sentences, not a
description of the topic. The blurb and the bridge are reader text, so they
follow `reference/writing-the-prose.md` like the page does:
- calm and plain, in 50 words or fewer;
- no dashes, and "exactly" only where exactness is the point;
- no grand words ("destroys", "remarkably"), no "every textbook", and no
  verification talk ("to fourteen decimal places");
- British spelling;
- the title in sentence case, matching the page's `<h1>`.

Read the existing entries before writing a new one; they were rewritten to this
standard on 24 September 2026.

Deployed by GitHub Pages through the Actions workflow, which uploads `site/`
as it is (the repository's Pages source is "GitHub Actions"). To publish:
`./scripts/build-site.sh`, then commit and push `main` from the repository root.
`site/.nojekyll` is kept for any branch-based deploy. Every asset path is relative, so the site works at any
base path without changes.

**Adding an article in the middle of a spine.** Give it the `spine_order` of
its place in reading order, renumber the entries after it, and rewrite the
bridge of the article that now follows it, since that bridge names its
predecessor. `render-index.py` sorts each spine by `spine_order` (since 30
September 2026; before that it drew the manifest's file order, and the five
Stage 1 finance articles first appeared at the end of the spine). Keep the
file order the same as the spine order anyway, so the manifest reads the way
the page does.
