/* problem.me v2 design-reference behaviour: no storage, no network calls. */
(() => {
  'use strict';
  if (!document.body?.classList.contains('pm-brand-reference')) return;
  const cards = [...document.querySelectorAll('[data-pm-category]')];
  const buttons = [...document.querySelectorAll('[data-pm-filter]')];
  const status = document.getElementById('pm-filter-status');
  const empty = document.getElementById('pm-filter-empty');
  for (const button of buttons) button.addEventListener('click', () => {
    const filter = button.dataset.pmFilter;
    let visible = 0;
    for (const card of cards) {
      const match = filter === 'all' || card.dataset.pmCategory === filter;
      card.hidden = !match;
      if (match) visible++;
    }
    for (const peer of buttons) peer.setAttribute('aria-pressed', String(peer === button));
    if (status) status.textContent = `${visible} technique${visible === 1 ? '' : 's'} shown`;
    if (empty) empty.hidden = visible !== 0;
  });
})();
