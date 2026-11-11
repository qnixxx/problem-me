# Problem.me v2.1.0 — Problem Management Academy

Release date: 11 November 2026

## Product scope
Six new standalone, read-only educational pages extend the original four capybara Case Files and four Field Guides:

- `academy.html`: two recommended learning paths, four curriculum chapters and six evidence-first thinking moves.
- `foundations.html`: differences between incident/problem/workaround/known error; the problem lifecycle, investigation brief, evidence standards and verification.
- `choose-method.html`: when to choose Pareto, Fishbone, 5 Whys or Kepner–Tregoe; appropriate handoffs, limits and quality gates.
- `professional-cases.html`: four **fictional** cases concerning payment errors, warehouse defects, facilities control deviation and a migration decision. Evidence and assumptions are deliberately distinguished.
- `practice.html`: eight self-checks revealed with native HTML `details/summary`, without answers, scores or stored progress.
- `glossary.html`: 22 working definitions.

Home and Technique Library link to the Academy. Feature Log and sitemap include the edition. Layout uses `academy.css` with no remote fonts or new assets.

## Privacy and safety invariant
- No HTML forms, buttons, data entry, accounts, contact collection, saved progress, external scripts or application JavaScript.
- Native disclosure elements only reveal already-published explanatory text. No response is collected.
- `script-src 'none'` and `connect-src 'none'` enforced on all new pages.
- Fictional cases are clearly labeled; no actual organization's system or outcomes are represented.
- Original read-only site and its archival branches remain untouched aside from navigation and editorial release information.

## Quality gates
```bash
python3 build-release.py --check
node test-content-polish.cjs
node test-production-readonly.cjs
```
The latter runs Chromium against 18 public editorial pages on desktop and mobile widths, including the native disclosure interaction. The prior 4 Field Guide illustrations remain unchanged and covered.

## Reference basis
These are independent original learning explanations, not official vendor training:
- PeopleCert — ITIL 4 Practitioner Problem Management
- ASQ — quality tools, including Pareto and Ishikawa
- Kepner–Tregoe — methodology FAQ
- AHRQ — IS/IS NOT analysis

## Rollback
Prior release remains in the Git history under the v2.0.2 merge commit, and site artifacts are static. Rollback via a new PR reverting v2.1 commit if necessary.
