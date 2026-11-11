# problem.me v2.0.2 — Quality & Trust

Release date: 11 November 2026

## Purpose
Problem.me remains a static, read-only educational website. **No visitor input**: no forms, text fields, buttons, editable workspaces, import/export, accounts, or visitor-created investigations.

## Changes
- Removed all four retired investigation/prototype routes. Previous links now reach the branded static `404.html`.
- Removed the last homepage browser scripts and its blocking boot interaction. Editorial content and navigation render immediately, including with JavaScript disabled.
- Removed legacy workspace, privacy-control, print-report, handoff, investigation and drawer CSS from the four Case Files and shared stylesheets.
- Removed retired prototype specifications and the old JavaScript runtime from production `main` (archived Git branches preserve the historical code).
- Enforced `script-src 'none'` and `connect-src 'none'` on public pages.
- Updated the feature log and privacy notice to describe v2.0.2 accurately.
- Strengthened static build checks and multi-viewport Chromium tests to fail if any form controls, buttons, scripts, old routes or persistence are reintroduced.

## Scope of deletion
Deletion is from the current Git deployment tree. Historical code remains in the repository's archive branches and Git history. Past browser-local investigation data, if any, is **not** accessed or erased by this release, and cannot be remotely erased by the website.

## Validation
The pull-request workflow runs:
```sh
python3 build-release.py --check
node test-content-polish.cjs
node test-production-readonly.cjs
```
The browser check covers the twelve educational pages at 1440, 390 and 320 pixels, checks images, missing resources, keyboard Skip link, document overflow, and verifies no inputs, scripts, or storage changes. GitHub Pages continues using the existing `CNAME` and custom domain.

## Design
Keep the original terminal design, mascot, four Case Files and four technique Field Guides. This is a quality/security cleanup, not a content redesign.
