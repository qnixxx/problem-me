# Capybara Terminal facelift — review build

Base: GitHub main `0fc6eca` (includes the existing v2 brand reference).
Branch: `design/capybara-terminal-rollout`.
Status: implemented for review; not deployed to problem.me.

## What changed

- A shared screen theme across all 15 HTML pages: cream / neon wordmarks, near-black panels, rounded controls and cards, warm amber secondary accents, clearer primary actions.
- Homepage uses the supplied mascot artwork with a calm, explicit investigation CTA, a shorter introduction and a normal-flow caption. Removed the replaced homepage CSS mascot drawing.
- Case File diagrams retain their meaning and poses with warmer mascot colours. Field Guides, Privacy, the library and both investigation pages use the same component treatment.
- Existing hamburger behavior and footer cursor animation retained. The brand reference now also uses the shared navigation/footer.
- Legacy small text in the brand reference raised to the site's 14px minimum; existing 17px reading text and 16px input floor retained.
- Runtime packager now includes image assets; this also fixes omission of the existing social-preview image.
- No framework, remote font, additional runtime script, or persistence dependency.

## Executed validation

- `node test-pilot.cjs`: all 7 groups passed (JavaScript syntax, schema 3 roundtrip, schema 1/2 migration, missing states, malformed/future rejection, UTF-8 size limit).
- `node test-readability.cjs`: 635 explicit CSS sizes at least 14px; old and new text palettes pass 4.5:1 contrast checks.
- `python build-release.py --check`: 15 pages; unique IDs; 322 local paths/anchors; 31 runtime files complete.
- `git diff --check`: passed.
- Existing browser suites were attempted, but Playwright cannot launch: the installed package has no Chromium executable. No visual, Safari, mobile, or browser regression pass is claimed.

## Review locally

Extract the runtime ZIP into a new directory. Run `python -m http.server 8000` in that directory, then open http://localhost:8000/index.html. Use a separate browser profile for test investigations. A new origin will not contain investigations saved on problem.me.

## Before merging / publishing

1. Review homepage at 390 × 844 and 1280 × 844: headline, image, caption and CTA; no horizontal page overflow.
2. Check menu open / Escape / close / navigation and footer on the library, each Case File, all four guides, Privacy, Feature Log and both investigation pages.
3. Review long titles, guides at 200% zoom, sticky headers on Safari, focus visibility and reduced motion.
4. Run `test-browser.cjs`, `test-nav.cjs` and `test-typography.cjs` with Playwright Chromium available. Typography tests check 320, 390 and 1280px widths and the new image/caption geometry.
5. Inspect all three embedded workspaces, chart scrolling, Evidence Ledger and stable iframe heights. Verify Private Session, Local Save, exports, imports and handoffs with disposable data.
6. Print a report from each technique: existing report content and colours must remain readable.

## Deployment after approval

Use the entire runtime ZIP from `python build-release.py`, retaining the `articles/` and `assets/` directories. Replace the runtime files together. Preserve existing CNAME and hosting settings; the ZIP intentionally does not change them. Test/dev scripts and this document need not be uploaded to Pages.

Application version and schema stay unchanged (1.0.0 / schema 3). Investigation JavaScript, IndexedDB code and embedded adapters were not modified.
