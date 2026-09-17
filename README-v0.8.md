# Problem.me v0.8.0 — shared investigation pilot

Deploy the files from this package together in the same site directory. Open
`investigation.html`, or use the new shared-pilot link on the homepage. The site
must be served over HTTPS or localhost; opening the HTML directly as file:// is
not supported for the shared workspace. Keep the existing `techniques.html` and
other site assets: they were not supplied and are not included in this update.

## User workflow

The pilot opens a blank Private Session. Both 5 Whys and Fishbone remain loaded
in one page, so switching preserves both workspaces without putting investigation
data into URLs, sessionStorage or localStorage. The Evidence Ledger is shared.

Choose START LOCAL SAVE to explicitly save on this device. One complete JSON
record contains metadata, both tool states and evidence; subsequent edits save
that record. OPEN SAVED explicitly opens the last shared pilot. Starting a new
investigation or returning to Private Session preserves the previous saved copy.
Refreshing starts a new private session; use OPEN SAVED to reopen the local copy.
Private changes disappear on refresh/close unless exported.

Use Fishbone's cause selector above the workspace to send a cause into 5 Whys.
Confirmation is always required. Existing WHY answers remain and should be
reviewed against the changed starting point. Switching alone never seeds or
replaces tool content. A selected-cause event is added to history.

Standalone pages and their drafts remain separate. Export an existing 5 Whys
investigation as .problemme and import it into the shared pilot to migrate it.
The pilot does not silently merge unrelated standalone drafts or evidence.

## Portable files

The pilot exports schemaVersion 2 with currentTechnique, techniquesUsed, history,
and toolData keyed by `5-whys` and `fishbone`. It imports well-formed v1 files
from the 5 Whys pilot, preserving ID, metadata, evidence and WHY content while
creating a blank Fishbone workspace. v2 files open in the shared pilot; the older
standalone 5 Whys importer does not accept them. Files are readable JSON, not
encrypted. Import and export enforce a 1 MiB limit.

Both versions use schema `problem.me/investigation`. v2 requires string
appVersion, id, title (up to 80 characters), status (open/verifying/resolved/archived),
createdAt and updatedAt ISO date-time strings; an array techniquesUsed containing
currentTechnique; history entries with at, technique, action; an evidence array
of at most 12 type/text records (fact/assumption/test/result); and valid toolData.

5 Whys data: problem, root, countermeasure, notes strings; 1–10 whys records with
text string and verify boolean. Fishbone data: effect, supported, nextTest,
notes strings; exactly six categories with name and 1–5 causes, each having text
and status (untested/no/likely/confirmed).

## Scope and verification

This is an experimental release. No production deployment was performed.
Fourteen Node regression checks passed: script syntax, complete round trips,
v1 migration, rejected malformed/future files, UTF-8 size limit, private switching,
shared evidence, saving both workspaces, quota failures, stale-tab conflict
detection, confirmed cause transfer, private import/export and rejected imports
leaving current content intact. Run `node test-pilot.cjs`.

Controller checks simulate DOM, adapters and storage; they do not prove browser
layout, focus, iframe behavior or accessibility. Chromium was unavailable in the
build environment. A Playwright browser check is included; run a local web server
on port 8765 from this directory, then `node test-browser.cjs` in an environment
with Playwright and Chromium installed. Review desktop/mobile and Print/PDF
before replacing a stable production release.

The local-save stale-copy guard catches another tab's changes before a write. It
is not a transactional multi-user store; use one editing tab per investigation.
Blocked storage leaves work in memory with a visible warning and export available.

The existing CRT/capybara designs are reused in same-origin iframes. Embedded
tools are forced into memory-only mode; the outer page owns persistence and
navigation. All shared pilot scripts and styles are local files. No external
dependencies, accounts, telemetry or network data calls were added.

## Design update

The shared page now uses the established Case File palette, 980px content width,
CRT scanlines, typography and CSS capybara. Investigation name/status share a row
on desktop. Export and save are primary actions; import/open/new/delete are
grouped under File Options. Privacy controls stay visible. Technique selection
uses large two-column buttons with descriptions. The embedded tools align with
the page edges and the Evidence Ledger fills the full width. Mobile layouts
reduce decoration and stack controls as needed.

Replace investigation.html, investigation.css, 5-whys.html and fishbone.html
together for this design update. Other included files match the existing pilot.
The data format and saving behavior are unchanged. Visual browser verification
is still pending; automated controller and markup checks passed.
