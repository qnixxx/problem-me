# Problem.me v0.7.2 — Investigation pilot stabilization

Based on the supplied v0.7 pages and the v0.7.1 pilot in 5-whys(2).html.

Replace the five HTML files on the existing site using the filenames in this
package. Keep the existing techniques.html: it was not supplied and is not
included here. This is an update package, not a complete site backup.
No deployment has been performed.

Changes:
- Validate the documented investigation envelope and individual WHY/evidence
  records before applying an import. Valid v0.7.1 exports remain compatible.
- Show when the current working draft differs from the saved snapshot, including
  after reload. Do not overwrite newer auto-saved drafts with older snapshots.
- Advance snapshot metadata only after successful storage; report import snapshot
  storage failures and leave the current content available for export.
- Export current data with a current timestamp and enforce the 1 MiB round-trip limit.
- Preserve evidence text inputs while updating counts, advice and print output.
- Correct the homepage version label to v0.7.2.

CRT/capybara CSS, local-first architecture, Private Session, and schemaVersion 1
are preserved. Name/status changes still require an explicit investigation save.
Private Session is page-local; refreshing returns to the existing local-save mode.

Verification:
32 automated regression checks passed using Node's VM with simulated DOM/storage:
script syntax; saved/dirty/reload states; failed saves; schema validation; legacy
file import; file-size rejection; private import/export without storage writes;
and evidence input handlers across all four tools.
Run: node tests/regression.cjs

Browser verification remains pending because Chromium was unavailable in the
build environment. The included Playwright test covers typing/focus, storage,
imports, reload, browser errors and mobile horizontal overflow. With Playwright
and Chromium installed, serve this directory on port 8765, then run:
node tests/browser.cjs
Perform a visual check of desktop/mobile and Print/PDF before production release.
