/* First Milk Venture — accessible cinematic product experience.
 * No WebGL, cookies, external libraries, tracking, or backend calls.
 * Pointer effects are opt-in for capable devices; touch and reduced motion
 * always keep the content fully usable. Product descriptions use textContent.
 */
(() => {
  'use strict';
  const stage = document.getElementById('fmv-cinema');
  if (!stage) return;
  const scene = document.getElementById('fmv-3d-scene');
  const title = document.getElementById('fmv-cinema-product-title');
  const description = document.getElementById('fmv-cinema-product-description');
  const packageTitle = document.getElementById('fmv-package-title');
  const index = stage.querySelector('.fmv-cinema-kicker');
  const choices = [...stage.querySelectorAll('[data-fmv-product]')];
  const catalogue = Object.freeze({
    milk: Object.freeze({label:'Farm Fresh Milk',package:'FARM FRESH MILK',summary:'A fresh beginning, beautifully bottled.',number:'01'}),
    ghee: Object.freeze({label:'Pure Cow Ghee',package:'PURE COW GHEE',summary:'Golden goodness, crafted for your everyday favourites.',number:'02'}),
    curd: Object.freeze({label:'Fresh Curd',package:'FRESH CURD',summary:'A little spoonful of smooth, creamy comfort.',number:'03'}),
    butter: Object.freeze({label:'Creamy Butter',package:'CREAMY BUTTER',summary:'A golden touch for the moments you love.',number:'04'})
  });
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function chooseProduct(key) {
    const data = Object.hasOwn(catalogue, key) ? catalogue[key] : null;
    if (!data) return;
    // Explicit allowlist: never use event data as raw HTML or as a fetched URL.
    stage.dataset.product = key;
    title.textContent = data.label;
    description.textContent = data.summary;
    packageTitle.textContent = data.package;
    index.textContent = 'THE FIRST MILK COLLECTION ✦ ' + data.number + ' / 04';
    for (const button of choices) {
      button.setAttribute('aria-pressed', String(button.dataset.fmvProduct === key));
    }
  }
  choices.forEach((button, position) => {
    button.addEventListener('click', () => chooseProduct(button.dataset.fmvProduct));
    button.addEventListener('keydown', event => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
      event.preventDefault();
      let next = position;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = choices.length - 1;
      else next = (position + (event.key === 'ArrowRight' ? 1 : -1) + choices.length) % choices.length;
      choices[next].focus();
      chooseProduct(choices[next].dataset.fmvProduct);
    });
  });
  chooseProduct('milk');

  // Hardware-accelerated tilt, updated only on pointer interaction and only
  // when the user has not requested reduced motion.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let animationFrame = 0;
  let rx = 0, ry = 0;
  function syncTilt() {
    animationFrame = 0;
    if (!scene || reduceMotion.matches || !finePointer.matches || document.hidden) return;
    scene.style.setProperty('--fmv-scene-rx', rx.toFixed(2) + 'deg');
    scene.style.setProperty('--fmv-scene-ry', ry.toFixed(2) + 'deg');
  }
  function tilt(event) {
    if (reduceMotion.matches || !finePointer.matches || document.hidden) return;
    const area = stage.getBoundingClientRect();
    if (!area.width || !area.height) return;
    // Clamp both axes to prevent unpleasant perspective jumps.
    const x = Math.max(-1, Math.min(1, ((event.clientX - area.left) / area.width - .5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - area.top) / area.height - .5) * 2));
    rx = -y * 3.5;
    ry = x * 5;
    if (!animationFrame) animationFrame = window.requestAnimationFrame(syncTilt);
  }
  function resetTilt() {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    rx = 0; ry = 0;
    if (scene) {
      scene.style.removeProperty('--fmv-scene-rx');
      scene.style.removeProperty('--fmv-scene-ry');
    }
  }
  stage.addEventListener('pointermove', tilt, {passive:true});
  stage.addEventListener('pointerleave', resetTilt, {passive:true});
  document.addEventListener('visibilitychange', () => {if(document.hidden) resetTilt();});
  reduceMotion.addEventListener?.('change', resetTilt);
  finePointer.addEventListener?.('change', resetTilt);

  // No video decode, no canvas rendering, no constant JS animation loop.
  // Product cards are ordinary links, and still work when scripting is disabled.
})();
