/* Order sections including return/refund history, conversations/reviews and profile preferences. */
(() => {
  'use strict';
  const e=value=>FMV.escape(value);
  let section='recent',orders=[],subscriptionSection='active',subscriptions=[],returnClaims=new Map();
  const group=order=>order.status==='Delivered'?'delivered':order.status==='Cancelled'?'cancelled':'recent';
  // Orders can be delivered AND later involved in a return. Keep the original
  // Recent/Delivered/Cancelled filters intact while adding a history view.
  const inSection=(order,key)=>key==='returned'?returnClaims.has(order.id):group(order)===key;
  function update(items){
    orders=Array.isArray(items)?items:[];
    for(const button of document.querySelectorAll('[data-order-section]')){
      const key=button.dataset.orderSection;
      button.setAttribute('aria-selected',String(section===key));
      button.querySelector('span').textContent=orders.filter(o=>inSection(o,key)).length;
    }
  }
  function updateReturns(claims){
    const next=new Map();
    for(const claim of Array.isArray(claims)?claims:[]){
      if(!claim || typeof claim.order_id!=='string' || !claim.order_id)continue;
      const earlier=next.get(claim.order_id);
      if(!earlier || String(claim.created_at||'')>=String(earlier.created_at||''))next.set(claim.order_id,claim);
    }
    returnClaims=next;
    update(orders);
    if(section==='returned' && FMV.user)loadDashboardStatus({orders,subscriptions});
  }
  function updateSubscriptions(items){subscriptions=items;for(const button of document.querySelectorAll('[data-subscription-section]')){const key=button.dataset.subscriptionSection;button.setAttribute('aria-selected',String(subscriptionSection===key));button.querySelector('span').textContent=items.filter(s=>s.status===key).length;}}
  function actions(order){
    const unread=FMVWorkspace.snapshot?.chat_unread?.[order.id] || 0;
    const claim=returnClaims.get(order.id);
    const hasActiveReturn=claim && !['rejected','cancelled'].includes(String(claim.status));
    const returnAction=hasActiveReturn?'view-return':'request-return';
    const returnLabel=hasActiveReturn?'Return status':'Request return';
    const deliveredActions=order.status==='Delivered'?
      `<button type="button" class="fmv-btn secondary" data-customer-action="${returnAction}" data-order-id="${e(order.id)}">${returnLabel}</button><button type="button" class="fmv-btn secondary" data-customer-action="rate" data-order-id="${e(order.id)}">Rate delivery</button>`:'';
    return `<button type="button" class="fmv-btn secondary" data-workspace-action="chat" data-order-id="${e(order.id)}">Order chat${unread?' ('+Number(unread)+')':''}</button>${deliveredActions}`;
  }
  function pinAddress(id){
    const item=FMVWorkspace.snapshot?.addresses?.find(a=>a.id===id) || {};
    const form=FMVWorkspace.form('Pin delivery location',`<p>Save coordinates for this delivery address. They apply to future orders. Only use current location while you are at that address.</p><label>Latitude<input name="latitude" type="number" min="-90" max="90" step="any" value="${item.latitude ?? ''}" required></label><label>Longitude<input name="longitude" type="number" min="-180" max="180" step="any" value="${item.longitude ?? ''}" required></label><button type="button" class="fmv-btn secondary" id="fmv-customer-location">Use current location</button>`,async element=>{
      await FMV.request('/users/me/addresses/'+encodeURIComponent(id)+'/location',{method:'PATCH',body:{latitude:Number(element.elements.latitude.value),longitude:Number(element.elements.longitude.value)}});FMV.notice('Delivery location saved for future orders.');await refreshCustomer();
    });
    document.getElementById('fmv-customer-location').addEventListener('click',()=>FMV.guard(async()=>{
      if(!navigator.geolocation)throw new Error('Location access is unavailable. Enter coordinates manually.');
      const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{timeout:10000,enableHighAccuracy:true}));
      form.elements.latitude.value=position.coords.latitude;form.elements.longitude.value=position.coords.longitude;
    }));
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const list=document.getElementById('dashboard-orders-list'),nav=document.createElement('div');nav.className='fmv-order-sections';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','My order sections');
    nav.innerHTML=['recent','delivered','cancelled','returned'].map(key=>`<button type="button" role="tab" aria-controls="dashboard-orders-list" aria-selected="${key===section}" data-order-section="${key}">${key[0].toUpperCase()+key.slice(1)} <span>0</span></button>`).join('');list.before(nav);list.setAttribute('role','tabpanel');
    const title=list.parentElement.querySelector('h3,h4');if(title)title.textContent='My orders';
    const subList=document.getElementById('dashboard-subscriptions-list'),subNav=document.createElement('div');subNav.className='fmv-order-sections fmv-subscription-sections';subNav.setAttribute('role','tablist');subNav.setAttribute('aria-label','Subscription sections');
    subNav.innerHTML=['active','paused','cancelled'].map(key=>`<button type="button" role="tab" aria-controls="dashboard-subscriptions-list" aria-selected="${key===subscriptionSection}" data-subscription-section="${key}">${key[0].toUpperCase()+key.slice(1)} <span>0</span></button>`).join('');subList.before(subNav);subList.setAttribute('role','tabpanel');
    const menu=document.querySelector('[data-profile-area="menu"]');if(menu){const settings=document.createElement('section');settings.className='fmv-work-card';settings.innerHTML='<h3>Display & notifications</h3>'+FMVWorkspace.settingsMarkup();menu.querySelector('.fmv-profile-logout').before(settings);}
    document.addEventListener('click',event=>{
      const tab=event.target.closest('[data-order-section]');if(tab){section=tab.dataset.orderSection;loadDashboardStatus({orders,subscriptions:fmvSubscriptions});return;}
      const subTab=event.target.closest('[data-subscription-section]');if(subTab){subscriptionSection=subTab.dataset.subscriptionSection;loadDashboardStatus({orders,subscriptions});return;}
      const button=event.target.closest('[data-customer-action]');if(!button)return;
      if(button.dataset.customerAction==='request-return'){
        FMV.guard(()=>window.FMVReturns?.open(button.dataset.orderId));
        return;
      }
      if(button.dataset.customerAction==='view-return'){
        const returned=document.querySelector('[data-order-section="returned"]');
        returned?.click();
        document.getElementById('dashboard-orders-list')?.scrollIntoView({block:'start',behavior:'smooth'});
        return;
      }
      if(button.dataset.customerAction==='pin-address'){pinAddress(button.dataset.id);return;}
      if(button.dataset.customerAction==='rate')FMVWorkspace.form('Rate this delivery','<label>Rating<select name="stars"><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Fair</option><option value="2">2 — Poor</option><option value="1">1 — Very poor</option></select></label><label>Feedback<textarea name="comment" maxlength="1000" rows="3"></textarea></label>',async form=>{await FMV.request('/orders/'+encodeURIComponent(button.dataset.orderId)+'/rating',{method:'POST',body:{stars:Number(form.elements.stars.value),comment:form.elements.comment.value.trim()}});FMV.notice('Delivery rating saved.');});
    });
  });
  document.addEventListener('fmv:locked',()=>{
    orders=[];subscriptions=[];returnClaims=new Map();section='recent';subscriptionSection='active';
    for(const button of document.querySelectorAll('[data-order-section]')){
      button.setAttribute('aria-selected',String(button.dataset.orderSection==='recent'));
      const count=button.querySelector('span');if(count)count.textContent='0';
    }
  });
  window.FMVOrders={
    update,updateReturns,
    filter:items=>items.filter(o=>inSection(o,section)),
    claimFor:order=>returnClaims.get(order.id)||null,
    actions,updateSubscriptions,
    filterSubscriptions:items=>items.filter(s=>s.status===subscriptionSection),
    get section(){return section;},
    get subscriptionSection(){return subscriptionSection;}
  };
})();
