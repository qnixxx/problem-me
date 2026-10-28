# Problem.me v2.1.0 — The Capybara Casebook

Release date: 28 October 2026

## Editorial principle

Keep the **original Problem.me** identity: dark terminal design, mint-green UI, warm typography, colorful capybaras and four complete educational Field Guides.

This release **adds four authored, illustrated read-only stories** to the existing four Case Files. It does not replace or edit the original cases.

### New Casebook

- **#005 — The Melon Cart That Was Always Late:** Inspector Mango uses **5 Whys** to trace a fictional late departure back to an inventory handoff worth testing. No blame-based conclusion.
- **#006 — The Picnic with Too Many Guests:** Professor Pebble uses **Fishbone / Ishikawa** to map competing causes of ants near a picnic, with observations distinguished from hypotheses.
- **#007 — The Garden That Drank the Pond:** Archivist Lilac uses **Pareto Analysis** to rank 50 invented watering disruptions. The category counts total 50 and cumulative percentages total 100%. The lesson distinguishes *incident count* from *actual water volume*.
- **#008 — The Great Reading-Nook Decision:** Captain Coral uses **Kepner–Tregoe** to reject one option that fails a MUST, score two remaining options on WANTs, consider risk and separately investigate a later window leak.

Each case includes four substantial sections, original locally hosted capybara SVG artwork, a complete method example, a fictional-case disclaimer and links back to the relevant existing Field Guide.

### Privacy & accessibility

- Static HTML / CSS / SVG; **no new JavaScript or third-party requests**.
- No visitor input, authentication, tracking, analytics or browser storage.
- Semantic headings, text alternatives, skip links, chapter navigation and mobile layouts.
- Responsive illustration dimensions and mobile-safe links; tables scroll horizontally with keyboard access.

### Navigation and indexing

- The homepage now features the four new stories in a separate section, without changing the original featured techniques.
- The technique library includes a link to the Casebook.
- The public sitemap includes /casebook/ and the four new story routes.
- Retired interactive routes stay excluded from the sitemap and do not accept visitor input.

### Rollback

The previous read-only production commit is `ada04441b2c74672c323a0eca58bcd5c633cfdc3`, preserved at `archive/v2.0.1-readonly-pre-casebook`. The full original interactive source remains at `archive/v1.0.2-interactive-pre-readonly`.

Rollback is a new PR restoring the preserved tree (not a destructive force-push).

### Checks

```
python3 build-release.py --check
node test-content-polish.cjs
node test-production-readonly.cjs
```

CI runs static link, CSP and media checks, story consistency checks and Chromium at 1440, 390 and 320px.
