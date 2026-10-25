
(() => {
  const buttons = [...document.querySelectorAll('.filter')];
  const cards = [...document.querySelectorAll('.tech-card')];
  const search = document.getElementById('techSearch');
  const count = document.getElementById('resultCount');
  const empty = document.getElementById('emptyState');
  let active = 'all';

  function applyFilters() {
    const query = search.value.trim().toLowerCase();
    let shown = 0;

    cards.forEach(card => {
      const categoryMatch = active === 'all' || card.dataset.category === active;
      const searchMatch = !query || card.dataset.search.includes(query) || card.textContent.toLowerCase().includes(query);
      const visible = categoryMatch && searchMatch;
      card.hidden = !visible;
      if (visible) shown++;
    });

    count.textContent = shown;
    empty.classList.toggle('visible', shown === 0);
  }

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      active = button.dataset.filter;
      buttons.forEach(btn => btn.setAttribute('aria-pressed', String(btn === button)));
      applyFilters();
    });
  });

  search.addEventListener('input', applyFilters);
})();

