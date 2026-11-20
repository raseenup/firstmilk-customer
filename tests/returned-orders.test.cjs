/* Local customer order tab regressions; no network or credentials required. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');

const root=path.resolve(__dirname,'..');
const ordersSource=fs.readFileSync(path.join(root,'orders.js'),'utf8');
const appSource=fs.readFileSync(path.join(root,'app.js'),'utf8');
const featureSource=fs.readFileSync(path.join(root,'customer-features.js'),'utf8');

function setup(t) {
  const dom=new JSDOM(`<!doctype html><html><body>
    <section class="customer-orders-column"><h3>Recent orders</h3><div id="dashboard-orders-list"></div></section>
    <section><div id="dashboard-subscriptions-list"></div></section>
  </body></html>`,{url:'https://customer.firstmilkventure.com/',runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const w=dom.window,calls=[];
  w.FMV={
    user:{id:'test-customer'},
    escape:v=>String(v),
    notice:()=>{}
  };
  w.FMVWorkspace={snapshot:{},settingsMarkup:()=>''};
  w.fmvSubscriptions=[];
  w.loadDashboardStatus=payload=>calls.push(payload);
  w.eval(ordersSource);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return {w,calls};
}
const orders=[
  {id:'A',status:'Unassigned'},
  {id:'B',status:'Delivered'},
  {id:'C',status:'Cancelled'}
];

test('Returned tab appears next to Cancelled with an independent count',t=>{
  const {w}=setup(t);
  w.FMVOrders.update(orders);
  const tabs=[...w.document.querySelectorAll('[data-order-section]')];
  assert.deepEqual(tabs.map(b=>b.dataset.orderSection),['recent','delivered','cancelled','returned']);
  assert.deepEqual(tabs.map(b=>b.querySelector('span').textContent),['1','1','1','0']);
  assert.equal(tabs[3].getAttribute('role'),'tab');
});

test('A returned order is shown without removing it from Delivered',t=>{
  const {w,calls}=setup(t);
  w.FMVOrders.update(orders);
  w.FMVOrders.updateReturns([
    {id:'RMA-01',order_id:'B',status:'under_review',created_at:'2026-11-20T08:00:00'},
    {id:'RMA-02',order_id:'B',status:'approved',created_at:'2026-11-20T09:00:00'},
    {id:'RMA-foreign',order_id:'not-in-orders',status:'approved',created_at:'2026-11-20T09:00:00'}
  ]);
  const tabs=[...w.document.querySelectorAll('[data-order-section]')];
  assert.equal(tabs[1].querySelector('span').textContent,'1');
  assert.equal(tabs[3].querySelector('span').textContent,'1');
  tabs[3].click();
  assert.equal(calls.length,1);
  assert.equal(w.FMVOrders.section,'returned');
  assert.deepEqual(w.FMVOrders.filter(orders).map(o=>o.id),['B']);
  assert.equal(w.FMVOrders.claimFor(orders[1]).id,'RMA-02');
  tabs[1].click();
  assert.deepEqual(w.FMVOrders.filter(orders).map(o=>o.id),['B']);
});

test('Refresh updates count and clears claims on sign-out',t=>{
  const {w}=setup(t);
  w.FMVOrders.update(orders);
  const returned=w.document.querySelector('[data-order-section="returned"]');
  w.FMVOrders.updateReturns([{id:'RMA-01',order_id:'B',status:'under_review'}]);
  assert.equal(returned.querySelector('span').textContent,'1');
  w.FMVOrders.updateReturns([{id:'RMA-01',order_id:'B',status:'refunded'}]);
  assert.equal(w.FMVOrders.claimFor(orders[1]).status,'refunded');
  w.FMV.user=null;
  w.document.dispatchEvent(new w.Event('fmv:locked'));
  assert.equal(returned.querySelector('span').textContent,'0');
  assert.equal(w.FMVOrders.claimFor(orders[1]),null);
  assert.equal(w.FMVOrders.section,'recent');
});

test('Customer feature refresh synchronizes return data with the primary tabs',()=>{
  assert.match(featureSource,/window\.FMVOrders\?\.updateReturns\(returns\)/);
  assert.match(featureSource,/window\.FMVOrders\?\.updateReturns\(\[\]\)/);
});

test('Returned order cards show claim status without exposing delivery PIN',()=>{
  assert.match(appSource,/selectedOrderSection==='returned'/);
  assert.match(appSource,/claim\.refund_reference/);
  assert.match(appSource,/selectedOrderSection==='returned'\?'':`<div class="customer-pin">/);
  assert.match(appSource,/No return or refund requests yet/);
});


test('Delivered order shows Request Return and routes to its own preselected form',t=>{
  const {w}=setup(t);
  w.FMVOrders.update(orders);
  const actions=w.FMVOrders.actions(orders[1]);
  assert.match(actions,/data-customer-action="request-return"/);
  assert.match(actions,/Request return/);
  const holder=w.document.createElement('section');
  holder.innerHTML=actions;w.document.body.append(holder);
  const selected=[];
  w.FMV.guard=action=>action();
  w.FMVReturns={open:id=>selected.push(id)};
  holder.querySelector('[data-customer-action="request-return"]').click();
  assert.deepEqual(selected,['B']);
  assert.doesNotMatch(w.FMVOrders.actions(orders[0]),/request-return/);
});

test('Approved or pending claims show Return status instead of duplicate requests',t=>{
  const {w}=setup(t);
  w.FMVOrders.update(orders);
  w.FMVOrders.updateReturns([{id:'RMA-777',order_id:'B',status:'under_review'}]);
  assert.match(w.FMVOrders.actions(orders[1]),/data-customer-action="view-return"/);
  assert.doesNotMatch(w.FMVOrders.actions(orders[1]),/data-customer-action="request-return"/);
  w.FMVOrders.updateReturns([{id:'RMA-777',order_id:'B',status:'rejected'}]);
  assert.match(w.FMVOrders.actions(orders[1]),/data-customer-action="request-return"/);
});

test('Return processing requires explicit customer form submission and backend validation',()=>{
  assert.match(featureSource,/function openReturnForm\(orderId\)/);
  assert.match(featureSource,/order\.status!=='Delivered'/);
  assert.match(featureSource,/api\('\/customer\/returns',\{method:'POST'/);
  assert.match(featureSource,/window\.FMVExperience\?\.navigate\('profile','orders'\)/);
});
