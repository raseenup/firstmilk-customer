/* Website-only FMV AI: no tracking, no request until a visitor asks a question. */
(() => {
  'use strict';
  const ENDPOINT = 'https://backend.firstmilkventure.com/public/assistant/chat';
  const limit = 1000;
  const create = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  function mount() {
    if (document.getElementById('fmv-public-chat-widget')) return;
    const wrap = create('aside','fmv-ai-widget');
    wrap.id = 'fmv-public-chat-widget';
    const toggle = create('button','fmv-ai-bubble');
    toggle.type = 'button';
    toggle.setAttribute('aria-label','Ask FMV AI');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-controls','fmv-ai-chat-panel');
    toggle.title = 'Ask FMV AI';
    // Static icon; never render untrusted text using innerHTML.
    toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M20 11.5a8.3 8.3 0 0 1-12 7.4L3.5 20l1.2-4.4A8.3 8.3 0 1 1 20 11.5Z"/><path d="m12 8-.9 2.2L9 11l2.1.9L12 14l.9-2.1L15 11l-2.1-.8Z"/></svg>';
    const panel = create('section','fmv-ai-panel');
    panel.id = 'fmv-ai-chat-panel';
    panel.hidden = true;
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','FMV AI company information assistant');
    const header = create('header','fmv-ai-head');
    const titleWrap = create('div','fmv-ai-title');
    titleWrap.append(create('strong','', 'FMV AI'),create('small','', 'First Milk Venture assistant'));
    const close = create('button','fmv-ai-close','×');
    close.type='button';
    close.setAttribute('aria-label','Close FMV AI chat');
    header.append(titleWrap, close);
    const intro = create('p','fmv-ai-description',
      'Ask about our company, products and published policies. For orders or personal account questions, sign in to the customer portal.');
    const messages = create('div','fmv-ai-messages');
    messages.setAttribute('role','log');
    messages.setAttribute('aria-label','Chat messages');
    messages.setAttribute('aria-live','polite');
    messages.setAttribute('aria-relevant','additions text');
    const welcome = create('p','fmv-ai-message fmv-ai-reply','Welcome! How can FMV AI help you today?');
    messages.append(welcome);
    const form = create('form','fmv-ai-form');
    const label = create('label','', 'Your question');
    label.htmlFor = 'fmv-ai-question';
    const field = create('textarea','fmv-ai-question');
    field.id = 'fmv-ai-question';
    field.name = 'question';
    field.rows = 2;
    field.maxLength = limit;
    field.placeholder = 'Ask FMV AI…';
    field.autocomplete = 'off';
    field.required = true;
    const submit = create('button','fmv-ai-send','Send');
    submit.type = 'submit';
    form.append(label,field,submit);
    const footer = create('p','fmv-ai-disclaimer','FMV AI uses published company information. It cannot approve payments, returns or refunds.');
    const support = create('a','fmv-ai-support','Customer support');
    support.href='https://customer.firstmilkventure.com/?auth=signin';
    panel.append(header,intro,messages,form,footer,support);
    wrap.append(panel,toggle);
    document.body.append(wrap);

    let inFlight = null;
    const setOpen = open => {
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded',String(open));
      if (open) {
        field.focus({preventScroll:true});
      } else {
        if (inFlight) {inFlight.abort();inFlight=null;}
        submit.disabled=false;
        toggle.focus({preventScroll:true});
      }
    };
    toggle.addEventListener('click',()=>setOpen(panel.hidden));
    close.addEventListener('click',()=>setOpen(false));
    document.addEventListener('keydown',event=>{
      if(event.key==='Escape' && !panel.hidden) setOpen(false);
    });
    const say = (value, mine=false) => {
      const item = create('p','fmv-ai-message '+(mine?'fmv-ai-mine':'fmv-ai-reply'),value);
      messages.append(item);
      // Keep the page lightweight and limit retained DOM nodes.
      while(messages.children.length>30) messages.firstElementChild.remove();
      messages.scrollTop=messages.scrollHeight;
    };
    form.addEventListener('submit', async event=>{
      event.preventDefault();
      const question=field.value.trim();
      if(!question || question.length>limit || inFlight) return;
      field.value='';
      say(question,true);
      const abort=new AbortController();
      inFlight=abort;
      submit.disabled=true;
      submit.textContent='Checking…';
      const timeout=setTimeout(()=>abort.abort(),14000);
      try {
        const response=await fetch(ENDPOINT,{
          method:'POST',
          mode:'cors',
          credentials:'omit',
          cache:'no-store',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({message:question}),
          signal:abort.signal
        });
        if(!response.ok) throw new Error('Assistant temporarily unavailable');
        const data=await response.json();
        if(typeof data?.reply!=='string' || data.reply.length>5000)
          throw new Error('Unexpected assistant response');
        if(!abort.signal.aborted) say('FMV AI: '+data.reply);
      } catch(error) {
        if(!abort.signal.aborted || panel.hidden===false) {
          say('FMV AI is temporarily unavailable. Please try again or contact customer support.');
        }
      } finally {
        clearTimeout(timeout);
        if(inFlight===abort){
          inFlight=null;
          submit.disabled=false;
          submit.textContent='Send';
        }
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();