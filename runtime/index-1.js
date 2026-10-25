
    (() => {
      // All visible release labels read this one metadata value.
      const version = document.querySelector('meta[name="application-version"]').content;
      document.querySelectorAll('[data-release-label]').forEach(label => {
        label.textContent = `${label.dataset.prefix || ''}${version}${label.dataset.suffix || ''}`;
      });
    })();
  
