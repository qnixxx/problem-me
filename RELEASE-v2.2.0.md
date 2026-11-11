# problem.me v2.2.0 — Evidence Lab

Released: 11 November 2026 (pending merge/deployment validation)

## Scope

A self-contained, browser-only educational chapter with one index and three immersive fictional investigations:

- `evidence-lab.html`: the Lab index, exploration model and three scenarios.
- `lab-signin.html`: an identity-gateway issue affecting West but not East, including timestamped evidence, competing hypotheses, controlled tests and safe remediation.
- `lab-warehouse.html`: an errors-per-1,000-lines quality investigation contrasting device firmware, shifts and workload exposure.
- `lab-migration.html`: MUST-versus-WANT decision analysis, a worked weighted comparison, sensitivity analysis and protection against downside risk.
- `evidence-lab.css`: responsive, accessible visual components aligned with the dark/neon/capybara Academy identity.

The four v2.1 educational chapters remain; Evidence Lab becomes Chapter 05. The original four illustrated capybara Case Files and four Field Guides are unchanged. Homepage, Academy, Case Files, Practice, navigation, sitemap and Feature Log link to the new chapter.

## Product/privacy boundary

- All evidence, choices and outcomes are **fictional and prewritten**. Numbers represent teaching examples, not real operational findings.
- Native HTML `details/summary` disclosures reveal an outcome in the same page. Choices are not entered, transmitted, graded, stored or tracked.
- No visitor forms, text fields, buttons, JavaScript runtime, external requests, application cookies, Local Storage or IndexedDB.
- All public HTML requires a `script-src 'none'` and `connect-src 'none'` Content Security Policy.
- Existing archived interactive functionality is NOT restored and remains off the published branch.

## Release checks

```sh
python3 build-release.py --check
node test-content-polish.cjs
node test-production-readonly.cjs
```

The browser suite covers 22 public editorial pages at 1440, 390 and 320 pixels, visual overflow, images, failed requests, external requests, native evidence/choice disclosure behavior, debrief navigation and absence of data-entry controls and browser storage.

## Editorial scope / safety

Scenarios include operational and security concepts but do not provide production change procedures. They model safer reasoning such as preserving authentication validation, using representative denominators, and respecting nonnegotiable conditions. Real-world actions require authorization and specialist review.

## Rollback

If needed, restore the v2.1 release with a new revert PR. The previous code remains in Git history; do not force-move `main`.
