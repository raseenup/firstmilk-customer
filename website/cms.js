/* First Milk Venture public website CMS. Only safe, approved fields are rendered. */
(() => {
  'use strict';
  const api='https://backend.firstmilkventure.com';
  const isCareers=/careers(?:\.html)?$/i.test(location.pathname);
  const selectors={
    topline:'.topline', hero_title:'#hero-title', hero_description:'.hero-sub',
    products_title:'#products-title', products_description:'.products .section-heading p',
    why_title:'#why-title',why_description:'.why .centered p',
    how_title:'#how-title',how_description:'.steps-intro p',
    story_title:'#story-title',story_description:'.story-copy p',
    contact_title:'#contact-title',contact_description:'.contact-left > p',
    footer_note:'.footer-brand > p',
    careers_title:'main h1',careers_description:'main h1 + p'
  };
  const imageURL=value=>{
    if(typeof value!=='string' || !/^\/media\/campaign\/[a-zA-Z0-9_-]+$/.test(value))return '';
    return api+value;
  };
  let version=null;
  function contentBlock(block){
    const section=document.createElement('section');section.className='fmv-site-block '+block.variant;
    section.dataset.fmvBlock=block.id;
    const wrap=document.createElement('div');wrap.className='wrap fmv-site-block-inner';
    const copy=document.createElement('div');copy.className='fmv-site-block-copy';
    const title=document.createElement('h2');title.textContent=block.title;copy.append(title);
    if(block.body){const desc=document.createElement('p');desc.textContent=block.body;copy.append(desc);}
    wrap.append(copy);
    const url=imageURL(block.media_url);
    if(url){
      let media;if(block.media_type==='video/mp4'){
        media=document.createElement('video');media.controls=true;media.muted=true;media.playsInline=true;
        media.preload='metadata';media.setAttribute('aria-label',block.title);
      }else{media=document.createElement('img');media.loading='lazy';media.alt=block.title;}
      media.src=url;media.className='fmv-site-block-media';wrap.append(media);
    }
    section.append(wrap);return section;
  }
  function populate(site){
    if(!site || !site.version || version===site.version)return;
    version=site.version;
    if(/^#[0-9a-fA-F]{6}$/.test(site.background_color || ''))
      document.documentElement.style.setProperty('--fmv-site-brand',site.background_color);
    for(const [key,text] of Object.entries(site.copy || {})){
      const node=document.querySelector(selectors[key] || ':not(*)');
      if(node && text)node.textContent=text;
    }
    if(!isCareers){
      const hero=document.querySelector('.hero-visual'),url=imageURL(site.media_url);
      if(hero && url){
        let media=hero.querySelector('.fmv-site-hero-media');
        if(!media){
          media=document.createElement(site.media_type==='video/mp4'?'video':'img');
          media.className='fmv-site-hero-media';hero.replaceChildren(media);
        }
        if(site.media_type==='video/mp4'){
          media.controls=true;media.muted=true;media.playsInline=true;media.preload='metadata';
        }else{media.loading='eager';media.alt='First Milk Venture featured artwork';}
        media.src=url;media.classList.toggle('contain',site.media_fit==='contain');
      }
    }
    document.querySelectorAll('[data-fmv-block]').forEach(el=>el.remove());
    const lastPlacement=new Map();
    for(const block of site.blocks || []){
      if(block.page!==(isCareers?'careers':'home'))continue;
      const anchors={
        'after-hero':'.hero','after-products':'#products','after-why':'#why-us',
        'before-footer':'.site-footer'
      };
      const selector=anchors[block.placement] || '.site-footer';
      const anchor=document.querySelector(selector) || document.querySelector('.site-footer');
      if(!anchor)continue;
      const section=contentBlock(block);
      const key=block.page+'|'+block.placement;
      if(lastPlacement.has(key))lastPlacement.get(key).after(section);
      else if(block.placement==='before-footer' || isCareers)anchor.before(section);
      else anchor.after(section);
      lastPlacement.set(key,section);
    }
  }
  // Render's static pages never wait for an API call. Reuse recent published
  // content immediately, then revalidate only when reasonably stale.
  const CACHE_KEY='fmv-public-website-cms-v2';
  const CHECK_INTERVAL=180000; // 3 minutes rather than making API requests every minute
  let lastCheck=0,refreshInFlight=null;
  function cached(){
    try{
      const record=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');
      if(record && Date.now()-record.savedAt<86400000 && record.site?.version){
        populate(record.site);
        return record.savedAt;
      }
    }catch(error){/* Storage may be disabled. Render static HTML remains visible. */}
    return 0;
  }
  async function refresh(force=false){
    if(document.hidden || refreshInFlight || (!force && Date.now()-lastCheck<CHECK_INTERVAL))return;
    lastCheck=Date.now();
    const task=(async()=>{
      try{
        const response=await fetch(api+'/public/website',{
          cache:'default',credentials:'omit',signal:AbortSignal.timeout(8000)
        });
        if(!response.ok) return;
        const site=await response.json();
        if(!site || typeof site.version!=='number' || !Array.isArray(site.blocks)
            || !site.copy || typeof site.copy!=='object') return;
        populate(site);
        // Public company copy only. Limit browser storage footprint.
        const serial=JSON.stringify({site,savedAt:Date.now()});
        if(serial.length<80000){
          try{sessionStorage.setItem(CACHE_KEY,serial);}catch(error){}
        }
      }catch(error){
        /* Keep the static site (and last approved copy) visible during API cold starts. */
      }
    })();
    refreshInFlight=task;
    await task;
    refreshInFlight=null;
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const savedAt=cached();
    if(Date.now()-savedAt>CHECK_INTERVAL) refresh(true);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
    window.addEventListener('pageshow',()=>refresh());
    setInterval(()=>refresh(),CHECK_INTERVAL);
  });
})();