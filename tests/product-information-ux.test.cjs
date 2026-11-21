/* Offline iPhone-style product details regression: no services or secrets. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'product-information.js'),'utf8');

function escapeHTML(text){
  return String(text).replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);
}
async function setup(t){
  const dom=new JSDOM('<!doctype html><html><body><button data-product-information="prod-1">Details</button></body></html>',{
    url:'https://customer.firstmilkventure.com',runScripts:'outside-only',pretendToBeVisual:true
  });
  t.after(()=>dom.window.close());
  const w=dom.window,cartCalls=[],subscriptionCalls=[];
  const catalog=[{id:'prod-1',name:'Pure Cow Ghee',description:'Golden Purity',price:350,unit:'500g',stock_quantity:5}];
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.FMV={
    escape:escapeHTML,money:n=>'₹'+Number(n).toFixed(2),
    request:async()=>({information:{highlights:['Farm fresh'],manufacturer:{expiry_date:'2026-12-01'}}})
  };
  w.productsCatalog=catalog;
  w.customerProductVisual=()=>'<img alt="Product" src="/safe.png">';
  w.addToCart=(id,quantity)=>{cartCalls.push({id,quantity});return true;};
  w.subscribeProduct=(id,quantity)=>{subscriptionCalls.push({id,quantity});};
  w.eval(script);
  await new Promise(resolve=>{
    if(w.document.readyState==='loading')w.document.addEventListener('DOMContentLoaded',resolve,{once:true});
    else resolve();
  });
  w.document.querySelector('[data-product-information]').click();
  await new Promise(resolve=>setImmediate(resolve));
  return {w,cartCalls,subscriptionCalls};
}

test('product detail panel hides numeric inventory and provides icon-only cart',async t=>{
  const {w}=await setup(t),d=w.document;
  assert.equal(d.querySelector('.fmv-pi-stock').textContent,'Available to order');
  assert.doesNotMatch(d.querySelector('.fmv-pi-stock').textContent,/5 in stock/i);
  const cart=d.querySelector('[data-pi-cart]');
  assert.ok(cart.querySelector('svg'));
  assert.equal(cart.getAttribute('aria-label'),'Add selected quantity to cart');
  assert.doesNotMatch(cart.textContent,/add to cart/i);
  assert.ok(d.querySelector('[data-pi-qty="-1"]'));
  assert.ok(d.querySelector('[data-pi-qty="1"]'));
});

test('quantity stepper respects stock upper bound and carts selected quantity',async t=>{
  const {w,cartCalls}=await setup(t),d=w.document;
  const increment=d.querySelector('[data-pi-qty="1"]');
  increment.click();increment.click();
  assert.equal(d.querySelector('#fmv-pi-quantity').textContent,'3');
  increment.click();increment.click();increment.click();
  assert.equal(d.querySelector('#fmv-pi-quantity').textContent,'5');
  assert.equal(increment.disabled,true);
  d.querySelector('[data-pi-qty="-1"]').click();
  assert.equal(d.querySelector('#fmv-pi-quantity').textContent,'4');
  d.querySelector('[data-pi-cart]').click();
  assert.deepEqual(cartCalls,[{id:'prod-1',quantity:4}]);
});

test('subscription receives chosen quantity and stock numbers remain hidden',async t=>{
  const {w,subscriptionCalls}=await setup(t),d=w.document;
  d.querySelector('[data-pi-qty="1"]').click();
  d.querySelector('[data-pi-subscribe]').click();
  assert.deepEqual(subscriptionCalls,[{id:'prod-1',quantity:2}]);
});

test('new assets and single-snapshot auth wiring are present',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const experience=fs.readFileSync(path.join(root,'experience.js'),'utf8');
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  assert.match(html,/product-information\.css\?v=20261121-quantity-fast/);
  assert.match(experience,/prepareCampaignVideos/);
  assert.match(experience,/data-fmv-src/);
  assert.match(app,/FMVExperience\?\.applySnapshot/);
});
