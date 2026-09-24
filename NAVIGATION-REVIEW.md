# Collapsible navigation — Home + Shared Investigation

Review prototype based on current GitHub main `7db849e`. Version remains v0.9.2. Nothing deployed. Reasoning Review work is not included.

## What changed

- One explicit MENU button opens a right-side drawer on Home and Shared Investigation. No permanently occupied sidebar; diagrams and workspaces retain their width.
- Destinations: Start an Investigation (new Private Session), My Investigations, Technique Library (Case Files + interactive tools), Field Guides (direct link to the guide index), Privacy, Feature Log, Home.
- Home is highlighted when current. Inside an investigation, “Return to this investigation” closes the menu; “Start an investigation” still means a new session.
- Existing header links are hidden only after menu initialization succeeds. Brand returns Home. Contextual footer links remain useful at the end of long pages.
- The two headers stay visible while scrolling. Brand is non-wrapping; mobile status text yields space to MENU.
- Native modal dialog supplies background inertness. Explicit keyboard cycling, Escape, close button, backdrop dismissal, focus return and scroll restoration are implemented. The dialog scrolls on short displays.
- Existing normal-link navigation and unsaved-work protection remain. Opening a drawer does not save, switch techniques or navigate. Cancelling a leave-page warning restores the usable workspace.
- Investigation control disabling is narrowed from all document buttons/inputs/selects to main workspace controls. This prevents unrelated navigation controls being disabled during initialization/saving. Storage logic, schema and adapters are unchanged.

## Runtime files changed (upload together only if adopting this prototype)

1. `index.html`
2. `investigation.html`
3. `investigation.js` — two selector changes only
4. `site-nav.css` — new
5. `site-nav.js` — new

Revision 2 added `typography.css`, loaded by all 14 HTML pages: index.html, techniques.html, features.html, privacy.html, investigation.html, investigations.html, 5-whys.html, fishbone.html, pareto.html, kepner-tregoe.html and the four articles/*.html guides. Deploy all linked pages with typography.css; do not upload the stylesheet or menu files alone.

Revision 3 improves reading comfort. Prose uses local system sans-serif fonts at 17px, introductions at 18px, and editable text at a minimum of 16px. Paragraphs use more generous leading and spacing; article text has a bounded line length. Branding, headings, navigation and technical labels keep Courier. Scanlines are removed from long-form reading pages. System fonts require no remote font downloads or added dependencies. Contextual heading sizes and tool/chart layouts retain their hierarchy. Product version remains v0.9.2; “v3” names this prototype revision only.

The final readability checks passed across all 14 pages at 320, 390 and 1280px, including the older Kepner–Tregoe dropdown rules. The form-text floor intentionally overrides their smaller legacy declarations. All 25 stabilization browser groups passed; the earlier completed 11 navigation groups and 11 source/model checks remain successful. No investigation schema or persistence code was changed for this reading revision.

Other pages deliberately retain their existing navigation until this two-page trial is reviewed. This is not yet a site-wide navigation rollout. No persistence, remote dependency, account or framework was added.

## Review

The standalone `problem-me-menu-preview-v3.html` opens directly in a browser and shows the Home drawer. `problem-me-reading-preview.html` shows the improved Field Guide reading experience. Both bundle their styles and favicon. Other destination links lead to the live site, which does not yet contain this prototype. These are visual/interaction previews, not replacement site pages.

Rebuild the reading sample with `node build-reading-preview.cjs /absolute/path/problem-me-reading-preview.html`; rebuild Home with `node build-nav-preview.cjs /absolute/path/problem-me-menu-preview-v3.html`.

For the actual two-page workflow and typography across the site, extract problem-me-navigation-v3.zip, run `python -m http.server 8000` in its root and visit http://localhost:8000/index.html. Use HTTP, not direct file opening, for the embedded investigation workspace. The package includes all 26 runtime files, plus review/testing files. Existing CNAME/Pages/DNS/HTTPS settings are excluded and must remain untouched.

## Automated verification

All 11 navigation groups, 11 source/model checks and 25 browser regression groups passed in Chromium 153.0.8010.0. The downloaded Home preview also passed a separate file:// opening/closing/highlight check with no remote requests or JavaScript errors. `git diff --check` passed.

- `test-nav.cjs`: 11 Chromium groups covering both pages at 320, 390 and 1280px; modal focus cycling, current location, close/Escape/backdrop, scroll retention, no overflow, Private Session preservation, cancelled unsaved navigation, Local Save preservation, destinations, pending initialization and JS-unavailable workspace fallback.
- `test-typography.cjs`: checks shared font roles, brand size/weight, 18px lead text, label sizes and overflow on all 14 pages at 320, 390 and 1280px. Also checks sans-serif article prose at 17px or larger, comfortable leading, and visible editable text at 16px or larger, plus the direct Field Guides route and missing assets/JavaScript errors.
- `review-tests/source-regression.cjs`: the stabilization suite restored as a separate review test rather than changing the older tests in current main. Covers syntax, IDs, paths, schema 1/2 migration, schema 3 round trip, malformed/future files, missing state and UTF-8 limits.
- `review-tests/browser-regression.cjs`: the prior 25-group stabilization suite against this working tree, including knowledge/mobile navigation, Local Save, Private Session, atomic conflicts, imports/exports, legacy migration, shared ledger, handoffs and iframe heights.
- Mobile and desktop drawer screenshots visually inspected.
- Mobile and desktop reading screenshots visually inspected. The self-contained reading preview was opened directly with no external font/asset requests. Physical-device Safari rendering and OS-specific font appearance remain manual checks.
- Playwright is development-only. CHROMIUM_PATH can select an existing browser binary. Tests run their own local HTTP servers. No dependencies are added to the website.

## Limits and next check

Chromium testing does not establish Safari/iPhone correctness. Check native dialog focus, background scroll lock, sticky header and browser-bar/rotation behavior on a real iPhone before adopting the prototype. The homepage's existing JavaScript boot remains unchanged; the no-JS navigation fallback assertion is for the investigation page.

Try a disposable Private Session: enter a note, open/close the menu, choose Privacy and cancel the browser warning. Your note should remain and scrolling should work. Save locally, visit My Investigations through the drawer, and Continue. Finally compare how quickly you can find a guide from Home. If this feels better, extend the shared menu to the remaining page families in a subsequent pass.
