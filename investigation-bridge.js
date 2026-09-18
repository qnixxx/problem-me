(() => {
  if (new URLSearchParams(location.search).get('investigation') !== '1') return;
  const candidates = [
    ['5-whys', window.problemMeFiveWhys],
    ['fishbone', window.problemMeFishbone],
    ['pareto', window.problemMePareto]
  ];
  const match = candidates.find(([, api]) => api);
  if (!match || !window.problemMeEvidence) return;
  const [technique, api] = match;
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
