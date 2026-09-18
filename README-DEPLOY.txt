problem.me v0.8.1 — MY INVESTIGATIONS
18 Sep 2026

WHAT CHANGED
- Added My Investigations: investigations.html
- Local investigations now use IndexedDB database: problem.me / investigations
- Shared workspace can open a saved investigation by ID and auto-save it locally
- Existing v0.8 shared-pilot localStorage record is migrated once into IndexedDB
- Private Session still writes no investigation data to local storage
- .problemme import/export remains portable and local-first
- Shared Evidence Ledger and 5 Whys <-> Fishbone handoff remain intact
- Infinite-scroll iframe fix from the deployed v0.8 patch is preserved

UPLOAD THESE FILES TO THE SAME DIRECTORY
5-whys.html
fishbone.html
investigation.html
investigation.css
investigation.js
investigation-model.js
investigation-store.js
investigation-bridge.js
investigations.html
investigations.css
investigations.js

TEST FIRST
1. Open investigation.html and create a small 5 Whys + Fishbone case.
2. START LOCAL SAVE.
3. Open FILE OPTIONS -> MY INVESTIGATIONS.
4. Confirm the case appears and CONTINUE restores both tools + ledger.
5. Enter PRIVATE SESSION, edit something, refresh, and confirm the saved copy reappears unchanged.
6. Export a .problemme file, delete the local case, then import it from My Investigations.
7. Check both workspaces on mobile for stable vertical height/no infinite downward growth.

STORAGE NOTE
IndexedDB is browser/device-local storage, not cloud backup. Clearing site data can remove investigations. Export important work as .problemme files.

CLEAR-DATA NOTE
The standalone 5 Whys/Fishbone CLEAR ALL LOCAL DATA controls now explicitly refer to standalone technique drafts. My Investigations has its own DELETE ALL LOCAL INVESTIGATIONS control.

VALIDATION
- Node controller/model test: 13 checks passed.
- IndexedDB store API + legacy migration test: passed with an in-memory IndexedDB test double.
- Browser regression test is included as test-browser.cjs. This environment blocks browser navigation to local HTTP/file URLs, so the browser test could not be executed here.
