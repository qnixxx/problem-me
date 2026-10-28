# Problem.me v2.0.0 — Read-only production release

Release date: 28 October 2026

## What changed

Problem.me is a read-only educational hobby website. The production homepage keeps the original neon-green terminal style, capybara illustrations and "Same problems. Clearer thinking." identity.

- Four original illustrated Capybara Case Files: 5 Whys, Fishbone, Pareto and Kepner–Tregoe.
- Four complete technique Field Guide articles with worked examples.
- Existing route names retained for case studies and articles.
- `/investigation.html`, `/investigations.html`, `/board-experiment.html` and `/brand-system.html` are static retirement notes with no visitor inputs.
- No visitor accounts, forms, saved investigations, application cookies, tracking, external scripts, or server-side problem processing.
- Existing browser-local records from the old site are **not** automatically erased; the read-only site no longer accesses them.
- `/next/` and `/bureau/` previews, and unused interactive JS/runtime source, are removed from the deployed branch.

## Guaranteed code rollback point

The exact pre-read-only main production commit is:

`f357e451aae2a5c31167ed1499ef3af3df81c26d`

Preserved permanently under the branch reference:

[`archive/v1.0.2-interactive-pre-readonly`](https://github.com/qnixxx/problem-me/tree/archive/v1.0.2-interactive-pre-readonly)

It contains all previous interactive pages, investigation models, scripts, handoffs and saved-draft behavior, including the experimental `/next/` and `/bureau/` previews. Removing those files from the new deployed tree does **not** delete their Git history or their archive-branch copies.

### How to restore it later

Open a separate rollback branch from the then-current `main`; restore the archived tree into a **new commit** and merge via PR:

```sh
git fetch origin
git switch -c rollback/interactive origin/main
git restore --source=origin/archive/v1.0.2-interactive-pre-readonly --staged --worktree -- .
git diff --cached --stat
git commit -m "Restore interactive Problem.me v1.0.2"
git push -u origin rollback/interactive
```

Then open a GitHub PR from `rollback/interactive` to `main`, review changes and wait for GitHub Pages deployment. A new rollback commit is preferable to force-moving `main`, because it preserves an auditable history and works with branch protection.

Code rollback restores the earlier website **functionality**, not any browser storage deleted by visitors. Data saved locally before this release may still be present if the visitor has not cleared browser site data.

## Compliance and hosting scope

The absence of user input minimizes application-level processing but does **not** establish GDPR exemption. GitHub Pages serves the site and performs technical security logging. The Privacy notes remain published without a banner.

## Verification

```sh
python3 build-release.py --check
node test-production-readonly.cjs
```

The browser test requires Playwright and installed Chromium; GitHub Actions runs both checks on pull requests and production commits.
