(() => {
  'use strict';
  const trigger=document.querySelector('[data-site-menu]');
  if(!trigger || typeof HTMLDialogElement==='undefined' || !HTMLDialogElement.prototype.showModal)return;
  const dialog=document.createElement('dialog');
  dialog.className='site-drawer';dialog.id='site-navigation';dialog.setAttribute('aria-labelledby','site-navigation-title');
  dialog.innerHTML=`<div class="drawer-heading"><div><p class="drawer-kicker">PROBLEM.ME / NAVIGATION</p><h2 id="site-navigation-title">FIND YOUR NEXT STEP_</h2></div><button class="drawer-close" type="button" autofocus>CLOSE ×</button></div>
    <nav aria-label="Site navigation">
      <a class="drawer-link primary" href="investigation.html">START AN INVESTIGATION →<small>A new Private Session</small></a>
      <a class="drawer-link" href="investigations.html">MY INVESTIGATIONS<small>Saved in this browser</small></a>
      <a class="drawer-link" href="techniques.html">TECHNIQUE LIBRARY<small>Case Files + interactive tools</small></a>
      <a class="drawer-link" href="techniques.html#field-guides">FIELD GUIDES<small>Learn when and how to use each method</small></a>
      <div class="drawer-divider" aria-hidden="true"></div>
      <a class="drawer-link" href="privacy.html">PRIVACY</a>
      <a class="drawer-link" href="features.html">FEATURE LOG</a>
      <a class="drawer-link" href="index.html">HOME</a>
    </nav><p class="drawer-note"><strong>CAPYBARA.EXE</strong><br>Find the tool you need. Keep the question in view.</p>`;
  document.body.append(dialog);
  const page=location.pathname.split('/').pop() || 'index.html';
  if(page==='investigation.html'){
    const current=document.createElement('button');current.type='button';current.className='drawer-link';current.setAttribute('aria-current','page');
    current.textContent='← RETURN TO THIS INVESTIGATION';current.addEventListener('click',close);dialog.querySelector('nav').prepend(current);
  } else {
    dialog.querySelectorAll('a').forEach(link=>{if(link.getAttribute('href')===page){link.setAttribute('aria-current','page');link.addEventListener('click',event=>{event.preventDefault();close();});}});
  }
  let previousOverflow='',locked=false;
  function release(){
    if(!locked)return;
    document.documentElement.style.overflow=previousOverflow;locked=false;
    trigger.setAttribute('aria-expanded','false');trigger.focus({preventScroll:true});
  }
  function close(){dialog.close();release();}
  trigger.setAttribute('aria-controls',dialog.id);trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-haspopup','dialog');
  trigger.addEventListener('click',()=>{
    if(dialog.open)return;
    previousOverflow=document.documentElement.style.overflow;
    dialog.showModal();locked=true;document.documentElement.style.overflow='hidden';trigger.setAttribute('aria-expanded','true');
  });
  dialog.querySelector('.drawer-close').addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const stops=[...dialog.querySelectorAll('a[href],button:not(:disabled)')];
    const first=stops[0],last=stops[stops.length-1];
    if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus();}
  });
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)close();
  });
  dialog.addEventListener('close',()=>{
    if(!dialog.open)release();
  });
  // Anchors deliberately retain native navigation and beforeunload handling.
  // Closing first leaves the workspace usable when an unsaved-work warning is cancelled.
  dialog.querySelectorAll('a:not([aria-current])').forEach(link=>link.addEventListener('click',close));
  document.querySelectorAll('[data-menu-replaced]').forEach(el=>el.hidden=true);
  document.documentElement.classList.add('has-site-menu');trigger.hidden=false;
})();
