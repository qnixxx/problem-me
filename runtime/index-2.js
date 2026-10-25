
    (() => {
      const boot = document.getElementById('boot');
      const site = document.getElementById('site');
      const log = document.getElementById('bootLog');
      const progress = document.getElementById('bootProgress');
      const progressTrack = document.querySelector('.boot-progress');
      const status = document.getElementById('bootStatus');
      const skip = document.getElementById('skipBoot');
      const year = document.getElementById('year');
      const typed = document.getElementById('typedMission');
      const capyStatus = document.getElementById('capyStatus');
      const solveBtn = document.getElementById('solveEverything');
      const easterOutput = document.getElementById('easterOutput');
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (year) year.textContent = new Date().getFullYear();

      const lines = [
        ['PROBLEM.ME SYSTEM START', 'ok'],
        ['Checking technique library........................ OK', 'ok'],
        ['Loading interactive workspaces.................... OK', 'ok'],
        ['Mounting /techniques.............................. OK', 'ok'],
        ['Private Session mode.............................. ARMED', 'ok'],
        ['Evidence Ledger................................... ONLINE', 'ok'],
        ['Technique handoffs................................ CONNECTED', 'ok'],
        ['Report export engine.............................. READY', 'ok'],
        ['Cloud account requirement......................... NONE', 'ok'],
        ['Checking for obvious causes....................... NONE FOUND', 'warn'],
        ['Blaming DNS....................................... TEMPTING', 'warn'],
        ['Capybara consultant............................... ONLINE', 'ok'],
        ['Common sense...................................... EXPERIMENTAL', 'warn'],
        ['Everything looks good............................. SUSPICIOUS', 'warn'],
        ['Preparing clearer thinking........................ DONE', 'ok']
      ];

      let finished = false;
      let timer = null;
      let index = 0;

      function setProgress(value) {
        if (progress) progress.style.width = `${value}%`;
        if (progressTrack) progressTrack.setAttribute('aria-valuenow', String(value));
      }

      function typeMission() {
        if (!typed) return;
        const text = 'choose a technique. follow the evidence. solve something real.';
        typed.textContent = '';

        if (reduceMotion) {
          typed.textContent = text;
          return;
        }

        let i = 0;
        const typer = window.setInterval(() => {
          typed.textContent += text[i] || '';
          i += 1;
          if (i >= text.length) window.clearInterval(typer);
        }, 34);
      }

      function finishBoot() {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        setProgress(100);
        if (status) status.textContent = 'SYSTEM ONLINE';

        const reveal = () => {
          if (boot) boot.classList.add('hidden');
          if (site) site.classList.add('online');
          typeMission();
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        };

        if (reduceMotion) reveal();
        else window.setTimeout(reveal, 180);
      }

      function bootStep() {
        if (finished) return;

        if (index < lines.length) {
          if (log) {
            const line = document.createElement('span');
            line.className = `boot-line ${lines[index][1]}`;
            line.textContent = `> ${lines[index][0]}`;
            log.appendChild(line);
          }

          index += 1;
          const value = Math.round((index / lines.length) * 100);
          setProgress(value);
          if (status) status.textContent = index < lines.length ? `BOOTING ${String(index).padStart(2, '0')}/${lines.length}` : 'READY';
          timer = window.setTimeout(bootStep, 150);
        } else {
          timer = window.setTimeout(finishBoot, 300);
        }
      }

      skip?.addEventListener('click', finishBoot);

      window.addEventListener('keydown', (event) => {
        const tag = document.activeElement?.tagName;
        if (event.key === 'Enter' && !finished && !['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(tag)) finishBoot();
      });

      const capyStates = [
        'STATUS: UNBOTHERED',
        'STATUS: HAS SEEN WORSE',
        'STATUS: BLAMING DNS',
        'STATUS: NEEDS MORE DATA',
        'STATUS: SUSPICIOUSLY CALM',
        'STATUS: REQUESTING SNACKS'
      ];

      if (capyStatus && !reduceMotion) {
        let capyIndex = 0;
        window.setInterval(() => {
          capyIndex = (capyIndex + 1) % capyStates.length;
          capyStatus.textContent = capyStates[capyIndex];
        }, 5200);
      }

      solveBtn?.addEventListener('click', () => {
        if (!easterOutput) return;
        easterOutput.replaceChildren();
        easterOutput.append('ERROR: scope too large.', document.createElement('br'), 'Try one problem at a time. ');
        const cursor = document.createElement('span');
        cursor.className = 'blink-cursor';
        cursor.setAttribute('aria-hidden', 'true');
        cursor.textContent = '_';
        easterOutput.appendChild(cursor);
      });

      if (reduceMotion) finishBoot();
      else timer = window.setTimeout(bootStep, 220);
    })();
  
