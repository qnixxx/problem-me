# problem.me v1.0.0 — release handoff

Prepared from `qnixxx/problem-me` main at `8b90b6b` on 2026-09-29.
Branch: `release/v1.0`.

Status: packaged release candidate. Not deployed or tagged. Browser verification
is an outstanding release gate; do not read the v1.0 labels as proof of deployment.

## Scope

Promote the current local-first workspace to its first stable product release:
5 Whys, Fishbone and Pareto share an investigation and Evidence Ledger; Local Save
uses IndexedDB; Private Session keeps investigation changes in page memory;
`.problemme` files provide portable copies. Four Field Guides, privacy notes,
shared menu, typography and compact footers remain intact. KT stays standalone.

This does not introduce the previously discussed Reasoning Review or AI engine.
The Capybara Supply feature branch is not on current main and is not bundled.

## Changes

Initial runtime changes updated release metadata and Feature Log content:

- `index.html`: application-version 1.0.0 drives the existing homepage labels.
- `investigation.html`: workspace release label 1.0.0.
- `investigations.html`: local library release label 1.0.0.
- `privacy.html`: privacy notes release label 1.0.0.
- `investigation-model.js`: fresh/decoded appVersion 1.0.0.
- `features.html`: current release 1.0.0; retain the historical v0.9.2 entry.

Development files:

- `test-pilot.cjs`: repair stale schema-2 assertions and remove obsolete
  localStorage controller mocks; seven syntax/model compatibility groups.
- `test-browser.cjs`: replace the obsolete localStorage browser test with ten
  real-browser groups for current IndexedDB, Private, import/export, shared
  evidence, handoffs, conflicts, save failure, migrations and iframe sizing.
- `build-release.py`: validate static links, assets, anchors and IDs; package and
  byte-verify the complete runtime ZIP using only Python's standard library.
- `PROBLEMME-FORMAT-v3.md`: document current compatibility separately from the
  historical schema-1 specification.
- `RELEASE-v1.0.md`: this handoff.

No investigation controller, bridge, store, navigation logic, runtime dependencies,
database version or schema version changed. Existing IndexedDB records are not
mass-rewritten. A saved record is decoded in memory; a later save records the
current appVersion while retaining its identity and work.

## Executed verification

- `node test-pilot.cjs`: PASS, seven groups. Syntax includes runtime JS and
  inline scripts in all 14 pages. Covers schemas 1/2 → 3, schema 3 roundtrip,
  Unicode, missing unused states, malformed/future rejection and 1 MiB limits.
- `python build-release.py`: PASS, 14 pages, 281 local references/anchors,
  unique static IDs, all 26 runtime files, ZIP integrity and byte equivalence.
- `git diff --check`: PASS.
- `node --check` on all four browser/model test files: PASS.

Browser attempts: `test-browser.cjs`, `test-nav.cjs`, `test-typography.cjs` all
failed at browser launch, before application assertions executed. The restored
Chromium 153 binary exits with SIGTRAP; an earlier incomplete binary exited with
SIGSEGV. A replacement Playwright download returned an invalid/truncated archive.
These are NOT browser passes. No Safari/WebKit, physical iPhone, screenshot,
visual-layout or live deployment validation was completed in this pass.

The new browser suite itself still needs an executed validation run. It is not a
substitute for the previously successful v0.9.2 checks.

## Finish the release gate

On a workstation with Node and Playwright installed (development only):

```sh
node test-pilot.cjs
node test-browser.cjs
node test-nav.cjs
node test-typography.cjs
python3 build-release.py
```

The browser suites start their own temporary HTTP server. Install Playwright and
its Chromium browser in a development environment if missing. `CHROMIUM_PATH`
can select an existing browser binary. No Node package or build step is needed
on GitHub Pages.

## Deployment

`problem-me-v1.0.0-runtime.zip` contains the complete runtime, without a containing
folder. Extract it and replace the matching files in the existing repository
root, retaining the `articles/` directory. Upload all 26 files together, not just
HTML. Keep existing `CNAME`, GitHub Pages settings, DNS and HTTPS configuration.
The package intentionally does not contain those infrastructure files.

The accompanying source ZIP contains the tracked project plus the tests and
release documents; it is for development/review, not the upload shortcut.

Once browser checks pass, publish the runtime files using the existing workflow.
Then tag the deployed commit `v1.0.0`. Do not tag an older main commit. The local
branch is prepared for review; no GitHub branch, tag or release was published.

## Quick browser checklist before announcing

Use a test investigation, not your only copy of important work.

1. Home shows V1.0.0 ONLINE. On iPhone Safari, open/close the menu, scroll, then
   visit a Field Guide, its tool, Privacy and My Investigations. Check headers,
   footer alignment and no horizontal scrolling.
2. In a fresh Private Session, edit 5 Whys and evidence; switch to Fishbone and
   Pareto. Evidence must remain shared; empty Pareto has no empty handoff panel.
3. Add a Fishbone cause and Pareto data. Exercise all three handoffs. Existing
   answers/branches remain intact and confirmation precedes replacement.
4. Start Local Save; reload and continue from My Investigations. Enter Private,
   edit the title, then reopen the saved copy in another tab: private edits must
   not have overwritten it.
5. Export and import a `.problemme` file. Import a malformed/future file and
   confirm current work is unchanged. Open one older export if available.
6. Open the same saved investigation in two tabs. Save one, edit the other:
   saving should pause on conflict. Check Duplicate, search, status filter,
   export and Delete on test records in My Investigations.

Browser storage is not a backup. Export important investigations before testing.

## Readability follow-up (2026-09-29)

Updated the existing CSS declarations instead of stacking page-specific size
fixes. Compact labels, captions and actions use a 14px minimum; prose uses 17px,
leads 18px and editable text 16px at the default browser font size. Relative units
continue to respect browser font settings. The terminal font and colours remain.

Shared typography now removes text-obscuring scanlines/vignettes, loosens heading
line height, wraps long action labels, keeps placeholders and disabled text
legible, and respects reduced motion throughout the site. Diagrams retain a
minimum 1:1 SVG scale in their existing scroll containers so their 14px labels
aren't reduced to tiny text on mobile. Horizontal scrolling is confined to those
diagrams; ranked Pareto data and Fishbone inputs remain available alongside them.

Changed runtime files: `typography.css`, `article.css`, `site-nav.css`,
`investigation.css`, `investigations.css`, `index.html`, `techniques.html`,
`5-whys.html`, `fishbone.html`, `pareto.html`, `kepner-tregoe.html`, `features.html`.
All guides and Privacy inherit the shared CSS; their markup did not need edits.
Development: `test-typography.cjs` updates the expected metadata size;
`test-readability.cjs` adds a static size and palette-contrast guard.

Executed: seven model/syntax groups PASS; 625 explicit CSS font-size declarations
meet the 14px source floor; the seven tested text colours against three core
backgrounds have a minimum contrast ratio of 4.52:1; static paths and ZIP checks
PASS. These source checks do not establish computed sizes or contrast for every
rendered element. Reattempted browser typography testing with Chromium 131; it
again exited at launch with SIGTRAP. No visual/zoom/Safari pass is claimed.

Before deployment, run `node test-readability.cjs` and the browser suites above.
Inspect Home, all four Case Files, the workspace, My Investigations, all guides,
Privacy and Feature Log at 390px and desktop width. Increase browser text/zoom to
200%; check labels, menus, buttons, footers and article paragraphs for clipping.
Check diagram scrolling and labels, plus all three embedded tool heights.
