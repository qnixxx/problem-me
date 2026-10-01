# problem.me portable investigations — schema 3

Current application release: 1.0.0. The schema stays at **3**; application version
and file schema version are separate. `PROBLEMME-FORMAT-v1.txt` is the historical
specification, not the current storage description.

- Extension: `.problemme`; encoding: UTF-8 JSON, not encrypted.
- Schema marker: `problem.me/investigation`.
- Imports and exports are limited to 1 MiB measured as UTF-8 bytes.
- Identity, title (at most 80 characters), status, ISO timestamps, technique
  states, history and shared evidence remain part of one document.
- Status: `open`, `verifying`, `resolved`, `archived`.
- Schema 1 supports `5-whys`; schema 2 adds `fishbone`; schema 3 adds `pareto`.
- On decode, supported older schemas become schema 3 in memory. Missing unused
  technique states receive defaults. Missing used or malformed states fail
  validation. Future schemas are rejected rather than guessed or downgraded.
- Evidence allows at most 12 entries, each with text and one of `fact`,
  `assumption`, `test`, `result`. History entries have timestamp, technique and
  action strings.
- 5 Whys has 1–10 steps. Fishbone has six categories with 1–5 causes each and
  statuses `untested`, `no`, `likely`, `confirmed`. Pareto has 3–12 rows,
  nonnegative numeric values (or blank inputs), and threshold 50–100.

`investigation-model.js` is the executable validation contract. Keep compatibility
changes explicit and covered by `test-pilot.cjs` and `test-browser.cjs`.

Local Save uses IndexedDB database `problem.me`, database version 1, object store
`investigations`. Private Session changes remain in page memory. Import into the
workspace first enters Private Session; a failed import does not replace current
work. Browser storage is convenient, but portable exports remain essential for
backup. Exports, clipboard copies and PDFs are outside the Private Session's
memory-only persistence boundary once the user creates them.
