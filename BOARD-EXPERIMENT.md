# Living investigation board — interaction experiment

Open board-experiment.html in a browser. It is a single HTML file with embedded CSS/JS; its optional mascot image loads from problem.me. The initial delivery case is fictional. Start blank to try your own case.

Flow: define problem → select/add hypothesis → link observation with source and supports/challenges/context relation → predict and plan test → record result and interpretation. Each hypothesis keeps its own evidence/test/result. Capybara prompts are transparent local rules, not causal judgments.

## Isolation
No production file changed. No IndexedDB, localStorage, cookies, analytics or server writes. Refresh/close loses changes. Explicit JSON download/open is supported, capped at 1 MiB. Files use problem.me/board-experiment version 1 and are NOT .problemme files. Existing investigation schema/migrations remain untouched. The earlier workspace facelift is not present on current main and has not been reconstructed or overwritten.

## Verification actually executed
Seven JavaScript checks in the available execution isolate: embedded JS syntax, empty/example validity, JSON round trip, invalid/future/duplicate IDs rejection, verdict without result rejection, checkpoint branches, unique static IDs/no persistence APIs. These are not DOM or browser tests.

Local shell was unavailable. No browser rendering, mobile layout, keyboard interaction, download or import UI tests ran. Do not release as a production feature before browser review.

## Review
1. Open at 390px and laptop width; check no page overflow.
2. Select all three example hypotheses; linked evidence and tests must change together.
3. Add/edit/remove an observation; edit problem and hypothesis.
4. Plan a test, record a result and interpretation; check contextual prompts.
5. Download, open the file, check all relationships survive. Reject a future-version/invalid file without changing the board.
6. Start blank; verify replacement confirmation after edits. Check keyboard focus and dialog Escape/Cancel.

## Next gate
Review this interaction before integrating with shared workspaces. Production integration requires stable evidence IDs/relationships and an explicit migration design, tested against old exports and all three technique adapters. No AI backend, KT integration or production deployment is included.
