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
