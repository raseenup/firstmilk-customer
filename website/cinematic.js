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
  // Approved published media ID paths only. Never load arbitrary editor-supplied URLs.
  const MEDIA_PATTERN = /^\/media\/campaign\/MEDIA-[A-Za-z0-9_-]{8,100}$/;
  const IMAGE_TYPES = new Set(['image/jpeg','image/png','image/webp']);
  const API_ORIGIN = 'https://backend.firstmilkventure.com';
  let productImages = {}, globalArtwork = null, activeVisual = null, activeVisualPath = '';
  let visualGeneration = 0;
  const mediaUrl = value => typeof value === 'string' && MEDIA_PATTERN.test(value) ? API_ORIGIN + value : '';
  function showProductArtwork(key) {
    const sceneVisual = productImages[key] || globalArtwork;
    const path = sceneVisual ? mediaUrl(sceneVisual.url) : '';
    const video = sceneVisual?.mime_type === 'video/mp4';
    if (activeVisualPath === path && activeVisual && stage.dataset.product === key) return;
    const generation = ++visualGeneration;
    activeVisualPath = path;
    if (activeVisual) { activeVisual.pause?.(); activeVisual.remove(); activeVisual = null; }
    stage.dataset.heroImage = 'fallback';
    if (!path) return; // Keep original CSS bottle if an editor has not published an image.
    const asset = document.createElement(video ? 'video' : 'img');
    asset.className = 'fmv-cinema-product-photo';
    asset.setAttribute('aria-hidden','true');
    if (video) {
      asset.muted = true; asset.loop = true; asset.autoplay = true; asset.playsInline = true;
      asset.preload = 'metadata'; asset.controls = false;
      asset.disablePictureInPicture = true;
    } else {
      asset.alt = ''; asset.decoding = 'async'; asset.loading = 'eager';
      asset.fetchPriority = key === 'milk' ? 'high' : 'auto';
    }
    const ready = () => {
      if (generation !== visualGeneration || activeVisual !== asset) return;
      stage.dataset.heroImage = 'ready';
    };
    asset.addEventListener(video ? 'loadeddata' : 'load', ready, {once:true});
    asset.addEventListener('error', () => {
      if (generation !== visualGeneration) return;
      asset.remove(); activeVisual = null; activeVisualPath = '';
      stage.dataset.heroImage = 'fallback';
    }, {once:true});
    activeVisual = asset;
    scene.append(asset);
    asset.src = path;
    if (!video && asset.complete && asset.naturalWidth) ready();
    if (video) asset.play().catch(() => {});
  }
  // The CMS calls this after using its safe, public content endpoint.
  window.FMVHeroMedia = (entries={}, fallback={}) => {
    const approved = {};
    for (const key of ['milk','ghee','curd','butter']) {
      const item = entries && typeof entries === 'object' ? entries[key] : null;
      if (item && IMAGE_TYPES.has(item.mime_type) && mediaUrl(item.url)) approved[key] = item;
    }
    productImages = approved;
    globalArtwork = fallback && mediaUrl(fallback.url) &&
      (IMAGE_TYPES.has(fallback.type) || fallback.type === 'image/gif' || fallback.type === 'video/mp4')
      ? {url:fallback.url,mime_type:fallback.type} : null;
    // Reset only when media source or selected product changes.
    showProductArtwork(stage.dataset.product || 'milk');
  };

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
    showProductArtwork(key);
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
