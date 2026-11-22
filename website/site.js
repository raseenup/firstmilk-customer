/* First Milk Venture — privacy-conscious marketing interactions.
   Uses native browser APIs only, with no trackers or third-party assets. */
(() => {
  'use strict';
  const menuButton = document.getElementById('menu-toggle');
  const menu = document.getElementById('main-nav');
  function closeMenu() {
    if (!menuButton || !menu) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    menu.classList.remove('nav-open');
  }
  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      menu.classList.toggle('nav-open', open);
    });
    menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 850) closeMenu();
    }, {passive: true});
    document.addEventListener('pointerdown', event => {
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
    });
  }

  const year = document.getElementById('copyright-year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Prefer lightweight reveal animations; never leave content inaccessible if APIs
  // or JS animation support are absent. Honor user reduced-motion preferences.
  const revealElements = [...document.querySelectorAll('.reveal')];
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    document.documentElement.classList.add('js');
    const observer = new IntersectionObserver((entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      }
    }, {threshold: .08, rootMargin: '0px 0px 45px 0px'});
    revealElements.forEach(element => observer.observe(element));
  }

  // Brand video: optimized MP4 loads only near the viewport. Pause offscreen
  // or when the page is hidden so the looping film does not waste mobile CPU,
  // GPU, battery or data. Keep its lightweight WebP poster visible.
  const brandFilm=document.getElementById('fmv-film-video');
  if(brandFilm){
    const frame=brandFilm.closest('.fmv-brand-film-frame');
    const retryButton=document.getElementById('fmv-film-retry');
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
    const saveData=navigator.connection?.saveData===true;
    const mobileSource=brandFilm.getAttribute('data-mobile-src');
    const desktopSource=brandFilm.getAttribute('data-src');
    const validLocalSource=value=>typeof value==='string'&&
      /^assets\/video\/fmv-brand-film-(?:720|mobile)\.mp4$/.test(value);
    const smallScreen=window.matchMedia?.('(max-width:650px)')?.matches===true;
    const source=smallScreen&&validLocalSource(mobileSource)?mobileSource:desktopSource;
    let activated=false, inViewport=false, manuallyStarted=false;
    function showRetry(){if(retryButton)retryButton.hidden=false;}
    function hideRetry(){if(retryButton)retryButton.hidden=true;}
    function activateBrandFilm(){
      if(activated||!validLocalSource(source))return;
      activated=true;
      brandFilm.src=source;
      brandFilm.preload='metadata';
      brandFilm.muted=true;
      brandFilm.defaultMuted=true;
      brandFilm.playsInline=true;
      brandFilm.controls=false;
      brandFilm.load();
    }
    function tryPlay(userInitiated=false){
      if(!inViewport||document.hidden)return;
      if((reducedMotion||saveData)&&!manuallyStarted&&!userInitiated){
        showRetry();return;
      }
      if(!activated)activateBrandFilm();
      if(!activated){showRetry();return;}
      if(userInitiated)manuallyStarted=true;
      brandFilm.muted=true;
      brandFilm.playsInline=true;
      brandFilm.controls=false;
      if(!brandFilm.paused){hideRetry();return;}
      try{
        const pending=brandFilm.play();
        if(pending&&typeof pending.catch==='function'){
          pending.then(()=>{
            if(inViewport&&!document.hidden)hideRetry();
          },()=>{
            if(inViewport&&!document.hidden)showRetry();
          });
        }
      }catch(error){showRetry();}
    }
    brandFilm.addEventListener('playing',()=>{
      frame?.classList.add('fmv-film-playing');hideRetry();
    });
    brandFilm.addEventListener('pause',()=>{
      frame?.classList.remove('fmv-film-playing');
      if(inViewport&&!document.hidden&&!brandFilm.ended)showRetry();
    });
    brandFilm.addEventListener('error',()=>{
      frame?.classList.remove('fmv-film-playing');
      if(inViewport&&!document.hidden)showRetry();
    });
    if(retryButton){
      retryButton.addEventListener('click',()=>tryPlay(true));
    }
    function onVisibilityChange(visible){
      inViewport=visible;
      if(!visible||document.hidden){
        if(activated&&!brandFilm.paused)brandFilm.pause();
        hideRetry();
      }else{
        activateBrandFilm();
        tryPlay();
      }
    }
    if('IntersectionObserver' in window){
      const filmObserver=new IntersectionObserver(entries=>{
        const entry=entries.find(item=>item.target===brandFilm);
        if(entry)onVisibilityChange(entry.isIntersecting);
      },{rootMargin:'220px 0px',threshold:0});
      filmObserver.observe(brandFilm);
    }else onVisibilityChange(true);
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){
        if(activated&&!brandFilm.paused)brandFilm.pause();
        hideRetry();
      }else if(inViewport)tryPlay();
    });
    window.addEventListener('pageshow',()=>{
      if(inViewport)tryPlay();
    });
  }

  // Email contact avoids introducing an unaudited public API or storing user data.
  // A verified support mailbox should be configured before publishing publicly.
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-message');
  if (form && status) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      status.classList.remove('error');
      if (!form.reportValidity()) {
        status.classList.add('error');
        status.textContent = 'Please check the required fields and try again.';
        return;
      }
      const value = id => document.getElementById(id).value.trim();
      const name = value('contact-name');
      const email = value('contact-email');
      const topic = value('contact-topic');
      const message = value('contact-message');
      const subject = 'Website enquiry: ' + topic;
      const body = [
        'Hello First Milk Venture,',
        '',
        message,
        '',
        '---',
        'Name: ' + name,
        'Reply email: ' + email,
        'Topic: ' + topic,
        'Sent via: First Milk Venture website'
      ].join('\n');
      const mailto = 'mailto:support@firstmilkventure.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Opening your email app. Please review your message and press Send. If no app opens, write to support@firstmilkventure.com.';
      window.location.href = mailto;
    });
  }
  // Careers uses the same zero-backend mail composer. CVs cannot be attached by
  // a mailto URL: ask applicants to attach the file in their own mail app.
  const careerForm = document.getElementById('career-form');
  const careerStatus = document.getElementById('career-status');
  if (careerForm && careerStatus) {
    careerForm.addEventListener('submit', event => {
      event.preventDefault();
      careerStatus.classList.remove('error');
      if (!careerForm.reportValidity()) {
        careerStatus.classList.add('error');
        careerStatus.textContent = 'Please complete the required details before preparing your message.';
        return;
      }
      const val = id => document.getElementById(id).value.trim();
      const name = val('career-name');
      const email = val('career-email');
      const phone = val('career-phone');
      const interest = val('career-interest');
      const message = val('career-message');
      const subject = 'Career enquiry | ' + interest;
      const body = [
        'Hello First Milk Venture team,', '',
        'I would like to express interest in opportunities with First Milk Venture.', '',
        message, '',
        'Name: ' + name, 'Email: ' + email,
        'Phone: ' + (phone || 'Not provided'),
        'Area of interest: ' + interest, '',
        'Please attach your CV/resume before sending this email.'
      ].join('\n');
      const url = 'mailto:support@firstmilkventure.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      careerStatus.textContent = 'Opening your email app. Attach your CV if available, review the draft, then press Send. If no app opens, email support@firstmilkventure.com.';
      window.location.href = url;
    });
  }

})();
