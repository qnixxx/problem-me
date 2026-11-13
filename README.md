# problem.me — v1.0

**Same problems. Clearer thinking.**

Problem.me is an independent, non-commercial educational website for learning practical problem management. It combines accessible explanations, original capybara-illustrated Case Files, professional examples, and guided evidence-based investigations.

## Explore

- [Problem Management Academy](academy.html) — five connected chapters covering fundamentals, technique selection, applied examples, practice and the Evidence Lab.
- [Technique Library](techniques.html) — 5 Whys, Fishbone, Pareto and Kepner–Tregoe, each with an illustrated Case File and a Field Guide.
- [Professional Cases](professional-cases.html) — four fictional operational investigations for applying each method to realistic problem shapes.
- [Evidence Lab](evidence-lab.html) — three staged fictional investigations with evidence packets, choices and reasoning debriefs.
- [Practice](practice.html) — eight guided reasoning challenges with worked explanations.
- [Glossary](glossary.html) — concise definitions of 22 core terms.
- [What's Inside](features.html) — a current guide to the v1.0 learning experience.
- [Privacy](privacy.html) — how the educational site handles visitor information.

## Site structure

The same four destinations appear in the header on every public page:

1. **Home** (`index.html`) — a short introduction and three obvious starting paths.
2. **Learn** (`academy.html`) — the five-chapter Academy: foundations, method selection, professional cases, reasoning practice and guided investigations. Individual lesson pages show breadcrumbs back to Learn.
3. **Techniques** (`techniques.html`) — four methods, each with one illustrated Case File and one evidence-first Field Guide. Case and guide pages link back to the Technique Library.
4. **Practice** (`practice.html`) — choose short self-checks or explore the Evidence Lab's three longer scenarios. All labs link back to the Lab index and then Practice.

Secondary pages (Glossary, What's Inside, Privacy) are available contextually and through the compact footer. Detail pages have short Home → Section → Page breadcrumb trails. Avoid separate competing menus or links that send visitors back to the same page as their primary call to action.

The homepage terminal entrance is a ~2-second CSS-only visual introduction. It uses the established terminal identity, can be skipped immediately with the “Skip intro” anchor, respects reduced-motion settings, and never delays the actual page content. No visitor data is entered or stored.

## Learning philosophy

Understand the deviation before choosing a method. Separate observed facts from plausible explanations, actively test competing hypotheses, and define how durable improvement will be verified. All professional scenarios and their numerical observations are explicitly fictional teaching examples.

The brand uses a warm orange capybara mascot, dark green/black surfaces, neon-green accents, and clear editorial layouts. Only the existing established mascot illustrations are used.

## Technical approach

The website is static HTML and CSS, hosted on GitHub Pages via the `problem.me` custom domain. Educational disclosures are native HTML elements. Pages do not require registration, collect investigation text, or write application storage. The site does not include analytics or third-party scripts.

To preview locally, serve the repository directory over HTTP using a local static-file server.

## Release validation

```sh
python3 build-release.py --check
node test-content-polish.cjs
node test-production-readonly.cjs
```

The browser suite uses Playwright Chromium and is run by the repository's CI workflow at desktop and mobile widths. The static checks cover all 22 educational pages, internal links, image references, metadata and the absence of data-entry controls.

**Current publication version: v1.0**
