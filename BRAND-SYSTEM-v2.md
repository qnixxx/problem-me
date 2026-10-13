# problem.me — Capybara Terminal v2

The existing design reference is now extended into a site-wide **review build** on `design/capybara-terminal-rollout`. Production remains on `main` until review and browser verification.

## Design

Near-black backgrounds, neon green actions, cream headings, jade reading text, and warm amber details. The supplied capybara artwork leads the homepage; existing schematic mascots retain their educational poses with warm brown fills. Courier remains the terminal identity; system sans-serif remains the reading face. Fonts and assets are served locally.

## Integration

`brand-v2.css` is loaded after each page's existing styles. `html.pm-theme` maps legacy colour tokens; `body.pm-v2.pm-app` enables shared component treatments. The application section is screen-only to preserve existing report printing. Embedded workspaces retain their zero-minimum-height rules. No viewport height, persistent storage, or application behavior is added.

The existing reference components and filter demo stay in `brand-v2.css` / `brand-v2.js`. All public pages, including the reference, now use the existing shared menu and footer.

## Assets

`assets/capybara-terminal.jpeg` is the user's original 1536 × 1024 artwork, copied unchanged. Its intrinsic dimensions reserve space before loading. `problem-me-social-preview-1200x630.jpg` remains the social image. `build-release.py` packages both.

## Verification

See `FACELIFT-REVIEW.md` for executed checks, browser limitations and the review checklist. The application version remains 1.0.0, investigation schema remains 3, and no data migration is introduced.
