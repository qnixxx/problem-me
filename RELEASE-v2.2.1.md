# problem.me v2.2.1 — Visual & Editorial Polish

Release date: 12 November 2026

## Editorial direction

Problem.me teaches investigation, causal reasoning, method selection and verification. The public learning pages should lead with those benefits rather than repeatedly calling attention to the website's underlying static architecture.

- Revised homepage and Academy entry copy to emphasize learning.
- Replaced recurring platform/privacy notices in lessons, Case Files, practice prompts, Evidence Lab screens, and page footers with evidence-first editorial guidance.
- Refreshed technique library summaries, metadata, case header labels, and release-summary wording.
- Preserved the dedicated Privacy page and historically accurate release descriptions.

## Visuals

Three new original SVG capybara illustrations were added without remote image hosting, scripts, or new runtime dependencies:

- `assets/capybara-new-signin.svg` — orange capybara, identity gateways and a verification shield
- `assets/capybara-new-warehouse.svg` — orange capybara, warehouse parcels and scanning data
- `assets/capybara-new-migration.svg` — orange capybara, alternative platforms and decision checks

The same illustrations appear on the corresponding three Evidence Lab case cards and their case pages. Each is responsive, self-contained, lightweight (approximately 6 KB), semantically described by the enclosing HTML image's alt attribute, and uses the established warm-orange/neon-green/dark visual language. Original capybara artwork elsewhere on the website is unchanged.

## What has not changed

No visitor inputs, scripts, forms, save functions or analytics have been added. The underlying v2.2 security/privacy boundary remains unchanged; it simply does not dominate the education-focused interface.

## Verification

```sh
python3 build-release.py --check
node test-content-polish.cjs
node test-production-readonly.cjs
```

Content tests enforce 22 educational pages, accurate version labels, the presence and safe syntax of the three new SVG visuals, and the absence of prominent retired labels. Chromium checks verify all public images load, the three case illustrations and alt descriptions appear, responsive layouts do not overflow, keyboard disclosures function, and no scripts, data-entry controls or browser storage are introduced.
