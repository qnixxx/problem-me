problem.me v0.9.2 — Privacy/Field Guide sticky header fix

Deploy only:
  article.css

Change:
- Keeps desktop sticky behavior.
- Uses a fixed 58px top bar on mobile to avoid iOS Safari sticky failures.
- Adds matching body offset so content does not sit underneath the header.
- Applies to privacy.html and all Field Guide pages via the shared stylesheet.
