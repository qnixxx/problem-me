(() => {
  if (new URLSearchParams(location.search).get('investigation') !== '1') return;
  const technique = window.problemMeFiveWhys ? '5-whys' : 'fishbone';
  const api = window.problemMeFiveWhys || window.problemMeFishbone;
  window.investigationAdapter = {
    get: () => api.getState(),
    set: value => api.setState(value),
    evidence: () => window.problemMeEvidence.getState(),
    setEvidence: value => window.problemMeEvidence.setState(value)
  };
  let pending;
  ['input', 'change', 'click'].forEach(type => document.addEventListener(type, () => {
    clearTimeout(pending);
    pending = setTimeout(() => {
      try { parent.problemMePilot?.changed(technique); } catch (_) {}
    }, 0);
  }));
  // The outer investigation owns navigation; never put private content in a URL.
  document.addEventListener('click', event => {
    if (event.target.closest('a')) event.preventDefault();
  }, true);
})();
