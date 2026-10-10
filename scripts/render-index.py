#!/usr/bin/env python3
"""Render site/index.html from site/articles.json.

The landing page is deliberately a single self-contained file: no build step,
no framework, nothing to install. Edit the template here, re-run
./scripts/build-site.sh, and the page is regenerated.
"""
import html
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"

SITE_NAME = "Martin Le"
SITE_TITLE = "Visual explainers"
SITE_BLURB = (
    "Short, interactive essays on economics, finance, machine learning and statistics. "
    "Each one takes a single idea and gives you something on the page to move."
)

FAVICON = (
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9"
    "IjAgMCAzMiAzMiI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjZjFmM2YzIi8+PHJlY3QgeD0i"
    "NS41IiB5PSI1LjUiIHdpZHRoPSIyMSIgaGVpZ2h0PSIyMSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMjMyZjNlIiBz"
    "dHJva2Utd2lkdGg9IjIuNSIvPjxsaW5lIHgxPSIxOCIgeTE9IjUuNSIgeDI9IjE4IiB5Mj0iMjYuNSIgc3Ryb2tl"
    "PSIjN2M1YWVkIiBzdHJva2Utd2lkdGg9IjIuNSIvPjxsaW5lIHgxPSI1LjUiIHkxPSIxNyIgeDI9IjE4IiB5Mj0i"
    "MTciIHN0cm9rZT0iIzdjNWFlZCIgc3Ryb2tlLXdpZHRoPSIyLjUiLz48L3N2Zz4="
)


def font_faces() -> str:
    latin = (
        "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,"
        "U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,"
        "U+FEFF,U+FFFD"
    )
    ext = (
        "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,"
        "U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,"
        "U+2113,U+2C60-2C7F,U+A720-A7FF"
    )
    out = []
    for weight in (400, 500, 700, 800):
        for subset, rng in (("latin", latin), ("latin-ext", ext)):
            out.append(
                f'@font-face{{font-family:"Inter";'
                f'src:url("assets/fonts/inter-{subset}-{weight}-normal.woff2") format("woff2");'
                f"font-weight:{weight};font-style:normal;font-display:swap;"
                f"unicode-range:{rng};}}"
            )
    return "\n    ".join(out)


def ml_card(a: dict) -> str:
    slug = html.escape(a["slug"])
    return f"""        <a class="card" href="{slug}/">
          <h3 class="card-title">{html.escape(a["title"])}</h3>
          <p class="card-blurb">{html.escape(a["blurb"])}</p>
          <p class="card-meta">{html.escape(a.get("date", ""))}<span class="arrow">Read &rarr;</span></p>
        </a>"""


def spine_item(a: dict, is_first: bool = False) -> str:
    slug = html.escape(a["slug"])
    order = a.get("spine_order", 0)
    order_str = f"Part {order:02d}" if order else ""
    unit = html.escape(a.get("unit", ""))
    bridge = a.get("bridge", "")

    bridge_html = ""
    if bridge:
        tag = "Introduction" if is_first else "Bridge"
        bridge_html = f"""        <div class="spine-bridge" aria-label="{tag}">
          <div class="bridge-line-wrap">
            <span class="bridge-dot"></span>
            <span class="bridge-tag">{tag}</span>
          </div>
          <p class="bridge-text">{html.escape(bridge)}</p>
        </div>"""

    badge_html = ""
    if order_str or unit:
        badge_html = f"""          <div class="card-badge-row">
            <span class="spine-order-badge">{html.escape(order_str)}</span>
            {f'<span class="spine-unit-badge">{unit}</span>' if unit else ''}
          </div>"""

    card_html = f"""        <a class="card card-spine" href="{slug}/">
{badge_html}
          <h3 class="card-title">{html.escape(a["title"])}</h3>
          <p class="card-blurb">{html.escape(a["blurb"])}</p>
          <p class="card-meta">{html.escape(a.get("date", ""))}<span class="arrow">Read &rarr;</span></p>
        </a>"""

    if bridge_html:
        return f"{bridge_html}\n{card_html}"
    return card_html


def main() -> None:
    articles = json.loads((SITE / "articles.json").read_text())

    # Each spine is drawn in spine_order, whatever order the manifest lists it in:
    # an article added in the middle of a spine used to land at its end.
    by_spine = lambda a: a.get("spine_order", 0)
    econ_articles = sorted((a for a in articles if a.get("track") == "economics"), key=by_spine)
    fin_articles = sorted((a for a in articles if a.get("track") == "finance"), key=by_spine)
    ml_articles = [a for a in articles if a.get("track") == "ml" or not a.get("track")]

    econ_cards = "\n".join(
        spine_item(a, is_first=(i == 0)) for i, a in enumerate(econ_articles)
    )
    fin_cards = "\n".join(
        spine_item(a, is_first=(i == 0)) for i, a in enumerate(fin_articles)
    )
    ml_cards = "\n".join(ml_card(a) for a in ml_articles)

    page = f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{html.escape(SITE_TITLE)} · {html.escape(SITE_NAME)}</title>
    <meta name="description" content="{html.escape(SITE_BLURB)}" />
    <meta property="og:title" content="{html.escape(SITE_TITLE)}" />
    <meta property="og:description" content="{html.escape(SITE_BLURB)}" />
    <link rel="icon" href="{FAVICON}" />
    <style>
    {font_faces()}

    :root {{
      --squidink: #232f3e;
      --paper: #f1f3f3;
      --violet: #7c5aed;
      --violet-dim: rgba(124, 90, 237, 0.12);
      --stone: #d4dada;
      --stone-light: #e5e9e9;
      --font-main: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
    }}

    * {{ box-sizing: border-box; }}

    body {{
      margin: 0;
      background: var(--paper);
      color: var(--squidink);
      font-family: var(--font-main);
      -webkit-font-smoothing: antialiased;
    }}

    .wrap {{
      max-width: 720px;
      margin: 0 auto;
      padding: 0 1.25rem 5rem 1.25rem;
    }}

    .site-mark {{
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      padding: 2rem 0 3rem 0;
    }}

    .wordmark {{
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      margin: 0;
    }}

    h1 {{
      text-wrap: balance;
      font-size: clamp(2.6rem, 9vw, 3.8rem);
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      line-height: 1.05;
      margin: 0 0 1.5rem 0;
      text-align: center;
    }}

    .blurb {{
      text-wrap: balance;
      font-size: 1.15rem;
      line-height: 1.6;
      text-align: center;
      opacity: 0.8;
      margin: 0 auto 2.5rem auto;
      max-width: 36rem;
    }}

    .track-nav {{
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 3.5rem;
    }}

    .track-nav a {{
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.9rem;
      border: 2px solid var(--squidink);
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      text-decoration: none;
      color: var(--squidink);
      background: transparent;
      transition: all 150ms ease;
    }}

    .track-nav a:hover,
    .track-nav a:focus-visible {{
      background: var(--squidink);
      color: var(--paper);
      outline: none;
    }}

    .track-nav .count {{
      background: var(--violet);
      color: #fff;
      font-size: 0.75rem;
      padding: 0.1rem 0.4rem;
      border-radius: 999px;
      line-height: 1.2;
    }}

    .track-section {{
      margin-bottom: 4rem;
      scroll-margin-top: 2rem;
    }}

    .track-header {{
      border-bottom: 2px solid var(--squidink);
      padding-bottom: 0.75rem;
      margin-bottom: 2rem;
    }}

    .track-title {{
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      margin: 0 0 0.4rem 0;
      display: flex;
      align-items: baseline;
      gap: 0.6rem;
    }}

    .track-subtitle {{
      font-size: 0.95rem;
      line-height: 1.55;
      opacity: 0.8;
      margin: 0;
    }}

    /* Card styling */
    .card {{
      display: block;
      border: 3px solid var(--squidink);
      padding: 1.5rem 1.6rem 1.2rem 1.6rem;
      margin-bottom: 1.5rem;
      text-decoration: none;
      color: inherit;
      background: transparent;
      transition: border-color 150ms ease, transform 150ms ease, background-color 150ms ease;
    }}

    .card:hover,
    .card:focus-visible {{
      border-color: var(--violet);
      transform: translateY(-2px);
      background: #ffffff;
      outline: none;
    }}

    .card-badge-row {{
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.6rem;
      font-size: 0.75rem;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 700;
    }}

    .spine-order-badge {{
      background: var(--squidink);
      color: var(--paper);
      padding: 0.15rem 0.5rem;
    }}

    .spine-unit-badge {{
      border: 1px solid var(--squidink);
      padding: 0.15rem 0.5rem;
      opacity: 0.85;
    }}

    .card-title {{
      font-size: 1.55rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0 0 0.6rem 0;
      line-height: 1.2;
    }}

    .card-blurb {{
      font-size: 1rem;
      line-height: 1.55;
      margin: 0 0 1rem 0;
      opacity: 0.85;
    }}

    .card-meta {{
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 0.85rem;
      letter-spacing: 1px;
      text-transform: uppercase;
      opacity: 0.6;
      margin: 0;
    }}

    .card:hover .arrow {{ color: var(--violet); opacity: 1; }}

    /* Spine and bridge elements */
    .spine-container {{
      position: relative;
    }}

    .spine-bridge {{
      position: relative;
      margin: 0.5rem 0 0.5rem 1rem;
      padding: 0.8rem 1rem 0.8rem 1.25rem;
      border-left: 2px solid var(--violet);
      background: var(--violet-dim);
    }}

    .bridge-line-wrap {{
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.3rem;
    }}

    .bridge-dot {{
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--violet);
    }}

    .bridge-tag {{
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--violet);
    }}

    .bridge-text {{
      font-size: 0.88rem;
      line-height: 1.5;
      margin: 0;
      color: var(--squidink);
      opacity: 0.9;
    }}

    footer {{
      border-top: 1px solid var(--stone);
      margin-top: 4rem;
      padding-top: 1.5rem;
      font-size: 0.85rem;
      line-height: 1.6;
      opacity: 0.7;
    }}

    footer a {{ color: var(--violet); font-weight: 700; }}

    @media (max-width: 600px) {{
      .wrap {{ padding: 0 1rem 4rem 1rem; }}
      .card {{ padding: 1.2rem 1.2rem 1rem 1.2rem; }}
      .card-title {{ font-size: 1.35rem; }}
      .spine-bridge {{ margin-left: 0.5rem; }}
    }}
    </style>
  </head>

  <body>
    <div class="wrap">
      <header class="site-mark">
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
          <rect x="5.5" y="5.5" width="21" height="21" fill="none" stroke="#232f3e" stroke-width="2.5" />
          <line x1="18" y1="5.5" x2="18" y2="26.5" stroke="#7c5aed" stroke-width="2.5" />
          <line x1="5.5" y1="17" x2="18" y2="17" stroke="#7c5aed" stroke-width="2.5" />
        </svg>
        <p class="wordmark">{html.escape(SITE_NAME)}</p>
      </header>

      <main>
        <h1>{html.escape(SITE_TITLE)}</h1>
        <p class="blurb">{html.escape(SITE_BLURB)}</p>

        <nav class="track-nav" aria-label="Sections">
          <a href="#economics">Economics Sequence <span class="count">{len(econ_articles)}</span></a>
          <a href="#finance">Finance Sequence <span class="count">{len(fin_articles)}</span></a>
          <a href="#machine-learning">Machine Learning &amp; Statistics <span class="count">{len(ml_articles)}</span></a>
        </nav>

        <section id="economics" class="track-section">
          <header class="track-header">
            <h2 class="track-title">The Economics Sequence</h2>
            <p class="track-subtitle">An ordered progression through microeconomics and macroeconomics, in curriculum order. Each article builds on the machinery of the last, connected by a two-sentence bridge explaining what the previous article established and what the next one needs.</p>
          </header>
          <div class="spine-container">
{econ_cards}
          </div>
        </section>

        <section id="finance" class="track-section">
          <header class="track-header">
            <h2 class="track-title">The Finance Sequence</h2>
            <p class="track-subtitle">The technical side of markets, in reading order: how a trade happens, how shares and bonds are valued, and how portfolios and risk are measured. Like the economics sequence, each article is joined to the last by a two-sentence bridge.</p>
          </header>
          <div class="spine-container">
{fin_cards}
          </div>
        </section>

        <section id="machine-learning" class="track-section">
          <header class="track-header">
            <h2 class="track-title">Machine Learning &amp; Statistics</h2>
            <p class="track-subtitle">Interactive visual essays on foundational algorithms, loss functions, decision boundaries, evaluation metrics, and distribution drift.</p>
          </header>
{ml_cards}
        </section>
      </main>

      <footer>
        <p>
          Built on the article scaffold and design system of
          <a href="https://mlu-explain.github.io/">MLU-Explain</a>, used under
          CC BY-SA 4.0. The writing, code and data are original; the
          proprietary Amazon Ember typeface has been replaced with
          <a href="https://rsms.me/inter/">Inter</a> and
          <a href="https://www.ibm.com/plex/">IBM Plex Mono</a>, both under the
          SIL Open Font License.
        </p>
      </footer>
    </div>
  </body>
</html>
"""
    (SITE / "index.html").write_text(page)
    print(f"→ index.html ({len(articles)} articles: {len(econ_articles)} economics, {len(fin_articles)} finance, {len(ml_articles)} ML/stats)")


if __name__ == "__main__":
    main()
