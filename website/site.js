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

  // Start the branded video only once it enters the viewport (save mobile data).
  const brandFilm=document.getElementById('fmv-film-video');
  if(brandFilm){
    const activateBrandFilm=()=>{
      if(brandFilm.dataset.loaded)return;
      brandFilm.dataset.loaded='true';
      brandFilm.src=brandFilm.dataset.src;
      brandFilm.load();
      if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
        const promise=brandFilm.play();
        if(promise && typeof promise.catch==='function')promise.catch(()=>{});
      }
    };
    if('IntersectionObserver' in window){
      const filmObserver=new IntersectionObserver(entries=>{
        if(entries.some(entry=>entry.isIntersecting)){
          activateBrandFilm();
          filmObserver.disconnect();
        }
      },{rootMargin:'350px 0px'});
      filmObserver.observe(brandFilm);
    }else activateBrandFilm();
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
