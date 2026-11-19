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
  async function refresh(){
    if(document.hidden)return;
    try{const response=await fetch(api+'/public/website',{cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(response.ok)populate(await response.json());}
    catch(error){/* Keep the static site readable during free-host cold starts. */}
  }
  function chatWidget(){
    const outer=document.createElement('aside');outer.className='fmv-public-help';
    outer.innerHTML=`<button type="button" class="fmv-public-help-toggle" aria-expanded="false">✦ Ask First Milk AI</button>
      <section class="fmv-public-help-panel" role="dialog" aria-label="First Milk policy chatbot" hidden>
      <h3>How can we help?</h3><p>Answers come from published company information, not private account records.</p>
      <div class="fmv-public-chat-feed" aria-live="polite"><p>Ask about First Milk Venture, deliveries, policies or returns.</p></div>
      <form><label>Question<textarea required maxlength="1200" rows="2" placeholder="What is your return policy?"></textarea></label>
        <button type="submit">Ask</button></form>
      <a href="https://customer.firstmilkventure.com/?auth=signin">Visit customer support</a>
      </section>`;
    document.body.append(outer);
    const toggle=outer.querySelector('.fmv-public-help-toggle'),panel=outer.querySelector('section');
    toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));});
    outer.querySelector('form').addEventListener('submit',async event=>{
      event.preventDefault();const form=event.currentTarget,input=form.querySelector('textarea');
      const message=input.value.trim();if(message.length<2)return;input.value='';
      const feed=outer.querySelector('.fmv-public-chat-feed');
      const write=value=>{const p=document.createElement('p');p.textContent=value;feed.append(p);feed.scrollTop=feed.scrollHeight;};
      write('You: '+message);
      const button=form.querySelector('button');button.disabled=true;
      try{const response=await fetch(api+'/public/assistant/chat',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({message}),
        signal:AbortSignal.timeout(14000)});
        if(!response.ok)throw Error('Please try again shortly.');
        const result=await response.json();
        write('First Milk: '+result.reply);}
      catch(error){write('Our assistant is temporarily unavailable. Please contact support.');}
      finally{button.disabled=false;}
    });
  }
  document.addEventListener('DOMContentLoaded',()=>{chatWidget();refresh();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
    setInterval(()=>{if(!document.hidden)refresh();},60000);
  });
})();