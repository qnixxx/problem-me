# problem.me — Capybara Terminal v2 / design-system preview

**Deliverable 01 of 07**. This is an opt-in visual foundation and public reference page. The current homepage, case files and investigation tools remain unchanged.

## Files
- `brand-system.html`: visual reference, desktop/mobile
- `brand-v2.css`: namespaced theme and reusable tokens/components, activated only by body.pm-v2
- `brand-v2.js`: accessible local filter demo on the reference page
- `brand-schema.json`: machine-readable tokens and component catalogue
- Reuses the already published `problem-me-social-preview-1200x630.jpg` featuring the approved capybara logo.

## Tokens
Ink #010704; night #020c07; neon #35ff91; cream #faf5e2; body #d0e7d8; muted #99c7ac; outline #158d52; mascot #d18a49.

## Integration contract
Load `brand-v2.css` on each migrated page after existing base styles, then add `pm-v2` to that page's body only after responsive and functional tests. Existing tools, local IndexedDB/session state, evidence, exports and privacy features retain their current owners. Do not bulk-enable v2 across existing pages.

## Verification gates
Check mobile widths, zoom, focus, reduced motion, colour contrast, filter buttons and all existing tool behaviours before rolling out to the homepage (deliverable 02).
