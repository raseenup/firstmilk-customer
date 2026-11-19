/* Website-only FMV AI: JSDOM interaction and network safety regressions. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'..','chat.js'),'utf8');
const style=fs.readFileSync(path.join(__dirname,'..','chat.css'),'utf8');

function mount(fetchHandler){
  const dom=new JSDOM('<!doctype html><html><body><main id="main">Company website</main></body></html>',{
    url:'https://www.firstmilkventure.com/',runScripts:'outside-only',pretendToBeVisual:true
  });
  dom.window.fetch=fetchHandler;
  dom.window.eval(source);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
}

test('small round assistant renders only on website, without initial network requests',()=>{
  let requests=0;
  const dom=mount(()=>{requests++;throw Error('network should be idle')});
  const {document}=dom.window;
  const bubble=document.getElementById('fmv-public-chat-widget').querySelector('button');
  assert.equal(requests,0);
  assert.equal(bubble.getAttribute('aria-label'),'Ask FMV AI');
  assert.equal(bubble.getAttribute('aria-expanded'),'false');
  assert.match(style,/width:56px;height:56px/);
  assert.match(style,/border-radius:50%/);
  assert.equal(document.getElementById('fmv-ai-chat-panel').hidden,true);
  dom.window.close();
});

test('clicking the round launcher opens and closes the chat without requesting data',()=>{
  let requests=0;
  const dom=mount(()=>{requests++;return Promise.resolve({ok:true,json:async()=>({reply:'Hello'})})});
  const {document,Event,KeyboardEvent}=dom.window;
  const button=document.querySelector('.fmv-ai-bubble');
  button.click();
  assert.equal(document.querySelector('.fmv-ai-panel').hidden,false);
  assert.equal(button.getAttribute('aria-expanded'),'true');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(document.querySelector('.fmv-ai-panel').hidden,true);
  assert.equal(requests,0);
  dom.window.close();
});

test('only an actual chat submission calls approved public API, with no credentials or HTML injection',async()=>{
  const calls=[];
  const dom=mount((url,options)=>{
    calls.push({url,options});
    return Promise.resolve({ok:true,json:()=>Promise.resolve({reply:'<img src=x onerror=alert(1)> Published policy'})});
  });
  const {document,Event}=dom.window;
  document.querySelector('.fmv-ai-bubble').click();
  const question=document.getElementById('fmv-ai-question');
  question.value='What is the refund policy?';
  document.querySelector('.fmv-ai-form').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));
  await new Promise(resolve=>setTimeout(resolve,15));
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://backend.firstmilkventure.com/public/assistant/chat');
  assert.equal(calls[0].options.credentials,'omit');
  assert.equal(calls[0].options.method,'POST');
  assert.equal(JSON.parse(calls[0].options.body).message,'What is the refund policy?');
  assert.equal(document.querySelector('.fmv-ai-messages img'),null);
  assert.match(document.querySelector('.fmv-ai-messages').textContent,/<img src=x onerror=alert\(1\)>/);
  dom.window.close();
});

test('client script does not include chat anywhere in the customer portal',()=>{
  const portalHTML=fs.readFileSync(path.join(__dirname,'..','..','index.html'),'utf8');
  assert.doesNotMatch(portalHTML,/src="(?:\.\/)?chat\.js"/);
});
