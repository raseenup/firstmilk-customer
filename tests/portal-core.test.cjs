/* Run with Node's test runner and jsdom 27.2.0 on NODE_PATH. No live services. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const directory=path.resolve(__dirname,'..');
const role=fs.readFileSync(path.join(directory,'index.html'),'utf8').match(/data-portal="([^"]+)"/)[1];
const source=fs.readFileSync(path.join(directory,'portal-core.js'),'utf8');
const settle=()=>new Promise(resolve=>setImmediate(resolve));

async function harness(t){
  const dom=new JSDOM('<!doctype html><html class="fmv-locked"><body data-portal="'+role+'"><div id="sink"></div></body></html>',
    {url:'https://'+(role==='driver'?'delivery':role)+'.firstmilkventure.com/',runScripts:'outside-only',pretendToBeVisual:true});
  t.after(()=>dom.window.close());
  const w=dom.window,calls=[],timers=new Map();let timerId=0,online=true;
  const user={id:'qa-user',email:'qa@example.com',full_name:'QA User',portal:role,role:role==='admin'?'super_admin':role,approved:true};
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
  let responder=async url=>json(url.endsWith('/auth/session')?{user,revision:1}:url.endsWith('/sync')?{revision:1}:{});
  w.Headers=Headers;w.AbortSignal=AbortSignal;w.Blob=Blob;
  w.fetch=(url,options={})=>{calls.push({url,options});return responder(String(url),options);};
  w.FMV_CONFIG={apiBase:'https://backend.firstmilkventure.com'};
  w.sessionStorage.setItem('fmv_session_id_'+role,'SES-11111111111111111111');
  w.setTimeout=(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;};
  w.clearTimeout=id=>timers.delete(id);
  Object.defineProperty(w.navigator,'onLine',{get:()=>online,configurable:true});
  w.sessionStorage.setItem('fmv_session_'+role,'retired-test-credential');
  w.localStorage.setItem(role==='customer'?'customer_token':role+'_key','retired-test-key');
  w.eval(source);
  await new Promise(resolve=>w.document.addEventListener('DOMContentLoaded',resolve,{once:true}));
  async function run(delay){const found=[...timers].findLast(([,item])=>item.delay===delay);assert.ok(found,'Expected timer '+delay);timers.delete(found[0]);await found[1].fn();await settle();}
  await run(0);assert.equal(w.FMV.user.id,'qa-user');
  return {w,calls,timers,json,run,setOnline:value=>online=value,setResponder:fn=>responder=fn};
}

test('unchanged rendering keeps focus, local input and open details; changed data renders',async t=>{
  const {w}=await harness(t),html='<details><summary>Details</summary><input value="saved"></details>';
  w.FMV.setHTML('sink',html);const input=w.document.querySelector('#sink input'),details=input.parentElement;
  input.value='in progress';input.focus();details.open=true;
  w.FMV.setHTML('sink',html);
  assert.equal(w.document.querySelector('#sink input'),input);assert.equal(input.value,'in progress');
  assert.equal(w.document.activeElement,input);assert.equal(details.open,true);
  w.FMV.setHTML('sink','<p>Updated by the server</p>');assert.equal(w.document.querySelector('#sink').textContent,'Updated by the server');
});

test('a replaced target is rendered and explicit forced renders are available',async t=>{
  const {w}=await harness(t);w.FMV.setHTML('sink','<input value="saved">');
  const sink=w.document.getElementById('sink'),input=sink.firstChild;
  w.FMV.setHTML('sink','<input value="saved">',true);assert.notEqual(sink.firstChild,input);
  const replacement=w.document.createElement('div');replacement.id='sink';sink.replaceWith(replacement);
  w.FMV.setHTML('sink','<input value="saved">');assert.equal(replacement.firstChild.value,'saved');
});

test('only identical concurrent reads coalesce, including normalized headers',async t=>{
  const {w,calls,json,setResponder}=await harness(t);let finish;
  setResponder(()=>new Promise(resolve=>finish=resolve));
  const one=w.FMV.request('/items',{headers:{'X-B':'b','X-A':'a'}}),two=w.FMV.request('/items',{headers:{'x-a':'a','x-b':'b'}});
  assert.equal(one,two);assert.equal(calls.filter(c=>c.url.endsWith('/items')).length,1);
  finish(json({ok:true}));await one;
  setResponder(async(url,options)=>json({mode:new Headers(options.headers).get('X-Mode')}));
  const [a,b]=await Promise.all([w.FMV.request('/items',{headers:{'X-Mode':'a'}}),w.FMV.request('/items',{headers:{'X-Mode':'b'}})]);
  assert.equal(a.mode,'a');assert.equal(b.mode,'b');
});

test('a committed mutation starts a fresh read instead of reusing older in-flight data',async t=>{
  const {w,calls,json,setResponder}=await harness(t);let release,version=0;
  setResponder(async(url,options)=>{
    if(options.method==='PATCH'){version++;return json({saved:true});}
    if(version===0)return new Promise(resolve=>release=resolve);
    return json({version});
  });
  const old=w.FMV.request('/items');await w.FMV.request('/users/me',{method:'PATCH',body:{full_name:'Updated'}});
  assert.equal((await w.FMV.request('/items')).version,1);
  assert.equal(calls.filter(c=>c.url.endsWith('/items')).length,2);
  release(json({version:0}));await old;
});

test('responses from a replaced session are rejected and external fetches get no bearer token',async t=>{
  const {w,calls,json,setResponder}=await harness(t);let release;
  setResponder(()=>new Promise(resolve=>release=resolve));const old=w.FMV.request('/items');
  w.sessionStorage.setItem('fmv_session_id_'+role,'SES-22222222222222222222');release(json({private:'old user data'}));
  await assert.rejects(old,error=>error.stale===true);
  setResponder(async()=>json({}));await w.fetch('https://outside.example.test/pixel');
  assert.equal(new Headers(calls.at(-1).options.headers).has('Authorization'),false);
});

test('polling pauses offline, resumes immediately, backs off on errors and locks revoked sessions',async t=>{
  const {w,timers,run,setOnline,setResponder,json}=await harness(t);
  assert.ok([...timers.values()].some(item=>item.delay===1000));
  setOnline(false);w.dispatchEvent(new w.Event('offline'));assert.equal(timers.size,0);
  setOnline(true);w.dispatchEvent(new w.Event('online'));
  setResponder(async()=>{throw new Error('offline');});
  await run(0);for(const delay of [2000,4000,8000,16000])await run(delay);
  assert.ok([...timers.values()].some(item=>item.delay===30000));
  setResponder(async()=>json({detail:'Session expired'},401));await run(30000);
  assert.equal(w.FMV.user,null);assert.equal(w.FMV.token,'');assert.ok(w.document.documentElement.classList.contains('fmv-locked'));
});


test('sign-out revokes the token and restores only explicitly remembered identifier',async t=>{
  const {w}=await harness(t);
  const key='fmv_remember_identifier_customer_v1';
  const email='repeat.customer@example.com';
  const password='DontStoreThis9!';
  w.localStorage.setItem(key,email);
  w.localStorage.setItem('customer_token','obsolete-legacy-token');
  w.document.getElementById('fmv-auth-password').value=password;
  await w.FMV.logout();
  const input=w.document.getElementById('fmv-auth-identifier');
  const remember=w.document.getElementById('fmv-remember-identifier');
  assert.equal(input.value,email);
  assert.equal(remember.checked,true);
  assert.equal(w.document.getElementById('fmv-auth-password').value,'');
  assert.equal(w.sessionStorage.getItem('fmv_session_id_customer'),null);
  assert.equal(w.localStorage.getItem('customer_token'),null);
  assert.equal(w.localStorage.getItem(key),email);
  assert.doesNotMatch(w.document.getElementById('fmv-auth-message').textContent,
    /server could not confirm revocation/i);
  assert.ok([...Array(w.localStorage.length)].every((_,i)=>
    !String(w.localStorage.getItem(w.localStorage.key(i))||'').includes(password)));
});

test('email/mobile memory is an explicit opt-in and may be disabled',async t=>{
  const {w,setResponder,json}=await harness(t);
  const key='fmv_remember_identifier_customer_v1';
  w.FMV.showAuth('signin');
  const checkbox=w.document.getElementById('fmv-remember-identifier');
  assert.equal(checkbox.checked,false);
  const input=w.document.getElementById('fmv-auth-identifier');
  input.value='sample@example.com';
  const password=w.document.getElementById('fmv-auth-password');
  password.value='Password123!';
  checkbox.checked=true;
  setResponder(async url=>json(url.endsWith('/auth/signin')?
    {challenge_id:'trial',server_time:1000,resend_available_at:1000,expires_at:1300}:{}));
  w.document.getElementById('fmv-auth-form').dispatchEvent(
    new w.Event('submit',{cancelable:true,bubbles:true}));
  await settle();
  assert.equal(w.localStorage.getItem(key),'sample@example.com');
  assert.equal(password.value,'');
  assert.ok(![...Array(w.localStorage.length)].some((_,i)=>
    String(w.localStorage.getItem(w.localStorage.key(i))||'').includes('Password123!')));
  // Clearing the opt-in must also clear the saved identifier immediately.
  checkbox.checked=false;
  checkbox.dispatchEvent(new w.Event('change',{bubbles:true}));
  assert.equal(w.localStorage.getItem(key),null);
});

test('network failure leaves account signed out while reporting unverified server revocation',async t=>{
  const {w,setResponder}=await harness(t);
  setResponder(async url=>{
    if(url.endsWith('/auth/logout'))throw new Error('offline');
    return new Response('{}',{status:200,headers:{'Content-Type':'application/json'}});
  });
  await w.FMV.logout();
  assert.equal(w.FMV.user,null);
  assert.equal(w.sessionStorage.getItem('fmv_session_id_customer'),null);
  assert.match(w.document.getElementById('fmv-auth-message').textContent,/Server revocation could not be confirmed/);
});

test('portal fetches use a scoped cookie, and migration removes old browser credentials',async t=>{
  const {w,calls}=await harness(t);
  await w.FMV.request('/auth/session');
  const {options}=calls.at(-1), headers=new Headers(options.headers);
  assert.equal(options.credentials,'include');
  assert.equal(headers.get('X-FMV-Portal'),role);
  assert.equal(headers.get('X-FMV-Session'),'SES-11111111111111111111');
  assert.equal(headers.has('Authorization'),false);
  assert.equal(w.sessionStorage.getItem('fmv_session_'+role),null);
  assert.equal(w.localStorage.getItem(role==='customer'?'customer_token':role+'_key'),null);
  await w.fetch('https://outside.example.test/asset');
  const outside=new Headers(calls.at(-1).options.headers);
  assert.equal(outside.has('X-FMV-Portal'),false);
  assert.equal(outside.has('X-FMV-Session'),false);
  assert.notEqual(calls.at(-1).options.credentials,'include');
});
