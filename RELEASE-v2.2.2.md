# problem.me v2.2.2 — Evidence Lab Refactor

Release date: 12 November 2026

## Visual direction

Keep the established mascot identity. The Evidence Lab uses only capybara artwork already in the site:
- `assets/capybara-investigator.webp` — Regional Sign-in Outage
- `assets/capybara-analyst.webp` — Warehouse Scanning Mystery
- `assets/capybara-coffee.webp` — Migration Decision
- `assets/capybara-terminal-unframed.webp` — Lab hub introduction

Removed the three rejected experimental `capybara-new-*.svg` files from the published source. No new artwork, remote fonts or external image services.

## Editorial improvements

The three investigation pages now add:
- An upfront question and investigation method
- Distinction between observed evidence and unresolved questions
- Clear limitations of the fictional data and tests
- More rigorous rationale and competing explanations
- A three-part verification plan with monitoring, operational controls and closure conditions
- A practical learning takeaway

The Lab hub includes a six-move learning sequence (define, distinguish, discriminate, contain, verify, transfer), improved summaries and clearer links. Layout styles provide more generous reading hierarchy, easier desktop/mobile scanning and stronger visual treatment of existing capybara art.

All facts and numbers in the Lab remain explicitly fictional. Readers should not treat them as operational, security or procurement instructions.

## Invariants

No user input forms, scripts, accounts, tracking, saved answers or investigations. The original illustrated Case Files, professional cases, Academy and Privacy page are preserved.

## Validation

```sh
python3 build-release.py --check
node test-content-polish.cjs
node test-production-readonly.cjs
```

Regression tests require the 22 editorial pages, established capybara art, no old experimental SVGs, all three investigation briefs, evidence/unknown framing panels and verification workshops. Chromium checks each route at 1440, 390 and 320 pixels, ensures image loads, no horizontal overflow, functional disclosure panels, and absence of visitor input, storage or third-party requests.
